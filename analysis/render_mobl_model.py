"""Figure of the MoBL-ARMS model: (a) full model with all muscles, (b) wrist close-up used in the task.

Usage (wrist-opensim env):  python analysis/render_mobl_model.py  ->  results/mobl_arms_model.png
"""
import math
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import opensim as osim  # noqa: E402
from matplotlib.collections import PolyCollection  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "analysis"))
sys.path.insert(0, str(ROOT / "route_a_moco"))
from render_baseline_video import camera, load_meshes, transform  # noqa: E402
from common import load_config, model_path  # noqa: E402

OUT = ROOT / "results" / "mobl_arms_model.png"
INK, INK2 = "#0b0b0b", "#52514e"
MUSCLE = "#c0392b"
EXT, FLX = "#2a78d6", "#eb6834"


def draw(ax, model, state, Rcam, muscle_style, xlim=None, ylim=None):
    light = np.array([0.35, 0.55, 0.76])
    light /= np.linalg.norm(light)
    polys, cols, depth = [], [], []
    for frame, pts, tris, colour in load_meshes(model):
        R, p = transform(frame, state)
        v = (Rcam @ (pts @ R.T + p).T).T
        tri = v[tris]
        n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
        nn = np.linalg.norm(n, axis=1)
        keep = (nn > 1e-12) & (n[:, 2] > 0)
        tri, n = tri[keep], n[keep] / nn[keep, None]
        shade = 0.45 + 0.55 * np.clip(n @ light, 0, 1)
        polys.append(tri[:, :, :2])
        cols.append(np.clip(colour[None, :] * shade[:, None], 0, 1))
        depth.append(tri[:, :, 2].mean(axis=1))
    polys, cols, depth = np.concatenate(polys), np.concatenate(cols), np.concatenate(depth)
    order = np.argsort(depth)
    ax.add_collection(PolyCollection(polys[order], facecolors=cols[order], edgecolors="none"))
    ends = {}
    for k in range(model.getMuscles().getSize()):
        m = model.getMuscles().get(k)
        path = osim.GeometryPath.safeDownCast(m.getPath()).getCurrentPath(state)
        pts = np.array([[path.get(i).getLocationInGround(state).get(j) for j in range(3)] for i in range(path.getSize())])
        pc = (Rcam @ pts.T).T
        colour, lw, alpha = muscle_style(m.getName())
        ax.plot(pc[:, 0], pc[:, 1], color=colour, lw=lw, alpha=alpha, solid_capstyle="round", zorder=5)
        ends[m.getName()] = pc
    ax.set_aspect("equal")
    ax.axis("off")
    if xlim:
        ax.set_xlim(*xlim)
    if ylim:
        ax.set_ylim(*ylim)
    else:
        ax.autoscale_view()
    return ends


def main():
    cfg = load_config()
    ext, flx = set(cfg["names"]["wrist_extensors"]), set(cfg["names"]["wrist_flexors"] + cfg["names"].get("other_wrist_muscles", []))

    # (a) full model in the task posture, all 50 muscles
    full = osim.Model(str(model_path(cfg)))
    s = full.initSystem()
    cs = full.getCoordinateSet()
    for name, deg in cfg["posture"]["locked_deg"].items():
        cs.get(name).setValue(s, math.radians(deg), False)
    full.assemble(s)
    full.realizePosition(s)

    # (b) processed model with the cup, six wrist muscles, wrist at +30 deg (dropped)
    proc = osim.Model(str(ROOT / "results" / "baseline_processed.osim"))
    s2 = proc.initSystem()
    proc.getCoordinateSet().get("flexion").setValue(s2, math.radians(30), False)
    proc.getCoordinateSet().get("wrist_hand_r3").setValue(s2, math.radians(15), False)
    proc.realizePosition(s2)

    fig = plt.figure(figsize=(10, 5.6), dpi=300, facecolor="white")
    ax1 = fig.add_axes([0.0, 0.02, 0.44, 0.9])
    ax2 = fig.add_axes([0.46, 0.02, 0.54, 0.9])

    def style_full(name):
        if name in ext:
            return EXT, 1.8, 0.95
        if name in flx:
            return FLX, 1.8, 0.95
        return MUSCLE, 0.7, 0.55

    draw(ax1, full, s, camera(yaw_deg=35, pitch_deg=-10), style_full)
    ax1.set_title("(a) MoBL-ARMS: 15 DOF arm, 50 muscle compartments", fontsize=10, loc="left", color=INK)

    def style_wrist(name):
        return (EXT if name in ext else FLX), 2.4, 0.95

    R2 = camera(yaw_deg=10, pitch_deg=-15)
    hand = proc.getBodySet().get("hand").getPositionInGround(s2)
    hc = R2 @ np.array([hand.get(i) for i in range(3)])
    xl, yl = (hc[0] - 0.33, hc[0] + 0.17), (hc[1] - 0.19, hc[1] + 0.12)
    ends = draw(ax2, proc, s2, R2, style_wrist, xlim=xl, ylim=yl)
    # labels stacked above (extensors) and below (flexors) the forearm, with leader lines
    order_e = [m for m in cfg["names"]["wrist_extensors"] if m in ends]
    order_f = [m for m in cfg["names"]["wrist_flexors"] + cfg["names"].get("other_wrist_muscles", []) if m in ends]
    for group, sign, colour in ((order_e, 1, EXT), (order_f, -1, FLX)):
        for k, name in enumerate(group):
            pc = ends[name]
            seg = np.cumsum(np.r_[0, np.linalg.norm(np.diff(pc[:, :2], axis=0), axis=1)])
            t = 0.55 * seg[-1]
            x, y = np.interp(t, seg, pc[:, 0]), np.interp(t, seg, pc[:, 1])
            lx = hc[0] - 0.22 + k * 0.055
            ly = hc[1] + sign * (0.075 + 0.0)
            ax2.annotate(name, (x, y), xytext=(lx, ly), textcoords="data", fontsize=7.5, weight="bold",
                         color=colour, ha="center", va="center",
                         bbox=dict(facecolor="white", edgecolor="none", pad=1.2, alpha=0.9),
                         arrowprops=dict(arrowstyle="-", color=colour, lw=0.7))
    ax2.set_title("(b) Task model: wrist free, 0.3 kg cup, 6 wrist muscles", fontsize=10, loc="left", color=INK)
    ax2.plot([], [], color=EXT, lw=3, label="extensors ECRL, ECRB, ECU")
    ax2.plot([], [], color=FLX, lw=3, label="flexors FCR, FCU, PL")
    ax2.plot([], [], color=MUSCLE, lw=1.5, alpha=0.6, label="other muscles (panel a)")
    ax2.legend(loc="lower left", frameon=False, fontsize=8)

    fig.savefig(OUT, dpi=300, bbox_inches="tight", facecolor="white")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
