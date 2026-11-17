// P3 presentation deck (Team 7, MDM2 case study): extensor weakness sweep (K1) on MoBL-ARMS.
// Same template as the P2 deck. Numbers come from results/baseline_k1_sweep.csv.
// Usage:  NODE_PATH=<dir with pptxgenjs> node presentation/build_p3_deck.js
// Output: documents/Team7_P3_Presentation.pptx  (figures are read from results/)
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");

const ROOT = path.resolve(__dirname, "..");
const RES = (f) => path.join(ROOT, "results", f);
const LOGO = path.join(__dirname, "assets", "thd_logo.png");
const OUT = path.join(ROOT, "documents", "Team7_P3_Presentation.pptx");
const APPLY_THEME = process.env.APPLY_THEME_JS;
const DATE = "11/18/2026";
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
    accent4: "1BAF7A", // done / pass
    accent5: "C8C8C8", // table rows (P1 style)
    accent6: "9A9993",
    hlink: "2A78D6", folHlink: "6250D6",
  },
};

// ---------------------------------------------------------------- sweep data
const sweep = fs.readFileSync(RES("baseline_k1_sweep.csv"), "utf8").trim().split(/\r?\n/);
const cols = sweep[0].split(",");
const rows = sweep.slice(1).map((l) => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v])))
  .map((r) => ({
    f: 100 * +r.strength_factor, ok: r.task_ok === "True", solved: r.solver_success === "True", status: r.status,
    act: +r.ext_activation_peak, reserve: +r.reserve_peak_pct_gravity, drift: +r.hold_max_error_deg,
  }))
  .sort((a, b) => b.f - a.f);
const pct = (v) => `${+v.toFixed(2)} %`;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in, same as the P1 and P2 decks
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "P3: Extensor Weakness Sweep (K1) on MoBL-ARMS";
pres.author = "Team 7 (V. Joshi, N. Nagendra, H. Safi)";
const C = pres.SchemeColor;
const HEX = THEME.colors;

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
    { placeholder: { options: { name: "subtitle", type: "body", x: 1.67, y: 3.45, w: 10.0, h: 1.0, fontSize: 26, bold: true, color: C.text1, align: "center", valign: "middle" }, text: "" } },
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

function badge(slide, x, y, label, d = 0.5, fill = C.accent1) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill }, objectName: oid("badge") });
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

// cells may be strings or { text, options } for per-cell styling
function table(slide, header, body, colW, opts = {}) {
  const fs_ = opts.fontSize || 14;
  const head = header.map((h) => ({ text: h, options: { bold: true, color: C.background1, fill: { color: C.text1 }, fontSize: fs_ + 1 } }));
  const rowsOut = body.map((r, i) => r.map((c) => {
    const base = { fill: { color: i % 2 ? C.background2 : C.accent5 }, fontSize: fs_, color: C.text1 };
    return typeof c === "string" ? { text: c, options: base } : { text: c.text, options: { ...base, ...c.options } };
  }));
  slide.addTable([head, ...rowsOut], {
    x: opts.x || 0.6, y: opts.y || 1.5, w: colW.reduce((a, b) => a + b, 0), colW,
    border: { type: "solid", pt: 1.5, color: "FFFFFF" }, valign: "middle", margin: 0.07,
    rowH: opts.rowH, objectName: oid("table"),
  });
}

function img(slide, file, x, y, w, aspect, alt) {
  slide.addImage({ path: RES(file), x, y, w, h: w / aspect, altText: alt, objectName: oid("figure") });
}

function arrow(slide, x, y, w) {
  slide.addShape(pres.shapes.LINE, { x, y, w, h: 0, line: { color: C.accent6, width: 2, endArrowType: "triangle" }, objectName: oid("arrow") });
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
  s.addText("P3: Extensor Weakness Sweep (K1) on MoBL-ARMS", { placeholder: "subtitle" });
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
  s.addNotes("P3 milestone. In P2 we showed that a healthy wrist can lift and hold the cup in the MoBL-ARMS model. Today we answer the first research question on that same realistic model: how weak can the wrist extensors get before the task fails? That threshold is K1.");
}

