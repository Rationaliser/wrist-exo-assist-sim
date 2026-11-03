# P2 presentation: speaker notes

Presentation on 4 November 2026. Slides: `documents/Team7_P2_Presentation.pptx` (PDF copy next to it);
each slide also has notes in the PowerPoint file. Numbers come from `results/`.

## Main message

The Moco pipeline runs on MoBL-ARMS: the wrist lifts and holds a 0.3 kg cup with about 10 %
activation of ECRB and ECRL, and no help from the reserve actuator. On the planar model the task
fails below about 11 % of normal extensor strength, and a small wrist assist brings it back.
The MyoSuite environment for Route B is set up and checked.

## Things to say clearly

- Slides 6–10 (baseline, including the simulation video on slide 9) are MoBL-ARMS.
- Slides 11–12 (K1–K3) use the planar two-muscle model. It agrees with the MoBL-ARMS baseline
  (gravity torque within 2–9 %, same reserve level, similar extensor activation) and solves in
  seconds instead of about 45 minutes. Its muscle data come from MyoSuite's MyoHand (derived from
  MoBL-ARMS), the hand mass from Winter (2009); fibre and tendon lengths are assumed.
- K1–K3 are early results; the MoBL-ARMS versions are P3 work.

## Slide by slide

| Slide | Message | Figure |
|---|---|---|
| Method outline | Route A plans the motion with Moco, Route B learns it with PPO later | `pipeline_diagram.png` |
| Model and task | Arm at the side, elbow 90°, palm down, so gravity drops the hand. Wrist goes from 30° flexion to 15° extension in 1 s and holds | `planar_model_schematic.png` (sketch) |
| Baseline | Converged on both meshes (refined: 233 iterations, 28 min). Held within 0.11°. Reserve 0.02 % of gravity torque | `baseline_wrist_angle.png`, `baseline_reserve_torque.png` |
| Simulation video | Click to play (7 s, 5× slow motion). Arm fixed, wrist lifts the cup from 30° flexion to 15° extension and holds. Blue = extensors, orange = flexors, thicker = more active | `baseline_simulation.mp4` |
| Muscle activity | ECRB ≈ 0.11, ECRL ≈ 0.09, ECU ≈ 0.03; flexors at their minimum | `baseline_activations.png` |
| K1 | Activation reaches 1.0 below about 12 % strength; the task fails below 10.62–10.75 % | `planar_k1_sweep.png` |
| K2/K3 | 0.27 Nm motor at 8 % strength, 0.56 Nm at 5 %. A spring also works but needs 1.6–1.9× the peak torque. It cuts muscle effort by 82–86 % | `planar_assist.png` |
| Route B | `myoHandObjHoldFixed-v0` runs; wrist joints and the six wrist muscles are available by name | `myosuite_frames/` |
| Next steps | K1 on MoBL-ARMS, sensitivity check, spring vs. motor, PPO | — |

## Numbers

- Gravity torque at the wrist (MoBL-ARMS hand and cup): 0.37 Nm at the start, 0.54 Nm at the
  target. Planar model: 0.36 / 0.50 Nm.
- MoBL-ARMS baseline: final angle −15.00°, drift 0.11°, reserve peak 1.3e-4 Nm, hold activation
  ECRB 0.106, ECRL 0.089, ECU 0.034. Deviation is held by a brace (peak 0.49 Nm).
- K1 fails if the solver fails, the reserve exceeds 10 % of the gravity torque, or the hold drifts
  more than 2°. At the threshold the drift criterion trips first.
- K2:

  | Strength | Motor limit | Spring stiffness (rest −60°) | Spring torque at start / hold |
  |---|---|---|---|
  | 8 % | 0.27 Nm | 0.28 Nm/rad | 0.44 / 0.22 Nm |
  | 5 % | 0.56 Nm | 0.69 Nm/rad | 1.08 / 0.54 Nm |

- K3: 82 % less muscle effort at full strength, 86 % at 30 % strength, with the 0.69 Nm/rad spring.

## Likely questions

- *Why is K1 on the planar model?* A MoBL-ARMS solve takes about 45 minutes, so a 20-level sweep
  did not fit before P2. The planar model matches the MoBL-ARMS baseline and shows the trend; the
  same scripts will run on MoBL-ARMS in P3.
- *Why is deviation fixed?* We start with flexion only. Deviation is held at 0° by an ideal brace;
  in P3 we free it, and then ECU has to balance the radial pull of ECRL and ECRB.
- *Why did MoBL-ARMS need changes?* The wrist is split over two coupled joints, one FCU path point
  moves with forearm rotation, and Moco does not accept locked joints. We weld the arm in the exact
  posture, freeze that path point and brace deviation; the build checks that the hand does not move.
- *What is the reserve actuator?* A heavily penalised helper torque at the wrist. If the solution
  needs it, the muscles cannot do the task alone, which is the failure signal for K1.
- *Why a tracking term?* Minimising effort alone reaches the target only at the last instant and
  never holds. The tracking term shapes the move and the hold; how the muscles share the work is
  still predicted.
- *Is 11 % realistic?* It is a model result, not a clinical number. It depends on hand and cup
  mass, moment arms, fibre lengths and the movement time.
- *Is a spring enough?* Here, yes, down to 5 % strength. A motor needs less peak torque because it
  can follow the gravity profile; a spring is simpler and needs no power.
- *Why palm down?* That is the posture where gravity pulls the hand into flexion (wrist drop).
