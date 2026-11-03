"""Schematic of the fallback B planar wrist model (for slides / report).

Usage:  python analysis/model_schematic.py   ->  results/fallbackB_model_schematic.png
"""
import math
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import Arc, Circle, FancyArrowPatch, FancyBboxPatch, Polygon  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "results" / "fallbackB_model_schematic.png"
INK, INK2 = "#0b0b0b", "#52514e"
EXT, FLX = "#2a78d6", "#eb6834"
BONE, HAND, CUP = "#d9d4c7", "#e8e2d4", "#9a9993"


def rot(p, a):
    c, s = math.cos(a), math.sin(a)
    return (c * p[0] - s * p[1], s * p[0] + c * p[1])


def main():
    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_xlim(-3.25, 1.75)
    ax.set_ylim(-1.75, 1.15)

    # forearm (fixed, horizontal, palm down)
    ax.add_patch(FancyBboxPatch((-2.9, -0.17), 2.8, 0.34, boxstyle="round,pad=0,rounding_size=0.12",
                                fc=BONE, ec=INK2, lw=1))
    ax.text(-1.5, 0.0, "forearm (welded, pronated)", ha="center", va="center", fontsize=8, color=INK)
    # ground hatch at the elbow end
    ax.plot([-3.0, -3.0], [-0.45, 0.45], color=INK2, lw=1.2)
    for y in [-0.4, -0.2, 0.0, 0.2, 0.4]:
        ax.plot([-3.0, -3.12], [y, y - 0.1], color=INK2, lw=0.8)

    # hand rotated 30 deg into flexion (tip down); local frame: x distal
    q = math.radians(-30)
    hand = [(0.08, -0.13), (1.15, -0.11), (1.15, 0.11), (0.08, 0.13)]
    ax.add_patch(Polygon([rot(p, q) for p in hand], closed=True, fc=HAND, ec=INK2, lw=1))
    # cup: palmar (below) the hand
    tx, ty = rot((0.72, -0.12), q)  # grasp point on the palmar surface
    ax.add_patch(FancyBboxPatch((tx - 0.17, ty - 0.46), 0.34, 0.46, boxstyle="round,pad=0,rounding_size=0.05",
                                fc=CUP, ec=INK2, lw=1, zorder=1))
    ax.text(tx - 0.24, ty - 0.25, "cup\n0.3 kg", fontsize=7.5, color=INK, va="center", ha="right")

    # wrist joint
    ax.add_patch(Circle((0, 0), 0.07, fc="white", ec=INK, lw=1.2, zorder=5))
    # wrap cylinders and muscle paths
    ax.add_patch(Circle((0, 0), 0.118 * 1.6, fill=False, ec=EXT, lw=0.8, ls=(0, (2, 2))))
    ax.add_patch(Circle((0, 0), 0.185 * 1.6, fill=False, ec=FLX, lw=0.8, ls=(0, (2, 2))))
    r_e, r_f = 0.118 * 1.6, 0.185 * 1.6
    ins_e = rot((0.35, r_e), q)
    ins_f = rot((0.35, -r_f), q)
    ax.plot([-2.6, 0.0], [r_e, r_e], color=EXT, lw=2.2)
    ax.add_patch(Arc((0, 0), 2 * r_e, 2 * r_e, theta1=math.degrees(q) + 90, theta2=90, color=EXT, lw=2.2))
    ax.plot([rot((0, r_e), q)[0], ins_e[0]], [rot((0, r_e), q)[1], ins_e[1]], color=EXT, lw=2.2)
    ax.plot([-2.6, ins_f[0]], [-r_f, ins_f[1]], color=FLX, lw=2.2)
    ax.text(-2.55, r_e + 0.09, "EXT_lumped  782 N, r = 11.8 mm", fontsize=7.5, color=INK)
    ax.text(-2.55, -r_f - 0.2, "FLX_lumped  888 N, r = 18.5 mm", fontsize=7.5, color=INK)

    # angle convention
    ax.plot([0, 1.35], [0, 0], color=INK2, lw=0.8, ls=(0, (4, 3)))
    ax.add_patch(Arc((0, 0), 2.3, 2.3, theta1=-30, theta2=0, color=INK, lw=1))
    ax.text(1.2, -0.42, "+30°\nflexion\n(start)", fontsize=7.5, color=INK, va="top")
    ax.annotate("", xy=rot((1.25, 0), math.radians(15)), xytext=(1.25, 0),
                arrowprops=dict(arrowstyle="-|>", color=INK, lw=1, connectionstyle="arc3,rad=0.25"))
    ax.text(1.25, 0.42, "target −15°\n(extension)", fontsize=7.5, color=INK)

    # gravity
    ax.add_patch(FancyArrowPatch((-1.5, -0.7), (-1.5, -1.35), arrowstyle="-|>", mutation_scale=12,
                                 color=INK, lw=1.4))
    ax.text(-1.42, -1.05, "gravity flexes the wrist\n(0.36–0.50 Nm with cup)", fontsize=7.5, color=INK, va="center")
    ax.annotate("wrist pin joint", xy=(0, 0.07), xytext=(-0.25, 0.75), fontsize=7.5, color=INK, ha="center",
                arrowprops=dict(arrowstyle="-", color=INK2, lw=0.7))

    OUT.parent.mkdir(exist_ok=True)
    fig.savefig(OUT, dpi=300, bbox_inches="tight", facecolor="white")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
