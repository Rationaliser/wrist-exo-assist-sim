# Route A simulation: results summary

3 November 2026, K1 on MoBL-ARMS added 17 November 2026

The Route A baseline runs on the MoBL-ARMS upper-limb model. The wrist lifts a 0.3 kg cup from a
dropped position and holds it level, and the six wrist muscles do all of the work (the penalised
reserve actuator stays at 0.02 % of the gravity torque).

A planar two-muscle wrist model is kept next to MoBL-ARMS. It reproduces the MoBL-ARMS baseline
closely and solves in seconds instead of about 45 minutes, so the first K1–K3 studies were run on
it. K1 has since been repeated on MoBL-ARMS (below); K2 and K3 on MoBL-ARMS are still to come.

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

## K1 on MoBL-ARMS (weakness sweep)

The maximum isometric force of ECRL, ECRB and ECU was scaled together and the baseline task was
solved again at each level. A level fails if the solver does not converge, the reserve exceeds 10 %
of the peak gravity torque, or the wrist drifts more than 2° from the target during the hold.

To keep the sweep practical, every level was solved on the coarse mesh only (30 intervals, about
8–17 minutes each), warm-started from the saved solution at the nearest strength level, with at most
600 iterations. Eight grid levels ran as two parallel chains, followed by three bisection steps.
Command: `sweep_weakness.py --coarse-only --warm-start --max-iter 600`.

| Extensor strength | Solver | Peak extensor activation | Reserve / gravity | Hold drift | Task |
|---|---|---|---|---|---|
| 100 % | converged | 0.12 | 0.01 % | 0.14° | passes |
| 50 % | converged | 0.27 | 0.05 % | 0.23° | passes |
| 30 % | converged | 0.47 | 0.13 % | 0.28° | passes |
| 20 % | converged | 0.72 | 0.28 % | 0.38° | passes |
| 15 % | converged | 0.97 | 0.50 % | 0.49° | passes |
| 12 % | converged | 1.00 | 2.3 % | 0.70° | passes |
| 11.75 % | converged | 1.00 | 2.8 % | 1.04° | passes |
| 11.5 % | converged | 1.00 | 3.7 % | 2.10° | fails (drift) |
| 11 % | converged | 1.00 | 6.1 % | 5.17° | fails (drift) |
| 10 % | iteration limit | 1.00 | 19 % | 7.8° | fails |
| 8 % | Error_In_Step_Computation | 1.00 | 53 % | 14.8° | fails |

**K1: the task fails between 11.5 % and 11.75 % of unimpaired extensor strength** (about 11.6 %,
coarse mesh). The planar model gave 10.62–10.75 %, so the two models agree to about one percentage
point.

From about 15 % strength down, the extensors are fully activated. Close to the threshold the wrist
does not collapse at once: the muscles still produce most of the torque, the reserve stays below
10 %, and the hand sags slowly during the hold. Hold drift is therefore the criterion that decides K1,
and the reserve criterion only takes over below about 10 %.

Convergence checks:

- 11.75 % was solved twice from different starting points (the 11.5 % and the 12 % solutions) and
  reached the same optimum both times (objective 2.6997), so the pass is reproducible.
- Restarting a near-threshold level from its own converged solution does not work: 11.75 % then hit
  the iteration limit, and 12 % converged to a much worse local optimum (objective 116.9 instead of
  2.49). In these solutions the extensor activations sit on their upper bound, and the interior-point
  solver moves away from it first. Starting from a neighbouring level avoids this.
- Refining the near-threshold levels to 60 intervals failed (11.5 %: Error_In_Step_Computation;
  12 %: no convergence from the poor coarse start). K1 is therefore a coarse-mesh result. A robust
  statement is that 12 % passes and 11 % clearly fails.

Files: `baseline_k1_sweep.csv`, `baseline_k1_summary.json`, `baseline_k1_sweep.png`, solutions in
`baseline_k1_solutions/`.

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
- `baseline_k1_sweep.png`: K1 on MoBL-ARMS (activation, reserve and hold drift against strength).
- `planar_k1_sweep.png`, `planar_assist.png`: K1–K3 on the planar model.
- `pipeline_diagram.png`: method overview.

## Limitations

- K1 on MoBL-ARMS is a coarse-mesh result; refinement near the threshold did not converge.
- K2 and K3 still come from the planar model; the thresholds are model-specific.
- Deviation is braced at 0° in the baseline.
- Finger muscles are left out.
- The hold is shaped by a tracking term, so the kinematics are partly prescribed.
- MoBL-ARMS solves take 8–17 minutes on the coarse mesh and about 45 minutes with refinement, which
  limits how many sweep points are practical.
- One generic adult and one 1 s task: the results are relative, not clinical predictions.

## Next steps (P3)

- Sensitivity to cup mass, movement time and a free wrist deviation.
- Spring vs. motor on MoBL-ARMS, with stiffness and rest angle as Moco parameters.
- Route B: PPO in `myoHandObjHold` with the MoBL-ARMS wrist trajectory as reference.
