"""K1: wrist-extensor weakness sweep.

Scales the max isometric force of the configured wrist extensors (scale_strength hook) and
re-solves the baseline cup lift-and-hold problem at each strength factor. A factor "fails" when
  * the solver does not converge, or
  * peak reserve torque > RESERVE_LIMIT_PCT of the peak gravity torque at the wrist, or
  * the wrist drifts more than HOLD_LIMIT_DEG from the target during the hold.
The threshold (K1) is then refined by bisection between the weakest passing and the strongest
failing factor.

Each solution is written to results/<tag>_k1_solutions/ and every row is appended to the CSV as
soon as it is solved, so a long MoBL-ARMS sweep can be split over several processes and resumed.
With --warm-start, each solve starts from the saved solution at the nearest strength factor.

Usage (wrist-opensim env):
    python route_a_moco/sweep_weakness.py [--config PATH] [--tag baseline] [--bisect 4]
        [--factors 1.0,0.5,0.3] [--coarse-only] [--warm-start] [--max-iter 600]
        [--bisect-range LO,HI]
"""
import argparse
import csv
import json
import logging
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_model import build  # noqa: E402
from common import RESULTS_DIR, load_config  # noqa: E402
from solve_baseline import evaluate, make_study, run_solve  # noqa: E402

log = logging.getLogger("sweep_weakness")

FACTORS = [1.0, 0.8, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.12, 0.1, 0.08, 0.06, 0.04]
RESERVE_LIMIT_PCT = 10.0
HOLD_LIMIT_DEG = 2.0


def muscle_effort(sol, muscles):
    """Integral of the sum of squared muscle excitations over the motion."""
    t = sol.getTimeMat()
    e2 = sum(sol.getControlMat(f"/forceset/{m}") ** 2 for m in muscles)
    return float(np.trapezoid(e2, t))


def solution_file(tag, factor):
    return RESULTS_DIR / f"{tag}_k1_solutions" / f"f{factor:.4f}.sto"


def nearest_solution(tag, factor):
    """Saved successful solution at the strength factor closest to `factor`, or None."""
    d = RESULTS_DIR / f"{tag}_k1_solutions"
    if not d.exists():
        return None
    files = [(abs(float(f.stem[1:]) - factor), f) for f in d.glob("f*.sto")]
    return min(files)[1] if files else None


def solve_at(cfg, factor, modify=None, control_weights=None, return_solution=False, guess_file=None):
    """Solve the baseline task with extensors scaled by `factor`.
    modify(model) may add forces (e.g. an assist device) to the processed model.
    guess_file: a previous solution (.sto) to start the coarse solve from."""
    model, info = build(cfg, strength_factor=factor, verbose=False)
    if modify is not None:
        modify(model)
        model.finalizeConnections()
        model.initSystem()
    sc = cfg["solver"]
    study, solver, qpath = make_study(cfg, model, info, sc["num_mesh_intervals"], control_weights)
    if guess_file is not None:
        solver.setGuessFile(str(guess_file))
        log.info("f=%.4f  warm start from %s", factor, Path(guess_file).name)
    sol, stats = run_solve(study, f"f={factor:.4f} N={sc['num_mesh_intervals']}")
    if stats["success"] and sc.get("refine_mesh_intervals"):
        study, solver, qpath = make_study(cfg, model, info, sc["refine_mesh_intervals"], control_weights)
        solver.setGuess(sol)
        sol_f, stats_f = run_solve(study, f"f={factor:.4f} N={sc['refine_mesh_intervals']}")
        if stats_f["success"]:
            sol, stats = sol_f, stats_f
    m, _, _ = evaluate(cfg, model, info, sol, qpath)
    t = sol.getTimeMat()
    ext = [sol.getStateMat(f"/forceset/{n}/activation") for n in cfg["names"]["wrist_extensors"]]
    ext = np.max(np.vstack(ext), axis=0)
    hold = t >= cfg["task"]["duration_s"] * (1 - cfg["task"]["hold_fraction"])
    reserve = info["reserves"][0]
    row = {
        "strength_factor": factor,
        "solver_success": stats["success"],
        "status": stats["status"],
        "iterations": stats["iterations"],
        "solve_time_s": round(stats["solver_duration_s"], 2),
        "mesh_intervals": int(stats["label"].split("N=")[1]),
        "reserve_peak_Nm": m[f"{reserve}_peak_abs_Nm"],
        "reserve_rms_Nm": m[f"{reserve}_rms_Nm"],
        "reserve_peak_pct_gravity": m[f"{reserve}_peak_over_gravity_pct"],
        "hold_max_error_deg": m["hold_max_error_deg"],
        "ext_activation_peak": float(ext.max()),
        "ext_activation_hold_mean": float(ext[hold].mean()),
        "gravity_torque_peak_Nm": m["gravity_torque_peak_abs_Nm"],
        "muscle_effort": muscle_effort(sol, info["kept_muscles"]),
        "warm_start": Path(guess_file).name if guess_file is not None else "",
    }
    row["task_ok"] = bool(row["solver_success"]
                          and row["reserve_peak_pct_gravity"] <= RESERVE_LIMIT_PCT
                          and row["hold_max_error_deg"] <= HOLD_LIMIT_DEG)
    log.info("f=%.4f  ok=%s  reserve=%.1f%% of gravity  peak ext act=%.2f  hold err=%.2f deg",
             factor, row["task_ok"], row["reserve_peak_pct_gravity"], row["ext_activation_peak"],
             row["hold_max_error_deg"])
    if return_solution:
        return row, sol, model
    return row


