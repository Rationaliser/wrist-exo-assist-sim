"""Task 4b: baseline Moco solve -- lift the dropped wrist to a functional angle and hold it.

Problem
  * states: wrist flexion angle/speed (+ deviation if freed), muscle activations
  * hard bounds: start angle, end angle, zero speed at t=0 and t=T
  * goals:   MocoControlGoal (effort; reserve controls weighted x reserve_weight)
           + MocoStateTrackingGoal on the wrist angle against a minimum-jerk move followed by a
             hold at the end angle (gives the "and hold it" part; pure effort with endpoint
             constraints would only arrive at t=T without holding)
  * solver:  MocoCasADiSolver, coarse mesh first, refined only if the coarse solve succeeds

Usage (wrist-opensim env):
    python route_a_moco/solve_baseline.py [--config PATH] [--torque-driven] [--no-refine]
"""
import argparse
import json
import logging
import math
import sys
import time
from pathlib import Path

import numpy as np
import opensim as osim

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_model import RESERVE_PREFIX, build, gravity_torque  # noqa: E402
from common import RESULTS_DIR, load_config  # noqa: E402

log = logging.getLogger("solve_baseline")


def min_jerk_reference(t, q0, q1, t_move):
    tau = np.clip(t / t_move, 0.0, 1.0)
    return q0 + (q1 - q0) * (10 * tau ** 3 - 15 * tau ** 4 + 6 * tau ** 5)


def reference_table(qpath, q0, q1, duration, t_move, n=101):
    t = np.linspace(0.0, duration, n)
    q = min_jerk_reference(t, q0, q1, t_move)
    table = osim.TimeSeriesTable()
    table.addTableMetaDataString("inDegrees", "no")
    labels = osim.StdVectorString()
    labels.append(qpath + "/value")
    table.setColumnLabels(labels)
    for ti, qi in zip(t, q):
        row = osim.RowVector(1, float(qi))
        table.appendRow(float(ti), row)
    return table


def coord_path(model, name):
    return model.getCoordinateSet().get(name).getAbsolutePathString()


def make_study(cfg, model, info, num_intervals, control_weights=None):
    """control_weights: optional {actuator path: effort weight} for extra actuators (e.g. assist)."""
    task = cfg["task"]
    q = cfg["names"]["wrist_flexion"]
    qpath = coord_path(model, q)
    coord = model.getCoordinateSet().get(q)
    q0, q1 = math.radians(task["start_deg"]), math.radians(task["end_deg"])
    T = task["duration_s"]
    t_move = T * (1.0 - task["hold_fraction"])

    study = osim.MocoStudy()
    study.setName("wrist_baseline")
    problem = study.updProblem()
    problem.setModelAsCopy(model)
    problem.setTimeBounds(0.0, T)
    problem.setStateInfo(qpath + "/value", [coord.getRangeMin(), coord.getRangeMax()], q0, q1)
    problem.setStateInfo(qpath + "/speed", [-20.0, 20.0], 0.0, 0.0)
    for extra in info["free_coordinates"][1:]:  # e.g. wrist deviation, if freed
        p = coord_path(model, extra)
        c = model.getCoordinateSet().get(extra)
        problem.setStateInfo(p + "/value", [c.getRangeMin(), c.getRangeMax()])
        problem.setStateInfo(p + "/speed", [-20.0, 20.0], 0.0, 0.0)

    rc = cfg["reserves"]
    effort = osim.MocoControlGoal("effort", rc["effort_weight"])
    for r in info["reserves"]:
        effort.setWeightForControl("/forceset/" + r, rc["reserve_weight"])
    for path, w in (control_weights or {}).items():
        effort.setWeightForControl(path, w)
    problem.addGoal(effort)

    if info["kept_muscles"] and cfg.get("actuation", "muscles") != "torque":
        # without this, initial activations are free and the solver exploits them (spike at t=0)
        problem.addGoal(osim.MocoInitialActivationGoal("initial_activation"))

    track = osim.MocoStateTrackingGoal("wrist_track", task["track_weight"])
    track.setReference(osim.TableProcessor(reference_table(qpath, q0, q1, T, t_move)))
    problem.addGoal(track)

    sc = cfg["solver"]
    solver = study.initCasADiSolver()
    solver.set_num_mesh_intervals(num_intervals)
    solver.set_transcription_scheme(sc["transcription"])
    solver.set_optim_convergence_tolerance(sc["optim_convergence_tolerance"])
    solver.set_optim_constraint_tolerance(sc["optim_constraint_tolerance"])
    solver.set_optim_max_iterations(sc["max_iterations"])
    solver.set_parallel(sc["parallel"])

    guess = solver.createGuess()
    tg = guess.getTime().to_numpy()
    guess.setState(qpath + "/value", osim.Vector(list(min_jerk_reference(tg, q0, q1, t_move))))
    solver.setGuess(guess)
    return study, solver, qpath


