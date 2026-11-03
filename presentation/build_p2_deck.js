// P2 presentation deck (Team 7, MDM2 case study), styled after the P1 concept presentation.
// Usage:  NODE_PATH=<dir with pptxgenjs> node presentation/build_p2_deck.js
// Output: documents/Team7_P2_Presentation.pptx  (figures are read from results/)
const path = require("path");
const pptxgen = require("pptxgenjs");

const ROOT = path.resolve(__dirname, "..");
const RES = (f) => path.join(ROOT, "results", f);
const LOGO = path.join(__dirname, "assets", "thd_logo.png");
const OUT = path.join(ROOT, "documents", "Team7_P2_Presentation.pptx");
const APPLY_THEME = process.env.APPLY_THEME_JS;
const DATE = "11/4/2026";
const FOOTER = "Case Study Wrist Exoskeleton Assistance";

const THEME = {
  name: "Team7 THD",
  headFontFace: "Times New Roman",
  bodyFontFace: "Times New Roman",
  colors: {
    dk1: "000000", lt1: "FFFFFF", dk2: "595959", lt2: "E6E6E6",
    accent1: "1F2A44", // THD navy (dominant accent)
    accent2: "2A78D6", // extensor / motor blue (matches the figures)
    accent3: "EB6834", // flexor / spring orange (matches the figures)
    accent4: "1BAF7A", // done
    accent5: "C8C8C8", // table rows (P1 style)
    accent6: "9A9993",
    hlink: "2A78D6", folHlink: "6250D6",
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in, same as the P1 deck
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "P2: Literature Map, Method Outline and Baseline Simulation";
pres.author = "Team 7 (V. Joshi, N. Nagendra, H. Safi)";
const C = pres.SchemeColor;

// ---------------------------------------------------------------- layouts
const footerObjects = [
  { text: { text: DATE, options: { x: 0.9, y: 7.0, w: 2.0, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.text2, margin: 0 } } },
  { text: { text: FOOTER, options: { x: 4.17, y: 7.0, w: 5.0, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.text2, align: "center", margin: 0 } } },
];
const slideNumber = { x: 12.0, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.text2, align: "right" };

pres.defineSlideMaster({
  title: "TITLE",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.45, w: 12.13, h: 1.55, fontSize: 36, bold: true, color: C.text1, align: "center", valign: "middle" }, text: "" } },
    { image: { x: 5.47, y: 2.3, w: 2.4, h: 0.866, path: LOGO } },
    { placeholder: { options: { name: "subtitle", type: "body", x: 2.67, y: 3.45, w: 8.0, h: 1.0, fontSize: 26, bold: true, color: C.text1, align: "center", valign: "middle" }, text: "" } },
    ...footerObjects,
  ],
  slideNumber,
});

pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  objects: [
    { image: { x: 10.73, y: 0.3, w: 2.2, h: 0.794, path: LOGO } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.3, w: 9.9, h: 0.95, fontSize: 36, bold: true, color: C.text1, align: "left", valign: "middle", margin: 0 }, text: "" } },
    ...footerObjects,
  ],
  slideNumber,
});

pres.defineSlideMaster({
  title: "END",
  background: { color: C.background1 },
  objects: [...footerObjects],
  slideNumber,
});

// ---------------------------------------------------------------- helpers
let objId = 0;
const oid = (s) => `${s}_${++objId}`;

function text(slide, t, opts) {
  slide.addText(t, { isTextBox: true, objectName: oid("text"), color: C.text1, fontSize: 14, valign: "top", ...opts });
}

function card(slide, x, y, w, h, fill = C.background2) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08, objectName: oid("card") });
}

function badge(slide, x, y, label, d = 0.5) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: C.accent1 }, line: { color: C.accent1 }, objectName: oid("badge") });
  slide.addText(String(label), { x, y, w: d, h: d, isTextBox: true, objectName: oid("badgeText"), fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0 });
}

function chip(slide, x, y, w, label, fill) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.36, fill: { color: fill }, line: { color: fill }, rectRadius: 0.18, objectName: oid("chip") });
  slide.addText(label, { x, y, w, h: 0.36, isTextBox: true, objectName: oid("chipText"), fontSize: 12, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0 });
}

function stat(slide, x, y, w, big, label, bigColor = C.accent1, h = 1.3) {
  card(slide, x, y, w, h);
  text(slide, big, { x: x + 0.2, y: y + 0.08, w: w - 0.4, h: 0.62, fontSize: 30, bold: true, color: bigColor, valign: "middle", margin: 0 });
  text(slide, label, { x: x + 0.2, y: y + 0.68, w: w - 0.4, h: h - 0.74, fontSize: 13, color: C.text2, margin: 0 });
}

function bullets(items, size = 14) {
  return items.map((it, i) => ({
    text: typeof it === "string" ? it : it.text,
    options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 6, fontSize: size, ...(typeof it === "string" ? {} : it.options) },
  }));
}

