# P2 baseline simulation: summary

Status as of 2 Nov 2026. **The Route A baseline below was run on fallback B (a planar two-muscle
wrist model built in code), not on MoBL-ARMS.** The SimTK account needed to download MoBL-ARMS is
still waiting for approval, which can take up to 72 h. The pipeline is model-agnostic, so swapping
MoBL-ARMS in later only takes steps 1–3 under "Swapping in MoBL-ARMS" below.

## What was built

| Part | Status |
|---|---|
| Environments | `wrist-opensim`: OpenSim **4.6** with Moco, Python 3.12 (conda, `opensim-org`). `wrist-myosuite`: MyoSuite 3.0.0, MuJoCo 3.17, SB3 2.9.2, Python 3.12 |
| Model inventory (Task 3) | `inspect_model.py` works. Inventory written for the fallback model (`fallbackB_model_inventory.md`). **MoBL-ARMS inventory not done: model not available yet** |
| Processed model (Task 4) | `build_model.py`: welds every joint without a free coordinate (Moco rejects locked coordinates; in OpenSim 4.6 welding keeps the posture), adds a 0.3 kg cup, keeps only wrist muscles, `scale_strength()` hook, DeGrooteFregly2016 muscles with rigid tendons, penalised reserve `reserve_<coord>` |
| Baseline solve (Task 4) | `solve_baseline.py`: MocoCasADiSolver, coarse mesh then refined. **Converged on fallback B** |
| Tests (Task 5) | 6 tests. Default config (MoBL-ARMS missing): 1 passed, 5 skipped with reason. `WRIST_CONFIG=config/fallback_planar.yaml`: 6 passed |
| Figures (Task 6) | 4 PNGs, 300 dpi, half-page width, each stamped "Fallback B" |
| MyoSuite smoke test (Task 7) | Runs. Wrist joints and muscles exposed by name (see `myosuite_smoke.md`) |

### Fallback B model (`config/fallback_planar.yaml`, `route_a_moco/build_planar_model.py`)

- **Bodies.** The forearm is welded horizontal and pronated (palm down). The hand sits on pin joint `wrist_flexion`, range −60° to +70° (+ = flexion).
- **Mass properties.** Hand 0.45 kg, COM 5.6 cm distal (Winter 2009, 75 kg adult). Cup 0.3 kg, 8 cm distal and 4 cm palmar.
- **Muscles.**
  - `EXT_lumped` (ECRL + ECRB + ECU): 782 N, moment arm 11.8 mm.
  - `FLX_lumped` (FCR + FCU): 888 N, moment arm 18.5 mm.
  - Forces and moment arms come from the MyoSuite MyoHand model (myo_sim 0.2.3, derived from MoBL-ARMS), read from the installed package.
  - Each muscle wraps over a cylinder at the wrist axis.
  - Measured moment arms: EXT −11.8 mm from 0° to +60°, rising to −18.9 mm at −45°. FLX +18.5 mm in extension, up to +23.7 mm in flexion.
- **Assumptions (not checked against a primary table).** Optimal fibre length 7 cm (EXT) and 6 cm (FLX). Tendon slack length set so fibres are at optimal length at 0°. Origin and insertion distances.
- **Gravity check.** Gravity flexes the wrist over the whole range (hand falls): +0.359 Nm at the +30° start, +0.497 Nm at the −15° target, +0.482 Nm at 0°. A hand calculation at 0° gives 0.25 Nm (hand) + 0.24 Nm (cup).

## Moco problem

- **Task.** Wrist goes from **+30° (dropped, flexed) to −15° (extended)** in 1.0 s, with zero velocity at both ends. The last 30 % of the time is a hold.
- **Goals.**
  - `MocoControlGoal` for effort, weight 1. The reserve control is weighted ×1000 and its optimal force is 1 Nm.
  - `MocoInitialActivationGoal`, which stops the solver from using free initial activations.
  - `MocoStateTrackingGoal` (weight 100) on the wrist angle against a minimum-jerk move followed by a hold.
- **Why the tracking goal (design choice).** With pure effort and endpoint constraints the wrist only arrives at the target at t = 1 s and never holds. The kinematics are therefore guided, while muscle coordination is predicted.
- **Solver.** Hermite–Simpson transcription, tolerances 1e-3, 30 mesh intervals, then 60 with the coarse solution as the initial guess.

