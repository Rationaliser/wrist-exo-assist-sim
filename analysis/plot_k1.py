"""Figure for the K1 weakness sweep (results/<tag>_k1_sweep.csv -> results/<tag>_k1_sweep.png).

Two panels sharing the x axis (extensor strength, % of unimpaired max isometric force):
  left  peak wrist-extensor activation
  right peak reserve torque as % of the peak gravity torque, with the 10 % failure line
Filled markers = task passes, hollow = task fails. The shaded band is the K1 interval.

Usage:  python analysis/plot_k1.py [--tag fallbackB] [--stamp "Fallback B: ..."]
"""
import argparse
import json
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "route_a_moco"))
import plot_results as pr  # noqa: E402  (shared style, palette, save())
from common import RESULTS_DIR  # noqa: E402

plt = pr.plt


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--tag", default="baseline")
    ap.add_argument("--stamp", default="")
    args = ap.parse_args()
    pr.STAMP = args.stamp

    df = pd.read_csv(RESULTS_DIR / f"{args.tag}_k1_sweep.csv").sort_values("strength_factor")
    k1 = json.loads((RESULTS_DIR / f"{args.tag}_k1_summary.json").read_text())
    crit = k1["criteria"]["reserve_limit_pct_of_gravity"]
    x = 100 * df["strength_factor"]
    ok = df["task_ok"].astype(bool)

    fig, axes = plt.subplots(1, 2, figsize=(pr.HALF_PAGE[0] * 2.0, pr.HALF_PAGE[1]), sharex=True)
    fig.subplots_adjust(wspace=0.35)
    panels = [("ext_activation_peak", "Peak extensor activation (0–1)", "Extensor activation"),
              ("reserve_peak_pct_gravity", "Peak reserve / gravity torque (%)", "Reserve torque needed")]
    for ax, (col, ylab, title) in zip(axes, panels):
        ax.plot(x, df[col], color=pr.SERIES[0], lw=1.4, zorder=2)
        ax.scatter(x[ok], df[col][ok], s=22, color=pr.SERIES[0], zorder=3, label="task passes")
        ax.scatter(x[~ok], df[col][~ok], s=22, facecolor="white", edgecolor=pr.SERIES[0], lw=1.3,
                   zorder=3, label="task fails")
        if "weakest_passing_factor" in k1["k1"]:
            lo, hi = 100 * k1["k1"]["strongest_failing_factor"], 100 * k1["k1"]["weakest_passing_factor"]
            ax.axvspan(lo, hi, color=pr.GRID, alpha=0.9, lw=0, zorder=0)
            ax.axvline(0.5 * (lo + hi), color=pr.INK2, lw=0.8, ls=(0, (1, 2)), zorder=1)
        ax.set_xlabel("Extensor strength (% of unimpaired)")
        ax.set_ylabel(ylab)
        ax.set_title(title, loc="left")
        ax.set_xlim(0, 102)
    axes[0].set_ylim(0, 1.05)
    axes[1].axhline(crit, color=pr.INK2, lw=0.9, ls=(0, (4, 3)))
    axes[1].text(100, crit, f"failure limit {crit:.0f} %", ha="right", va="bottom", fontsize=7, color=pr.INK2)
    axes[1].set_ylim(0, max(crit * 1.5, df["reserve_peak_pct_gravity"].max() * 1.08))
    axes[0].legend(frameon=False, loc="upper right")
    if "weakest_passing_factor" in k1["k1"]:
        hi = 100 * k1["k1"]["weakest_passing_factor"]
        mid = 50 * (k1["k1"]["weakest_passing_factor"] + k1["k1"]["strongest_failing_factor"])
        axes[0].annotate(f"K1 ≈ {mid:.1f} %", (hi, 0.9), xytext=(6, 0), textcoords="offset points",
                         fontsize=7, color=pr.INK2, va="center")
    lim = k1["criteria"]
    axes[0].text(98, 0.62, f"fail = solver fails, reserve > {lim['reserve_limit_pct_of_gravity']:.0f} %\n"
                 f"of gravity torque, or hold drift > {lim['hold_limit_deg']:.0f}°",
                 ha="right", va="top", fontsize=6.5, color=pr.INK2)
    out = RESULTS_DIR / f"{args.tag}_k1_sweep.png"
    pr.save(fig, out)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
