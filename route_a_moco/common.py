"""Shared helpers for Route A: config loading and repo paths."""
import os
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = REPO_ROOT / "config" / "baseline.yaml"
# WRIST_RESULTS_DIR lets tests/dry runs write elsewhere
RESULTS_DIR = Path(os.environ.get("WRIST_RESULTS_DIR", REPO_ROOT / "results"))


def load_config(path=None):
    """Load the YAML config (default: $WRIST_CONFIG, else config/baseline.yaml)."""
    path = Path(path or os.environ.get("WRIST_CONFIG") or DEFAULT_CONFIG)
    with open(path) as f:
        return yaml.safe_load(f)


def model_path(cfg):
    """Absolute path of the source .osim model named in the config."""
    p = Path(cfg["model"]["path"])
    return p if p.is_absolute() else REPO_ROOT / p
