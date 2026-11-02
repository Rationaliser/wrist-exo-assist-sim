"""Task 4a: build the processed wrist model used by the baseline Moco solve.

Steps (all names come from config/baseline.yaml, which is filled from the model inventory):
  1. set the "locked" posture as default coordinate values and replace every joint that has
     no free coordinate with a WeldJoint (Moco does not accept locked coordinates; in
     OpenSim 4.6 ModOpReplaceJointsWithWelds keeps the default pose);
  2. weld a cup body to the hand;
  3. keep only muscles that span the wrist;
  4. scale_strength() hook for the weakness sweep;
  5. DeGrooteFregly2016 muscles (rigid tendon) and penalised reserve actuators.

Usage (wrist-opensim env):
    python route_a_moco/build_model.py [--config PATH] [--strength FACTOR]
"""
import argparse
import logging
import math
import sys
from pathlib import Path

import opensim as osim

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import REPO_ROOT, RESULTS_DIR, load_config, model_path  # noqa: E402

log = logging.getLogger("build_model")

RESERVE_PREFIX = "reserve_"
CUP_BODY = "cup"


# --------------------------------------------------------------------------- hooks
def scale_strength(model, muscle_names, factor):
    """Multiply max isometric force of the named muscles by `factor` (in place).

    Raises KeyError if a name is not a muscle in the model. Returns {name: (old, new)}.
    """
    muscles = model.updMuscles()
    changed = {}
    for name in muscle_names:
        if muscles.getIndex(name) < 0:
            raise KeyError(f"muscle '{name}' not in model")
        m = muscles.get(name)
        old = m.getMaxIsometricForce()
        m.setMaxIsometricForce(old * factor)
        changed[name] = (old, old * factor)
    return changed


# --------------------------------------------------------------------------- helpers
def free_coordinates(cfg):
    names = cfg["names"]
    free = [names["wrist_flexion"]]
    if cfg["posture"].get("free_wrist_deviation"):
        free.append(names["wrist_deviation"])
    return free


def wrist_muscles(cfg):
    n = cfg["names"]
    return list(n["wrist_extensors"]) + list(n["wrist_flexors"]) + list(n.get("other_wrist_muscles", []))


def set_posture(model, locked_deg, free):
    """Set default values of the posture coordinates (deg -> rad for rotational ones)."""
    cs = model.updCoordinateSet()
    for name, deg in (locked_deg or {}).items():
        if name in free:
            raise ValueError(f"'{name}' is both free and in posture.locked_deg")
        c = cs.get(name)
        c.setDefaultValue(math.radians(deg) if c.getMotionType() == osim.Coordinate.Rotational else deg)


def joints_to_weld(model, free):
    """Joints none of whose coordinates are free. Joints mixing free and non-free
    coordinates cannot be welded; their non-free coordinates are returned separately."""
    weld, mixed = [], []
    for j in model.getJointSet():
        coords = [j.get_coordinates(i).getName() for i in range(j.numCoordinates())]
        if not any(c in free for c in coords):
            if coords:
                weld.append(j.getName())
        else:
            mixed += [c for c in coords if c not in free]
    return weld, mixed


def remove_constraints_on(model, coord_names):
    """Remove coordinate-coupler (and similar) constraints that reference welded coordinates."""
    removed = []
    cs = model.updConstraintSet()
    for i in reversed(range(cs.getSize())):
        c = cs.get(i)
        cc = osim.CoordinateCouplerConstraint.safeDownCast(c)
        if cc is None:
            continue
        refs = [cc.getIndependentCoordinateNames().get(k)
                for k in range(cc.getIndependentCoordinateNames().getSize())]
        refs.append(cc.getDependentCoordinateName())
        if any(r in coord_names for r in refs):
            removed.append(c.getName())
            cs.remove(i)
    return removed


