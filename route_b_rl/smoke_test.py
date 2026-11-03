"""MyoSuite smoke test (Route B, wrist-myosuite env). No training.

* lists the registered myo environments (read from the registry, not guessed)
* picks a myoHand environment that includes the wrist
* runs random actions, prints observation/action dimensions
* reports which wrist joints and wrist muscles the environment exposes, by name
* writes results/myosuite_smoke.md and a few offscreen-rendered frames

Usage:
    MUJOCO_GL=egl python route_b_rl/smoke_test.py [--env myoHandObjHoldFixed-v0] [--steps 200]
"""
import argparse
import os
import time
from pathlib import Path

os.environ.setdefault("MUJOCO_GL", "egl")  # offscreen rendering without a display

import mujoco  # noqa: E402
import numpy as np  # noqa: E402
import myosuite  # noqa: E402,F401  (registers the environments)
from myosuite.utils import gym  # noqa: E402

RESULTS = Path(__file__).resolve().parents[1] / "results"
DEFAULT_ENV = "myoHandObjHoldFixed-v0"  # hand holds an object: closest to the cup task
WRIST_JOINT_KEYS = ("flexion", "deviation", "pro_sup")
WRIST_MUSCLE_KEYS = ("ECRL", "ECRB", "ECU", "FCR", "FCU", "PL")


def names(model, obj, n):
    return [mujoco.mj_id2name(model, obj, i) for i in range(n)]


