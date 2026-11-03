# P2 presentation notes (for the team, 4 Nov 2026)

**Deck:** `presentation/P2_Team7_Wrist_Exo_Baseline.pptx` (PDF backup next to it). It has 17 slides in the P1 style, with speaker notes on every slide.
Presentation date: **Wed 4 Nov 2026**. Updated on the evening of 3 Nov with the **MoBL-ARMS baseline**. All numbers below are in `results/` and can be
reproduced with the README commands.

## One-sentence story

We built a working OpenSim Moco pipeline on the MoBL-ARMS upper-limb model that predicts how the
wrist muscles lift and hold a cup against gravity: about 10 % activation of ECRB and ECRL is enough.
On a planar cross-check model the task stops working below about **11 % of normal
wrist-extensor strength**, and a small wrist assist restores it. Route B (MyoSuite) is installed
and its wrist model has been checked.

## Be upfront about this (important)

- **The baseline (slides 6–9) is MoBL-ARMS.** SimTK access was approved on 3 Nov and the baseline converged on it the same evening.
- **K1, K2 and K3 (slides 10–11) come from the planar cross-check model ("fallback B"):** one lumped extensor and one lumped flexor, built in code. It matches the MoBL-ARMS baseline (gravity torque within 2–9 %, same 0.02 % reserve, similar extensor activation) but solves in seconds instead of about 45 minutes. The sweeps on MoBL-ARMS are P3 work.
- **Where the cross-check model's parameters come from.**
  - Muscle forces and moment arms: the MyoSuite MyoHand model, which is derived from MoBL-ARMS.
  - Segment mass and centre of mass: Winter (2009).
  - Fibre and tendon lengths: assumptions.
- **K1, K2 and K3 are preliminary P3 previews,** not final results.

## Suggested slide flow and figures

| Slide | Message | Figure (`results/`) |
|---|---|---|
| Method outline | Two routes: OpenSim + Moco plans the motion; MyoSuite + PPO learns it later. P2 = the baseline pipeline | `pipeline_diagram.png` |
| Model + task | MoBL-ARMS: arm at the side, elbow 90°, forearm palm down, so gravity drops the hand (wrist drop). 0.3 kg cup in the hand. Wrist moves from 30° flexion to 15° extension in 1 s, then holds | `fallbackB_model_schematic.png` (task sketch) |
| Baseline result | MoBL-ARMS solve converged on both meshes (refined: 233 iterations, 28 min). Target reached, held within 0.11°. Reserve torque 0.02 % of gravity torque, so the muscles do all the work | `baseline_wrist_angle.png`, `baseline_reserve_torque.png` |
| Muscle activity | ECRB ≈ 0.11, ECRL ≈ 0.09, ECU ≈ 0.03 activation holds the cup; FCR, FCU and PL stay at the minimum | `baseline_activations.png`, `baseline_mean_activation.png` |
| K1 preview | Weaken the extensors step by step. Below about 12 % strength, activation saturates at 1.0. **K1 ≈ 10.7 %** (passes at 10.75 %, fails at 10.62 %) | `fallbackB_k1_sweep.png` |
| K2/K3 preview | At 8 % strength a 0.27 Nm ideal motor restores the task; at 5 % strength, 0.56 Nm. A wrist spring is enough in both cases but needs about 1.6–1.9× the peak torque. That spring cuts muscle effort by 82–86 % when the task already works | `fallbackB_assist.png` |
| Route B | `myoHandObjHoldFixed-v0` runs; wrist joints (flexion, deviation, pro_sup) and all six wrist muscles exposed by name | `myosuite_frames/*.png`, `myosuite_smoke.md` |
| Next steps | K1 on MoBL-ARMS, sensitivity check, spring vs motor optimisation, PPO guided by the Moco motion | — |

## Key numbers

- **Gravity torque at the wrist (MoBL-ARMS hand + cup):** 0.37 Nm at the start and 0.54 Nm at the target. It always flexes the wrist. The planar model gives 0.36 / 0.50 Nm.
- **MoBL-ARMS baseline (100 % strength):**
  - final angle −15.00°, hold error 0.11°
  - reserve peak 1.3e-4 Nm (0.02 % of gravity)
  - hold activation ECRB 0.106, ECRL 0.089, ECU 0.034; flexors at 0.01
  - deviation is held by an ideal brace (peak 0.49 Nm)
- **Planar cross-check baseline:** hold error 0.057°, reserve 0.02 %, lumped extensor activation 0.084.
- **K1 (planar cross-check model).**
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

- **Why are K1–K3 on a planar model?** Each MoBL-ARMS solve takes about 45 minutes, so a 20-level sweep was not possible by P2. The planar model reproduces the MoBL-ARMS baseline closely and solves in seconds, so it shows the trends. The same scripts will run on MoBL-ARMS in P3.
- **Why is deviation braced?** The work order keeps only wrist flexion free at first. An ideal brace holds deviation at 0°; P3 will test with deviation free, where ECU must balance the radial pull of ECRL and ECRB.
- **Why did MoBL-ARMS need fixes?** Its wrist is split over two coupled joints, and one muscle path point (FCU) moves with forearm rotation. Moco also rejects locked joints. We welded the arm with exact posture transforms, froze that path point and braced deviation. Each step is checked in code (the hand must not move) and in the tests.
- **What is a reserve actuator?** A heavily penalised "helper" torque at the wrist. If the solution needs it, the muscles alone can't do the task, which is exactly our failure signal for K1.
- **Why a tracking goal in a "predictive" simulation?**
  - Minimising effort alone reaches the target only at the final instant and never holds.
  - A soft tracking goal on the wrist angle (a smooth move, then a hold) gives "lift and hold".
  - How the muscles share the work is still predicted.
- **Is 11 % strength realistic?** It is a model result, not a clinical number. It depends on hand and cup mass, moment arms, fibre lengths and the 1 s movement time. The MoBL-ARMS sweep and a sensitivity check come in P3.
- **So is a spring enough (K2)?** In this model and task, yes, down to at least 5 % strength. A motor needs a lower peak torque (0.27–0.56 Nm) because it can match the gravity profile. A spring is simpler, lighter and needs no battery. P3 will optimise stiffness and rest angle properly and test other tasks.
- **Why palm down?** That is the posture where gravity pulls the hand into flexion (wrist drop), which is the case the exoskeleton must handle.