function table(slide, header, rows, colW, opts = {}) {
  const fs = opts.fontSize || 14;
  const head = header.map((h) => ({ text: h, options: { bold: true, color: C.background1, fill: { color: C.text1 }, fontSize: fs + 2 } }));
  const body = rows.map((r, i) => r.map((c) => ({ text: c, options: { fill: { color: i % 2 ? C.background2 : C.accent5 }, fontSize: fs, color: C.text1 } })));
  slide.addTable([head, ...body], {
    x: opts.x || 0.6, y: opts.y || 1.5, w: colW.reduce((a, b) => a + b, 0), colW,
    border: { type: "solid", pt: 1.5, color: "FFFFFF" }, valign: "middle", margin: 0.08,
    rowH: opts.rowH, objectName: oid("table"),
  });
}

function img(slide, file, x, y, w, aspect, alt) {
  slide.addImage({ path: RES(file), x, y, w, h: w / aspect, altText: alt, objectName: oid("figure") });
}

const content = (section, title) => {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  return s;
};

// ---------------------------------------------------------------- 1 title
pres.addSection({ title: "Introduction" });
{
  const s = pres.addSlide({ masterName: "TITLE", sectionTitle: "Introduction" });
  s.addText("Simulation-Based Wrist Exoskeleton Assistance after Stroke: Optimal Control vs. Reinforcement Learning", { placeholder: "title" });
  s.addText("P2: Literature Map, Method Outline and Baseline Simulation", { placeholder: "subtitle" });
  text(s, [
    { text: "Team Members:", options: { bold: true, fontSize: 22, breakLine: true } },
    { text: "Vedant Joshi", options: { bold: true, fontSize: 18, breakLine: true } },
    { text: "Navya Nagendra", options: { bold: true, fontSize: 18, breakLine: true } },
    { text: "Harshil Safi", options: { bold: true, fontSize: 18 } },
  ], { x: 0.9, y: 4.75, w: 4.0, h: 1.9, paraSpaceAfter: 6 });
  text(s, [
    { text: "Guided by:", options: { bold: true, fontSize: 18, breakLine: true } },
    { text: "Prof. Hamidreza Heidari", options: { fontSize: 18 } },
  ], { x: 8.9, y: 5.55, w: 3.8, h: 0.9, valign: "bottom" });
  s.addNotes("P2 milestone presentation. Today: literature map, method outline, the first working baseline simulation, and early results for K1-K3. The baseline runs on the MoBL-ARMS upper-limb model. The K1-K3 results come from a simpler planar two-muscle model, and we say so on those slides.");
}

// ---------------------------------------------------------------- 2 at a glance
{
  const s = content("Introduction", "P2 at a Glance:");
  const rows = [
    ["Literature map", "20 sources in 4 clusters: clinical problem, wrist devices, musculoskeletal optimal control, learning-based control", "Done", C.accent4],
    ["Method outline", "Two-route pipeline (Moco plan and MyoSuite RL), KPIs K1–K4 made measurable", "Done", C.accent4],
    ["Baseline simulation", "MoBL-ARMS cup lift-and-hold converges; the six wrist muscles do all the work", "Done", C.accent4],
    ["Bibliography", "All references checked online; list on the last slides", "Done", C.accent4],
  ];
  rows.forEach(([h, d, st, col], i) => {
    const y = 1.55 + i * 1.32;
    card(s, 0.6, y, 7.7, 1.12);
    badge(s, 0.8, y + 0.31, i + 1);
    text(s, h, { x: 1.5, y: y + 0.12, w: 4.4, h: 0.4, fontSize: 18, bold: true, margin: 0 });
    text(s, d, { x: 1.5, y: y + 0.5, w: 6.6, h: 0.58, fontSize: 13, color: C.text2, margin: 0 });
    chip(s, 6.25, y + 0.12, 1.85, st, col);
  });
  stat(s, 8.75, 1.55, 3.98, "0.02 %", "peak reserve torque vs. gravity torque in the baseline (limit 10 %)");
  stat(s, 8.75, 2.95, 3.98, "≈ 10 %", "ECRB / ECRL activation that holds the 0.3 kg cup (MoBL-ARMS)");
  stat(s, 8.75, 4.35, 3.98, "≈ 10.7 %", "extensor strength below which the task fails (K1, planar model)", C.accent3);
  text(s, "Baseline: MoBL-ARMS. K1: planar two-muscle model.", { x: 8.75, y: 5.8, w: 3.98, h: 0.6, fontSize: 12, italic: true, color: C.text2, margin: 0 });
  s.addNotes("Four P2 deliverables, all done. The baseline runs on MoBL-ARMS: reserve torque is 0.02 % of the gravity torque, so the muscles do all the work, and about 10 % activation of ECRB and ECRL holds the cup. The K1 threshold of about 10.7 % comes from the planar two-muscle model; the full sweep on MoBL-ARMS is P3 work because each MoBL-ARMS solve takes about 45 minutes.");
}