// ---------------------------------------------------------------- 2 at a glance
{
  const s = content("Introduction", "P3 at a Glance:");
  const items = [
    ["Weakness sweep on MoBL-ARMS", "11 extensor strength levels from 100 % down to 8 %, each solved with Moco", "Done", C.accent4],
    ["Practical solver strategy", "Coarse mesh, warm starts, two parallel runs: about 1 h 45 min instead of 8 h", "Done", C.accent4],
    ["Convergence checks", "Pass at 11.75 % reproduced; refinement near the threshold did not converge", "Partly", C.accent3],
    ["Sensitivity analysis", "Cup mass, movement time and a free wrist deviation", "Next", C.accent1],
  ];
  items.forEach(([h, d, st, col], i) => {
    const y = 1.55 + i * 1.32;
    card(s, 0.6, y, 7.7, 1.12);
    badge(s, 0.8, y + 0.31, i + 1);
    text(s, h, { x: 1.5, y: y + 0.12, w: 4.6, h: 0.4, fontSize: 18, bold: true, margin: 0 });
    text(s, d, { x: 1.5, y: y + 0.5, w: 6.6, h: 0.58, fontSize: 13, color: C.text2, margin: 0 });
    chip(s, 6.25, y + 0.12, 1.85, st, col);
  });
  stat(s, 8.75, 1.55, 3.98, "≈ 11.6 %", "extensor strength below which the cup task fails (K1, MoBL-ARMS)", C.accent3);
  stat(s, 8.75, 2.95, 3.98, "10.7 %", "same threshold in the planar model: the two models agree within 1 point");
  stat(s, 8.75, 4.35, 3.98, "12 % / 11 %", "clear pass / clear fail: the safe statement of the result", C.accent2);
  text(s, "All numbers on this slide: MoBL-ARMS, coarse mesh, unless marked planar.", { x: 8.75, y: 5.8, w: 3.98, h: 0.6, fontSize: 12, italic: true, color: C.text2, margin: 0 });
  s.addNotes("Four parts of P3. The sweep on MoBL-ARMS is done. We changed the solver set-up so that it fits into an afternoon. We checked whether the result is reproducible: the pass just above the threshold is, but refining the solutions near the threshold to the finer mesh did not converge, so we report K1 as a coarse-mesh result. The sensitivity analysis is the next step. Headline: the task fails below about 11.6 % of normal extensor strength, which agrees with the 10.7 % of our planar model.");
}

// ---------------------------------------------------------------- 3 why K1
{
  const s = content("Introduction", "Why K1 Comes First:");
  card(s, 0.6, 1.5, 12.13, 0.95);
  text(s, [
    { text: "Research question: ", options: { bold: true } },
    { text: "How weak can the wrist extensors get before lifting and holding a cup fails, and what minimum assistance restores the task?" },
  ], { x: 0.85, y: 1.55, w: 11.7, h: 0.85, fontSize: 16, valign: "middle", margin: 0 });
  const kpis = [
    ["K1", "Strength threshold", "Which patients need help at all?", C.accent1, C.background1],
    ["K2", "Minimum assist", "How strong must the spring or motor be?", C.background2, C.text1],
    ["K3", "Effort saved", "How much does the device unload the muscles?", C.background2, C.text1],
    ["K4", "Robustness", "Does an RL controller cope with disturbances?", C.background2, C.text1],
  ];
  const w = 2.6, gap = 0.58, y = 2.85, h = 2.3;
  kpis.forEach(([k, name, q, fill, ink], i) => {
    const x = 0.6 + i * (w + gap);
    card(s, x, y, w, h, fill);
    text(s, k, { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.6, fontSize: 30, bold: true, color: ink === C.background1 ? ink : C.accent1, margin: 0 });
    text(s, name, { x: x + 0.2, y: y + 0.8, w: w - 0.4, h: 0.4, fontSize: 17, bold: true, color: ink, margin: 0 });
    text(s, q, { x: x + 0.2, y: y + 1.25, w: w - 0.4, h: 0.95, fontSize: 14, color: ink, margin: 0 });
    if (i < kpis.length - 1) arrow(s, x + w + 0.06, y + h / 2, gap - 0.12);
  });
  chip(s, 0.6, 5.35, 2.6, "Today (P3)", C.accent3);
  text(s, "K1 fixes the strength levels at which K2 and K3 size the device and K4 tests the controller, so every later result depends on it.",
    { x: 0.6, y: 5.9, w: 12.13, h: 0.7, fontSize: 15, margin: 0 });
  s.addNotes("The four KPIs form a chain. K1 says from which strength level on a patient needs assistance at all. K2 then asks how strong the assist must be at levels below that threshold, K3 how much muscle effort it saves, and K4 whether a reinforcement-learning controller keeps the task working under disturbances, compared with the optimal plan. That is why K1 comes first: it fixes the operating points for everything after it.");
}

