"""Figure for the K1 weakness sweep (results/<tag>_k1_sweep.csv -> results/<tag>_k1_sweep.png).

Three panels sharing the x axis (extensor strength, % of unimpaired max isometric force):
  left    peak wrist-extensor activation
  middle  peak reserve torque as % of the peak gravity torque, with the 10 % failure line
  right   largest drift from the target angle during the hold, with the 2 deg failure line
Filled markers = task passes, hollow = task fails. The shaded band is the K1 interval.

Usage:  python analysis/plot_k1.py [--tag planar] [--stamp "Planar 2-muscle wrist model"]
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

    fig, axes = plt.subplots(1, 3, figsize=(pr.HALF_PAGE[0] * 3.0, pr.HALF_PAGE[1]), sharex=True)
    fig.subplots_adjust(wspace=0.38, bottom=0.24)
    panels = [("ext_activation_peak", "Peak extensor activation (0–1)", "Extensor activation"),
              ("reserve_peak_pct_gravity", "Peak reserve / gravity torque (%)", "Reserve torque needed"),
              ("hold_max_error_deg", "Max hold drift (deg)", "Hold drift")]
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
        axes[0].annotate(f"K1 ≈ {mid:.1f} %", (hi, 0.5), xytext=(-5, 0), textcoords="offset points",
                         fontsize=7, color=pr.INK2, va="center", ha="right", rotation=90)
    hlim = k1["criteria"]["hold_limit_deg"]
    axes[2].axhline(hlim, color=pr.INK2, lw=0.9, ls=(0, (4, 3)))
    axes[2].text(100, hlim, f"failure limit {hlim:.0f}°", ha="right", va="bottom", fontsize=7, color=pr.INK2)
    axes[2].set_ylim(0, max(hlim * 1.5, df["hold_max_error_deg"].max() * 1.08))
    fig.text(0.5, 0.02, f"Task fails if the solver does not converge, the reserve exceeds {crit:.0f} % of the "
             f"gravity torque, or the wrist drifts more than {hlim:.0f}° during the hold.",
             ha="center", fontsize=7, color=pr.INK2)
    out = RESULTS_DIR / f"{args.tag}_k1_sweep.png"
    pr.save(fig, out)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