// ---------------------------------------------------------------- 3 literature map
pres.addSection({ title: "Literature" });
{
  const s = content("Literature", "Literature Map:");
  const cx = 4.68, cy = 2.85, cw = 3.97, ch = 1.85;
  const clusters = [
    { x: 0.6, y: 1.45, title: "Clinical problem (why)", refs: ["Nijland 2010: early finger extension predicts arm recovery after stroke", "Wrist drop: weak extensors, hand falls under gravity"], ax: 4.3, ay: 2.6, bx: cx, by: cy + 0.35 },
    { x: 9.03, y: 1.45, title: "Wrist assist devices (what exists)", refs: ["Hussain 2020: review of wrist rehabilitation robots", "Lambelet 2017, 2020: eWrist, 1-DoF wrist exo, < 500 g", "KhalilianMotamed Bonab 2024: exosuit designed in OpenSim"], ax: 9.03, ay: 2.6, bx: cx + cw, by: cy + 0.35 },
    { x: 0.6, y: 4.1, title: "Optimal control (Route A)", refs: ["Delp 2007, Seth 2018: OpenSim", "Dembia 2020: OpenSim Moco", "Holzbaur 2005, Saul 2015, McFarland 2019: MoBL-ARMS", "De Groote 2016: muscle model"], ax: 4.3, ay: 4.9, bx: cx, by: cy + ch - 0.35 },
    { x: 9.03, y: 4.1, title: "Learning-based control (Route B)", refs: ["Todorov 2012: MuJoCo", "Caggiano 2022, Wang 2022: MyoSuite, MyoSim", "Schulman 2017: PPO", "Luo 2024, Chavarrías 2025: RL exo control"], ax: 9.03, ay: 4.9, bx: cx + cw, by: cy + ch - 0.35 },
  ];
  clusters.forEach((c) => {
    s.addShape(pres.shapes.LINE, { x: Math.min(c.ax, c.bx), y: Math.min(c.ay, c.by), w: Math.abs(c.bx - c.ax), h: Math.abs(c.by - c.ay), flipV: (c.bx - c.ax) * (c.by - c.ay) < 0, line: { color: C.accent6, width: 1.5 }, objectName: oid("link") });
    card(s, c.x, c.y, 3.7, 2.15);
    text(s, c.title, { x: c.x + 0.18, y: c.y + 0.12, w: 3.35, h: 0.4, fontSize: 16, bold: true, color: C.accent1, margin: 0 });
    text(s, bullets(c.refs, 12), { x: c.x + 0.18, y: c.y + 0.55, w: 3.4, h: 1.7, margin: 0 });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: cy, w: cw, h: ch, fill: { color: C.accent1 }, line: { color: C.accent1 }, rectRadius: 0.1, objectName: oid("core") });
  text(s, [
    { text: "Our study", options: { bold: true, fontSize: 18, breakLine: true } },
    { text: "Size wrist assistance for a weakened wrist (spring or motor?) and compare a Moco plan with an RL policy", options: { fontSize: 13 } },
  ], { x: cx + 0.2, y: cy + 0.15, w: cw - 0.4, h: ch - 0.3, color: C.background1, align: "center", valign: "middle", margin: 0 });
  text(s, [
    { text: "Gap: ", options: { bold: true } },
    { text: "no study we found sizes wrist assistance for a weakened post-stroke wrist, or compares an optimal plan with a learned controller." },
  ], { x: 0.6, y: 6.45, w: 12.13, h: 0.4, fontSize: 14, margin: 0 });
  s.addNotes("Four clusters of literature feed the project. Clinical: wrist/finger extension matters for recovery (Nijland 2010, EPOS study). Devices: wrist exoskeletons exist, for example the 1-DoF eWrist (Lambelet), and reviews (Hussain 2020) cover design and control; simulation-based exo design exists for an elbow-wrist exosuit with healthy users (KhalilianMotamed Bonab 2024). Route A tools: OpenSim, Moco, MoBL-ARMS, De Groote muscle model. Route B tools: MuJoCo, MyoSuite/MyoSim, PPO; RL exo control has been shown for other joints (Luo 2024, Chavarrias 2025 for the knee). The gap: nobody sizes wrist assistance for a weakened wrist and compares a plan with a learned controller.");
}

