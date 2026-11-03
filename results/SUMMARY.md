# P2 baseline simulation: summary

Status as of 3 Nov 2026 (evening). **The Route A baseline now runs on MoBL-ARMS** (SimTK access
approved on 3 Nov). It converged, and the six MoBL-ARMS wrist muscles do all of the work.

The planar **fallback B** model (built on 2 Nov while access was pending) stays in the repository
as a cross-check. **The K1–K3 previews are still fallback-B results**: a full sweep on MoBL-ARMS
takes many hours at about 45 min per solve, so it is P3 work.

## What was built

| Part | Status |
|---|---|
| Environments | `wrist-opensim`: OpenSim **4.6** with Moco, Python 3.12 (conda, `opensim-org`). `wrist-myosuite`: MyoSuite 3.0.0, MuJoCo 3.17, SB3 2.9.2, Python 3.12 |
| Model inventory (Task 3) | `results/model_inventory.md` for MoBL-ARMS: 20 coordinates, 50 muscles, 11 bodies, 13 constraints. Names in `config/baseline.yaml` are taken from it |
| Processed model (Task 4) | `build_model.py`. See "MoBL-ARMS processing" below |
| Baseline solve (Task 4) | `solve_baseline.py`: MocoCasADiSolver, coarse then refined mesh. **Converged on MoBL-ARMS** (and on fallback B) |
| Tests (Task 5) | 6 tests; **6 passed on MoBL-ARMS**, and 6 passed with `WRIST_CONFIG=config/fallback_planar.yaml` |
| Figures (Task 6) | `baseline_*.png` (MoBL-ARMS) and `fallbackB_*.png`, 300 dpi, half-page width |
| MyoSuite smoke test (Task 7) | Runs. Wrist joints and muscles exposed by name (`myosuite_smoke.md`) |

## Model: MoBL-ARMS

- **File.** `MOBL_ARMS_fixed_41.osim` (torso fixed to ground), from `MobL_ARMS_OpenSim41_unimanual_tutorial.zip` on SimTK project upexdyn. It uses Millard muscles matched to the Schutte curves.
- **Licence and citation.** The package has no licence file and SimTK lists a CC ANC use agreement, so the model is gitignored. Cite Saul et al. (2015) as modified by McFarland et al. (2019); details are in `models/README.md`.
- **Verified names.**
  - Wrist flexion: `flexion` (joint `radiocarpal`; + = flexion, because FCR, FCU and PL have positive moment arms).
  - Deviation: `deviation` (+ = ulnar).
  - Forearm rotation: `pro_sup` (+90° = pronated, palm down).
  - Hand body: `hand` (0.58 kg).
  - Extensors ECRL, ECRB, ECU; flexors FCR, FCU, plus PL.
- **Coupled wrist.** `flexion` and `deviation` are "Coupled" coordinates. Coupler constraints drive `wrist_hand_r3` (about half the flexion angle) and `wrist_hand_r1` in a second joint, so hand rotation is split across two joints.

### MoBL-ARMS processing (`build_model.py`)

