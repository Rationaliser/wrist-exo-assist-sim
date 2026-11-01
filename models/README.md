# models/

This folder is gitignored (except this file and `.gitkeep`). Third-party model files are **not** committed.

## MoBL-ARMS dynamic upper-limb model (required for Route A)

* Source: SimTK project **upexdyn** — "MoBL-ARMS Dynamic Upper Limb" — <https://simtk.org/projects/upexdyn>
  (Downloads page: <https://simtk.org/frs/?group_id=657>). A free SimTK login is needed.
* Release used: "MoBL-ARMS dynamic upper limb model - OpenSim 4.1+" (22 Feb 2021),
  file `MobL_ARMS_OpenSim41_unimanual_tutorial.zip` (~63 MB).
* Licence: SimTK lists it under the "Creative Commons ANC Use Agreement"
  (attribution, non-commercial). The redistribution terms are not shown on the download page,
  so the model is kept out of git (work-order ground rule 3).
* Cite: Saul KR, Hu X, Goehler CM, et al. (2015) Benchmarking of dynamic simulation predictions
  in two software platforms using an upper limb musculoskeletal model. *Comput Methods Biomech
  Biomed Engin* 18(13):1445-58. doi:10.1080/10255842.2014.916698

Unzip and copy the unimanual `.osim` file (and its `Geometry/` folder, for visualisation) into
this folder, then set `model.path` in `config/baseline.yaml` to the file name.
