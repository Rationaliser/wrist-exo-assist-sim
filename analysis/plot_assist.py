"""Figure for the K2/K3 assist study (results/<tag>_assist_summary.json -> <tag>_assist.png).

Left:  K2 -- smallest assist that restores the task at each failing strength level:
       ideal-motor torque limit vs peak torque of the smallest sufficient spring (Nm),
       with the peak gravity torque at the wrist as a reference line.
Right: K3 -- muscle-effort reduction (%) from that spring at strength levels that pass unassisted.

Usage:  python analysis/plot_assist.py [--tag fallbackB] [--stamp "..."]
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "route_a_moco"))
import plot_results as pr  # noqa: E402
from common import RESULTS_DIR  # noqa: E402

plt = pr.plt


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--tag", default="baseline")
    ap.add_argument("--stamp", default="")
    args = ap.parse_args()
    pr.STAMP = args.stamp

    summ = json.loads((RESULTS_DIR / f"{args.tag}_assist_summary.json").read_text())
    runs = pd.read_csv(RESULTS_DIR / f"{args.tag}_assist_runs.csv")
    grav = runs["gravity_torque_peak_Nm"].max()
    k2, k3 = summ["k2"], summ["k3"]

    fig, axes = plt.subplots(1, 2, figsize=(pr.HALF_PAGE[0] * 2.0, pr.HALF_PAGE[1]),
                             gridspec_kw={"width_ratios": [1.4, 1]})
    fig.subplots_adjust(wspace=0.45)

    ax = axes[0]
    x = np.arange(len(k2))
    w = 0.36
    motor = [k["motor_limit_min_Nm"] or np.nan for k in k2]
    spring = [k["spring_peak_torque_Nm"] or np.nan for k in k2]
    for off, vals, col, lab in [(-w / 2, motor, pr.SERIES[0], "ideal motor (torque limit)"),
                                (w / 2, spring, pr.SERIES[1], "spring (peak torque)")]:
        ax.bar(x + off, vals, width=w, color=col, edgecolor="white", linewidth=1.5, label=lab)
        for xi, v in zip(x + off, vals):
            ax.text(xi, v if np.isfinite(v) else 0, f"{v:.2f}" if np.isfinite(v) else "n/a",
                    ha="center", va="bottom", fontsize=6.5, color=pr.INK2,
                    bbox=dict(facecolor="white", edgecolor="none", pad=0.6))
    ax.axhline(grav, color=pr.INK2, lw=0.9, ls=(0, (4, 3)), zorder=0.5,
               label=f"peak gravity torque ({grav:.2f} Nm)")
    labels = [f"{100 * k['strength_factor']:.0f} % strength" for k in k2]
    ax.set_xticks(x, labels)
    ax.set_ylabel("Assist torque (Nm)")
    ax.set_axisbelow(True)
    ax.grid(axis="x", visible=False)
    top = np.nanmax(motor + spring + [grav])
    ax.set_ylim(0, top * 1.3)
    ax.legend(frameon=False, loc="upper left", fontsize=6.5)
    ax.set_title("K2: smallest assist that restores the task", loc="left")

    ax = axes[1]
    if k3:
        xs = np.arange(len(k3))
        red = [k["effort_reduction_pct"] for k in k3]
        ax.bar(xs, red, width=0.55, color=pr.SERIES[1], edgecolor="white", linewidth=1.5)
        for xi, v in zip(xs, red):
            ax.text(xi, v, f"{v:.0f} %", ha="center", va="bottom", fontsize=6.5, color=pr.INK2)
        ax.set_xticks(xs, [f"{100 * k['strength_factor']:.0f} %\nstrength" for k in k3])
        ax.set_ylim(0, max(100, max(red) * 1.15))
        ax.set_title(f"K3: effort saved by spring\n(k = {k3[0]['spring_stiffness_Nm_per_rad']:.2f} Nm/rad)",
                     loc="left")
    ax.set_ylabel("Muscle-effort reduction (%)")
    ax.set_axisbelow(True)
    ax.grid(axis="x", visible=False)

    out = RESULTS_DIR / f"{args.tag}_assist.png"
    pr.save(fig, out)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