// ---------------------------------------------------------------- 4 model
pres.addSection({ title: "Method" });
{
  const s = content("Method", "Model and Task: MoBL-ARMS:");
  img(s, "mobl_arms_model.png", 0.6, 1.4, 12.13, 2.548, "MoBL-ARMS model: (a) full arm with 50 muscles; (b) task model with the wrist free, a 0.3 kg cup and the six wrist muscles labelled.");
  text(s, [
    { text: "Task: ", options: { bold: true } },
    { text: "arm at the side, elbow 90°, palm down; lift the dropped wrist from +30° to −15° in 1 s and hold it, with a 0.3 kg cup (gravity torque 0.37–0.54 Nm). Model from [1]–[3], solved with OpenSim Moco [4]–[6]." },
  ], { x: 0.6, y: 6.25, w: 12.13, h: 0.6, fontSize: 14, margin: 0 });
  s.addNotes("Same model and task as the P2 baseline. Left: the full MoBL-ARMS arm with 50 muscles. Right: the version we simulate, with all joints except wrist flexion fixed in the task posture, the cup in the hand and the six muscles that move the wrist. Blue are the extensors ECRL, ECRB and ECU, which lift the hand; orange are the flexors. Gravity pulls the palm-down hand into flexion, so the extensors carry the whole load.");
}

// ---------------------------------------------------------------- 5 sweep method
{
  const s = content("Method", "Weakness Sweep Method:");
  const steps = [
    ["Weaken", "Scale the maximum force of ECRL, ECRB and ECU by the same factor; flexors unchanged (weakness after stroke [7], method as in [8])"],
    ["Solve", "Same Moco problem as the baseline: minimise muscle effort, lift and hold the cup; a heavily penalised reserve torque is available"],
    ["Judge", "Apply three pass/fail rules to the solution (right)"],
  ];
  steps.forEach(([h, d], i) => {
    const y = 1.5 + i * 1.45;
    card(s, 0.6, y, 7.3, 1.25);
    badge(s, 0.8, y + 0.37, i + 1);
    text(s, h, { x: 1.5, y: y + 0.12, w: 6.2, h: 0.4, fontSize: 18, bold: true, margin: 0 });
    text(s, d, { x: 1.5, y: y + 0.52, w: 6.2, h: 0.68, fontSize: 14, color: C.text2, margin: 0 });
  });
  card(s, 8.25, 1.5, 4.48, 4.15);
  text(s, "A strength level fails if:", { x: 8.5, y: 1.65, w: 4.0, h: 0.45, fontSize: 18, bold: true, color: C.accent1, margin: 0 });
  [["Solver", "does not converge"], ["> 10 %", "reserve torque, relative to the gravity torque"], ["> 2°", "wrist drift during the hold"]].forEach(([big, lab], i) => {
    const y = 2.25 + i * 1.1;
    text(s, big, { x: 8.5, y, w: 1.45, h: 0.6, fontSize: 24, bold: true, color: C.accent3, valign: "middle", margin: 0 });
    text(s, lab, { x: 10.0, y, w: 2.55, h: 0.8, fontSize: 14, color: C.text1, valign: "middle", margin: 0 });
  });
  card(s, 0.6, 5.95, 12.13, 0.7);
  text(s, [
    { text: "Levels: ", options: { bold: true } },
    { text: "100, 50, 30, 20, 15, 12, 10, 8 %, then 3 bisection steps between the weakest pass and the strongest fail." },
  ], { x: 0.85, y: 5.95, w: 11.7, h: 0.7, fontSize: 15, valign: "middle", margin: 0 });
  s.addNotes("Stroke weakens muscles, and weakness is the main cause of hand impairment after stroke (Kamper 2006). We model it the way Ong et al. modelled ankle weakness: by scaling the maximum isometric force of the affected muscles. Here that is the three wrist extensors together; the flexors stay normal. Each level is solved as an optimal control problem. The reserve is an artificial helper torque at the wrist with a very high cost, so the solver only uses it when the muscles cannot do the task. A level fails if the solver fails, if the reserve has to supply more than 10 % of the gravity torque, or if the wrist sags more than 2 degrees during the hold. We used a grid of eight levels and then bisected three times to narrow the threshold down.");
}