def moment_arms(model, data, joint_names, actuator_names, dq=1e-4):
    """Actuator moment arms (m) about the given hinge joints by finite differences of
    actuator length at the current pose: r = -d(length)/d(q) (MuJoCo convention)."""
    out = {}
    q0 = data.qpos.copy()
    for jn in joint_names:
        jid = mujoco.mj_name2id(model, mujoco.mjtObj.mjOBJ_JOINT, jn)
        adr = model.jnt_qposadr[jid]
        lens = []
        for sign in (+1, -1):
            data.qpos[:] = q0
            data.qpos[adr] += sign * dq
            mujoco.mj_fwdPosition(model, data)
            lens.append(data.actuator_length.copy())
        r = -(lens[0] - lens[1]) / (2 * dq)
        out[jn] = {a: float(r[i]) for i, a in enumerate(actuator_names)}
    data.qpos[:] = q0
    mujoco.mj_fwdPosition(model, data)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--env", default=DEFAULT_ENV)
    ap.add_argument("--steps", type=int, default=200)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--frames", type=int, default=4)
    ap.add_argument("--camera", default="hand_side_exter", help="named camera in the MuJoCo model")
    args = ap.parse_args()

    registry = sorted(myosuite.myosuite_env_suite)
    myohand = [e for e in registry if e.startswith("myoHand")]
    print(f"{len(registry)} myo environments registered; {len(myohand)} start with 'myoHand'")
    if args.env not in registry:
        raise SystemExit(f"{args.env} is not registered. myoHand envs: {myohand}")

    env = gym.make(args.env)
    u = env.unwrapped
    model, data = u.model, u.data
    obs, _ = env.reset(seed=args.seed)
    env.action_space.seed(args.seed)

    joints = names(model, mujoco.mjtObj.mjOBJ_JOINT, model.njnt)
    acts = names(model, mujoco.mjtObj.mjOBJ_ACTUATOR, model.nu)
    wrist_joints = [j for j in joints if j in WRIST_JOINT_KEYS]
    wrist_muscles = [a for a in acts if a in WRIST_MUSCLE_KEYS]
    ranges = {j: np.degrees(model.jnt_range[mujoco.mj_name2id(model, mujoco.mjtObj.mjOBJ_JOINT, j)])
              for j in wrist_joints}
    marms = moment_arms(model, data, wrist_joints, acts)
    spanning = {j: {a: r for a, r in marms[j].items() if abs(r) > 1e-4} for j in wrist_joints}

    print(f"env: {args.env}  obs dim: {env.observation_space.shape}  action dim: {env.action_space.shape}")
    print(f"wrist joints: {wrist_joints}")
    print(f"wrist muscles: {wrist_muscles}")

    renderer = None
    frame_paths = []
    try:
        renderer = mujoco.Renderer(model, 360, 480)
        cams = names(model, mujoco.mjtObj.mjOBJ_CAMERA, model.ncam)
        cam = args.camera if args.camera in cams else -1
    except Exception as e:  # rendering is optional for the smoke test
        print(f"offscreen rendering unavailable: {e}")
    frame_steps = set(np.linspace(0, args.steps - 1, args.frames, dtype=int).tolist())
    frame_dir = RESULTS / "myosuite_frames"
    frame_dir.mkdir(parents=True, exist_ok=True)

    t0 = time.time()
    rewards, resets = [], 0
    for k in range(args.steps):
        obs, r, terminated, truncated, info = env.step(env.action_space.sample())
        rewards.append(float(r))
        if renderer is not None and k in frame_steps:
            renderer.update_scene(data, camera=cam)
            from PIL import Image
            p = frame_dir / f"{args.env}_step{k:03d}.png"
            Image.fromarray(renderer.render()).save(p)
            frame_paths.append(p)
        if terminated or truncated:
            obs, _ = env.reset()
            resets += 1
    wall = time.time() - t0
    env.close()
    print(f"ran {args.steps} random steps in {wall:.2f} s, {resets} resets, "
          f"mean reward {np.mean(rewards):.3f}")

    L = [f"# MyoSuite smoke test: `{args.env}`\n",
         f"* MyoSuite {getattr(myosuite, '__version__', '?')}, MuJoCo {mujoco.__version__}, "
         f"Gymnasium {gym.__version__}",
         f"* Registry: {len(registry)} myo environments; {len(myohand)} myoHand environments: "
         + ", ".join(f"`{e}`" for e in myohand),
         f"* Chosen: `{args.env}` (hand holds an object; includes the wrist)",
         f"* Observation dim: {env.observation_space.shape}, action dim: {env.action_space.shape} "
         f"(actions in [{env.action_space.low.min():.0f}, {env.action_space.high.max():.0f}])",
         f"* Random rollout: {args.steps} steps, seed {args.seed}, {wall:.2f} s wall, {resets} resets, "
         f"mean reward {np.mean(rewards):.3f}, no errors",
         f"* Model: {model.njnt} joints, {model.nu} actuators (muscles), timestep {model.opt.timestep} s, "
         f"frame skip {getattr(u, 'frame_skip', '?')}\n",
         "## Wrist exposure (needed for Route B)\n",
         "| wrist joint | range (deg) | muscles with moment arm > 0.1 mm at reset pose (mm) |",
         "|---|---|---|"]
    for j in wrist_joints:
        lo, hi = ranges[j]
        arms = ", ".join(f"{a} {r * 1000:+.1f}" for a, r in sorted(spanning[j].items(), key=lambda x: -abs(x[1])))
        L.append(f"| `{j}` | [{lo:.0f}, {hi:.0f}] | {arms} |")
    L += ["", f"Wrist muscles present by name: {', '.join(f'`{m}`' for m in wrist_muscles)}"
          f" ({len(wrist_muscles)}/{len(WRIST_MUSCLE_KEYS)} of {', '.join(WRIST_MUSCLE_KEYS)}).",
          "", f"All joints: {', '.join(f'`{j}`' for j in joints)}", "",
          f"All actuators: {', '.join(f'`{a}`' for a in acts)}", ""]
    if frame_paths:
        L.append(f"## Frames (random actions, offscreen EGL render, camera `{args.camera}`)\n")
        L += [f"![step]({p.relative_to(RESULTS)})" for p in frame_paths]
    else:
        L.append("No frames rendered (offscreen rendering unavailable).")
    (RESULTS / "myosuite_smoke.md").write_text("\n".join(L) + "\n")
    print(f"wrote {RESULTS / 'myosuite_smoke.md'}")


if __name__ == "__main__":
    main()