def remove_non_wrist_forces(model, keep_muscles, welded_coords):
    """Remove muscles not in keep_muscles, and coordinate-based forces on welded coordinates."""
    fs = model.updForceSet()
    removed_muscles, removed_other = [], []
    for i in reversed(range(fs.getSize())):
        f = fs.get(i)
        if osim.Muscle.safeDownCast(f):
            if f.getName() not in keep_muscles:
                removed_muscles.append(f.getName())
                fs.remove(i)
            continue
        for cls in (osim.CoordinateLimitForce, osim.CoordinateActuator):
            obj = cls.safeDownCast(f)
            if obj is not None and obj.get_coordinate() in welded_coords:
                removed_other.append(f.getName())
                fs.remove(i)
                break
    missing = [m for m in keep_muscles if m not in [model.getMuscles().get(k).getName()
                                                     for k in range(model.getMuscles().getSize())]]
    if missing:
        raise KeyError(f"configured wrist muscles not in model: {missing}")
    return sorted(removed_muscles), sorted(removed_other)


def cylinder_inertia(mass, radius, height):
    """Solid cylinder, axis along body y."""
    ixx = mass * (3 * radius ** 2 + height ** 2) / 12.0
    iyy = 0.5 * mass * radius ** 2
    return osim.Inertia(ixx, iyy, ixx)


def add_cup(model, hand_body, cup_cfg):
    hand = model.getBodySet().get(hand_body)
    m, r, h = cup_cfg["mass_kg"], cup_cfg["radius_m"], cup_cfg["height_m"]
    cup = osim.Body(CUP_BODY, m, osim.Vec3(0), cylinder_inertia(m, r, h))
    cup.attachGeometry(osim.Cylinder(r, h / 2))
    off = osim.Vec3(*cup_cfg["offset_in_hand_m"])
    rot = osim.Vec3(*[math.radians(a) for a in cup_cfg.get("orientation_in_hand_deg", [0, 0, 0])])
    joint = osim.WeldJoint("cup_weld", hand, off, rot, cup, osim.Vec3(0), osim.Vec3(0))
    model.addBody(cup)
    model.addJoint(joint)
    return cup


