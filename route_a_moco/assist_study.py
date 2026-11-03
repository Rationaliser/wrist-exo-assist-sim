"""K2/K3: wrist assistance, ideal motor vs passive torsional spring.

K2  At extensor strength levels where the unassisted task fails, find by bisection
    * the smallest torque limit (Nm) of an ideal wrist motor that restores the task, and
    * the smallest stiffness (Nm/rad) of a linear torsional spring at the wrist (rest angle
      SPRING_REST_DEG, i.e. it always pulls toward extension) that restores the task.
    "Restores" uses the same pass criteria as the K1 sweep (solver converged, reserve <= 10 %
    of gravity torque, hold error <= 2 deg).
K3  At strength levels where the task still passes unassisted, compare muscle effort
    (integral of summed squared excitations) with and without the spring.

Usage (wrist-opensim env):
    python route_a_moco/assist_study.py --weak 0.05 0.03 --pass-levels 1.0 0.3 [--tag baseline]
"""
import argparse
import csv
import json
import logging
import math
import sys
from pathlib import Path

import numpy as np
import opensim as osim

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import RESULTS_DIR, load_config  # noqa: E402
from sweep_weakness import solve_at  # noqa: E402

log = logging.getLogger("assist_study")

MOTOR = "assist_motor"
SPRING = "assist_spring"
MOTOR_WEIGHT = 1.0        # effort weight on the motor control (same as one muscle excitation)
SPRING_REST_DEG = -60.0   # end of the wrist range in extension: spring always extends the wrist


def add_motor(coord, limit_nm):
    def modify(model):
        ca = osim.CoordinateActuator(coord)
        ca.setName(MOTOR)
        ca.setOptimalForce(limit_nm)
        ca.setMinControl(-1.0)
        ca.setMaxControl(1.0)
        model.addForce(ca)
    return modify


def add_spring(coord, stiffness, rest_deg=SPRING_REST_DEG):
    def modify(model):
        sp = osim.SpringGeneralizedForce(coord)
        sp.setName(SPRING)
        sp.setStiffness(stiffness)
        sp.setRestLength(math.radians(rest_deg))
        sp.setViscosity(0.0)
        model.addForce(sp)
    return modify


def spring_torque(stiffness, q_rad, rest_deg=SPRING_REST_DEG):
    """Generalized force of SpringGeneralizedForce: -k (q - rest); + = flexing."""
    return -stiffness * (q_rad - math.radians(rest_deg))


def run_case(cfg, factor, kind, value):
    coord = cfg["names"]["wrist_flexion"]
    if kind == "motor":
        row, sol, _ = solve_at(cfg, factor, add_motor(coord, value), {f"/forceset/{MOTOR}": MOTOR_WEIGHT},
                               return_solution=True)
        row["assist_peak_Nm"] = float(np.max(np.abs(sol.getControlMat(f"/forceset/{MOTOR}"))) * value)
    elif kind == "spring":
        row, sol, model = solve_at(cfg, factor, add_spring(coord, value), return_solution=True)
        q = sol.getStateMat(model.getCoordinateSet().get(coord).getAbsolutePathString() + "/value")
        row["assist_peak_Nm"] = float(np.max(np.abs(spring_torque(value, q))))
    else:
        row = solve_at(cfg, factor)
        row["assist_peak_Nm"] = 0.0
    row.update({"assist": kind or "none", "assist_value": value})
    log.info("  %s=%.4f at f=%.3f -> ok=%s, assist peak %.3f Nm, effort %.4g",
             kind or "none", value, factor, row["task_ok"], row["assist_peak_Nm"], row["muscle_effort"])
    return row


def bisect(cfg, factor, kind, hi, steps):
    """Smallest assist value in (0, hi] that passes; assumes pass/fail is monotonic in value."""
    rows = []
    r = run_case(cfg, factor, kind, hi)
    rows.append(r)
    if not r["task_ok"]:
        return None, rows
    lo = 0.0
    for _ in range(steps):
        mid = 0.5 * (lo + hi)
        r = run_case(cfg, factor, kind, mid)
        rows.append(r)
        lo, hi = (lo, mid) if r["task_ok"] else (mid, hi)
    return hi, rows


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--config", default=None)
    ap.add_argument("--tag", default="baseline")
    ap.add_argument("--weak", type=float, nargs="+", required=True, help="failing strength factors (K2)")
    ap.add_argument("--pass-levels", type=float, nargs="+", default=[1.0], help="passing factors (K3)")
    ap.add_argument("--motor-max", type=float, default=1.0, help="upper bracket, Nm")
    ap.add_argument("--spring-max", type=float, default=2.0, help="upper bracket, Nm/rad")
    ap.add_argument("--steps", type=int, default=6)
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    cfg = load_config(args.config)

    # sanity check of the spring sign: it must extend (negative torque) inside the wrist range
    assert spring_torque(1.0, math.radians(cfg["task"]["end_deg"])) < 0

    rows, k2 = [], []
    for f in args.weak:
        log.info("K2 at strength factor %.3f", f)
        base = run_case(cfg, f, None, 0.0)
        rows.append(base)
        t_min, r_m = bisect(cfg, f, "motor", args.motor_max, args.steps)
        k_min, r_s = bisect(cfg, f, "spring", args.spring_max, args.steps)
        rows += r_m + r_s
        best_s = min((r for r in r_s if r["task_ok"]), key=lambda r: r["assist_value"], default=None)
        best_m = min((r for r in r_m if r["task_ok"]), key=lambda r: r["assist_value"], default=None)
        k2.append({
            "strength_factor": f,
            "unassisted_ok": base["task_ok"],
            "motor_limit_min_Nm": t_min,
            "motor_peak_used_Nm": best_m["assist_peak_Nm"] if best_m else None,
            "spring_stiffness_min_Nm_per_rad": k_min,
            "spring_peak_torque_Nm": best_s["assist_peak_Nm"] if best_s else None,
            "spring_enough": k_min is not None,
            "bracket": {"motor_max_Nm": args.motor_max, "spring_max_Nm_per_rad": args.spring_max,
                        "steps": args.steps},
        })

    k_ref = max((k["spring_stiffness_min_Nm_per_rad"] for k in k2
                 if k["spring_stiffness_min_Nm_per_rad"] is not None), default=None)
    k3 = []
    if k_ref is not None:
        for f in args.pass_levels:
            log.info("K3 at strength factor %.3f with spring k=%.3f", f, k_ref)
            r0 = run_case(cfg, f, None, 0.0)
            r1 = run_case(cfg, f, "spring", k_ref)
            rows += [r0, r1]
            k3.append({"strength_factor": f, "spring_stiffness_Nm_per_rad": k_ref,
                       "effort_unassisted": r0["muscle_effort"], "effort_with_spring": r1["muscle_effort"],
                       "effort_reduction_pct": 100.0 * (1 - r1["muscle_effort"] / r0["muscle_effort"]),
                       "both_ok": r0["task_ok"] and r1["task_ok"]})

    out_csv = RESULTS_DIR / f"{args.tag}_assist_runs.csv"
    with open(out_csv, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    summary = {"motor_effort_weight": MOTOR_WEIGHT, "spring_rest_deg": SPRING_REST_DEG,
               "k2": k2, "k3": k3}
    (RESULTS_DIR / f"{args.tag}_assist_summary.json").write_text(json.dumps(summary, indent=2))
    log.info("wrote %s", out_csv)
    log.info(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
