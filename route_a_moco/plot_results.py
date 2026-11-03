"""Report figures from a Moco solution.

Reads results/<tag>_solution.sto (+ <tag>_gravity_torque.csv, <tag>_report.json) and writes
300-dpi PNGs sized for half-page width:
  1. <tag>_wrist_angle.png       wrist angle vs time, target marked
  2. <tag>_activations.png       extensor / flexor activations vs time (small multiples)
  3. <tag>_reserve_torque.png    reserve torque next to the gravity torque at the wrist
  4. <tag>_mean_activation.png   mean activation per muscle (muscle-driven solves only)

Usage (wrist-opensim env, or any env with pandas + matplotlib + pyyaml):
    python route_a_moco/plot_results.py [--config PATH] [--tag baseline]
"""
import argparse
import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import RESULTS_DIR, load_config  # noqa: E402

# Categorical palette (fixed order; validated for CVD separation on a light surface).
# Slots 3-5 sit below 3:1 contrast, so every line is also direct-labelled.
SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"]
OTHER = "#9a9993"
INK, INK2, GRID = "#0b0b0b", "#52514e", "#e4e3df"
HALF_PAGE = (3.4, 2.4)  # inches; ~half an A4 text width

plt.rcParams.update({
    "font.size": 8, "axes.titlesize": 9, "axes.labelsize": 8, "xtick.labelsize": 7,
    "ytick.labelsize": 7, "legend.fontsize": 7, "axes.edgecolor": INK2, "axes.labelcolor": INK,
    "xtick.color": INK2, "ytick.color": INK2, "axes.grid": True, "grid.color": GRID,
    "grid.linewidth": 0.6, "axes.spines.top": False, "axes.spines.right": False,
    "lines.linewidth": 1.6, "savefig.dpi": 300, "savefig.bbox": "tight", "figure.dpi": 100,
})


STAMP = ""  # provenance note printed above every figure (e.g. which model was used)


def save(fig, out):
    if STAMP:
        fig.text(0.01, 1.08, STAMP, ha="left", va="bottom", fontsize=6.5, color=INK2, style="italic")
    fig.savefig(out)
    plt.close(fig)


def read_sto(path):
    """Read an OpenSim .sto (header ... 'endheader', then a tab-separated table)."""
    with open(path) as f:
        for n, line in enumerate(f):
            if line.strip() == "endheader":
                break
    return pd.read_csv(path, sep="\t", skiprows=n + 1)


def find_col(df, suffix):
    hits = [c for c in df.columns if c.endswith(suffix)]
    if len(hits) != 1:
        raise KeyError(f"expected one column ending in '{suffix}', got {hits}")
    return hits[0]


def label_end(ax, x, y, text, color_dy=0.0):
    ax.annotate(text, (x[-1], y[-1]), xytext=(3, color_dy), textcoords="offset points",
                fontsize=7, color=INK2, va="center")


def spread(values, min_gap):
    """Nudge label y-positions apart so end labels don't collide."""
    order = np.argsort(values)
    out = np.array(values, dtype=float)
    for a, b in zip(order[:-1], order[1:]):
        if out[b] - out[a] < min_gap:
            out[b] = out[a] + min_gap
    return out


def fig_angle(df, cfg, qname, out):
    t = df["time"].to_numpy()
    q = np.degrees(df[find_col(df, f"/{qname}/value")].to_numpy())
    task = cfg["task"]
    t_hold = task["duration_s"] * (1 - task["hold_fraction"])
    fig, ax = plt.subplots(figsize=HALF_PAGE)
    ax.axvspan(t_hold, t[-1], color=GRID, alpha=0.6, lw=0)
    ax.text((t_hold + t[-1]) / 2, task["start_deg"], "hold", ha="center", va="bottom", fontsize=7, color=INK2)
    ax.axhline(task["end_deg"], color=INK2, lw=0.9, ls=(0, (4, 3)))
    ax.text(t[0], task["end_deg"], f" target {task['end_deg']:+.0f}°", va="bottom", fontsize=7, color=INK2)
    ax.plot(t, q, color=SERIES[0])
    ax.set_xlabel("Time (s)")
    ax.set_ylabel("Wrist flexion angle (deg)\n(+ flexion, − extension)")
    ax.set_title("Wrist angle", loc="left")
    save(fig, out)


def fig_activations(df, groups, colors, out):
    t = df["time"].to_numpy()
    fig, axes = plt.subplots(1, len(groups), figsize=(HALF_PAGE[0] * 1.9, HALF_PAGE[1]), sharey=True)
    fig.subplots_adjust(wspace=0.4)
    axes = np.atleast_1d(axes)
    acts = {m: df[find_col(df, f"/{m}/activation")].to_numpy() for g in groups.values() for m in g}
    top = max(a.max() for a in acts.values()) * 1.1
    for ax, (title, muscles) in zip(axes, groups.items()):
        ends, series = [], []
        for m in muscles:
            ax.plot(t, acts[m], color=colors[m])
            ends.append(acts[m][int(0.9 * len(acts[m])):].mean())  # last 10 %: robust to end-point dips
            series.append(m)
        ys = spread(ends, 0.07 * top) if ends else []
        top = max([top] + [y * 1.05 for y in ys])
        for m, y in zip(series, ys):
            ax.annotate(m, (t[-1], y), xytext=(3, 0), textcoords="offset points",
                        fontsize=7, color=INK2, va="center")
        ax.set_title(title, loc="left")
        ax.set_xlabel("Time (s)")
        ax.set_xlim(t[0], t[-1] * 1.12)
    axes[0].set_ylabel("Activation (0–1)")
    axes[0].set_ylim(0, top)
    if sum(len(g) for g in groups.values()) > 2:
        handles = [plt.Line2D([], [], color=colors[m], lw=1.6) for g in groups.values() for m in g]
        fig.legend(handles, [m for g in groups.values() for m in g], loc="upper center",
                   bbox_to_anchor=(0.5, -0.07), ncol=6, frameon=False)
    save(fig, out)