// ---------------------------------------------------------------- 4 literature -> pipeline
{
  const s = content("Literature", "From Literature to Our Pipeline:");
  table(s, ["Source", "What it gives us", "Where we use it"], [
    ["Holzbaur 2005; Saul 2015; McFarland 2019", "MoBL-ARMS upper-limb model (OpenSim 4.1 version)", "Route A model for the baseline"],
    ["Dembia 2020 (Moco)", "Direct-collocation optimal control", "Baseline solve, K1–K3 studies"],
    ["De Groote 2016", "Fast, robust muscle formulation", "DeGrooteFregly muscles in every solve"],
    ["Wang 2022; Caggiano 2022", "MyoHand model (from MoBL-ARMS) and MyoSuite tasks", "Route B environment; planar model muscle data"],
    ["Lambelet 2017, 2020; Hussain 2020", "A 1-DoF wrist flexion/extension exo is wearable and realistic", "Assist modelled as torque at the wrist axis"],
    ["Schulman 2017; Raffin 2021", "PPO and Stable-Baselines3", "Route B policy training (P3/P4)"],
  ], [3.6, 4.45, 4.08], { y: 1.5, fontSize: 14, rowH: [0.5, 0.72, 0.6, 0.6, 0.82, 0.82, 0.6] });
  s.addNotes("Each source has a concrete job in our pipeline. MoBL-ARMS (Holzbaur, Saul, McFarland) is our Route A model. Moco solves the optimal control problem. The De Groote muscle model is what Moco recommends. MyoSim/MyoSuite gives Route B its environment and the muscle data for our planar two-muscle model (MyoHand is derived from MoBL-ARMS). The eWrist papers justify modelling the device as a single torque at the wrist flexion/extension axis.");
}

// ---------------------------------------------------------------- 5 method outline
pres.addSection({ title: "Method" });
{
  const s = content("Method", "Method Outline:");
  img(s, "pipeline_diagram.png", 0.6, 1.5, 12.13, 2.847, "Pipeline: Route A model, inspect, build, Moco problem, solve and check, P3 studies; Route B environment, smoke test, PPO, K4 robustness.");
  text(s, [
    { text: "Solid boxes: built and tested in P2.  ", options: { bold: true } },
    { text: "Dashed boxes: P3/P4. The Moco wrist motion becomes the reference for the RL reward." },
  ], { x: 0.6, y: 5.95, w: 12.13, h: 0.5, fontSize: 14, margin: 0 });
  s.addNotes("Route A: load a model, write an inventory of coordinates and muscles (names go into config, nothing hard-coded), build a processed model (posture welded, cup attached, wrist muscles only, reserve actuators), set up the Moco problem, solve and check reserve torque against gravity torque. Route B: MyoSuite environment checked with a smoke test; PPO training comes next and will use the Moco motion as reference.");
}

// ---------------------------------------------------------------- 6 model and task
{
  const s = content("Method", "Model and Task: MoBL-ARMS:");
  text(s, bullets([
    "MoBL-ARMS upper limb (OpenSim 4.1 version, torso fixed)",
    "Arm at the side, elbow 90°, forearm pronated (palm down): gravity flexes the wrist",
    "Wrist flexion free; deviation braced at 0°; 9 joints welded",
    "6 wrist muscles: ECRL, ECRB, ECU, FCR, FCU, PL (DeGroote–Fregly, rigid tendon)",
    "0.3 kg cup in the hand: gravity torque 0.37–0.54 Nm",
  ], 15), { x: 0.6, y: 1.55, w: 6.3, h: 3.9, margin: 0 });
  card(s, 0.6, 4.4, 6.3, 1.25);
  text(s, [
    { text: "Model fixes we needed: ", options: { bold: true } },
    { text: "exact-pose welds, a frozen moving path point (FCU) and a deviation brace; all checked in tests." },
  ], { x: 0.8, y: 4.47, w: 5.9, h: 1.1, fontSize: 13, valign: "middle", margin: 0 });
  img(s, "planar_model_schematic.png", 7.25, 1.6, 5.48, 1.724, "Task schematic: fixed forearm, hand on a wrist joint, cup in the hand, extensor and flexor, gravity flexing the wrist.");
  text(s, "Task sketch, drawn on the planar two-muscle model we use for quick checks.", { x: 7.25, y: 4.95, w: 5.48, h: 0.7, fontSize: 12, italic: true, color: C.text2, margin: 0 });
  s.addNotes("We use the MoBL-ARMS upper-limb model, the version for OpenSim 4.1 with the torso fixed. The arm is at the side with the elbow at 90 degrees and the forearm pronated, palm down, so gravity pulls the hand into flexion. Only wrist flexion moves; deviation is held at 0 by an ideal brace. We keep the six muscles that move the wrist; the finger muscles are assumed busy holding the cup. The cup adds about 0.23 Nm, giving 0.37 Nm at the start and 0.54 Nm at the target. MoBL-ARMS needed three fixes for Moco, all verified: welds that keep the exact posture, freezing FCU's moving path point, and bracing deviation. The sketch shows the task on our simpler planar model.");
}

