# P2 baseline simulation: results summary

3 November 2026

The Route A baseline runs on the MoBL-ARMS upper-limb model. The wrist lifts a 0.3 kg cup from a
dropped position and holds it level, and the six wrist muscles do all of the work (the penalised
reserve actuator stays at 0.02 % of the gravity torque).

A planar two-muscle wrist model is kept next to MoBL-ARMS. It reproduces the MoBL-ARMS baseline
closely and solves in seconds instead of about 45 minutes, so the first K1–K3 studies were run on
it. Those numbers are early results and will be repeated on MoBL-ARMS in P3.

## Setup

- OpenSim 4.6 with Moco (conda env `wrist-opensim`, Python 3.12).
- MyoSuite 3.0.0, MuJoCo 3.17 and Stable-Baselines3 2.9.2 (env `wrist-myosuite`, Python 3.12).
- Model: `MOBL_ARMS_fixed_41.osim` from SimTK project upexdyn (torso fixed, Millard muscles matched
  to the Schutte curves). Cite Saul et al. (2015) as modified by McFarland et al. (2019). The model
  is not in git; see `models/README.md`.

## Model preparation

Names were read from the model (`model_inventory.md`): wrist flexion `flexion` (+ = flexion),
deviation `deviation` (+ = ulnar), forearm rotation `pro_sup` (+90° = pronated), hand body `hand`.
In MoBL-ARMS the wrist rotation is split over two joints: coupler constraints drive
`wrist_hand_r3` (about half of the flexion angle) and `wrist_hand_r1` from flexion and deviation.

`build_model.py` then:

1. Sets the posture: arm at the side, elbow 90°, forearm pronated (palm down), deviation 0°. With
   the palm down, gravity pulls the hand into flexion.
2. Welds the 9 joints between the thorax and the wrist, using the transforms of the assembled
   posture, and checks that the hand does not move. OpenSim's `ModOpReplaceJointsWithWelds` lost
   this posture on MoBL-ARMS (the hand ended up hanging down), so it is not used.
3. Freezes FCU's moving path point (`FCU-P2`, which follows `pro_sup`) at its posture location.
   Without this OpenSim crashes once `pro_sup` is welded.
4. Holds deviation at 0° with fixed state bounds and a nearly free `brace_deviation` actuator.
   A constant coupler constraint pinned the wrong coordinate in OpenSim 4.6's assembler.
5. Keeps ECRL, ECRB, ECU, FCR, FCU and PL. The extrinsic finger muscles also cross the wrist, but
   they are assumed to be busy holding the cup; they can be added back in the config.
6. Replaces the muscles with DeGroote–Fregly muscles (rigid tendons) and adds one penalised reserve
   on wrist flexion.
7. Attaches the cup (0.3 kg, 8 cm distal and 4 cm palmar to the wrist).

Gravity torque at the wrist is computed from the potential energy with the constraints assembled,
so the coupled joint is included. It flexes the wrist over the whole range: 0.365 Nm at the start
(+30°) and 0.540 Nm at the target (−15°). The cup adds about 0.23 Nm to the hand's 0.29 Nm at 0°.

## Optimal control problem

The wrist moves from +30° (dropped) to −15° (extended) in 1.0 s with zero velocity at both ends,
and holds for the last 30 % of the time. The objective is muscle effort (sum of squared
excitations, reserve weighted ×1000) plus a soft tracking term on a minimum-jerk move followed by
a hold. Without the tracking term the effort optimum only reaches the target at t = 1 s and never
holds; the muscle coordination is still predicted by the solver. Moco CasADi solver,
Hermite–Simpson, tolerance 1e-3, 30 mesh intervals refined to 60.

## Baseline results (MoBL-ARMS)

| | |
|---|---|
| Coarse solve (30 intervals) | converged, 224 iterations, 18 min |
| Refined solve (60 intervals) | converged, 233 iterations, 28 min |
| Final wrist angle | −15.00° |
| Largest drift during the hold | 0.11° |
| Gravity torque, start / target | 0.365 / 0.540 Nm |
| Reserve torque, peak / RMS | 1.3e-4 / 4.0e-5 Nm (0.02 % of peak gravity torque) |
| Hold activation ECRB / ECRL / ECU | 0.106 / 0.089 / 0.034 |
| FCR, FCU, PL | at the 0.01 minimum |
| Brace torque on deviation, peak | 0.49 Nm |

ECRB and ECRL carry most of the load. The brace mainly absorbs their radial-deviation pull, which
ECU would otherwise have to balance.

## Planar model check

The planar model has a fixed pronated forearm, a hand on one pin joint, one lumped extensor (782 N,
11.8 mm moment arm) and one lumped flexor (888 N, 18.5 mm). Forces and moment arms come from the
MyoSuite MyoHand model (derived from MoBL-ARMS); hand mass and centre of mass come from Winter
(2009); fibre and tendon lengths are assumed. On the same task it gives a gravity torque of
0.359 / 0.497 Nm, a hold error of 0.057°, reserve 0.02 % and extensor activation 0.084, close to
MoBL-ARMS.

## Early K1–K3 results (planar model)

- K1 (`sweep_weakness.py`): the extensor maximum force was scaled from 100 % down to 4 %. A level
  counts as failed if the solver fails, the reserve exceeds 10 % of the gravity torque, or the hold
  drifts more than 2°. The task fails below 10.62–10.75 % of unimpaired strength.
- K2 (`assist_study.py`): at 8 % strength an ideal motor needs 0.27 Nm, or a spring of 0.28 Nm/rad
  (rest angle −60°, peak 0.44 Nm). At 5 % strength: 0.56 Nm, or 0.69 Nm/rad (peak 1.08 Nm). A spring
  is enough in both cases but needs 1.6–1.9× the motor's peak torque.
- K3: the 0.69 Nm/rad spring cuts muscle effort by 82 % at full strength and 86 % at 30 % strength.

The unassisted solves at 4 % and 5 % strength hit the iteration limit; both levels fail on every
criterion anyway. The motor effort weight (1.0) and the spring rest angle are modelling choices.

## Route B

`myoHandObjHoldFixed-v0` was picked from the 226 registered MyoSuite environments. 200 random steps
run without errors (observation 91, action 39). The wrist joints `flexion`, `deviation`, `pro_sup`
and the muscles ECRL, ECRB, ECU, FCR, FCU, PL are available by name (`myosuite_smoke.md`).

## Figures

- `baseline_wrist_angle.png`, `baseline_activations.png`, `baseline_reserve_torque.png`,
  `baseline_mean_activation.png`: MoBL-ARMS baseline.
- `planar_*.png`: the same plots for the planar model, plus `planar_model_schematic.png`.
- `planar_k1_sweep.png`, `planar_assist.png`: K1–K3.
- `pipeline_diagram.png`: method overview.

## Limitations

- K1–K3 come from the planar model; the thresholds are model-specific.
- Deviation is braced at 0° in the baseline.
- Finger muscles are left out.
- The hold is shaped by a tracking term, so the kinematics are partly prescribed.
- MoBL-ARMS solves take about 45 minutes, which limits how many sweep points are practical.
- One generic adult and one 1 s task: the results are relative, not clinical predictions.

## Next steps (P3)

- K1 on MoBL-ARMS: coarse-mesh sweep with warm starts from the neighbouring strength level.
- Sensitivity to cup mass, movement time and a free wrist deviation.
- Spring vs. motor on MoBL-ARMS, with stiffness and rest angle as Moco parameters.
- Route B: PPO in `myoHandObjHold` with the MoBL-ARMS wrist trajectory as reference.
