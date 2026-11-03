"""Method-outline figure: the simulation pipeline (Route A + Route B), P2 done vs later phases.

Usage (any env with matplotlib):  python analysis/pipeline_diagram.py
Writes results/pipeline_diagram.png (300 dpi).
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "results" / "pipeline_diagram.png"
INK, INK2 = "#0b0b0b", "#52514e"
DONE, DONE_FILL = "#2a78d6", "#e8f1fb"
LATER, LATER_FILL = "#9a9993", "#f4f4f2"
ROUTE_B, ROUTE_B_FILL = "#1baf7a", "#e6f6ef"

W, H = 2.4, 1.3  # box size (axis units)


def box(ax, x, y, title, body, edge, fill, dashed=False):
    ax.add_patch(FancyBboxPatch((x, y), W, H, boxstyle="round,pad=0.02,rounding_size=0.12",
                                linewidth=1.3, edgecolor=edge, facecolor=fill,
                                linestyle=(0, (4, 3)) if dashed else "-"))
    ax.text(x + 0.12, y + H - 0.16, title, fontsize=8.5, fontweight="bold", color=INK, va="top")
    ax.text(x + 0.12, y + H - 0.46, body, fontsize=6.4, color=INK2, va="top", linespacing=1.35)


def arrow(ax, x0, y0, x1, y1, color=INK2):
    ax.add_patch(FancyArrowPatch((x0, y0), (x1, y1), arrowstyle="-|>", mutation_scale=9,
                                 linewidth=1.1, color=color, shrinkA=2, shrinkB=2))


def main():
    fig, ax = plt.subplots(figsize=(11.5, 3.9))
    ax.set_xlim(0, 16.0)
    ax.set_ylim(0, 4.95)
    ax.axis("off")

    xs = [0.2 + i * 2.65 for i in range(6)]
    ya, yb = 3.05, 0.55
    ax.text(0.2, ya + H + 0.22, "Route A — OpenSim 4.6 + Moco (primary)", fontsize=9.5, fontweight="bold", color=DONE)
    ax.text(0.2, yb + H + 0.22, "Route B — MuJoCo + MyoSuite (secondary)", fontsize=9.5, fontweight="bold", color=ROUTE_B)

    a = [
        ("Model", "MoBL-ARMS (SimTK);\nplanar 2-muscle wrist\nfor fast cross-checks"),
        ("Inspect", "inventory of coordinates,\nmuscles, bodies\n→ names into config"),
        ("Build", "weld posture (palm down)\n0.3 kg cup, wrist muscles\nDGF muscles, reserves"),
        ("Moco problem", "+30° → −15°, hold\nmin. effort + tracking\nreserves ×1000 penalty"),
        ("Solve + check", "CasADi, mesh 30 → 60\nreserve vs gravity torque\n(flag if > 10 %)"),
        ("P3: K1 → K2/K3", "weakness sweep\n(scale_strength)\nspring vs motor at wrist"),
    ]
    for i, (t, b) in enumerate(a):
        later = i == 5
        box(ax, xs[i], ya, t, b, LATER if later else DONE, LATER_FILL if later else DONE_FILL, dashed=later)
        if i:
            arrow(ax, xs[i - 1] + W, ya + H / 2, xs[i], ya + H / 2)

    b = [
        ("Environment", "myoHandObjHold-v0\nregistry-checked;\nwrist joints + 6 muscles"),
        ("Smoke test", "200 random steps\nobs 91, act 39\noffscreen frames"),
        ("P3/P4: PPO", "Stable-Baselines3\nreward guided by the\nRoute A wrist motion"),
        ("P4: K4", "success rate under\nheavier cup, pushes,\nfatigue vs Moco plan"),
    ]
    for i, (t, bd) in enumerate(b):
        later = i >= 2
        box(ax, xs[i], yb, t, bd, LATER if later else ROUTE_B, LATER_FILL if later else ROUTE_B_FILL, dashed=later)
        if i:
            arrow(ax, xs[i - 1] + W, yb + H / 2, xs[i], yb + H / 2)
    # Route A motion guides Route B training
    arrow(ax, xs[4] + W / 2, ya, xs[2] + W * 0.75, yb + H, color=LATER)
    ax.text(xs[4] - 0.25, (ya + yb + H) / 2, "reference motion", fontsize=6.6, color=INK2, style="italic", ha="left")

    # legend
    for k, (edge, fill, dashed, lab) in enumerate([(DONE, DONE_FILL, False, "done in P2"),
                                                   (LATER, LATER_FILL, True, "later phases")]):
        x = 11.6 + k * 2.2
        ax.add_patch(FancyBboxPatch((x, 0.08), 0.35, 0.2, boxstyle="round,pad=0.01,rounding_size=0.05",
                                    edgecolor=edge, facecolor=fill, linewidth=1.2,
                                    linestyle=(0, (3, 2)) if dashed else "-"))
        ax.text(x + 0.5, 0.18, lab, fontsize=7, color=INK2, va="center")

    OUT.parent.mkdir(exist_ok=True)
    fig.savefig(OUT, dpi=300, bbox_inches="tight", facecolor="white")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
