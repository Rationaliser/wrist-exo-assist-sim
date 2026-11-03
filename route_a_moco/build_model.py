"""Build the processed wrist model used by the baseline Moco solve.

Steps (names come from the config, which is filled from the model inventory):
  1. set the posture as default coordinate values, then replace every joint without a free
     coordinate by a WeldJoint at that posture (Moco does not accept locked coordinates);
     coordinates that share a joint with a free one are braced instead;
  2. freeze moving path points that depend on welded coordinates;
  3. keep only the configured wrist muscles and weld a cup body to the hand;
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


def is_angular(coord):
    """Rotational coordinates, and 'Coupled' ones (MoBL-ARMS wrist flexion/deviation drive
    rotations through coupler constraints), are in radians."""
    return coord.getMotionType() in (osim.Coordinate.Rotational, osim.Coordinate.Coupled)


def set_posture(model, locked_deg, free):
    """Set default values of the posture coordinates (deg -> rad for angular ones), then assemble
    and store every coordinate's assembled value as its default, so coordinates that are coupled
    to the posture (e.g. MoBL-ARMS shoulder girdle) stay consistent when their joints are welded."""
    cs = model.updCoordinateSet()
    for name, deg in (locked_deg or {}).items():
        if name in free:
            raise ValueError(f"'{name}' is both free and in posture.locked_deg")
        c = cs.get(name)
        c.setDefaultValue(math.radians(deg) if is_angular(c) else deg)
    state = model.initSystem()  # assembles: dependent coordinates satisfy the constraints
    for i in range(cs.getSize()):
        cs.get(i).setDefaultValue(cs.get(i).getValue(state))
    drift = {n: math.degrees(cs.get(n).getDefaultValue()) - d for n, d in (locked_deg or {}).items()
             if is_angular(cs.get(n)) and abs(math.degrees(cs.get(n).getDefaultValue()) - d) > 0.5}
    if drift:
        raise RuntimeError(f"posture changed during assembly (deg): {drift}")


def coupler_map(model):
    """{dependent coordinate: [independent coordinates]} for every CoordinateCouplerConstraint."""
    out = {}
    for c in model.getConstraintSet():
        cc = osim.CoordinateCouplerConstraint.safeDownCast(c)
        if cc is not None:
            names = cc.getIndependentCoordinateNames()
            out[cc.getDependentCoordinateName()] = [names.get(k) for k in range(names.getSize())]
    return out


def joints_to_weld(model, free):
    """Split the model's joints and coordinates for the wrist-only problem.

    Returns (weld, lock, dependent):
      weld       joints with no free, locked or dependent coordinate -> replaced by WeldJoints
      lock       non-free coordinates sharing a joint with a free one (e.g. MoBL-ARMS wrist
                 deviation next to flexion) -> held at their default by a constant coupler
      dependent  coordinates that coupler constraints drive from kept coordinates
                 (e.g. MoBL-ARMS wrist_hand_r1/r3) -> kept, with their constraints
    """
    joint_coords = {j.getName(): [j.get_coordinates(i).getName() for i in range(j.numCoordinates())]
                    for j in model.getJointSet()}
    couplers = coupler_map(model)
    kept = set(free)
    while True:  # closure: joint-mates of kept coordinates, and dependents of kept coordinates
        grow = {c for coords in joint_coords.values() if kept & set(coords) for c in coords}
        grow |= {dep for dep, ind in couplers.items() if set(ind) & kept}
        if grow <= kept:
            break
        kept |= grow
    dependent = sorted(c for c in kept if c in couplers)
    lock = sorted(c for c in kept if c not in free and c not in couplers)
    weld = [j for j, coords in joint_coords.items() if coords and not (set(coords) & kept)]
    return weld, lock, dependent


def weld_joints(model, names):
    """Replace each named joint by a WeldJoint that keeps the child body exactly where it is in the
    current default (assembled) posture. ModOpReplaceJointsWithWelds did not keep the MoBL-ARMS
    posture in OpenSim 4.6 (the hand ended up hanging at elbow 0 deg), so the weld transform is
    computed here from the assembled state instead."""
    state = model.initSystem()
    specs = []
    for n in names:
        j = model.getJointSet().get(n)
        parent = j.getParentFrame().findBaseFrame()
        child = j.getChildFrame().findBaseFrame()
        # A.findTransformBetween(s, B) is A's pose expressed in B, so this is the child in the parent
        X = child.findTransformBetween(state, parent)
        p, r = X.p(), X.R().convertRotationToBodyFixedXYZ()
        specs.append((n, parent.getAbsolutePathString(), child.getAbsolutePathString(),
                      osim.Vec3(p.get(0), p.get(1), p.get(2)), osim.Vec3(r.get(0), r.get(1), r.get(2))))
    js = model.updJointSet()
    for n, *_ in specs:
        js.remove(js.getIndex(n))
    for n, ppath, cpath, p, r in specs:
        parent = osim.PhysicalFrame.safeDownCast(model.getComponent(ppath))
        child = osim.PhysicalFrame.safeDownCast(model.getComponent(cpath))
        model.addJoint(osim.WeldJoint(n, parent, p, r, child, osim.Vec3(0), osim.Vec3(0)))
    model.finalizeConnections()


BRACE_PREFIX = "brace_"


def brace_coordinates(model, names, optimal_force=10.0):
    """Coordinates that must stay at their default but share a joint with a free coordinate (e.g.
    MoBL-ARMS wrist deviation next to flexion) get an ideal 'brace' actuator; solve_baseline.py
    fixes their value and speed with state bounds. A constant CoordinateCouplerConstraint was
    tried first, but OpenSim 4.6's assembler then pinned the *independent* coordinate (flexion)."""
    out = []
    for n in names:
        ca = osim.CoordinateActuator(n)
        ca.setName(BRACE_PREFIX + n)
        ca.setOptimalForce(optimal_force)
        ca.setMinControl(-1.0)
        ca.setMaxControl(1.0)
        model.addForce(ca)
        out.append(ca.getName())
    return out


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


