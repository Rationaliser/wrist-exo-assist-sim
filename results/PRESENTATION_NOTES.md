# P2 presentation notes (for the team, 3 Nov 2026, 14:00 CET)

Prepared from the repository state on 2 Nov 2026. All numbers below are in `results/` and can be
reproduced with the README commands.

## One-sentence story

We built a working OpenSim Moco pipeline that predicts how the wrist muscles lift and hold a cup
against gravity. On a simplified wrist model the task stops working below about **11 % of normal
wrist-extensor strength**, and a small wrist assist restores it. Route B (MyoSuite) is installed
and its wrist model has been checked.

## Be upfront about this (important)

- **All Route A numbers come from fallback B.** Fallback B is a planar wrist model with one lumped extensor and one lumped flexor, built in code.
- **Why not MoBL-ARMS yet.** The planned model needs a SimTK account, which is still waiting for approval (up to 72 h). The pipeline is model-agnostic, so MoBL-ARMS drops in with config changes only.
- **Where the fallback parameters come from.**
  - Muscle forces and moment arms: the MyoSuite MyoHand model, which is derived from MoBL-ARMS.
  - Segment mass and centre of mass: Winter (2009).
  - Fibre and tendon lengths: assumptions.
- **K1, K2 and K3 are preliminary P3 previews,** not final results.

## Suggested slide flow and figures

| Slide | Message | Figure (`results/`) |
|---|---|---|
| Method outline | Two routes: OpenSim + Moco plans the motion; MyoSuite + PPO learns it later. P2 = the baseline pipeline | `pipeline_diagram.png` |
| Model + task | Forearm horizontal, palm down, so gravity drops the hand (wrist drop). 0.3 kg cup in the hand. Wrist moves from 30° flexion to 15° extension in 1 s, then holds | `fallbackB_wrist_angle.png` |
| Baseline result | Solver converged (24 iterations on the fine mesh, 3.4 s). Target reached, held within 0.06°. Reserve torque 0.02 % of gravity torque, so muscles do all the work | `fallbackB_reserve_torque.png` |
| Muscle activity | About 8 % extensor activation holds the cup; the flexor stays at its minimum | `fallbackB_activations.png`, `fallbackB_mean_activation.png` |
| K1 preview | Weaken the extensors step by step. Below about 12 % strength, activation saturates at 1.0. **K1 ≈ 10.7 %** (passes at 10.75 %, fails at 10.62 %) | `fallbackB_k1_sweep.png` |
| K2/K3 preview | At 8 % strength a 0.27 Nm ideal motor restores the task; at 5 % strength, 0.56 Nm. A wrist spring is enough in both cases but needs about 1.6–1.9× the peak torque. That spring cuts muscle effort by 82–86 % when the task already works | `fallbackB_assist.png` |
| Route B | `myoHandObjHoldFixed-v0` runs; wrist joints (flexion, deviation, pro_sup) and all six wrist muscles exposed by name | `myosuite_frames/*.png`, `myosuite_smoke.md` |
| Next steps | Swap in MoBL-ARMS, final K1 sweep, spring vs motor optimisation, PPO guided by the Moco motion | — |

## Key numbers

- **Gravity torque at the wrist (hand + cup):** 0.36 Nm at the start and 0.50 Nm at the target. It always flexes the wrist.
- **Baseline (100 % strength):**
  - final angle −15.00°, hold error 0.057°
  - reserve peak 1.2e-4 Nm (0.02 % of gravity)
  - extensor activation 0.084 during the hold
- **K1 criteria.** A strength level fails if the solver fails, the reserve exceeds 10 % of the gravity torque, or the hold drifts more than 2°.
- **K1 result.**
  - K1 is between 10.62 % and 10.75 % of unimpaired extensor force.
  - At the boundary, hold drift trips first, before the reserve limit.
  - At 4 % strength the coarse solve hit its iteration limit; that level fails on every criterion anyway.

- **K2 (smallest assist that restores the task, bisection resolution ±0.016 Nm / ±0.03 Nm/rad):**

  | Extensor strength | Unassisted | Ideal motor: min torque limit | Spring: min stiffness (rest −60°) | Spring torque at start / at hold |
  |---|---|---|---|---|
  | 8 % | fails | **0.27 Nm** | **0.28 Nm/rad** | 0.44 / 0.22 Nm |
  | 5 % | fails | **0.56 Nm** | **0.69 Nm/rad** | 1.08 / 0.54 Nm |

  - **Is a spring enough?** Yes for this slow lift-and-hold, at both strength levels.
  - **But it needs more peak torque.** A linear spring gives the most torque in the flexed start position, where gravity is weakest. So it needs a higher peak torque than a motor, which supplies torque only when needed.
- **K3 (muscle-effort reduction, ∫Σ excitation² dt).** The k = 0.69 Nm/rad spring cuts effort by **82 %** at full strength and **86 %** at 30 % strength. The task passes in all four runs.
- **Preliminary only.** The motor's effort weight (1.0) and the spring's rest angle (−60°) are modelling choices. A real spring would also resist the wrist during other daily tasks, which isn't modelled yet.

## Likely questions

- **Why a planar model?** It's a fallback while MoBL-ARMS access is pending. It isolates the wrist flexion/extension problem, and the same code runs on MoBL-ARMS.
- **What is a reserve actuator?** A heavily penalised "helper" torque at the wrist. If the solution needs it, the muscles alone can't do the task, which is exactly our failure signal for K1.
- **Why a tracking goal in a "predictive" simulation?**
  - Minimising effort alone reaches the target only at the final instant and never holds.
  - A soft tracking goal on the wrist angle (a smooth move, then a hold) gives "lift and hold".
  - How the muscles share the work is still predicted.
- **Is 11 % strength realistic?** It is a model result, not a clinical number. It depends on assumed hand and cup mass, moment arms and fibre lengths, and on the 1 s movement time. MoBL-ARMS and a sensitivity check come in P3.
- **So is a spring enough (K2)?** In this model and task, yes, down to at least 5 % strength. A motor needs a lower peak torque (0.27–0.56 Nm) because it can match the gravity profile. A spring is simpler, lighter and needs no battery. P3 will optimise stiffness and rest angle properly and test other tasks.
- **Why palm down?** That is the posture where gravity pulls the hand into flexion (wrist drop), which is the case the exoskeleton must handle.
