# Wrist Exoskeleton Assistance after Stroke: Optimal Control vs. Reinforcement Learning

Case study for **MDM2 – Assistive Robotics for Improvement of Life Quality**
(Software & Simulation track), Deggendorf Institute of Technology.

> Status (P2, Nov 2026): baseline simulation on MoBL-ARMS working. Results in
> [results/SUMMARY.md](results/SUMMARY.md).

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

## Repository structure

```
wrist-exo-assist-sim/
├── documents/              P1 proposal and presentation, P2 presentation
├── env/                    environment files (OpenSim conda env, MyoSuite pip requirements)
├── models/                 MoBL-ARMS goes here (not in git, see models/README.md)
├── config/
│   ├── baseline.yaml       MoBL-ARMS: names, posture, cup, task, solver settings
│   └── planar.yaml         planar 2-muscle wrist model used for fast checks
├── route_a_moco/
│   ├── inspect_model.py    model inventory (coordinates, muscles, bodies)
│   ├── build_model.py      processed model: posture, cup, wrist muscles, reserves
│   ├── build_planar_model.py
│   ├── solve_baseline.py   Moco problem, solve, reserve check
│   ├── plot_results.py
│   ├── sweep_weakness.py   K1: extensor weakness sweep
│   └── assist_study.py     K2/K3: motor vs. spring
├── route_b_rl/
│   └── smoke_test.py       MyoSuite environment check
├── analysis/               extra figures (pipeline diagram, K1/K2 plots, model sketch)
├── presentation/           scripts that build the P2 report and slides, speaker notes
├── results/                solutions (.sto), reports, figures, SUMMARY.md
└── tests/
```

## Model

MoBL-ARMS (Saul et al. 2015, updated by McFarland et al. 2019) is on SimTK, project
[upexdyn](https://simtk.org/projects/upexdyn). We use `MOBL_ARMS_fixed_41.osim` from
`MobL_ARMS_OpenSim41_unimanual_tutorial.zip`. Downloading needs a free SimTK login, and the model is
not redistributed here. See [models/README.md](models/README.md) for where to put the files.

## How to run

Tested on Ubuntu 22.04. Run everything from the repository root.

### Environments

OpenSim and MyoSuite live in separate environments:

```bash
conda env create -f env/environment-opensim.yml
conda create -n wrist-myosuite python=3.12 -y
conda run -n wrist-myosuite pip install -r env/requirements-myosuite.txt
```

### Route A: baseline on MoBL-ARMS

```bash
conda activate wrist-opensim
python route_a_moco/inspect_model.py      # results/model_inventory.md
python route_a_moco/build_model.py        # builds the processed model, prints gravity torque
python route_a_moco/solve_baseline.py     # results/baseline_solution.sto (about 45 min)
python route_a_moco/plot_results.py       # results/baseline_*.png
pytest
```

`solve_baseline.py --torque-driven` replaces the muscles with an ideal wrist actuator.

### Route A: planar model

All scripts read `$WRIST_CONFIG`, so the same commands run on the planar model (seconds per solve):

```bash
export WRIST_CONFIG=config/planar.yaml
python route_a_moco/build_planar_model.py
python route_a_moco/solve_baseline.py --tag planar
python route_a_moco/plot_results.py --tag planar
python route_a_moco/sweep_weakness.py --tag planar                    # K1, about 10 min
python route_a_moco/assist_study.py --tag planar --weak 0.08 0.05 --pass-levels 1.0 0.3
python analysis/plot_k1.py --tag planar --stamp "Planar 2-muscle wrist model"
python analysis/plot_assist.py --tag planar --stamp "Planar 2-muscle wrist model"
```

### Route B: MyoSuite check

```bash
conda activate wrist-myosuite
MUJOCO_GL=egl python route_b_rl/smoke_test.py   # results/myosuite_smoke.md
```

### P2 report and slides

```bash
node presentation/build_p2_report.js   # documents/Team7_P2_Report.docx (needs the docx npm package)
node presentation/build_p2_deck.js     # documents/Team7_P2_Presentation.pptx (needs pptxgenjs)
```

PDF versions are exported with LibreOffice (`soffice --headless --convert-to pdf`).