# --------------------------------------------------------------------------- main build
def build(cfg, strength_factor=None, verbose=True):
    """Return the processed osim.Model (initSystem() already called once) and a build log dict."""
    src = model_path(cfg)
    if not src.exists():
        raise FileNotFoundError(f"model not found: {src} (see models/README.md)")
    model = osim.Model(str(src))
    model.initSystem()

    free = free_coordinates(cfg)
    set_posture(model, cfg["posture"].get("locked_deg"), free)
    weld, mixed = joints_to_weld(model, free)
    if mixed:
        raise RuntimeError(
            f"non-free coordinates share a joint with a free coordinate and cannot be welded: {mixed}. "
            "Add them to posture.prescribe_deg (not implemented yet) or free them.")
    welded_coords = {model.getJointSet().get(j).get_coordinates(i).getName()
                     for j in weld for i in range(model.getJointSet().get(j).numCoordinates())}

    removed_constraints = remove_constraints_on(model, welded_coords)
    removed_muscles, removed_other = remove_non_wrist_forces(model, wrist_muscles(cfg), welded_coords)

    add_cup(model, cfg["names"]["hand_body"], cfg["cup"])

    factor = cfg["muscles"].get("strength_factor", 1.0) if strength_factor is None else strength_factor
    if factor != 1.0:
        scale_strength(model, cfg["names"]["wrist_extensors"], factor)

    torque_driven = cfg.get("actuation", "muscles") == "torque"
    if torque_driven:  # fallback A: one ideal torque actuator per free coordinate, no muscles
        tc = cfg.get("torque_actuator", {"optimal_force_nm": 5.0, "bound": 1.0})
        for q in free:
            ca = osim.CoordinateActuator(q)
            ca.setName("tau_" + q)
            ca.setOptimalForce(tc["optimal_force_nm"])
            ca.setMinControl(-tc["bound"])
            ca.setMaxControl(tc["bound"])
            model.addForce(ca)
    model.finalizeConnections()

    # Moco model processing
    mp = osim.ModelProcessor(model)
    welds = osim.StdVectorString()
    for j in weld:
        welds.append(j)
    mp.append(osim.ModOpReplaceJointsWithWelds(welds))
    mc = cfg["muscles"]
    if torque_driven:
        mp.append(osim.ModOpRemoveMuscles())
    elif mc.get("model", "DeGrooteFregly2016") == "DeGrooteFregly2016":
        mp.append(osim.ModOpReplaceMusclesWithDeGrooteFregly2016())
        if mc.get("ignore_passive_fiber_force"):
            mp.append(osim.ModOpIgnorePassiveFiberForcesDGF())
    if mc.get("ignore_tendon_compliance", True) and not torque_driven:
        mp.append(osim.ModOpIgnoreTendonCompliance())
    rc = cfg["reserves"]
    mp.append(osim.ModOpAddReserves(rc["optimal_force_nm"], rc["bound"], True))
    out = mp.process()

    # name reserves clearly: reserve_<coordinate>
    reserves = []
    for a in out.getActuators():
        ca = osim.CoordinateActuator.safeDownCast(a)
        if ca is not None and ca.get_coordinate() in free:
            ca.setName(RESERVE_PREFIX + ca.get_coordinate())
            reserves.append(ca.getName())
    out.finalizeConnections()
    out.initSystem()

    info = {
        "source_model": str(src.relative_to(REPO_ROOT)) if src.is_relative_to(REPO_ROOT) else str(src),
        "free_coordinates": free,
        "welded_joints": weld,
        "removed_constraints": removed_constraints,
        "removed_muscles": removed_muscles,
        "removed_other_forces": removed_other,
        "kept_muscles": [out.getMuscles().get(i).getName() for i in range(out.getMuscles().getSize())],
        "reserves": reserves,
        "strength_factor": factor,
    }
    if verbose:
        log.info("free coordinates: %s", free)
        log.info("welded %d joints: %s", len(weld), weld)
        log.info("removed %d constraints: %s", len(removed_constraints), removed_constraints)
        log.info("removed %d muscles: %s", len(removed_muscles), removed_muscles)
        log.info("removed %d other forces: %s", len(removed_other), removed_other)
        log.info("kept %d muscles: %s", len(info["kept_muscles"]), info["kept_muscles"])
        log.info("reserves: %s", reserves)
    return out, info


def gravity_torque(model, coord_name, angle_rad):
    """Generalized force (Nm) that gravity applies to `coord_name` at `angle_rad`, zero velocity,
    with all other forces disabled. Positive = in the coordinate's positive direction."""
    m = model.clone()
    for i in range(m.getForceSet().getSize()):
        m.updForceSet().get(i).set_appliesForce(False)
    s = m.initSystem()
    m.getCoordinateSet().get(coord_name).setValue(s, angle_rad)
    m.realizeDynamics(s)
    idsolver = osim.InverseDynamicsSolver(m)
    udot = osim.Vector(s.getNU(), 0.0)
    tau_needed = idsolver.solve(s, udot)  # generalized forces needed to hold still
    # mobility (u) index of the coordinate: set only its speed to 1 and find it in U
    probe = osim.State(s)
    probe.updU().setToZero()
    m.getCoordinateSet().get(coord_name).setSpeedValue(probe, 1.0)
    u = probe.getU()
    k = [i for i in range(u.size()) if u.get(i) != 0.0]
    assert len(k) == 1, f"could not map {coord_name} to one mobility"
    return -tau_needed.get(k[0])


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--config", default=None)
    ap.add_argument("--strength", type=float, default=None, help="extensor strength factor")
    ap.add_argument("--out", default=str(RESULTS_DIR / "baseline_processed.osim"))
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    cfg = load_config(args.config)
    model, info = build(cfg, args.strength)
    model.printToXML(args.out)
    log.info("wrote %s", args.out)

    q = cfg["names"]["wrist_flexion"]
    for label in ("start_deg", "end_deg"):
        ang = cfg["task"][label]
        log.info("gravity torque on %s at %s=%+.1f deg: %+.4f Nm",
                 q, label, ang, gravity_torque(model, q, math.radians(ang)))


if __name__ == "__main__":
    main()
