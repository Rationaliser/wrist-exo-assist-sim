# Wrist Exoskeleton Assistance after Stroke: Optimal Control vs. Reinforcement Learning

Case study for **MDM2 – Assistive Robotics for Improvement of Life Quality**
(Software & Simulation track), Deggendorf Institute of Technology.

> Status: project setup. Code and results will be added from November 2026.

## Overview

After a stroke, weak wrist extensors make the wrist drop, so everyday tasks such as lifting a cup and
holding it level fail. This project uses musculoskeletal simulation to find how much wrist assistance a
weakened wrist needs, whether a passive spring is enough or a motor is required, and compares an
optimal-control plan with a learned feedback controller.

**Research question:** How weak can the wrist extensors get before a simulated arm can no longer lift
and hold a cup, and what is the minimum wrist assistance that restores it?

## Approach

| Route | Method | Tools |
| --- | --- | --- |
| A (primary) | Predictive cup lift-and-hold simulation; wrist-extensor strength reduced step by step; spring vs. ideal motor at the wrist, optimised for minimum muscle effort | OpenSim, Moco, MoBL-ARMS upper-limb model |
| B (secondary) | RL policy learns the cup task, guided by the Route A motion; robustness compared with the Moco plan | MuJoCo, MyoSuite (myoHand), Stable-Baselines3 (PPO) |

## Measurable outcomes

- **K1** Extensor strength threshold (% of max. muscle force) where lifting and holding the cup fails
- **K2** Minimum wrist assist torque (Nm) that restores the task, and whether a spring is enough
- **K3** Wrist-muscle effort reduction (%) compared with no assistance
- **K4** Success rate (%) of the RL policy vs. the Moco plan with a heavier cup, pushes and fatigue

## Milestones

| Phase | Date | Deliverable |
| --- | --- | --- |
| P1 | 21 Oct 2026 | Proposal |
| P2 | 4 Nov 2026 | Literature map, method outline, baseline simulation, bibliography report |
| P3 | 18 Nov and 2 Dec 2026 | Methodology |
| P4 | 16 Dec 2026 | Demo, experiments and analysis |
| P5 | 13 Jan 2027 | Final presentation and report |

## Planned structure

```
route_a_moco/     OpenSim Moco cup task, weakness sweep, spring vs. motor
route_b_rl/       MyoSuite myoHand environment and PPO training
analysis/         Metrics and plots
docs/             Proposal, reports, presentations
```