// ---------------------------------------------------------------- 7 Moco problem
{
  const s = content("Method", "Moco Problem Formulation:");
  const cards = [
    ["Task", ["Wrist from +30° (dropped) to −15° (extended)", "1.0 s; last 30 % is a hold", "Zero velocity at start and end"]],
    ["Objective", ["Minimise muscle effort (Σ excitation²)", "Reserve torque penalised ×1000", "Soft tracking of a smooth move-then-hold path"]],
    ["Pass / fail checks", ["Reserve ≤ 10 % of gravity torque", "Hold drift ≤ 2°", "Solver must converge"]],
    ["Solver", ["Moco CasADi + IPOPT, Hermite–Simpson", "Coarse 30 → refined 60 mesh intervals", "Tolerances 1e-3"]],
  ];
  cards.forEach(([h, items], i) => {
    const x = 0.6 + (i % 2) * 6.18, y = 1.5 + Math.floor(i / 2) * 2.62;
    card(s, x, y, 5.95, 2.4);
    badge(s, x + 0.25, y + 0.22, i + 1);
    text(s, h, { x: x + 0.95, y: y + 0.22, w: 4.8, h: 0.5, fontSize: 20, bold: true, valign: "middle", margin: 0 });
    text(s, bullets(items, 17), { x: x + 0.95, y: y + 0.85, w: 4.85, h: 1.45, margin: 0 });
  });
  s.addNotes("Why the tracking term: pure effort minimisation with endpoint constraints reaches the target only at the last instant and never holds. A soft tracking goal on a smooth move-then-hold path gives 'lift and hold', while the muscle coordination is still predicted. Reserve actuators are a heavily penalised helper torque at the wrist: if the solution needs them, the muscles alone cannot do the task. That is our failure signal, which separates a weak wrist from a solver failure.");
}

// ---------------------------------------------------------------- 8 baseline result
pres.addSection({ title: "Results" });
{
  const s = content("Results", "Baseline Result (100 % Strength):");
  img(s, "baseline_wrist_angle.png", 0.85, 1.45, 5.3, 1.335, "MoBL-ARMS wrist angle versus time: from +30 to -15 degrees, then held.");
  img(s, "baseline_reserve_torque.png", 6.6, 1.45, 5.75, 1.454, "MoBL-ARMS: reserve torque stays at zero while gravity torque rises from 0.37 to 0.54 Nm.");
  stat(s, 0.6, 5.55, 3.9, "Converged", "both meshes; refined: 233 iterations, 28 min", C.accent4, 1.25);
  stat(s, 4.72, 5.55, 3.9, "−15.00°", "target reached; held within 0.11°", C.accent1, 1.25);
  stat(s, 8.83, 5.55, 3.9, "0.02 %", "peak reserve / gravity torque: muscles do the work", C.accent1, 1.25);
  s.addNotes("MoBL-ARMS baseline: the coarse mesh converged in 224 iterations (18 min), the refined mesh in 233 iterations (28 min). The wrist reaches -15 degrees and holds within 0.11 degrees. Peak reserve torque is 0.00013 Nm, 0.02 % of the 0.54 Nm gravity torque, far below the 10 % limit, so the muscles alone do the task. The planar model gives the same picture: 0.02 % reserve, gravity 0.36-0.50 Nm.");
}

// ---------------------------------------------------------------- 8b simulation video
{
  const s = content("Results", "Baseline Simulation (MoBL-ARMS):");
  const cover = "image/png;base64," + require("fs").readFileSync(path.join(__dirname, "assets", "baseline_video_cover.png")).toString("base64");
  s.addMedia({ type: "video", path: RES("baseline_simulation.mp4"), x: 1.87, y: 1.42, w: 9.6, h: 5.4, cover, objectName: oid("video") });
  s.addNotes("Click the video to play it (about 7 seconds). The MoBL-ARMS arm is fixed with the elbow at 90 degrees and the palm down. The wrist starts dropped at 30 degrees flexion and lifts the 0.3 kg cup to 15 degrees extension in 1 second, then holds; the video plays 5 times slower than real time. Blue lines are the extensors, orange the flexors; thicker lines mean higher activation. The right side shows the wrist angle and the activation of each muscle. ECRB and ECRL do most of the work; the flexors stay at their minimum. The reserve torque stays at 0.02 % of the gravity torque, so the muscles do the task on their own.");
}

// ---------------------------------------------------------------- 9 muscle activity
{
  const s = content("Results", "Muscle Activity:");
  img(s, "baseline_activations.png", 0.6, 1.5, 8.4, 1.973, "MoBL-ARMS: ECRB 0.11, ECRL 0.09, ECU 0.03 activation during the hold; FCR, FCU and PL at their minimum 0.01.");
  text(s, "ECRB and ECRL do most of the work, ECU helps; the flexors stay at their minimum activation.", { x: 0.6, y: 5.85, w: 8.4, h: 0.5, fontSize: 14, color: C.text2, margin: 0 });
  stat(s, 9.35, 1.6, 3.38, "≈ 10 %", "ECRB / ECRL activation holds the 0.3 kg cup level", C.accent2, 1.55);
  stat(s, 9.35, 3.4, 3.38, "0.01", "FCR, FCU, PL activation (model minimum)", C.accent3, 1.55);
  text(s, "Starting point for K1: how much weaker can the extensor get?", { x: 9.35, y: 5.2, w: 3.38, h: 1.1, fontSize: 14, italic: true, margin: 0 });
  s.addNotes("At full strength MoBL-ARMS holds the cup with about 10 % activation of ECRB and 9 % of ECRL, while ECU helps at about 3 %. The flexors stay at their minimum activation of 0.01. The planar model needs 8 % on its single lumped extensor, which is consistent. This headroom is what the weakness sweep (K1) eats into.");
}