1. **Posture.** Shoulder elevation 0°, plane 0°, rotation 0°, elbow 90°, `pro_sup` +90° (palm down), deviation 0°. The model is assembled and the coupled shoulder-girdle coordinates are re-solved before welding.
2. **Welding.** 9 joints are welded (sternoclavicular … radioulnar) with transforms taken from the assembled state; the hand position is checked to be unchanged. `ModOpReplaceJointsWithWelds` could not be used: on this model it lost the posture, leaving the hand hanging at elbow 0°. 11 shoulder coupler constraints are removed.
3. **Moving path point.** FCU's moving path point `FCU-P2` depends on `pro_sup`; it is frozen at its posture location. Without this, OpenSim segfaults once `pro_sup` is welded.
4. **Deviation.** It is held at 0° by fixed state bounds and a `brace_deviation` actuator with near-zero cost. A constant coupler constraint was tried first, but OpenSim 4.6's assembler then pinned `flexion` instead. `wrist_hand_r1` and `wrist_hand_r3` stay coupled.
5. **Muscles.** 6 wrist muscles are kept (ECRL, ECRB, ECU, FCR, FCU, PL). 44 are removed, including the extrinsic finger muscles: the fingers hold the cup in a fixed grasp (P1 scope). This narrows Task 4.3's "all muscles that span the wrist", and the finger muscles can be added back in config. The shoulder ligaments and coordinate limit forces on welded joints are also removed; the wrist limit forces are kept.
6. **Muscle model and reserve.** DeGrooteFregly2016 muscles with rigid tendons; one penalised reserve, `reserve_flexion`.
7. **Cup.** 0.3 kg, 8 cm distal and 4 cm palmar in the hand frame. It sits 7.5 cm ahead of and 4.8 cm below the wrist.
8. **Gravity torque.** Computed as −dV/dq with the constraints assembled, which includes the coupled `wrist_hand_r3`. It flexes the wrist across the whole range: **+0.365 Nm at +30° (start), +0.540 Nm at −15° (target)**, 0.51 Nm at 0°. The cup adds about 0.23 Nm to the hand's 0.29 Nm at 0°.

## Moco problem (same for both models)

- **Task.** Wrist goes from **+30° (dropped) to −15° (extended)** in 1.0 s, with zero velocity at both ends; the last 30 % is a hold.
- **Goals.**
  - `MocoControlGoal` for effort. The reserve is weighted ×1000 (optimal force 1 Nm); the brace ×0.001.
  - `MocoInitialActivationGoal`.
  - `MocoStateTrackingGoal` (weight 100) against a minimum-jerk move followed by a hold.
- **Why the tracking goal (design choice).** With pure effort and endpoint constraints the wrist only arrives at the target at t = 1 s and never holds. The kinematics are therefore guided, while muscle coordination is predicted.
- **Solver.** Hermite–Simpson, tolerances 1e-3, 30 then 60 mesh intervals.
- **Coupled-coordinate guess.** For MoBL-ARMS, the coupled coordinates get ±π bounds and an initial guess consistent with the constraints. This cut the coarse solve from 291 to 224 iterations.

## Results: MoBL-ARMS baseline (`baseline_solution.sto`, primary)

| Quantity | Value |
|---|---|
| Coarse solve (N = 30) | **Solve_Succeeded**, 224 iterations, 1092 s |
| Refined solve (N = 60, used) | **Solve_Succeeded**, 233 iterations, 1671 s, objective 2.00e-2 |
| Final wrist angle | −15.00° (target −15°) |
| Max deviation from target during hold | 0.11° |
| Gravity torque at wrist (start / target / peak) | 0.365 / 0.540 / 0.540 Nm (flexing) |
| Reserve torque on flexion, peak / RMS | 1.3e-4 / 4.0e-5 Nm |
| **Reserve peak / peak gravity torque** | **0.02 %**, well under the 10 % flag |
| Hold activation: ECRB / ECRL / ECU | 0.106 / 0.089 / 0.034 (peaks 0.121 / 0.112 / 0.052) |
| Flexors FCR / FCU / PL | stay at the 0.01 minimum (FCU briefly 0.08 at t = 0) |
| Brace torque on deviation, peak | 0.49 Nm |

**Cross-check with fallback B** (same task, same pipeline):
- Gravity torque 0.359 / 0.497 Nm vs 0.365 / 0.540 Nm.
- Extensor hold activation 0.084 (lumped) vs 0.03–0.11 (individual muscles).
- Reserve 0.02 % in both.

The simple model and MoBL-ARMS agree, which supports using fallback B for the K1–K3 trend previews below.

## Results: fallback B (planar, `fallbackB_solution.sto`)

