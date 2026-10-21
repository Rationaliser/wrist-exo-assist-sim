# Sit-to-Stand Assistance: Optimal Control vs. Reinforcement Learning

Case study for **MDM2 – Assistive Robotics for Improvement of Life Quality**
(Software & Simulation track), Deggendorf Institute of Technology.

> Status: project setup. Code and results will be added from November 2026.

## Overview

Older adults with age-related leg weakness struggle to stand up from a chair. This project uses
musculoskeletal simulation to find how much assistive torque, and at which joint, a weakened body
needs to stand up, and compares an optimal-control plan with a learned feedback controller.

**Research question:** At what level of leg weakness does a simulated body fail to stand up, and
what is the minimum hip or knee assistance that restores it?

## Approach

| Route | Method | Tools |
| --- | --- | --- |
| A (primary) | Predictive sit-to-stand simulation; muscle strength reduced step by step; ideal hip/knee torque optimised for minimum muscle effort | OpenSim, Moco |
| B (secondary) | RL policy learns to stand, guided by the Route A trajectory; robustness compared with the Moco plan | MuJoCo, MyoSuite, Stable-Baselines3 (PPO) |

## Measurable outcomes

- **K1** Strength threshold (% of max. muscle force) where unassisted standing fails
- **K2** Minimum assistive torque (Nm) at hip, knee or both that restores standing
- **K3** Muscle-effort reduction (%) compared with no assistance
- **K4** Success rate (%) of the RL policy vs. the Moco plan under perturbations

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
route_a_moco/     OpenSim Moco sit-to-stand, weakness sweep, assistance optimisation
route_b_rl/       MuJoCo/MyoSuite environment and PPO training
analysis/         Metrics and plots
docs/             Proposal, reports, presentations
```

## Team

- [Member names]
- Supervisor: [Supervisor name]
