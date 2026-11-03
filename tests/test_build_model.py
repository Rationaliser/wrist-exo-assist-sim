"""Task 5: tests for route_a_moco/build_model.py (run in the wrist-opensim env: `pytest`)."""
import sys
from pathlib import Path

import pytest

osim = pytest.importorskip("opensim", reason="opensim not importable: activate the wrist-opensim env")

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "route_a_moco"))
from build_model import CUP_BODY, build, free_coordinates, scale_strength  # noqa: E402
from common import load_config, model_path  # noqa: E402

CFG = load_config()
MODEL_MISSING = not model_path(CFG).exists()
needs_model = pytest.mark.skipif(
    MODEL_MISSING, reason=f"MoBL-ARMS model not found at {model_path(CFG)} (see models/README.md)")


def _fmax(model):
    ms = model.getMuscles()
    return {ms.get(i).getName(): ms.get(i).getMaxIsometricForce() for i in range(ms.getSize())}


@pytest.fixture(scope="module")
def built():
    model, info = build(load_config(), verbose=False)
    return model, info


@needs_model
def test_processed_model_builds_and_inits(built):
    model, _ = built
    state = model.initSystem()
    assert state.getNQ() >= 1


@needs_model
def test_only_intended_coordinates_unlocked(built):
    """Only the configured coordinates move freely. Anything else left in the model must be either
    braced (fixed by a brace actuator + state bounds, e.g. MoBL-ARMS deviation) or driven by a
    coupler constraint (e.g. MoBL-ARMS wrist_hand_r1/r3)."""
    model, info = built
    state = model.initSystem()
    coords = [model.getCoordinateSet().get(i) for i in range(model.getCoordinateSet().getSize())]
    free = set(free_coordinates(CFG))
    assert free <= {c.getName() for c in coords}
    assert not any(c.getDefaultLocked() for c in coords)
    for c in coords:
        if c.getName() in free:
            assert not c.isConstrained(state), c.getName()
        else:
            assert c.getName() in info["braced_coordinates"] or c.isConstrained(state), c.getName()


@needs_model
def test_cup_body_has_configured_mass(built):
    model, _ = built
    assert model.getBodySet().contains(CUP_BODY)
    assert model.getBodySet().get(CUP_BODY).getMass() == pytest.approx(CFG["cup"]["mass_kg"])


@needs_model
def test_scale_strength_halves_only_named_muscles(built):
    model = built[0].clone()
    model.initSystem()
    named = CFG["names"]["wrist_extensors"]
    before = _fmax(model)
    scale_strength(model, named, 0.5)
    after = _fmax(model)
    assert set(named) <= set(before)
    for name, f0 in before.items():
        expected = 0.5 * f0 if name in named else f0
        assert after[name] == pytest.approx(expected, rel=1e-12), name


@needs_model
def test_reserves_are_named_and_cover_free_coordinates(built):
    _, info = built
    assert sorted(info["reserves"]) == sorted("reserve_" + q for q in free_coordinates(CFG))


def test_scale_strength_on_bundled_arm26():
    """Model-independent check of the hook on OpenSim's bundled arm26 test model."""
    path = Path(osim.__file__).parent / "tests" / "arm26.osim"
    if not path.exists():
        pytest.skip(f"bundled test model not found: {path}")
    model = osim.Model(str(path))
    model.initSystem()
    before = _fmax(model)
    scale_strength(model, ["BIClong", "TRIlat"], 0.5)
    after = _fmax(model)
    for name, f0 in before.items():
        assert after[name] == pytest.approx(f0 * (0.5 if name in ("BIClong", "TRIlat") else 1.0))
    with pytest.raises(KeyError):
        scale_strength(model, ["not_a_muscle"], 0.5)