// ---------------------------------------------------------------- 6 practical
{
  const s = content("Method", "Making the Sweep Practical:");
  const tips = [
    ["Coarse mesh only", "30 time intervals instead of 30 → 60: 8–17 min per level instead of about 45 min"],
    ["Warm start", "Each level starts from the solved level nearest to it (planar test: 162 → 56 iterations)"],
    ["Two runs in parallel", "Strong levels (100–20 %) and weak levels (15–8 %) at the same time, in separate folders"],
    ["Iteration cap", "At most 600 iterations, so one hopeless level cannot block the sweep; counted as a fail"],
  ];
  tips.forEach(([h, d], i) => {
    const x = 0.6 + (i % 2) * 4.15, y = 1.5 + Math.floor(i / 2) * 2.2;
    card(s, x, y, 3.95, 2.0);
    badge(s, x + 0.22, y + 0.22, i + 1);
    text(s, h, { x: x + 0.9, y: y + 0.22, w: 2.9, h: 0.5, fontSize: 17, bold: true, valign: "middle", margin: 0 });
    text(s, d, { x: x + 0.25, y: y + 0.88, w: 3.5, h: 1.05, fontSize: 14, color: C.text2, margin: 0 });
  });
  stat(s, 9.05, 1.5, 3.68, "≈ 8 h", "estimated with full refinement and cold starts (11 levels)", C.text2, 1.3);
  stat(s, 9.05, 3.0, 3.68, "1 h 45 min", "actual wall time of the whole sweep", C.accent4, 1.3);
  text(s, "Each solution is saved as soon as it finishes, so a crash loses nothing and later runs can start from it.",
    { x: 9.05, y: 4.5, w: 3.68, h: 1.2, fontSize: 14, italic: true, margin: 0 });
  text(s, "Cost of the shortcut: K1 rests on the coarse mesh (see convergence checks).",
    { x: 0.6, y: 6.05, w: 12.13, h: 0.5, fontSize: 14, color: C.text2, margin: 0 });
  s.addNotes("A full MoBL-ARMS solve takes about 45 minutes, so eleven levels would have taken around eight hours. Four changes made it practical. We solved only on the coarse mesh. Each level starts from the nearest level that was already solved, which on the planar model cut the iterations by about two thirds. The strong and weak levels ran at the same time, each in its own working folder, because Moco uses a stop file in the working directory. And every solve stops after 600 iterations, which then counts as a failure. The whole sweep took 1 hour 45 minutes. The price is that the threshold comes from the coarse mesh.");
}

// ---------------------------------------------------------------- 7 K1 result
pres.addSection({ title: "Results" });
{
  const s = content("Results", "K1 Result (MoBL-ARMS):");
  img(s, "baseline_k1_sweep.png", 0.6, 1.4, 12.13, 3.265, "K1 sweep on MoBL-ARMS: extensor activation, reserve torque and hold drift against extensor strength; the task fails between 11.5 and 11.75 percent.");
  stat(s, 0.6, 5.35, 3.9, "11.5–11.75 %", "last fail / first pass after bisection (coarse mesh)", C.accent3, 1.3);
  stat(s, 4.72, 5.35, 3.9, "≈ 11.6 %", "K1: extensor strength needed to lift and hold the cup", C.accent1, 1.3);
  stat(s, 8.83, 5.35, 3.9, "10.62–10.75 %", "planar two-muscle model, for comparison", C.text2, 1.3);
  s.addNotes("The main result. Left: peak extensor activation rises as the muscles get weaker and reaches its maximum of 1.0 at about 15 % strength. Middle: the reserve torque stays near zero down to 12 % and only shoots up below about 11 %. Right: the hold drift, which decides the threshold. Filled points pass, hollow points fail; the shaded band is the threshold. After bisection the last passing level is 11.75 % and the first failing level 11.5 %, so K1 is about 11.6 % of unimpaired extensor strength. The planar model gave 10.6 to 10.75 %.");
}