// ---------------------------------------------------------------- 10 K1
{
  const s = content("Results", "K1: Weakness Sweep (Planar Model):");
  img(s, "planar_k1_sweep.png", 0.6, 1.6, 8.4, 2.113, "K1 sweep: peak extensor activation rises to 1.0 below about 12 % strength; reserve torque exceeds the limit below about 10.7 %.");
  stat(s, 9.35, 1.6, 3.38, "≈ 10.7 %", "of unimpaired extensor strength: below this the cup task fails", C.accent3, 1.55);
  text(s, bullets([
    "Activation saturates at 1.0 below ~12 %",
    "Threshold found by bisection: 10.62–10.75 %",
    "Planar model; the MoBL-ARMS sweep follows in P3",
  ], 14), { x: 9.35, y: 3.4, w: 3.38, h: 2.9, margin: 0 });
  s.addNotes("This sweep uses the planar two-muscle model, which matches the MoBL-ARMS baseline (gravity torque, activations, reserve) but solves in seconds instead of 45 minutes. We scale the extensor's maximum force from 100 % down to 4 % and re-solve each time. A level fails if the solver fails, reserve torque exceeds 10 % of gravity torque, or the hold drifts more than 2 degrees. Bisection puts K1 between 10.62 % and 10.75 %. At the boundary the hold drift trips first. At 4 % the coarse solve hit its iteration limit; that level fails on every criterion anyway. This is a model result, not a clinical number: it depends on hand and cup mass, moment arms and the 1 s movement time.");
}

// ---------------------------------------------------------------- 11 K2/K3
{
  const s = content("Results", "K2/K3: Motor vs. Spring (Planar Model):");
  img(s, "planar_assist.png", 0.6, 1.6, 8.4, 2.119, "K2: minimum motor torque limit and spring peak torque at 8 % and 5 % strength. K3: muscle effort reduction with the spring.");
  stat(s, 9.35, 1.6, 3.38, "0.27 Nm", "motor that restores the task at 8 % strength (0.56 Nm at 5 %)", C.accent2, 1.5);
  stat(s, 9.35, 3.25, 3.38, "1.6–1.9×", "spring peak torque vs. motor: a spring is enough, but must be stronger", C.accent3, 1.5);
  stat(s, 9.35, 4.9, 3.38, "82–86 %", "less muscle effort with the spring when the task still works", C.accent1, 1.5);
  s.addNotes("Again on the planar two-muscle model. K2: at strength levels where the task fails (8 % and 5 %), bisection finds the smallest assist that restores it. An ideal motor needs a 0.27 Nm limit at 8 % and 0.56 Nm at 5 %. A linear spring (rest angle -60 degrees) also works, with stiffness 0.28 and 0.69 Nm/rad, but its peak torque is 1.6-1.9 times higher because a spring pushes hardest in the flexed start position, where gravity is weakest. K3: that spring cuts muscle effort by 82 % at full strength and 86 % at 30 % strength. Preliminary: motor weight and spring rest angle are modelling choices; P3 will optimise them.");
}

// ---------------------------------------------------------------- 12 Route B
pres.addSection({ title: "Route B" });
{
  const s = content("Route B", "Route B: MyoSuite Environment:");
  img(s, "myosuite_frames/myoHandObjHoldFixed-v0_step066.png", 0.6, 1.5, 3.45, 1.333, "MyoHand holding an object, random actions, frame 66.");
  img(s, "myosuite_frames/myoHandObjHoldFixed-v0_step199.png", 4.25, 1.5, 3.45, 1.333, "MyoHand holding an object, random actions, frame 199.");
  text(s, "myoHandObjHoldFixed-v0 under random actions (offscreen render).", { x: 0.6, y: 4.17, w: 7.1, h: 0.4, fontSize: 13, italic: true, color: C.text2, margin: 0 });
  card(s, 0.6, 4.75, 12.13, 1.85);
  text(s, "Route B plan (P3/P4)", { x: 0.85, y: 4.88, w: 5, h: 0.4, fontSize: 18, bold: true, color: C.accent1, margin: 0 });
  text(s, bullets([
    "PPO (Stable-Baselines3); reward tracks the Moco wrist motion, keeps the cup level and penalises effort",
    "Fingers held in a fixed grasp first; policy outputs muscle (and device) commands",
    "K4: compare the RL policy with the Moco plan under a heavier cup, pushes and fatigue",
  ], 15), { x: 0.85, y: 5.33, w: 11.7, h: 1.2, margin: 0 });
  table(s, ["Check", "Result"], [
    ["Registry", "226 myo environments, 24 myoHand"],
    ["Obs. / action", "91 / 39 (muscles)"],
    ["Wrist joints", "flexion, deviation, pro_sup"],
    ["Wrist muscles", "ECRL, ECRB, ECU, FCR, FCU, PL"],
    ["Smoke test", "200 random steps, no errors"],
  ], [1.7, 3.18], { x: 7.85, y: 1.5, fontSize: 13 });
  s.addNotes("Route B is set up and checked. We read the environment list from the MyoSuite registry instead of guessing names, picked the object-hold task with the MyoHand model, and ran 200 random steps without errors. All the wrist joints and the six wrist muscles Route B needs are exposed by name. PPO training starts in P3/P4.");
}

