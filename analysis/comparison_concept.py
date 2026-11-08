"""Concept figure: why optimal control and reinforcement learning are compared.

Usage:  python analysis/comparison_concept.py   ->  results/comparison_concept.png
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "results" / "comparison_concept.png"
INK, INK2 = "#0b0b0b", "#52514e"
OC, OC_FILL = "#2a78d6", "#e8f1fb"
RL, RL_FILL = "#1baf7a", "#e6f6ef"
CMP, CMP_FILL = "#eb6834", "#fdeee7"


def box(ax, x, y, w, h, edge, fill, title, lines):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.12",
                                lw=1.4, ec=edge, fc=fill))
    ax.text(x + 0.15, y + h - 0.2, title, fontsize=10.5, weight="bold", color=INK, va="top")
    ax.text(x + 0.15, y + h - 0.62, "\n".join(lines), fontsize=8.6, color=INK2, va="top", linespacing=1.45)


def arrow(ax, a, b):
    ax.add_patch(FancyArrowPatch(a, b, arrowstyle="-|>", mutation_scale=12, lw=1.2, color=INK2))


def main():
    fig, ax = plt.subplots(figsize=(9.6, 6.0))
    ax.set_xlim(0, 12)
    ax.set_ylim(0.45, 6.85)
    ax.axis("off")

    box(ax, 0.2, 4.35, 5.3, 2.4, OC, OC_FILL, "Optimal control (OpenSim Moco)",
        ["Question: what is the best the arm can do?",
         "Input: musculoskeletal model, task, cost (effort)",
         "Output: one optimal motion + muscle activations",
         "Gives: strength threshold (K1), minimum",
         "assist torque (K2), effort saved (K3)",
         "Limit: open-loop plan for one known condition"])
    box(ax, 6.5, 4.35, 5.3, 2.4, RL, RL_FILL, "Reinforcement learning (MyoSuite)",
        ["Question: can a controller do it in real time?",
         "Input: simulated arm, reward, many trials",
         "Output: feedback policy (state → muscle/device",
         "commands), evaluated in milliseconds",
         "Gives: reactions to disturbances",
         "Limit: no optimality guarantee, reward tuning"])
    box(ax, 2.2, 0.55, 7.6, 1.85, CMP, CMP_FILL, "Comparison under the same task and perturbations",
        ["Benchmark: Moco optimum = best case; RL is measured against it",
         "Price of robustness: extra effort/torque the feedback policy needs",
         "Robustness: success with heavier cup, pushes, fatigue (K4)",
         "Design advice: passive spring (fixed law) vs motor (needs a controller)"])
    arrow(ax, (3.0, 4.3), (4.4, 2.45))
    arrow(ax, (9.0, 4.3), (7.6, 2.45))
    arrow(ax, (5.55, 5.3), (6.45, 5.3))
    ax.text(6.0, 5.42, "reference\nmotion", fontsize=7.8, color=INK2, ha="center", va="bottom", style="italic")

    OUT.parent.mkdir(exist_ok=True)
    fig.savefig(OUT, dpi=300, bbox_inches="tight", facecolor="white")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
