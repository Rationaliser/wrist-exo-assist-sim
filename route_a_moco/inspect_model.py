"""Task 3: write an inventory of an OpenSim model to results/model_inventory.md.

Lists every coordinate, muscle (with the coordinates it spans) and body, so that
coordinate/muscle names used downstream are read from the model, not guessed.

Usage (wrist-opensim env):
    python route_a_moco/inspect_model.py [--model PATH] [--out PATH]
"""
import argparse
import math
import sys
from pathlib import Path

import opensim as osim

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import RESULTS_DIR, load_config, model_path  # noqa: E402

MOMENT_ARM_TOL = 1e-4  # m; |r| below this counts as "does not span"


def _fmt_coord_value(coord, value):
    if coord.getMotionType() == osim.Coordinate.Rotational:
        return f"{math.degrees(value):.1f}°"
    return f"{value:.4f} m"


def coordinate_rows(model):
    rows = []
    for c in model.getCoordinateSet():
        rows.append({
            "name": c.getName(),
            "joint": c.getJoint().getName(),
            "type": "rot" if c.getMotionType() == osim.Coordinate.Rotational else "trans",
            "default": _fmt_coord_value(c, c.getDefaultValue()),
            "range": f"[{_fmt_coord_value(c, c.getRangeMin())}, {_fmt_coord_value(c, c.getRangeMax())}]",
            "locked": c.getDefaultLocked(),
            "clamped": c.getDefaultClamped(),
        })
    return rows


def muscle_rows(model, state):
    rows = []
    coords = list(model.getCoordinateSet())
    for m in model.getMuscles():
        spans = []
        for c in coords:
            r = m.computeMomentArm(state, c)
            if abs(r) > MOMENT_ARM_TOL:
                spans.append(f"{c.getName()} ({r * 1000:+.1f} mm)")
        rows.append({
            "name": m.getName(),
            "class": m.getConcreteClassName(),
            "fmax": m.getMaxIsometricForce(),
            "lopt": m.getOptimalFiberLength(),
            "lts": m.getTendonSlackLength(),
            "spans": spans,
        })
    return rows


def body_rows(model):
    rows = []
    for b in model.getBodySet():
        com = b.getMassCenter()
        rows.append({
            "name": b.getName(),
            "mass": b.getMass(),
            "com": f"({com.get(0):.4f}, {com.get(1):.4f}, {com.get(2):.4f})",
        })
    return rows


def joint_rows(model):
    rows = []
    for j in model.getJointSet():
        rows.append({
            "name": j.getName(),
            "class": j.getConcreteClassName(),
            "parent": j.getParentFrame().findBaseFrame().getName(),
            "child": j.getChildFrame().findBaseFrame().getName(),
            "coords": ", ".join(j.get_coordinates(i).getName() for i in range(j.numCoordinates())),
        })
    return rows


def write_inventory(model, src_path, out_path):
    state = model.initSystem()
    model.realizePosition(state)

    coords = coordinate_rows(model)
    muscles = muscle_rows(model, state)
    bodies = body_rows(model)
    joints = joint_rows(model)

    L = []
    L.append(f"# Model inventory: `{Path(src_path).name}`\n")
    L.append(f"* OpenSim version: {osim.__version__}")
    L.append(f"* Model name: `{model.getName()}`")
    L.append(f"* Gravity: {model.getGravity()}")
    L.append(f"* Coordinates: {len(coords)}, muscles: {len(muscles)}, bodies: {len(bodies)}, "
             f"joints: {len(joints)}, constraints: {model.getConstraintSet().getSize()}, "
             f"forces: {model.getForceSet().getSize()}")
    L.append(f"* Moment arms evaluated at the default pose; |r| > {MOMENT_ARM_TOL * 1000:.1f} mm counts as spanning.\n")

    L.append("## Coordinates\n")
    L.append("| name | joint | type | default | range | locked | clamped |")
    L.append("|---|---|---|---|---|---|---|")
    for r in coords:
        L.append(f"| `{r['name']}` | {r['joint']} | {r['type']} | {r['default']} | {r['range']} | "
                 f"{r['locked']} | {r['clamped']} |")

    L.append("\n## Muscles\n")
    L.append("| name | class | F_max (N) | l_opt (m) | l_ts (m) | spans (moment arm) |")
    L.append("|---|---|---|---|---|---|")
    for r in muscles:
        L.append(f"| `{r['name']}` | {r['class']} | {r['fmax']:.1f} | {r['lopt']:.4f} | {r['lts']:.4f} | "
                 f"{'; '.join(r['spans']) or '—'} |")

    L.append("\n## Bodies\n")
    L.append("| name | mass (kg) | COM in body frame (m) |")
    L.append("|---|---|---|")
    for r in bodies:
        L.append(f"| `{r['name']}` | {r['mass']:.4f} | {r['com']} |")

    L.append("\n## Joints\n")
    L.append("| name | class | parent | child | coordinates |")
    L.append("|---|---|---|---|---|")
    for r in joints:
        L.append(f"| `{r['name']}` | {r['class']} | {r['parent']} | {r['child']} | {r['coords']} |")

    if model.getConstraintSet().getSize():
        L.append("\n## Constraints\n")
        for c in model.getConstraintSet():
            L.append(f"* `{c.getName()}` ({c.getConcreteClassName()})")

    non_muscle = [f for f in model.getForceSet() if not osim.Muscle.safeDownCast(f)]
    if non_muscle:
        L.append("\n## Other forces\n")
        for f in non_muscle:
            L.append(f"* `{f.getName()}` ({f.getConcreteClassName()})")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(L) + "\n")
    return coords, muscles


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--config", default=None)
    ap.add_argument("--model", default=None, help="override model.path from config")
    ap.add_argument("--out", default=str(RESULTS_DIR / "model_inventory.md"))
    args = ap.parse_args()

    src = Path(args.model) if args.model else model_path(load_config(args.config))
    if not src.exists():
        sys.exit(f"Model not found: {src}\nSee models/README.md for where to get MoBL-ARMS.")

    model = osim.Model(str(src))
    coords, muscles = write_inventory(model, src, Path(args.out))
    print(f"Wrote {args.out}: {len(coords)} coordinates, {len(muscles)} muscles")
    for r in coords:
        print(f"  coord  {r['name']:<24} default={r['default']:<10} range={r['range']} locked={r['locked']}")
    for r in muscles:
        print(f"  muscle {r['name']:<24} Fmax={r['fmax']:8.1f} N  spans: {', '.join(s.split(' ')[0] for s in r['spans'])}")


if __name__ == "__main__":
    main()