def fig_reserve(df, grav, actuators, out, title):
    t = df["time"].to_numpy()
    fig, ax = plt.subplots(figsize=HALF_PAGE)
    ax.plot(grav["time_s"], grav["gravity_torque_Nm"], color=SERIES[1])
    label_end(ax, grav["time_s"].to_numpy(), grav["gravity_torque_Nm"].to_numpy(), "gravity")
    for k, (name, fopt) in enumerate(actuators.items()):
        tau = df[find_col(df, f"/forceset/{name}")].to_numpy() * fopt
        ax.plot(t, tau, color=SERIES[0] if k == 0 else SERIES[2 + k])
        label_end(ax, t, tau, name.replace("reserve_", "reserve ").replace("tau_", "motor "))
    ax.hlines(0, t[0], t[-1], color=INK2, lw=0.6, zorder=0)
    ax.set_xlim(t[0], t[-1] * 1.18)
    ax.set_xlabel("Time (s)")
    ax.set_ylabel("Torque about wrist flexion axis (Nm)\n(+ flexing)")
    ax.set_title(title, loc="left")
    save(fig, out)


def fig_mean_activation(df, groups, out):
    names, means, cols = [], [], []
    for gi, (g, muscles) in enumerate(groups.items()):
        for m in muscles:
            names.append(m)
            means.append(df[find_col(df, f"/{m}/activation")].mean())
            cols.append(SERIES[gi])
    fig, ax = plt.subplots(figsize=HALF_PAGE)
    x = np.arange(len(names))
    ax.bar(x, means, width=0.7, color=cols, edgecolor="white", linewidth=1.5)
    for xi, v in zip(x, means):
        ax.text(xi, v, f"{v:.2f}", ha="center", va="bottom", fontsize=6.5, color=INK2)
    ax.set_xticks(x, names, rotation=45, ha="right")
    ax.set_ylabel("Mean activation (0–1)")
    ax.set_axisbelow(True)
    ax.grid(axis="x", visible=False)
    ax.set_ylim(0, max(means) * 1.15)
    handles = [plt.Rectangle((0, 0), 1, 1, color=SERIES[i]) for i in range(len(groups))]
    ax.legend(handles, list(groups), frameon=False, ncol=len(groups), loc="lower left",
              bbox_to_anchor=(0, 1.0), borderaxespad=0.2, handlelength=1.0)
    ax.set_title("Mean activation per muscle", loc="left", pad=18)
    save(fig, out)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--config", default=None)
    ap.add_argument("--tag", default="baseline")
    args = ap.parse_args()

    cfg = load_config(args.config)
    report = json.loads((RESULTS_DIR / f"{args.tag}_report.json").read_text())
    df = read_sto(RESULTS_DIR / f"{args.tag}_solution.sto")
    grav = pd.read_csv(RESULTS_DIR / f"{args.tag}_gravity_torque.csv")
    qname = cfg["names"]["wrist_flexion"]
    torque_driven = report["actuation"] == "torque"
    suffix = " (torque-driven)" if torque_driven else ""
    global STAMP
    notes = []
    if cfg["model"].get("label"):
        notes.append(cfg["model"]["label"])
    if torque_driven:
        notes.append("Torque-driven wrist, no muscles")
    STAMP = " | ".join(notes)
    written = []

    p = RESULTS_DIR / f"{args.tag}_wrist_angle.png"
    fig_angle(df, cfg, qname, p)
    written.append(p)

    actuators = {r: cfg["reserves"]["optimal_force_nm"] for r in report["build"]["reserves"]}
    if torque_driven:
        actuators.update({f"tau_{q}": cfg["torque_actuator"]["optimal_force_nm"]
                          for q in report["build"]["free_coordinates"]})
    p = RESULTS_DIR / f"{args.tag}_reserve_torque.png"
    fig_reserve(df, grav, actuators, p, ("Motor and reserve" if torque_driven else "Reserve") +
                " vs gravity torque" + suffix)
    written.append(p)

    if not torque_driven:
        kept = set(report["build"]["kept_muscles"])
        groups = {"Wrist extensors": [m for m in cfg["names"]["wrist_extensors"] if m in kept],
                  "Wrist flexors": [m for m in list(cfg["names"]["wrist_flexors"]) +
                                    list(cfg["names"].get("other_wrist_muscles", [])) if m in kept]}
        ordered = groups["Wrist extensors"] + groups["Wrist flexors"]
        colors = {m: SERIES[i] if i < len(SERIES) else OTHER for i, m in enumerate(ordered)}
        p = RESULTS_DIR / f"{args.tag}_activations.png"
        fig_activations(df, groups, colors, p)
        written.append(p)
        p = RESULTS_DIR / f"{args.tag}_mean_activation.png"
        fig_mean_activation(df, groups, p)
        written.append(p)

    for p in written:
        print(f"wrote {p}")


if __name__ == "__main__":
    main()