def _path_point_coordinates(p):
    """Names of the coordinates a moving/conditional path point depends on ([] for a fixed one)."""
    mp = osim.MovingPathPoint.safeDownCast(p)
    if mp is not None:
        names = []
        for get in (mp.getXCoordinate, mp.getYCoordinate, mp.getZCoordinate):
            try:
                names.append(get().getName())
            except RuntimeError:  # this axis has no coordinate
                pass
        return names
    cp = osim.ConditionalPathPoint.safeDownCast(p)
    if cp is not None:
        return [cp.getCoordinate().getName()]
    return []


def freeze_path_points(model, welded_coords):
    """Replace moving/conditional path points that depend on coordinates about to be welded
    (e.g. MoBL-ARMS FCU-P2, which moves with pro_sup) by fixed PathPoints at their location in the
    current default posture; an inactive conditional point is removed. Without this the welded
    model has dangling coordinate references (OpenSim segfaults in ModelProcessor.process)."""
    state = model.initSystem()
    frozen, dropped = [], []
    for k in range(model.getMuscles().getSize()):
        gp = osim.GeometryPath.safeDownCast(model.updMuscles().get(k).updPath())
        if gp is None:
            continue
        pps = gp.updPathPointSet()
        for i in reversed(range(pps.getSize())):
            p = pps.get(i)
            deps = _path_point_coordinates(p)
            if not deps or not set(deps) & set(welded_coords):
                continue
            if set(deps) - set(welded_coords):
                raise RuntimeError(f"path point {p.getName()} depends on welded and free coordinates: {deps}")
            if osim.ConditionalPathPoint.safeDownCast(p) is not None and not p.isActive(state):
                pps.remove(i)
                dropped.append(p.getName())
                continue
            fixed = osim.PathPoint()
            fixed.setName(p.getName())
            fixed.setParentFrame(p.getParentFrame())
            fixed.set_location(p.getLocation(state))
            gp.replacePathPoint(state, p, fixed)
            fixed.thisown = False  # owned by the path now
            frozen.append(p.getName())
    model.finalizeConnections()
    return frozen, dropped