def run_solve(study, label):
    t0 = time.time()
    sol = study.solve()
    wall = time.time() - t0
    ok = sol.success()
    if not ok:
        sol.unseal()
    stats = {
        "label": label,
        "success": bool(ok),
        "status": sol.getStatus(),
        "iterations": int(sol.getNumIterations()),
        "solver_duration_s": float(sol.getSolverDuration()),
        "wall_time_s": wall,
        "objective": float(sol.getObjective()),
    }
    log.info("[%s] success=%s status=%s iterations=%d solve time=%.1f s objective=%.5g",
             label, ok, stats["status"], stats["iterations"], stats["solver_duration_s"], stats["objective"])
    return sol, stats


def evaluate(cfg, model, info, sol, qpath):
    task = cfg["task"]
    t = sol.getTimeMat()
    q = sol.getStateMat(qpath + "/value")
    T = task["duration_s"]
    hold = t >= T * (1.0 - task["hold_fraction"])
    q1 = math.radians(task["end_deg"])
    m = {"final_angle_deg": math.degrees(q[-1]),
         "hold_max_error_deg": float(np.degrees(np.max(np.abs(q[hold] - q1))))}

    qname = cfg["names"]["wrist_flexion"]
    g = np.array([gravity_torque(model, qname, float(qi)) for qi in q])
    m["gravity_torque_start_Nm"] = float(g[0])
    m["gravity_torque_end_Nm"] = float(g[-1])
    m["gravity_torque_peak_abs_Nm"] = float(np.max(np.abs(g)))

    for r in info["reserves"]:
        act = model.getComponent("/forceset/" + r)
        fopt = osim.CoordinateActuator.safeDownCast(act).getOptimalForce()
        tau = sol.getControlMat("/forceset/" + r) * fopt
        m[f"{r}_peak_abs_Nm"] = float(np.max(np.abs(tau)))
        m[f"{r}_rms_Nm"] = float(np.sqrt(np.mean(tau ** 2)))
        m[f"{r}_peak_over_gravity_pct"] = 100.0 * m[f"{r}_peak_abs_Nm"] / m["gravity_torque_peak_abs_Nm"]
    return m, t, g


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--config", default=None)
    ap.add_argument("--torque-driven", action="store_true", help="fallback A: wrist torque actuator, no muscles")
    ap.add_argument("--no-refine", action="store_true")
    ap.add_argument("--tag", default="baseline")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    cfg = load_config(args.config)
    if args.torque_driven:
        cfg["actuation"] = "torque"
    model, info = build(cfg)
    model.printToXML(str(RESULTS_DIR / f"{args.tag}_processed.osim"))

    sc = cfg["solver"]
    study, solver, qpath = make_study(cfg, model, info, sc["num_mesh_intervals"])
    sol, stats = run_solve(study, f"coarse N={sc['num_mesh_intervals']}")
    runs = [stats]
    if stats["success"] and not args.no_refine and sc.get("refine_mesh_intervals"):
        study, solver, qpath = make_study(cfg, model, info, sc["refine_mesh_intervals"])
        solver.setGuess(sol)
        sol_f, stats_f = run_solve(study, f"refined N={sc['refine_mesh_intervals']}")
        runs.append(stats_f)
        if stats_f["success"]:
            sol = sol_f
        else:
            log.warning("refined solve failed; keeping the coarse solution")

    out = RESULTS_DIR / f"{args.tag}_solution.sto"
    sol.write(str(out))
    metrics, t, g = evaluate(cfg, model, info, sol, qpath)
    np.savetxt(RESULTS_DIR / f"{args.tag}_gravity_torque.csv", np.column_stack([t, g]),
               delimiter=",", header="time_s,gravity_torque_Nm", comments="")

    final = runs[-1] if runs[-1]["success"] or len(runs) == 1 else runs[0]
    report = {"actuation": cfg.get("actuation", "muscles"), "opensim_version": osim.__version__,
              "build": info, "runs": runs, "used_run": final["label"], "metrics": metrics,
              "solution_file": str(out.relative_to(RESULTS_DIR.parent))}
    (RESULTS_DIR / f"{args.tag}_report.json").write_text(json.dumps(report, indent=2))

    log.info("wrote %s", out)
    for k, v in metrics.items():
        log.info("  %-40s %+.4f", k, v)
    for r in info["reserves"]:
        pct = metrics[f"{r}_peak_over_gravity_pct"]
        flag = "OK" if pct <= 10.0 else "FLAG: reserve > 10 % of gravity torque"
        log.info("  %s peak = %.1f %% of peak gravity torque -> %s", r, pct, flag)
    if not final["success"]:
        log.error("SOLVE DID NOT CONVERGE -- solution written for inspection only")
        sys.exit(1)


if __name__ == "__main__":
    main()