// ---------------------------------------------------------------- 13 limitations
pres.addSection({ title: "Outlook" });
{
  const s = content("Outlook", "Limitations and Validity:");
  table(s, ["Limitation", "Effect", "Plan"], [
    ["K1–K3 run on the planar model", "Thresholds are model-specific", "Re-run on MoBL-ARMS (≈45 min per solve)"],
    ["Wrist deviation braced at 0°", "Brace takes radial side effects (0.49 Nm)", "Test with deviation free"],
    ["Assumed fibre and tendon lengths", "K1 value may shift", "Sensitivity analysis in P3"],
    ["Hold enforced by a soft tracking goal", "Kinematics partly prescribed", "Compare with a purely predictive variant"],
    ["Spring rest angle and motor weight fixed", "K2/K3 depend on these choices", "Optimise them as Moco parameters"],
    ["Generic adult, one 1 s task", "Not a clinical prediction", "State as relative findings (P1 ethics)"],
  ], [4.3, 3.7, 4.13], { y: 1.5, fontSize: 14, rowH: [0.52, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7] });
  s.addNotes("We are explicit about what the numbers mean. They are relative findings from a generic model. The biggest items: the K1-K3 studies must be repeated on MoBL-ARMS, deviation is braced in the baseline, and a sensitivity analysis on the assumed muscle parameters, cup mass and movement time tells us how solid the 10.7 % threshold is.");
}

// ---------------------------------------------------------------- 14 next steps
{
  const s = content("Outlook", "Next Steps (P3):");
  const steps = [
    ["K1 on MoBL-ARMS", "coarse-mesh sweep with warm starts", "P3 · 18 Nov"],
    ["Sensitivity", "cup mass, speed, deviation free", "P3 · 18 Nov"],
    ["Spring vs. motor", "stiffness and rest angle as Moco parameters", "P3 · 2 Dec"],
    ["Route B training", "PPO in MyoSuite, Moco-guided reward", "Weeks 48–50"],
    ["Robustness (K4)", "heavier cup, pushes, fatigue", "P4 · 16 Dec"],
  ];
  const x0 = 0.6, step = 2.48, d = 0.7, cyc = 2.15;
  s.addShape(pres.shapes.LINE, { x: x0 + d / 2, y: cyc + d / 2, w: step * 4, h: 0, line: { color: C.accent5, width: 2 }, objectName: oid("timeline") });
  steps.forEach(([h, dsc, when], i) => {
    const x = x0 + i * step;
    badge(s, x, cyc, i + 1, d);
    text(s, h, { x: x - 0.05, y: cyc + 0.95, w: 2.35, h: 0.45, fontSize: 17, bold: true, margin: 0 });
    text(s, dsc, { x: x - 0.05, y: cyc + 1.45, w: 2.25, h: 0.9, fontSize: 14, color: C.text2, margin: 0 });
    chip(s, x - 0.05, cyc + 2.5, 1.95, when, C.accent1);
  });
  card(s, 0.6, 5.75, 12.13, 0.85);
  text(s, [
    { text: "Already in place: ", options: { bold: true } },
    { text: "MoBL-ARMS baseline, sweep and assist scripts, tests and figures; P3 re-runs them on MoBL-ARMS." },
  ], { x: 0.85, y: 5.8, w: 11.7, h: 0.75, fontSize: 14, valign: "middle", margin: 0 });
  s.addNotes("Next: the K1 sweep on MoBL-ARMS (coarse mesh, warm starts) and a sensitivity analysis for P3 on 18 Nov, the optimised spring-vs-motor study for 2 Dec, Route B training in weeks 48-50, and the robustness comparison K4 for the P4 demo on 16 Dec. Most of the code for these steps already exists and was tested on the planar model.");
}