// ---------------------------------------------------------------- 8 table
{
  const s = content("Results", "Results by Strength Level:");
  const solverText = (r) => (r.solved ? "converged" : r.status === "Maximum_Iterations_Exceeded" ? "iteration limit" : "step error");
  const body = rows.map((r) => [
    { text: pct(r.f), options: { bold: true } },
    { text: solverText(r), options: r.solved ? {} : { color: C.accent3, bold: true } },
    r.act.toFixed(2),
    r.reserve < 1 ? `${r.reserve.toFixed(2)} %` : `${r.reserve.toFixed(1)} %`,
    `${r.drift.toFixed(2)}°`,
    { text: r.ok ? "pass" : r.solved && r.drift > 2 && r.reserve <= 10 ? "fail (drift)" : "fail", options: { bold: true, color: r.ok ? C.text1 : C.accent3 } },
  ]);
  table(s, ["Extensor strength", "Solver", "Peak extensor activation", "Reserve / gravity", "Hold drift", "Task"], body,
    [1.95, 1.95, 2.5, 2.0, 1.6, 1.6], { y: 1.45, fontSize: 13, rowH: 0.42 });
  text(s, "Limits: reserve ≤ 10 %, drift ≤ 2°, solver converged. Iteration limit at 10 %; “Error_In_Step_Computation” at 8 %.",
    { x: 0.6, y: 6.55, w: 12.13, h: 0.35, fontSize: 12, italic: true, color: C.text2, margin: 0 });
  s.addNotes("All eleven solves. Down to 15 % the task is easy: activation rises, but the reserve stays below 1 % of the gravity torque and the drift below half a degree. At 12 % and 11.75 % the extensors are fully active and the task still passes. At 11.5 % the wrist drifts 2.1 degrees during the hold, just over the limit, and at 11 % 5.2 degrees. At 10 % and 8 % the solver itself failed: the 10 % solve hit the 600-iteration limit and the 8 % solve stopped with a step-computation error. Both fail every other criterion as well, so they do not affect the threshold, but we list them as solver failures.");
}

// ---------------------------------------------------------------- 9 threshold mechanism
{
  const s = content("Results", "What Happens at the Threshold:");
  const near = rows.filter((r) => r.f <= 20).sort((a, b) => a.f - b.f);
  const xs = near.map((r) => r.f);
  s.addChart(pres.charts.SCATTER, [
    { name: "Strength", values: xs },
    { name: "Hold drift", values: near.map((r) => +r.drift.toFixed(2)) },
  ], {
    x: 0.6, y: 1.45, w: 6.3, h: 4.35, objectName: oid("chart"),
    chartColors: [HEX.accent2], lineSize: 2, lineDataSymbol: "circle", lineDataSymbolSize: 7,
    showLegend: false,
    showTitle: true, title: "Hold drift near the threshold (fails above 2°)", titleFontSize: 14, titleFontFace: "+mn-lt", titleColor: HEX.dk1,
    showValAxisTitle: true, valAxisTitle: "Hold drift (deg)", valAxisTitleFontSize: 12, valAxisTitleFontFace: "+mn-lt",
    showCatAxisTitle: true, catAxisTitle: "Extensor strength (% of unimpaired)", catAxisTitleFontSize: 12, catAxisTitleFontFace: "+mn-lt",
    valAxisLabelFontSize: 11, catAxisLabelFontSize: 11, valAxisLabelFontFace: "+mn-lt", catAxisLabelFontFace: "+mn-lt",
    valAxisLabelColor: HEX.dk2, catAxisLabelColor: HEX.dk2, valAxisMinVal: 0, valAxisMaxVal: 16, valAxisMajorUnit: 2,
    valGridLine: { color: HEX.lt2, size: 0.75 }, catGridLine: { style: "none" },
  });
  const points = [
    ["Muscles saturate first", "Extensor activation reaches 1.0 at about 15 % strength and stays there."],
    ["Then the hand sags", "At 11.5 % the muscles still carry most of the load (reserve 3.7 %), but the wrist sinks 2.1° during the hold."],
    ["Only then the helper takes over", "Below about 10 % the reserve passes 10 % of gravity torque (19 % at 10 %, 53 % at 8 %)."],
  ];
  points.forEach(([h, d], i) => {
    const y = 1.45 + i * 1.5;
    badge(s, 7.3, y + 0.05, i + 1, 0.45);
    text(s, h, { x: 7.95, y, w: 4.78, h: 0.45, fontSize: 17, bold: true, valign: "middle", margin: 0 });
    text(s, d, { x: 7.95, y: y + 0.5, w: 4.78, h: 0.85, fontSize: 14, color: C.text2, margin: 0 });
  });
  card(s, 0.6, 6.0, 12.13, 0.75);
  text(s, [
    { text: "For the device: ", options: { bold: true } },
    { text: "just below K1 the wrist needs a small extra push to stop the sag, not full support. K2 will measure how small." },
  ], { x: 0.85, y: 6.0, w: 11.7, h: 0.75, fontSize: 15, valign: "middle", margin: 0 });
  s.addNotes("How the task fails matters for the device. First the muscles run out of headroom: from about 15 % strength the extensors are fully activated. Close to the threshold the wrist does not collapse: the muscles still provide most of the torque, the helper torque stays below the 10 % limit, but the hand slowly sinks while holding the cup. The chart shows this drift crossing the 2 degree limit between 11.75 and 11.5 %. Only well below the threshold does the helper torque take over. So a patient just below K1 needs only a small additional torque, which is exactly what K2 will size on MoBL-ARMS.");
}

