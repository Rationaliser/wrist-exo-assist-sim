# Wrist Exoskeleton Assistance after Stroke: Optimal Control vs. Reinforcement Learning

Case study for **MDM2 – Assistive Robotics for Improvement of Life Quality**
(Software & Simulation track), Deggendorf Institute of Technology.

> Status (P2, 2 Nov 2026): baseline pipeline working. The Route A baseline currently runs on a planar
> fallback wrist model while MoBL-ARMS access is pending; see [results/SUMMARY.md](results/SUMMARY.md).

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
├── README.md
├── documents/                    # proposal + concept presentation
├── env/
│   ├── environment-opensim.yml   # conda env for Route A (OpenSim 4.6 + Moco, Python 3.12)
│   └── requirements-myosuite.txt # pip requirements for Route B (MyoSuite 3.0.0, SB3)
├── models/                       # gitignored: MoBL-ARMS goes here (see models/README.md)
├── config/
│   ├── baseline.yaml             # MoBL-ARMS: model path, names, posture, cup, task, solver
│   └── fallback_planar.yaml      # fallback B: planar 2-muscle wrist model + parameter sources
├── route_a_moco/
│   ├── inspect_model.py          # model inventory (coordinates, muscles, bodies)
│   ├── build_planar_model.py     # fallback B model, built in code
│   ├── build_model.py            # processed model: welds, cup, wrist muscles, scale_strength(), reserves
│   ├── solve_baseline.py         # Moco problem + solve, metrics, reserve check
│   ├── plot_results.py           # report figures
│   ├── sweep_weakness.py         # K1: extensor weakness sweep + bisection (P3 preview)
│   └── assist_study.py           # K2/K3: ideal motor vs torsional spring (P3 preview)
├── analysis/
│   ├── pipeline_diagram.py       # method-outline figure
│   └── plot_k1.py                # K1 sweep figure
├── route_b_rl/
│   └── smoke_test.py             # MyoSuite environment smoke test
├── results/                      # solutions (.sto), figures (.png), reports, SUMMARY.md
└── tests/
    └── test_build_model.py
```

## Model: MoBL-ARMS

MoBL-ARMS (Saul et al. 2015) comes from SimTK project
[upexdyn](https://simtk.org/projects/upexdyn), release "MoBL-ARMS dynamic upper limb model - OpenSim
4.1+" (file `MobL_ARMS_OpenSim41_unimanual_tutorial.zip`). Downloading it needs a free SimTK login.
SimTK lists it under the "Creative Commons ANC Use Agreement" and the redistribution terms are not
shown, so it is **not** in this repository. Unzip it and put the unimanual `.osim` file and its
`Geometry/` folder in `models/`, then set `model.path` in `config/baseline.yaml`. Details are in
[models/README.md](models/README.md).

## How to run

Tested on Ubuntu 22.04 (x86_64). The commands are run from the repository root.

### 1. Environments (one-off)

Install [Miniforge](https://github.com/conda-forge/miniforge) if conda is missing. Then create two
separate environments; OpenSim and MyoSuite are kept apart on purpose.

```bash
conda env create -f env/environment-opensim.yml
conda create -n wrist-myosuite python=3.12 -y
conda run -n wrist-myosuite pip install -r env/requirements-myosuite.txt
```

Check them:

```bash
conda run -n wrist-opensim python -c "import opensim; print(opensim.__version__, hasattr(opensim, 'MocoStudy'))"
conda run -n wrist-myosuite python -c "import myosuite"
```

### 2. Route A with MoBL-ARMS (primary)

```bash
conda activate wrist-opensim
python route_a_moco/inspect_model.py      # writes results/model_inventory.md
# fill names / posture in config/baseline.yaml from the inventory, then:
python route_a_moco/build_model.py        # processed model + gravity torque check
python route_a_moco/solve_baseline.py     # results/baseline_solution.sto, baseline_report.json
python route_a_moco/plot_results.py       # results/baseline_*.png
pytest
```

### 3. Route A with fallback B (no MoBL-ARMS needed)

All scripts read `$WRIST_CONFIG`, so the same commands run on the planar fallback model:

```bash
conda activate wrist-opensim
export WRIST_CONFIG=config/fallback_planar.yaml
python route_a_moco/build_planar_model.py                        # models/planar_wrist_fallbackB.osim
python route_a_moco/inspect_model.py --out results/fallbackB_model_inventory.md
python route_a_moco/solve_baseline.py --tag fallbackB
python route_a_moco/plot_results.py --tag fallbackB
pytest
```

`solve_baseline.py --torque-driven` runs fallback A (an ideal wrist torque actuator, no muscles).

### 3b. P3 preview: K1 weakness sweep and K2/K3 assistance (fallback B shown; drop `WRIST_CONFIG` for MoBL-ARMS)

```bash
export WRIST_CONFIG=config/fallback_planar.yaml
python route_a_moco/sweep_weakness.py --tag fallbackB                     # ~10 min
python analysis/plot_k1.py --tag fallbackB --stamp "Fallback B"
python route_a_moco/assist_study.py --tag fallbackB --weak 0.08 0.05 --pass-levels 1.0 0.3   # ~30 min
python analysis/pipeline_diagram.py
```

### 4. Route B smoke test

```bash
conda activate wrist-myosuite
MUJOCO_GL=egl python route_b_rl/smoke_test.py   # results/myosuite_smoke.md + frames
```

Results and their caveats are summarised in [results/SUMMARY.md](results/SUMMARY.md).