## Results (fallback B, `fallbackB_solution.sto`)

| Quantity | Value |
|---|---|
| Coarse solve (N = 30) | **Solve_Succeeded**, 162 iterations, 12.1 s |
| Refined solve (N = 60, used) | **Solve_Succeeded**, 24 iterations, 3.4 s, objective 7.64e-3 |
| Final wrist angle | −15.00° (target −15°) |
| Max deviation from target during hold | 0.057° |
| Gravity torque at wrist (start / target / peak) | 0.359 / 0.497 / 0.497 Nm (flexing) |
| Reserve torque, peak / RMS | 1.2e-4 / 2.6e-5 Nm |
| **Reserve peak / peak gravity torque** | **0.02 %**, well under the 10 % flag |
| Extensor activation, mean / hold / peak | 0.086 / 0.084 / 0.113 |
| Flexor activation, mean / hold | 0.011 / 0.010 (the DGF minimum activation is 0.01) |

So with full strength, about **8 % extensor activation holds the 0.3 kg cup level**. K1 (P3) will
find the strength factor at which this is no longer possible without reserve torque.

## Figures (`results/`)

1. `fallbackB_wrist_angle.png`: wrist angle vs time, target and hold window marked.
2. `fallbackB_activations.png`: extensor and flexor activations vs time.
3. `fallbackB_reserve_torque.png`: reserve torque next to the gravity torque at the wrist.
4. `fallbackB_mean_activation.png`: mean activation per muscle.

## Route B smoke test (`myosuite_smoke.md`)

- Environment: `myoHandObjHoldFixed-v0`, chosen from 226 registered environments read from the registry (24 myoHand).
- 200 random steps ran with no errors. Observation dimension 91, action dimension 39 (muscles).
- Wrist joints: `flexion` [−45°, 45°], `deviation`, `pro_sup`.
- Wrist muscles ECRL, ECRB, ECU, FCR, FCU and PL are all present, with moment-arm signs that make sense.

## Fallbacks used

- **Fallback B: used.** MoBL-ARMS is not available (SimTK account pending), so every Route A number above comes from the planar model.
- **Fallback A (torque-driven): not used.** It is implemented as `solve_baseline.py --torque-driven`, but not needed because the muscle-driven solve converged.

## Known limitations

- **Planar model.** One degree of freedom, two lumped muscles, no finger muscles. Optimal fibre length and tendon slack length are assumptions. Moment arms vary with angle where the path unwraps.
- **Hold relies on a tracking goal.** The motion profile is prescribed softly; only muscle coordination is predicted.
- **Mesh-level ripple.** Extensor activation shows small ripples (about 0.005) on the refined mesh. The minimum activation is 0.01 and tendons are rigid.
- **Gravity torque depends on assumptions.** It depends directly on the assumed hand COM and cup offset. The posture is palm down by design, so gravity flexes the wrist.
- **No MoBL-ARMS checks yet.** The MoBL-ARMS inventory, its names in `config/baseline.yaml`, and its gravity and sign checks are still open.

## Swapping in MoBL-ARMS (once SimTK approves)

1. Put the `.osim` file in `models/` and set `model.path` in `config/baseline.yaml`.
2. Run `inspect_model.py`, then fill `names` and `posture.locked_deg` (elbow about 90°, forearm pronated) from the inventory. Check the sign of the wrist flexion coordinate and set `task.start_deg` / `task.end_deg` to match.
3. Run `build_model.py` (prints gravity torque at start and target, which must be flexing), then `solve_baseline.py`, `plot_results.py` and `pytest`. Outputs are tagged `baseline_*`.

## Next steps (P3)

- **K1 weakness sweep.** Loop `strength_factor` over the extensors (for example 1.0 → 0.05). Record the solve status, reserve torque and hold error, and call it failure when reserve torque exceeds 10 % of the gravity torque or the solve fails.
- **K2 and K3, spring vs motor.** Add a torsional spring (stiffness as a `MocoParameter`) and/or an ideal motor `CoordinateActuator` at the wrist. Optimise for minimum muscle effort and compare the effort reduction.
- **Re-run on MoBL-ARMS** and report fallback B and MoBL-ARMS side by side.
- **Route B.** Export the Route A wrist trajectory as the reference for the PPO reward in `myoHandObjHold`.