- **Model.** A fixed, pronated forearm and a hand on a pin joint `wrist_flexion`. One lumped extensor (782 N, 11.8 mm) and one lumped flexor (888 N, 18.5 mm). Forces and moment arms come from MyoSuite MyoHand (derived from MoBL-ARMS); the hand is 0.45 kg (Winter 2009). Fibre and tendon lengths are assumptions.
- **Solve.** Converged: coarse 162 iterations in 12 s, refined 24 iterations in 3.4 s.
- **Accuracy.** Hold error 0.057°; reserve 0.02 % of gravity torque.

## P3 preview (preliminary, fallback B only): K1, K2, K3

- **K1, weakness sweep** (`sweep_weakness.py`, `fallbackB_k1_sweep.{csv,png}`).
  - **K1 is between 10.62 % and 10.75 % of unimpaired extensor force.**
  - A level fails if the solver fails, the reserve exceeds 10 % of the gravity torque, or the hold drifts more than 2°.
  - The 4 % coarse solve hit the iteration limit; that level fails on every criterion anyway.
- **K2, smallest assist that restores the task** (`assist_study.py`).
  - 8 % strength: motor 0.27 Nm, or spring 0.28 Nm/rad (peak 0.44 Nm).
  - 5 % strength: motor 0.56 Nm, or spring 0.69 Nm/rad (peak 1.08 Nm).
  - **A spring is enough at both levels**, but needs 1.6–1.9× the motor's peak torque.
- **K3, effort reduction.** The 0.69 Nm/rad spring cuts muscle effort by **82 %** (100 % strength) and **86 %** (30 % strength).
- **Modelling choices behind these numbers.** Motor effort weight 1.0; spring rest angle −60°.

## Figures (`results/`)

1. `baseline_wrist_angle.png`, `baseline_activations.png`, `baseline_reserve_torque.png`, `baseline_mean_activation.png`: MoBL-ARMS baseline.
2. `fallbackB_*.png` (same four), plus `fallbackB_model_schematic.png`: fallback B.
3. `fallbackB_k1_sweep.png` and `fallbackB_assist.png`: K1–K3 previews (fallback B).
4. `pipeline_diagram.png`: method outline.

## Route B smoke test (`myosuite_smoke.md`)

`myoHandObjHoldFixed-v0`, chosen from 226 registered environments. 200 random steps ran with no
errors; observation dimension 91, action dimension 39. Wrist joints `flexion`, `deviation`,
`pro_sup` and muscles ECRL, ECRB, ECU, FCR, FCU, PL are all exposed by name.

## Fallbacks used

- **Fallback B.** Used on 2–3 Nov while MoBL-ARMS was unavailable. It is **now replaced by MoBL-ARMS for the baseline**, but still the source of the K1–K3 previews.
- **Fallback A (torque-driven).** Not used; it is implemented as `solve_baseline.py --torque-driven`.

## Known limitations

- **Deviation is braced.** It is held at 0° by an ideal brace, which carries up to 0.49 Nm, mostly the radial-deviation side effect of ECRL and ECRB. A free deviation (`posture.free_wrist_deviation: true`) would instead need ECU co-contraction.
- **Finger muscles excluded.** The extrinsic finger muscles cross the wrist but are assumed busy gripping.
- **Hold relies on a tracking goal.** The kinematics are softly prescribed.
- **Solve time.** MoBL-ARMS solves take about 45 min (wrapping surfaces), so sweeps need the coarse mesh, a warm start or fewer levels.
- **Fallback-B parameters.** Fibre and tendon lengths there are assumptions; K1–K3 must be re-run on MoBL-ARMS.
- **Generic model.** One generic adult and one 1 s task: these are relative findings, not clinical predictions.

## Next steps (P3)

- **K1 on MoBL-ARMS.** Coarse-mesh sweep with warm starts from the neighbouring strength level, then bisection, plus a sensitivity check on cup mass and movement time.
- **K2/K3 on MoBL-ARMS.** Stiffness and rest angle as `MocoParameter`s, and a motor torque limit.
- **Free deviation.** Optionally free deviation and compare the brace torque with ECU co-contraction.
- **Route B.** Use the MoBL-ARMS wrist trajectory as the PPO reference in `myoHandObjHold`.