def append_row(path, row):
    new = not path.exists()
    with open(path, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(row))
        if new:
            w.writeheader()
        w.writerow(row)


def read_rows(path):
    if not path.exists():
        return []
    with open(path) as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        r["strength_factor"] = float(r["strength_factor"])
        r["task_ok"] = r["task_ok"] == "True"
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--config", default=None)
    ap.add_argument("--tag", default="baseline")
    ap.add_argument("--bisect", type=int, default=4, help="bisection steps after the grid")
    ap.add_argument("--factors", default=None, help="comma-separated strength factors (default: built-in grid)")
    ap.add_argument("--bisect-range", default=None,
                    help="LO,HI: skip the grid and bisect between a failing and a passing factor")
    ap.add_argument("--coarse-only", action="store_true", help="no mesh refinement")
    ap.add_argument("--warm-start", action="store_true", help="start from the nearest saved solution")
    ap.add_argument("--max-iter", type=int, default=None, help="override solver.max_iterations")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s", datefmt="%H:%M:%S")
    cfg = load_config(args.config)
    if args.coarse_only:
        cfg["solver"]["refine_mesh_intervals"] = None
    if args.max_iter:
        cfg["solver"]["max_iterations"] = args.max_iter

    out_csv = RESULTS_DIR / f"{args.tag}_k1_sweep.csv"
    sol_dir = RESULTS_DIR / f"{args.tag}_k1_solutions"
    sol_dir.mkdir(parents=True, exist_ok=True)

    def run(factor):
        guess = nearest_solution(args.tag, factor) if args.warm_start else None
        row, sol, _ = solve_at(cfg, factor, guess_file=guess, return_solution=True)
        if row["solver_success"]:
            sol.write(str(solution_file(args.tag, factor)))
        append_row(out_csv, row)
        return row

    if args.bisect_range:
        lo, hi = (float(x) for x in args.bisect_range.split(","))
    else:
        factors = [float(x) for x in args.factors.split(",")] if args.factors else FACTORS
        for f in factors:
            run(f)
        rows = read_rows(out_csv)
        ok = [r["strength_factor"] for r in rows if r["task_ok"]]
        bad = [r["strength_factor"] for r in rows if not r["task_ok"]]
        lo, hi = (max(bad), min(ok)) if ok and bad and min(ok) > max(bad) else (None, None)
    if lo is not None:
        for _ in range(args.bisect):
            mid = round(0.5 * (lo + hi), 4)
            r = run(mid)
            lo, hi = (lo, mid) if r["task_ok"] else (mid, hi)

    rows = read_rows(out_csv)
    ok = [r["strength_factor"] for r in rows if r["task_ok"]]
    bad = [r["strength_factor"] for r in rows if not r["task_ok"]]
    if ok and bad and min(ok) > max(bad):
        k1 = {"weakest_passing_factor": min(ok), "strongest_failing_factor": max(bad)}
    else:
        k1 = {"note": "no clean pass/fail boundary", "passing": sorted(ok), "failing": sorted(bad)}
    summary = {"criteria": {"reserve_limit_pct_of_gravity": RESERVE_LIMIT_PCT,
                            "hold_limit_deg": HOLD_LIMIT_DEG, "solver_must_converge": True},
               "scaled_muscles": cfg["names"]["wrist_extensors"],
               "mesh": {"coarse": cfg["solver"]["num_mesh_intervals"],
                        "refine": cfg["solver"]["refine_mesh_intervals"]},
               "max_iterations": cfg["solver"]["max_iterations"],
               "warm_start": args.warm_start, "k1": k1}
    (RESULTS_DIR / f"{args.tag}_k1_summary.json").write_text(json.dumps(summary, indent=2))
    log.info("wrote %s", out_csv)
    log.info("K1: %s", k1)


if __name__ == "__main__":
    main()
