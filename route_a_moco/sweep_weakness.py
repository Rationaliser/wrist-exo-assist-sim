"""K1 (P3 preview): wrist-extensor weakness sweep.

Scales the max isometric force of the configured wrist extensors (scale_strength hook) and
re-solves the baseline cup lift-and-hold problem at each strength factor. A factor "fails" when
  * the solver does not converge, or
  * peak reserve torque > RESERVE_LIMIT_PCT of the peak gravity torque at the wrist, or
  * the wrist drifts more than HOLD_LIMIT_DEG from the target during the hold.
The threshold (K1) is then refined by bisection between the weakest passing and the strongest
failing factor.

Usage (wrist-opensim env):
    python route_a_moco/sweep_weakness.py [--config PATH] [--tag baseline] [--bisect 4]
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


def solve_at(cfg, factor, modify=None, control_weights=None, return_solution=False):
    """Solve the baseline task with extensors scaled by `factor`.
    modify(model) may add forces (e.g. an assist device) to the processed model."""
    model, info = build(cfg, strength_factor=factor, verbose=False)
    if modify is not None:
        modify(model)
        model.finalizeConnections()
        model.initSystem()
    sc = cfg["solver"]
    study, _, qpath = make_study(cfg, model, info, sc["num_mesh_intervals"], control_weights)
    sol, stats = run_solve(study, f"f={factor:.3f} N={sc['num_mesh_intervals']}")
    if stats["success"] and sc.get("refine_mesh_intervals"):
        study, solver, qpath = make_study(cfg, model, info, sc["refine_mesh_intervals"], control_weights)
        solver.setGuess(sol)
        sol_f, stats_f = run_solve(study, f"f={factor:.3f} N={sc['refine_mesh_intervals']}")
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
    }
    row["task_ok"] = bool(row["solver_success"]
                          and row["reserve_peak_pct_gravity"] <= RESERVE_LIMIT_PCT
                          and row["hold_max_error_deg"] <= HOLD_LIMIT_DEG)
    log.info("f=%.3f  ok=%s  reserve=%.1f%% of gravity  peak ext act=%.2f  hold err=%.2f deg",
             factor, row["task_ok"], row["reserve_peak_pct_gravity"], row["ext_activation_peak"],
             row["hold_max_error_deg"])
    if return_solution:
        return row, sol, model
    return row


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--config", default=None)
    ap.add_argument("--tag", default="baseline")
    ap.add_argument("--bisect", type=int, default=4, help="bisection steps after the grid")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    cfg = load_config(args.config)

    rows = [solve_at(cfg, f) for f in FACTORS]
    ok = [r["strength_factor"] for r in rows if r["task_ok"]]
    bad = [r["strength_factor"] for r in rows if not r["task_ok"]]
    if ok and bad and min(ok) > max(bad):
        lo, hi = max(bad), min(ok)
        for _ in range(args.bisect):
            mid = round(0.5 * (lo + hi), 4)
            r = solve_at(cfg, mid)
            rows.append(r)
            lo, hi = (lo, mid) if r["task_ok"] else (mid, hi)
        k1 = {"weakest_passing_factor": hi, "strongest_failing_factor": lo}
    else:
        k1 = {"note": "no clean pass/fail boundary in the grid", "passing": ok, "failing": bad}
    rows.sort(key=lambda r: -r["strength_factor"])

    out_csv = RESULTS_DIR / f"{args.tag}_k1_sweep.csv"
    with open(out_csv, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    summary = {"criteria": {"reserve_limit_pct_of_gravity": RESERVE_LIMIT_PCT,
                            "hold_limit_deg": HOLD_LIMIT_DEG, "solver_must_converge": True},
               "scaled_muscles": cfg["names"]["wrist_extensors"], "k1": k1}
    (RESULTS_DIR / f"{args.tag}_k1_summary.json").write_text(json.dumps(summary, indent=2))
    log.info("wrote %s", out_csv)
    log.info("K1: %s", k1)


if __name__ == "__main__":
    main()