// ---------------------------------------------------------------- 15/16 bibliography
pres.addSection({ title: "References" });
const refs = [
  "Nijland, R. H. M., et al. (2010). Presence of finger extension and shoulder abduction within 72 hours after stroke predicts functional recovery: the EPOS cohort study. Stroke, 41(4), 745–750.",
  "Hussain, S., Jamwal, P. K., Van Vliet, P., & Ghayesh, M. H. (2020). State-of-the-art robotic devices for wrist rehabilitation: Design and control aspects. IEEE Transactions on Human-Machine Systems, 50(5), 361–372.",
  "Lambelet, C., Lyu, M., Woolley, D., Gassert, R., & Wenderoth, N. (2017). The eWrist – A wearable wrist exoskeleton with sEMG-based force control for stroke rehabilitation. Proc. IEEE ICORR, 726–733.",
  "Lambelet, C., et al. (2020). Characterization and wearability evaluation of a fully portable wrist exoskeleton for unsupervised training after stroke. Journal of NeuroEngineering and Rehabilitation, 17, 132.",
  "KhalilianMotamed Bonab, A., Chiaradia, D., Frisoli, A., & Leonardis, D. (2024). A framework for modeling, optimization, and musculoskeletal simulation of an elbow–wrist exosuit. Robotics, 13(4), 60.",
  "Luo, S., et al. (2024). Experiment-free exoskeleton assistance via learning in simulation. Nature, 630, 353–359.",
  "Delp, S. L., et al. (2007). OpenSim: Open-source software to create and analyze dynamic simulations of movement. IEEE TBME, 54(11).",
  "Seth, A., et al. (2018). OpenSim: Simulating musculoskeletal dynamics and neuromuscular control. PLOS Computational Biology, 14(7).",
  "Dembia, C. L., et al. (2020). OpenSim Moco: Musculoskeletal optimal control. PLOS Computational Biology, 16(12), e1008493.",
  "Holzbaur, K. R. S., Murray, W. M., & Delp, S. L. (2005). A model of the upper extremity for simulating musculoskeletal surgery and analyzing neuromuscular control. Annals of Biomedical Engineering, 33(6), 829–840.",
  "Saul, K. R., et al. (2015). Benchmarking of dynamic simulation predictions in two software platforms using an upper limb musculoskeletal model. Computer Methods in Biomechanics and Biomedical Engineering.",
  "McFarland, D. C., McCain, E. M., Poppo, M. N., & Saul, K. R. (2019). Spatial dependency of glenohumeral joint stability during dynamic unimanual and bimanual pushing and pulling. Journal of Biomechanical Engineering. doi:10.1115/1.4043035",
  "De Groote, F., Kinney, A. L., Rao, A. V., & Fregly, B. J. (2016). Evaluation of direct collocation optimal control problem formulations for solving the muscle redundancy problem. Annals of Biomedical Engineering. doi:10.1007/s10439-016-1591-9",
  "Winter, D. A. (2009). Biomechanics and Motor Control of Human Movement (4th ed.). Wiley.",
  "Todorov, E., Erez, T., & Tassa, Y. (2012). MuJoCo: A physics engine for model-based control. Proc. IEEE/RSJ IROS, 5026–5033.",
  "Caggiano, V., et al. (2022). MyoSuite: A contact-rich simulation suite for musculoskeletal motor control. L4DC, PMLR 168.",
  "Wang, H., Caggiano, V., Durandau, G., Sartori, M., & Kumar, V. (2022). MyoSim: Fast and physiologically realistic MuJoCo models for musculoskeletal and exoskeletal studies. Proc. IEEE ICRA, 8104–8111.",
  "Schulman, J., Wolski, F., Dhariwal, P., Radford, A., & Klimov, O. (2017). Proximal policy optimization algorithms. arXiv:1707.06347.",
  "Raffin, A., et al. (2021). Stable-Baselines3: Reliable reinforcement learning implementations. Journal of Machine Learning Research, 22(268), 1–8.",
  "Chavarrías, A., Rodriguez-Cianca, D., & Lanillos, P. (2025). Adaptive torque control of exoskeletons under spasticity conditions via reinforcement learning. arXiv:2503.11433.",
];
[[0, 10, "Bibliography (1/2):"], [10, refs.length, "Bibliography (2/2):"]].forEach(([a, b, t]) => {
  const s = content("References", t);
  text(s, bullets(refs.slice(a, b), 12), { x: 0.75, y: 1.45, w: 11.85, h: 5.4, paraSpaceAfter: 5, margin: 0 });
  s.addNotes("Full reference list. Sources marked in the literature map; all entries were checked online on 3 Nov 2026.");
});

// ---------------------------------------------------------------- 17 thank you
{
  const s = pres.addSlide({ masterName: "END", sectionTitle: "References" });
  text(s, "Thank You", { x: 2.67, y: 2.3, w: 8.0, h: 1.3, fontSize: 60, bold: true, align: "center", valign: "middle" });
  text(s, "Questions?", { x: 2.67, y: 3.6, w: 8.0, h: 0.6, fontSize: 24, color: C.text2, align: "center", valign: "middle" });
  text(s, [
    { text: "Repository:", options: { bold: true, fontSize: 20, breakLine: true } },
    { text: "github.com/Rationaliser/wrist-exo-assist-sim", options: { fontSize: 20, hyperlink: { url: "https://github.com/Rationaliser/wrist-exo-assist-sim" } } },
  ], { x: 2.67, y: 4.8, w: 8.0, h: 1.0, align: "center" });
  s.addNotes("Everything shown is reproducible from the repository: README 'How to run', results/SUMMARY.md and presentation/speaker_notes.md.");
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(OUT, THEME);
  }
  console.log(`wrote ${OUT}`);
})();