// ---------------------------------------------------------------- 10 two models
{
  const s = content("Results", "Two Models, One Answer:");
  const colsM = [
    ["Planar two-muscle model", C.text2, ["10.62–10.75 %", "0.497 Nm", "0.08 (one lumped extensor)", "seconds"]],
    ["MoBL-ARMS", C.accent1, ["11.5–11.75 %", "0.540 Nm", "ECRB 0.11, ECRL 0.09, ECU 0.03", "8–17 min (coarse mesh)"]],
  ];
  const labels = ["K1 threshold", "Gravity torque at the target", "Hold activation at full strength", "Time per solve"];
  labels.forEach((l, i) => text(s, l, { x: 0.6, y: 2.25 + i * 0.85, w: 3.0, h: 0.6, fontSize: 15, bold: true, valign: "middle", margin: 0 }));
  colsM.forEach(([name, col, vals], j) => {
    const x = 3.8 + j * 4.55;
    card(s, x, 1.45, 4.3, 4.15);
    text(s, name, { x: x + 0.25, y: 1.55, w: 3.8, h: 0.55, fontSize: 18, bold: true, color: col, valign: "middle", margin: 0 });
    vals.forEach((v, i) => text(s, v, { x: x + 0.25, y: 2.25 + i * 0.85, w: 3.85, h: 0.6, fontSize: i === 0 ? 20 : 15, bold: i === 0, color: i === 0 ? col : C.text1, valign: "middle", margin: 0 }));
  });
  card(s, 0.6, 5.9, 12.13, 0.85);
  text(s, [
    { text: "Consistent: ", options: { bold: true } },
    { text: "MoBL-ARMS needs about 9 % more torque at the target than the planar model, and its threshold is about 9 % higher (11.6 vs. 10.7 %)." },
  ], { x: 0.85, y: 5.9, w: 11.7, h: 0.85, fontSize: 15, valign: "middle", margin: 0 });
  s.addNotes("We ran K1 on two very different models: our planar model with one lumped extensor and one flexor, and the full MoBL-ARMS arm with three extensors on coupled wrist joints. They agree to within about one percentage point. The small difference is consistent with gravity: in MoBL-ARMS the hand and cup need 0.540 Nm at the target posture against 0.497 Nm in the planar model, about 9 % more, and the threshold is also about 9 % higher. This is a consistency check, not a proof: the models also differ in moment arms and muscle properties. The agreement is why we trust the planar model for quick exploration, with MoBL-ARMS giving the final numbers.");
}