def remove_non_wrist_forces(model, keep_muscles, welded_coords):
    """Remove muscles not in keep_muscles, coordinate-based forces on welded coordinates, and
    other passive elements that only act across welded joints (e.g. shoulder ligaments)."""
    fs = model.updForceSet()
    removed_muscles, removed_other = [], []
    for i in reversed(range(fs.getSize())):
        f = fs.get(i)
        if osim.Muscle.safeDownCast(f):
            if f.getName() not in keep_muscles:
                removed_muscles.append(f.getName())
                fs.remove(i)
            continue
        coord = None
        for cls in (osim.CoordinateLimitForce, osim.CoordinateActuator, osim.SpringGeneralizedForce):
            obj = cls.safeDownCast(f)
            if obj is not None:
                coord = obj.get_coordinate()
                break
        if coord is None and osim.Ligament.safeDownCast(f) is None:
            continue  # unknown force type: keep it
        if coord is None or coord in welded_coords:
            removed_other.append(f.getName())
            fs.remove(i)
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
    weld, lock, dependent = joints_to_weld(model, free)
    welded_coords = {model.getJointSet().get(j).get_coordinates(i).getName()
                     for j in weld for i in range(model.getJointSet().get(j).numCoordinates())}

    removed_constraints = remove_constraints_on(model, welded_coords)
    removed_muscles, removed_other = remove_non_wrist_forces(model, wrist_muscles(cfg), welded_coords)

    frozen, dropped = freeze_path_points(model, welded_coords)
    hand = model.getBodySet().get(cfg["names"]["hand_body"])
    hand_before = hand.getPositionInGround(model.initSystem())
    weld_joints(model, weld)
    hand_after = model.getBodySet().get(cfg["names"]["hand_body"]).getPositionInGround(model.initSystem())
    shift = max(abs(hand_after.get(i) - hand_before.get(i)) for i in range(3))
    if shift > 1e-6:
        raise RuntimeError(f"welding moved the hand by {shift:.3g} m; posture not preserved")
    add_cup(model, cfg["names"]["hand_body"], cfg["cup"])
    braces = brace_coordinates(model, lock)

    factor = cfg["muscles"].get("strength_factor", 1.0) if strength_factor is None else strength_factor
    if factor != 1.0:
        scale_strength(model, cfg["names"]["wrist_extensors"], factor)

    torque_driven = cfg.get("actuation", "muscles") == "torque"
    if torque_driven:  # torque-driven variant: one ideal torque actuator per free coordinate, no muscles
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

    # name reserves clearly: reserve_<coordinate> (free coordinates first, so reserves[0] is the
    # reserve on the primary free coordinate)
    reserves = []
    for a in out.getActuators():
        ca = osim.CoordinateActuator.safeDownCast(a)
        if ca is not None and not ca.getName().startswith(("tau_", BRACE_PREFIX)):
            ca.setName(RESERVE_PREFIX + ca.get_coordinate())
            reserves.append(ca.getName())
    reserves.sort(key=lambda r: (r[len(RESERVE_PREFIX):] not in free, free.index(r[len(RESERVE_PREFIX):])
                                 if r[len(RESERVE_PREFIX):] in free else 0, r))
    out.finalizeConnections()
    out.initSystem()

    info = {
        "source_model": str(src.relative_to(REPO_ROOT)) if src.is_relative_to(REPO_ROOT) else str(src),
        "free_coordinates": free,
        "braced_coordinates": lock,
        "braces": braces,
        "dependent_coordinates": dependent,
        "welded_joints": weld,
        "removed_constraints": removed_constraints,
        "removed_muscles": removed_muscles,
        "removed_other_forces": removed_other,
        "frozen_path_points": frozen,
        "dropped_path_points": dropped,
        "kept_muscles": [out.getMuscles().get(i).getName() for i in range(out.getMuscles().getSize())],
        "reserves": reserves,
        "strength_factor": factor,
    }
    if verbose:
        log.info("free coordinates: %s", free)
        log.info("welded %d joints: %s", len(weld), weld)
        log.info("held by a brace actuator + fixed state bounds: %s; dependent (coupled) coordinates kept: %s",
                 lock, dependent)
        log.info("removed %d constraints: %s", len(removed_constraints), removed_constraints)
        log.info("removed %d muscles: %s", len(removed_muscles), removed_muscles)
        log.info("removed %d other forces: %s", len(removed_other), removed_other)
        log.info("froze %d moving path points at the posture: %s (dropped: %s)", len(frozen), frozen, dropped)
        log.info("kept %d muscles: %s", len(info["kept_muscles"]), info["kept_muscles"])
        log.info("reserves: %s", reserves)
    return out, info


def gravity_torques(model, coord_name, angles_rad, dq=1e-4):
    """Gravity torque (Nm) on `coord_name` at each angle, as -dV/dq of the gravitational potential
    energy, with every constraint satisfied (so coupled coordinates, such as MoBL-ARMS
    wrist_hand_r3 = f(flexion), are included) and all other forces disabled.
    Positive = in the coordinate's positive direction."""
    m = model.clone()
    for i in range(m.getForceSet().getSize()):
        m.updForceSet().get(i).set_appliesForce(False)
    s = m.initSystem()
    cs = m.getCoordinateSet()
    c = cs.get(coord_name)

    def potential(q):
        # hold this coordinate (lock in the state) and let the assembler move only the coupled ones;
        # setValue(q, enforceConstraints=True) can pull q back when q drives a coupler constraint
        c.setValue(s, q, False)
        independent = [k for k in range(cs.getSize()) if not cs.get(k).isConstrained(s)]
        for k in independent:  # hold every independent coordinate; only coupled ones may move
            cs.get(k).setLocked(s, True)
        m.assemble(s)
        for k in independent:
            cs.get(k).setLocked(s, False)
        if abs(c.getValue(s) - q) > 1e-6:
            raise RuntimeError(f"assembly moved {coord_name}: {c.getValue(s)} != {q}")
        m.realizeDynamics(s)
        return m.calcPotentialEnergy(s)

    return [-(potential(q + dq) - potential(q - dq)) / (2 * dq) for q in angles_rad]


def gravity_torque(model, coord_name, angle_rad):
    return gravity_torques(model, coord_name, [angle_rad])[0]


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
