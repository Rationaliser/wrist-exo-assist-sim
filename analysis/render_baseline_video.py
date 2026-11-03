"""Render the MoBL-ARMS baseline solution as a video (bones, cup, muscle paths + traces).

Replays results/baseline_solution.sto on results/baseline_processed.osim, draws the bone meshes
from models/Geometry with a simple painter's algorithm, and colours the wrist muscles by activation.

Usage (wrist-opensim env):
    python analysis/render_baseline_video.py [--slow 3] [--fps 30] [--out results/baseline_simulation.mp4]
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import opensim as osim  # noqa: E402
from matplotlib.collections import PolyCollection  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "route_a_moco"))
from common import load_config  # noqa: E402
from plot_results import read_sto  # noqa: E402

GEOM = ROOT / "models" / "Geometry"
INK, INK2, GRID = "#0b0b0b", "#52514e", "#e4e3df"
EXT, FLX = "#2a78d6", "#eb6834"
BONE = np.array([0.91, 0.88, 0.82])
CUP = np.array([0.60, 0.60, 0.58])
W, H, DPI = 1280, 720, 100


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        cand = Path.home() / "miniforge3/envs/wrist-myosuite/lib/python3.12/site-packages/imageio_ffmpeg/binaries"
        exes = sorted(cand.glob("ffmpeg-*"))
        if exes:
            return str(exes[-1])
        return "ffmpeg"


def read_vtp(path):
    """Minimal ASCII VTK PolyData reader: points (N,3) and triangles (M,3)."""
    txt = path.read_text()

    def array(name_or_section):
        m = re.search(name_or_section + r'.*?<DataArray[^>]*>(.*?)</DataArray>', txt, re.S)
        return np.array(m.group(1).split(), dtype=float)

    pts = array(r"<Points>").reshape(-1, 3)
    polys = re.search(r"<Polys>(.*?)</Polys>", txt, re.S).group(1)
    conn = np.array(re.search(r'Name="connectivity"[^>]*>(.*?)</DataArray>', polys, re.S).group(1).split(), dtype=int)
    offs = np.array(re.search(r'Name="offsets"[^>]*>(.*?)</DataArray>', polys, re.S).group(1).split(), dtype=int)
    tris, start = [], 0
    for end in offs:  # fan-triangulate each polygon
        poly = conn[start:end]
        for k in range(1, len(poly) - 1):
            tris.append((poly[0], poly[k], poly[k + 1]))
        start = end
    return pts, np.array(tris, dtype=int)


def cylinder(radius, half_height, n=24):
    ang = np.linspace(0, 2 * np.pi, n, endpoint=False)
    ring = np.c_[radius * np.cos(ang), np.zeros(n), radius * np.sin(ang)]
    pts = np.vstack([ring + [0, -half_height, 0], ring + [0, half_height, 0], [[0, -half_height, 0], [0, half_height, 0]]])
    tris = []
    for k in range(n):
        a, b = k, (k + 1) % n
        tris += [(a, b, n + b), (a, n + b, n + a), (2 * n, b, a), (2 * n + 1, n + a, n + b)]
    return pts, np.array(tris)


def load_meshes(model):
    """[(frame, points, triangles, colour)] for every attached geometry."""
    out = []
    frames = [model.getGround()] + [model.getBodySet().get(i) for i in range(model.getBodySet().getSize())]
    for f in frames:
        for k in range(f.getPropertyByName("attached_geometry").size()):
            g = f.get_attached_geometry(k)
            mesh = osim.Mesh.safeDownCast(g)
            if mesh is not None:
                p = GEOM / mesh.get_mesh_file()
                if not p.exists():
                    continue
                pts, tris = read_vtp(p)
                s = g.get_scale_factors()
                pts = pts * [s.get(0), s.get(1), s.get(2)]
                out.append((f, pts, tris, BONE))
            elif g.getConcreteClassName() == "Cylinder":
                cyl = osim.Cylinder.safeDownCast(g)
                pts, tris = cylinder(cyl.get_radius(), cyl.get_half_height())
                out.append((f, pts, tris, CUP))
    return out


def camera(yaw_deg, pitch_deg):
    """Rotation from ground to camera: x right, y up, z towards the viewer."""
    y, p = np.radians(yaw_deg), np.radians(pitch_deg)
    ry = np.array([[np.cos(y), 0, np.sin(y)], [0, 1, 0], [-np.sin(y), 0, np.cos(y)]])
    rx = np.array([[1, 0, 0], [0, np.cos(p), -np.sin(p)], [0, np.sin(p), np.cos(p)]])
    return rx @ ry


def transform(frame, state):
    X = frame.getTransformInGround(state)
    R = np.array([[X.R().get(i, j) for j in range(3)] for i in range(3)])
    p = np.array([X.p().get(i) for i in range(3)])
    return R, p


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--slow", type=float, default=5.0, help="slow-motion factor")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--hold-start", type=float, default=0.5, help="seconds to show the first frame")
    ap.add_argument("--hold-end", type=float, default=1.5, help="seconds to freeze on the last frame")
    ap.add_argument("--out", default=str(ROOT / "results" / "baseline_simulation.mp4"))
    ap.add_argument("--yaw", type=float, default=10.0, help="camera yaw about vertical (deg)")
    ap.add_argument("--pitch", type=float, default=-15.0, help="camera pitch (deg)")
    ap.add_argument("--span", type=float, default=0.52, help="width of the view (m)")
    ap.add_argument("--shift", type=float, nargs=2, default=[-0.07, 0.0], help="view centre offset from the hand (m)")
    args = ap.parse_args()

    cfg = load_config()
    model = osim.Model(str(ROOT / "results" / "baseline_processed.osim"))
    state = model.initSystem()
    df = read_sto(ROOT / "results" / "baseline_solution.sto")
    t_sol = df["time"].to_numpy()
    cs = model.getCoordinateSet()
    coord_cols = {cs.get(i).getName(): f"{cs.get(i).getAbsolutePathString()}/value" for i in range(cs.getSize())}
    coord_cols = {k: v for k, v in coord_cols.items() if v in df.columns}
    qname = cfg["names"]["wrist_flexion"]
    muscles = [m for m in cfg["names"]["wrist_extensors"] + cfg["names"]["wrist_flexors"]
               + cfg["names"].get("other_wrist_muscles", []) if model.getMuscles().getIndex(m) >= 0]
    ext = set(cfg["names"]["wrist_extensors"])
    act = {m: df[f"/forceset/{m}/activation"].to_numpy() for m in muscles}
    q_deg = np.degrees(df[coord_cols[qname]].to_numpy())

    meshes = load_meshes(model)
    Rcam = camera(yaw_deg=args.yaw, pitch_deg=args.pitch)
    light = np.array([0.35, 0.55, 0.76])
    light /= np.linalg.norm(light)

    n_move = int(round(t_sol[-1] * args.slow * args.fps)) + 1
    times = np.r_[np.full(int(args.hold_start * args.fps), t_sol[0]), np.linspace(t_sol[0], t_sol[-1], n_move),
                  np.full(int(args.hold_end * args.fps), t_sol[-1])]

    # view window around the forearm and hand (in camera coordinates), from the start pose
    def set_time(t):
        for name, col in coord_cols.items():
            cs.get(name).setValue(state, float(np.interp(t, t_sol, df[col].to_numpy())), False)
        model.realizePosition(state)

    set_time(t_sol[0])
    hand_c = Rcam @ np.array([model.getBodySet().get(cfg["names"]["hand_body"]).getPositionInGround(state).get(i) for i in range(3)])
    cx, cy, span = hand_c[0] + args.shift[0], hand_c[1] + args.shift[1], args.span

    proc = subprocess.Popen([ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba",
                             "-s", f"{W}x{H}", "-r", str(args.fps), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                             "-crf", "18", "-movflags", "+faststart", args.out], stdin=subprocess.PIPE)

    fig = plt.figure(figsize=(W / DPI, H / DPI), dpi=DPI, facecolor="white")
    ax3 = fig.add_axes([0.0, 0.0, 0.58, 0.9])
    axq = fig.add_axes([0.66, 0.56, 0.31, 0.3])
    axa = fig.add_axes([0.66, 0.1, 0.31, 0.3])
    fig.text(0.02, 0.95, "MoBL-ARMS: lifting and holding a 0.3 kg cup (wrist muscles only, no assistance)",
             fontsize=14, color=INK, weight="bold")
    stamp = fig.text(0.02, 0.91, "", fontsize=11, color=INK2)

    for k, t in enumerate(times):
        set_time(t)
        polys, cols, depth = [], [], []
        for frame, pts, tris, colour in meshes:
            R, p = transform(frame, state)
            v = (Rcam @ (pts @ R.T + p).T).T
            tri = v[tris]
            n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
            nn = np.linalg.norm(n, axis=1)
            keep = (nn > 1e-12) & (n[:, 2] > 0)  # back-face culling
            tri, n = tri[keep], n[keep] / nn[keep, None]
            shade = 0.45 + 0.55 * np.clip(n @ light, 0, 1)
            polys.append(tri[:, :, :2])
            cols.append(np.clip(colour[None, :] * shade[:, None], 0, 1))
            depth.append(tri[:, :, 2].mean(axis=1))
        polys, cols, depth = np.concatenate(polys), np.concatenate(cols), np.concatenate(depth)
        order = np.argsort(depth)

        ax3.cla()
        ax3.add_collection(PolyCollection(polys[order], facecolors=cols[order], edgecolors="none"))
        for m in muscles:
            path = osim.GeometryPath.safeDownCast(model.getMuscles().get(m).getPath()).getCurrentPath(state)
            pts = np.array([[path.get(i).getLocationInGround(state).get(j) for j in range(3)] for i in range(path.getSize())])
            pc = (Rcam @ pts.T).T
            a = float(np.interp(t, t_sol, act[m]))
            w = 1.0 + 5.0 * min(a / 0.12, 1.0)
            ax3.plot(pc[:, 0], pc[:, 1], color=EXT if m in ext else FLX, lw=w, alpha=0.35 + 0.65 * min(a / 0.12, 1.0),
                     solid_capstyle="round", zorder=5)
        ax3.set_xlim(cx - span / 2, cx + span / 2)
        ax3.set_ylim(cy - span * 0.45, cy + span * 0.45)
        ax3.set_aspect("equal")
        ax3.axis("off")
        ax3.plot([], [], color=EXT, lw=4, label="extensors (ECRL, ECRB, ECU)")
        ax3.plot([], [], color=FLX, lw=4, label="flexors (FCR, FCU, PL)")
        ax3.legend(loc="lower left", frameon=False, fontsize=10, title="line width = activation", title_fontsize=9)

        axq.cla()
        axq.plot(t_sol, q_deg, color=GRID, lw=2)
        upto = t_sol <= t
        axq.plot(t_sol[upto], q_deg[upto], color=EXT, lw=2.2)
        axq.plot([t], [np.interp(t, t_sol, q_deg)], "o", color=EXT, ms=7)
        axq.axhline(cfg["task"]["end_deg"], color=INK2, lw=0.8, ls=(0, (4, 3)))
        axq.set_xlim(0, t_sol[-1])
        axq.set_ylabel("Wrist angle (deg)\n+ flexion / − extension", fontsize=10)
        axq.set_xlabel("Simulated time (s)", fontsize=10)
        axq.set_title("Wrist angle", loc="left", fontsize=12)
        axq.grid(color=GRID, lw=0.6)
        for sp in ("top", "right"):
            axq.spines[sp].set_visible(False)

        axa.cla()
        vals = [float(np.interp(t, t_sol, act[m])) for m in muscles]
        axa.bar(range(len(muscles)), vals, color=[EXT if m in ext else FLX for m in muscles], width=0.65)
        axa.set_xticks(range(len(muscles)), muscles, fontsize=10)
        axa.set_ylim(0, 0.15)
        axa.set_ylabel("Activation (0–1)", fontsize=10)
        axa.set_title("Muscle activation", loc="left", fontsize=12)
        axa.grid(axis="y", color=GRID, lw=0.6)
        axa.set_axisbelow(True)
        for sp in ("top", "right"):
            axa.spines[sp].set_visible(False)

        stamp.set_text(f"t = {t:.2f} s   ·   played {args.slow:g}× slower than real time   ·   "
                       f"reserve torque 0.02 % of gravity torque")
        fig.canvas.draw()
        proc.stdin.write(np.asarray(fig.canvas.buffer_rgba()).tobytes())
        if k % 15 == 0:
            print(f"frame {k + 1}/{len(times)}", flush=True)

    proc.stdin.close()
    proc.wait()
    plt.close(fig)
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