// ---------------------------------------------------------------- 11 checks and limitations
pres.addSection({ title: "Outlook" });
{
  const s = content("Outlook", "Convergence Checks and Limitations:");
  table(s, ["Check", "Result", "What it means"], [
    ["11.75 % solved again from a different start (12 %)", "Same optimum (objective 2.6997), passes", "The pass is reproducible"],
    ["Level restarted from its own solution", "11.75 %: iteration limit; 12 %: worse local optimum", "Start each level from a neighbouring level"],
    ["Refine near K1 to 60 intervals", { text: "Did not converge (11.5 %: step error)", options: { color: C.accent3, bold: true } }, "K1 is a coarse-mesh result"],
    ["10 % and 8 % solves", { text: "Iteration limit / step error", options: { color: C.accent3, bold: true } }, "Both fail every criterion anyway"],
    ["Generic adult, one 1 s task, deviation braced", "Not patient-specific", "Relative finding, not a clinical cut-off"],
  ], [4.3, 4.13, 3.7], { y: 1.45, fontSize: 14, rowH: [0.5, 0.75, 0.75, 0.75, 0.75, 0.75] });
  card(s, 0.6, 5.85, 12.13, 0.85);
  text(s, [
    { text: "Why the solver struggles near K1: ", options: { bold: true } },
    { text: "the extensor activations sit exactly on their upper limit of 1.0, a hard case for the interior-point solver used by Moco." },
  ], { x: 0.85, y: 5.85, w: 11.7, h: 0.85, fontSize: 15, valign: "middle", margin: 0 });
  s.addNotes("We checked the result before trusting it. Solving 11.75 % again from a different starting point gave exactly the same optimum, so the pass is reproducible. Restarting a near-threshold level from its own solution does not work: the solver diverged or found a much worse solution. The reason is that the extensor activations sit exactly on their upper bound of 1, and the interior-point solver first pushes variables away from their bounds. Refining the near-threshold levels to the finer 60-interval mesh did not converge, so K1 is a coarse-mesh result; the safe statement is that 12 % clearly passes and 11 % clearly fails. As before, this is a generic adult model and one task, so the number is a relative finding, not a clinical cut-off.");
}

// ---------------------------------------------------------------- 12 next steps
{
  const s = content("Outlook", "Next Steps:");
  const steps = [
    ["Sensitivity", "cup mass, movement time, free deviation", "P3"],
    ["Spring vs. motor", "K2/K3 with ideal devices [9]; stiffness and rest angle as Moco parameters", "P3 · 2 Dec"],
    ["Route B training", "PPO in MyoSuite, reward from the Moco motion", "Weeks 48–50"],
    ["Robustness (K4)", "heavier cup, pushes, fatigue: RL vs. Moco plan", "P4 · 16 Dec"],
    ["Final report", "all KPIs, discussion, recommendations", "P5 · 13 Jan"],
  ];
  const x0 = 0.6, step = 2.48, d = 0.7, cyc = 1.75;
  s.addShape(pres.shapes.LINE, { x: x0 + d / 2, y: cyc + d / 2, w: step * 4, h: 0, line: { color: C.accent5, width: 2 }, objectName: oid("timeline") });
  steps.forEach(([h, dsc, when], i) => {
    const x = x0 + i * step;
    badge(s, x, cyc, i + 1, d);
    text(s, h, { x: x - 0.05, y: cyc + 0.95, w: 2.35, h: 0.75, fontSize: 17, bold: true, margin: 0 });
    text(s, dsc, { x: x - 0.05, y: cyc + 1.7, w: 2.25, h: 1.1, fontSize: 14, color: C.text2, margin: 0 });
    chip(s, x - 0.05, cyc + 2.95, 1.95, when, C.accent1);
  });
  card(s, 0.6, 5.55, 12.13, 1.15);
  text(s, [
    { text: "Input to K2: ", options: { bold: true } },
    { text: "the assist will be sized at strength levels where the task fails (for example 10 % and 8 %), starting each solve from the saved K1 solutions. Its target is to bring the hold drift back under 2° with the reserve unused." },
  ], { x: 0.85, y: 5.6, w: 11.7, h: 1.05, fontSize: 15, valign: "middle", margin: 0 });
  s.addNotes("Next we test how sensitive K1 is to cup mass, movement time and letting the wrist deviate freely. For 2 December we repeat the spring-versus-motor study on MoBL-ARMS, this time with the spring stiffness and rest angle as parameters that Moco optimises; ideal-device studies like this follow Uchida et al. Then Route B: train a PPO controller in MyoSuite, and compare it with the Moco plan under disturbances for K4 in P4. The K1 solutions are saved, so the K2 solves can start from them.");
}

