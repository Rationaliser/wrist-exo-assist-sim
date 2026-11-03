"""Minimal planar wrist model built in code (fast cross-check of the MoBL-ARMS pipeline).

Two rigid bodies: a forearm welded to ground (horizontal, pronated: palm down) and a hand on a
pin joint `wrist_flexion` (+ = flexion = hand tip falls under gravity). One lumped wrist
extensor and one lumped wrist flexor (Millard2012 muscles, replaced by DeGrooteFregly2016 in
build_model.py), each wrapping over a cylinder at the wrist axis so the moment arm stays close
to the configured value. All parameters live in config/planar.yaml with their sources.

The cup is NOT added here; build_model.py adds it exactly as for MoBL-ARMS.

Usage (wrist-opensim env):
    python route_a_moco/build_planar_model.py [--config config/planar.yaml]
"""
import argparse
import math
import sys
from pathlib import Path

import opensim as osim

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import REPO_ROOT, load_config, model_path  # noqa: E402

DEFAULT_CFG = REPO_ROOT / "config" / "planar.yaml"


def _segment_inertia(mass, length, rog):
    """Planar-segment inertia about the COM from a radius of gyration (fraction of length)."""
    i = mass * (rog * length) ** 2
    return osim.Inertia(0.1 * i, i, i)  # small about the long axis


def make_model(p, coord_name, hand_body):
    m = osim.Model()
    m.setName("planar_wrist")
    m.setGravity(osim.Vec3(0, -9.80665, 0))
    # Frames: x = distal along the forearm, y = up (= dorsal, palm down), z = lateral.
    fa, hd = p["forearm"], p["hand"]
    forearm = osim.Body("forearm", fa["mass_kg"], osim.Vec3(-fa["com_from_wrist_m"], 0, 0),
                        _segment_inertia(fa["mass_kg"], fa["length_m"], fa["rog"]))
    hand = osim.Body(hand_body, hd["mass_kg"], osim.Vec3(hd["com_from_wrist_m"], 0, 0),
                     _segment_inertia(hd["mass_kg"], hd["length_m"], hd["rog"]))
    forearm.attachGeometry(osim.Brick(osim.Vec3(fa["length_m"] / 2, 0.02, 0.03)))
    forearm.get_attached_geometry(0).setColor(osim.Vec3(0.8, 0.7, 0.6))
    hand.attachGeometry(osim.Brick(osim.Vec3(hd["length_m"] / 2, 0.012, 0.04)))
    m.addBody(forearm)
    m.addBody(hand)

    weld = osim.WeldJoint("ground_forearm", m.getGround(), osim.Vec3(0, 1.0, 0), osim.Vec3(0),
                          forearm, osim.Vec3(0), osim.Vec3(0))
    # Both joint frames rotated pi about x: positive rotation then moves the hand tip downward.
    pin = osim.PinJoint("wrist", forearm, osim.Vec3(0), osim.Vec3(math.pi, 0, 0),
                        hand, osim.Vec3(0), osim.Vec3(math.pi, 0, 0))
    c = pin.updCoordinate()
    c.setName(coord_name)
    lo, hi = p["wrist_range_deg"]
    c.setRangeMin(math.radians(lo))
    c.setRangeMax(math.radians(hi))
    c.setDefaultValue(0.0)
    m.addJoint(weld)
    m.addJoint(pin)

    for spec in p["muscles"]:
        side = 1.0 if spec["side"] == "dorsal" else -1.0
        r = spec["moment_arm_m"]
        mus = osim.Millard2012EquilibriumMuscle(spec["name"], spec["max_isometric_force_n"],
                                                spec["optimal_fiber_length_m"], 0.2, 0.0)
        mus.addNewPathPoint("origin", forearm, osim.Vec3(-spec["origin_from_wrist_m"], side * r, 0))
        mus.addNewPathPoint("insertion", hand, osim.Vec3(spec["insertion_from_wrist_m"], side * r, 0))
        wrap = osim.WrapCylinder()
        wrap.setName(f"{spec['name']}_wrap")
        wrap.set_radius(r)
        wrap.set_length(0.06)
        wrap.set_quadrant("+y" if side > 0 else "-y")
        forearm.addWrapObject(wrap)
        mus.updGeometryPath().addPathWrap(wrap)
        m.addForce(mus)

    m.finalizeConnections()
    state = m.initSystem()
    # Tendon slack length: fibres at optimal length at the neutral wrist angle (assumption).
    for spec in p["muscles"]:
        mus = osim.Millard2012EquilibriumMuscle.safeDownCast(m.updForceSet().get(spec["name"]))
        lmt = mus.getLength(state)
        mus.setTendonSlackLength(lmt - spec["optimal_fiber_length_m"])
    m.finalizeConnections()
    return m


def moment_arm_table(model, coord_name, angles_deg):
    s = model.initSystem()
    c = model.getCoordinateSet().get(coord_name)
    rows = []
    for a in angles_deg:
        c.setValue(s, math.radians(a))
        model.realizePosition(s)
        rows.append((a, {mu.getName(): mu.computeMomentArm(s, c) for mu in model.getMuscles()}))
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--config", default=str(DEFAULT_CFG))
    args = ap.parse_args()
    cfg = load_config(args.config)
    out = model_path(cfg)
    out.parent.mkdir(parents=True, exist_ok=True)
    model = make_model(cfg["planar"], cfg["names"]["wrist_flexion"], cfg["names"]["hand_body"])
    model.printToXML(str(out))
    print(f"wrote {out}")
    for mu in model.getMuscles():
        print(f"  {mu.getName()}: Fmax={mu.getMaxIsometricForce():.1f} N, lopt={mu.getOptimalFiberLength():.4f} m, "
              f"lts={mu.getTendonSlackLength():.4f} m")
    print("  moment arms (mm; + = flexing):")
    for a, r in moment_arm_table(model, cfg["names"]["wrist_flexion"], range(-45, 61, 15)):
        print(f"    {a:+4d} deg  " + "  ".join(f"{k} {v * 1000:+6.1f}" for k, v in r.items()))


if __name__ == "__main__":
    main()