// ---------------------------------------------------------------- 13 references
pres.addSection({ title: "References" });
{
  const s = content("References", "References:");
  const refs = [
    "[1] K. R. S. Holzbaur, W. M. Murray, and S. L. Delp, “A model of the upper extremity for simulating musculoskeletal surgery and analyzing neuromuscular control,” Ann. Biomed. Eng., vol. 33, no. 6, pp. 829–840, 2005.",
    "[2] K. R. Saul et al., “Benchmarking of dynamic simulation predictions in two software platforms using an upper limb musculoskeletal model,” Comput. Methods Biomech. Biomed. Eng., 2015.",
    "[3] D. C. McFarland, E. M. McCain, M. N. Poppo, and K. R. Saul, “Spatial dependency of glenohumeral joint stability during dynamic unimanual and bimanual pushing and pulling,” J. Biomech. Eng., 2019.",
    "[4] A. Seth et al., “OpenSim: Simulating musculoskeletal dynamics and neuromuscular control to study human and animal movement,” PLoS Comput. Biol., vol. 14, no. 7, 2018.",
    "[5] C. L. Dembia et al., “OpenSim Moco: Musculoskeletal optimal control,” PLoS Comput. Biol., vol. 16, no. 12, art. no. e1008493, 2020.",
    "[6] F. De Groote, A. L. Kinney, A. V. Rao, and B. J. Fregly, “Evaluation of direct collocation optimal control problem formulations for solving the muscle redundancy problem,” Ann. Biomed. Eng., 2016.",
    "[7] D. G. Kamper, H. C. Fischer, E. G. Cruz, and W. Z. Rymer, “Weakness is the primary contributor to finger impairment in chronic stroke,” Arch. Phys. Med. Rehabil., vol. 87, no. 9, pp. 1262–1269, 2006.",
    "[8] C. F. Ong, T. Geijtenbeek, J. L. Hicks, and S. L. Delp, “Predicting gait adaptations due to ankle plantarflexor muscle weakness and contracture using physics-based musculoskeletal simulations,” PLoS Comput. Biol., vol. 15, no. 10, art. no. e1006993, 2019.",
    "[9] T. K. Uchida et al., “Simulating ideal assistive devices to reduce the metabolic cost of running,” PLoS ONE, vol. 11, no. 9, art. no. e0163417, 2016.",
  ];
  text(s, refs.map((r, i) => ({ text: r, options: { breakLine: i < refs.length - 1, paraSpaceAfter: 6 } })),
    { x: 0.75, y: 1.45, w: 11.85, h: 5.35, fontSize: 14, margin: 0 });
  s.addNotes("References used on these slides, in IEEE style; all of them are in our P2 literature review, where the full list of 39 sources is given.");
}

// ---------------------------------------------------------------- 14 thank you
{
  const s = pres.addSlide({ masterName: "END", sectionTitle: "References" });
  text(s, "Thank You", { x: 2.67, y: 2.3, w: 8.0, h: 1.3, fontSize: 60, bold: true, align: "center", valign: "middle" });
  text(s, "Questions?", { x: 2.67, y: 3.6, w: 8.0, h: 0.6, fontSize: 24, color: C.text2, align: "center", valign: "middle" });
  text(s, [
    { text: "Repository:", options: { bold: true, fontSize: 20, breakLine: true } },
    { text: "github.com/Rationaliser/wrist-exo-assist-sim", options: { fontSize: 20, hyperlink: { url: "https://github.com/Rationaliser/wrist-exo-assist-sim" } } },
  ], { x: 2.67, y: 4.8, w: 8.0, h: 1.0, align: "center" });
  s.addNotes("Everything shown is reproducible from the repository: the README has the sweep commands, and results/SUMMARY.md has the full table and the convergence checks.");
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(OUT, THEME);
  }
  console.log(`wrote ${OUT}`);
})();
