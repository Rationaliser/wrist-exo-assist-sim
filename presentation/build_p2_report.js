// P2 report (Team 7, MDM2 case study), same look as the P1 one-page proposal.
// Usage:  NODE_PATH=<dir with docx> node presentation/build_p2_report.js
// Output: documents/Team7_P2_Report.docx  (figures are read from results/)
const fs = require("fs");
const path = require("path");
const {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, ImageRun, LevelFormat, Packer,
  PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const RES = (f) => path.join(ROOT, "results", f);
const OUT = path.join(ROOT, "documents", "Team7_P2_Report.docx");

const CONTENT_W = 9638; // A4 width 11906 dxa minus 2 x 1134 dxa margins
const PX_W = 640; // content width in pixels for images (96 dpi)
const GREY = "D9D9D9";
const LIGHT = "F2F2F2";
const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border };
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: none, bottom: none, left: none, right: none };

// ------------------------------------------------------------------ helpers
const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 120 }, alignment: AlignmentType.LEFT, ...opts,
  children: (Array.isArray(text) ? text : [text]).map((t) => (typeof t === "string" ? new TextRun(t) : t)),
});
const b = (t) => new TextRun({ text: t, bold: true });
const i = (t) => new TextRun({ text: t, italics: true });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const bullet = (text) => new Paragraph({
  numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
  children: (Array.isArray(text) ? text : [text]).map((t) => (typeof t === "string" ? new TextRun(t) : t)),
});
const numbered = (text) => new Paragraph({
  numbering: { reference: "numbers", level: 0 }, spacing: { after: 60 },
  children: (Array.isArray(text) ? text : [text]).map((t) => (typeof t === "string" ? new TextRun(t) : t)),
});

function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), buf };
}

function image(file, widthPx) {
  const { w, h, buf } = pngSize(RES(file));
  return new ImageRun({ type: "png", data: buf, transformation: { width: widthPx, height: Math.round(widthPx * h / w) },
    altText: { title: file, description: file, name: file } });
}

let figNo = 0;
function figure(file, caption, widthPx = PX_W) {
  figNo += 1;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true,
      children: [image(file, widthPx)] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: `Figure ${figNo}: `, bold: true, size: 19 }), new TextRun({ text: caption, size: 19 })] }),
  ];
}

function figurePair(fileA, fileB, caption) {
  figNo += 1;
  const half = Math.floor(CONTENT_W / 2);
  const cell = (file) => new TableCell({
    borders: noBorders, width: { size: half, type: WidthType.DXA },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [image(file, 310)] })],
  });
  return [
    new Table({ width: { size: half * 2, type: WidthType.DXA }, columnWidths: [half, half],
      rows: [new TableRow({ children: [cell(fileA), cell(fileB)] })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 },
      children: [new TextRun({ text: `Figure ${figNo}: `, bold: true, size: 19 }), new TextRun({ text: caption, size: 19 })] }),
  ];
}

let tabNo = 0;
function table(header, rows, widths, caption) {
  tabNo += 1;
  const total = widths.reduce((a, c) => a + c, 0);
  const mk = (text, w, head) => new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: head ? { fill: GREY, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: head, size: 20 })] })],
  });
  return [
    new Paragraph({ spacing: { before: 120, after: 60 }, keepNext: true,
      children: [new TextRun({ text: `Table ${tabNo}: `, bold: true, size: 19 }), new TextRun({ text: caption, size: 19 })] }),
    new Table({
      width: { size: total, type: WidthType.DXA }, columnWidths: widths,
      rows: [new TableRow({ tableHeader: true, children: header.map((t, k) => mk(t, widths[k], true)) }),
        ...rows.map((r) => new TableRow({ children: r.map((t, k) => mk(t, widths[k], false)) }))],
    }),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
  ];
}

function infoTable(rows) {
  const w = [3000, CONTENT_W - 3000];
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: w,
    rows: rows.map(([k, v], n) => new TableRow({ children: [
      new TableCell({ borders, width: { size: w[0], type: WidthType.DXA },
        shading: { fill: n % 2 ? GREY : LIGHT, type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 40, bottom: 40, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 21 })] })] }),
      new TableCell({ borders, width: { size: w[1], type: WidthType.DXA },
        shading: { fill: n % 2 ? GREY : "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 40, bottom: 40, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: v, size: 21 })] })] }),
    ] })),
  });
}

// ------------------------------------------------------------------ content
const NB = " ";
const body = [];

body.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
    children: [new TextRun({ text: "MDM2 – Case Study: Assistive Robotics for", bold: true, size: 30, font: "Cambria" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
    children: [new TextRun({ text: "Improvement of Life Quality", bold: true, size: 30, font: "Cambria" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: "P2 Report: Literature Map, Method Outline and Baseline Simulation", bold: true, size: 26, font: "Cambria" })] }),
  infoTable([
    ["Team", "Team 7"],
    ["Members", "Vedant Joshi, Navya Nagendra, Harshil Safi"],
    ["Project Title", "Simulation-based design of wrist exoskeleton assistance for post-stroke wrist-extensor weakness: optimal control vs. reinforcement learning"],
    ["Supervisor", "Prof. Hamidreza Heidari"],
    ["GitHub Repository", "https://github.com/Rationaliser/wrist-exo-assist-sim"],
    ["Submission Date", "2026-11-04"],
  ]),
  new Paragraph({ spacing: { after: 120 }, children: [] }),
);

// 1 Introduction
body.push(h1("1. Introduction"),
  p("After a stroke, weak wrist extensors let the hand drop into flexion, and everyday tasks such as lifting a cup and holding it level start to fail. A wrist exoskeleton can hold the wrist up, but it is not obvious how much torque it has to provide, or whether a passive spring is enough. Our project answers this in simulation before any hardware is built, and compares an optimal-control plan with a learned controller."),
  p([b("Research question: "), "How weak can the wrist extensors get before a simulated arm can no longer lift and hold a cup, and what is the minimum wrist assistance that restores the task?"]),
  p("The project is measured by four outcomes: the extensor strength threshold at which the task fails (K1), the minimum assist torque and whether a spring is sufficient (K2), the reduction in muscle effort with assistance (K3), and the success rate of a reinforcement-learning policy compared with the optimal-control plan under perturbations (K4). This P2 report covers the literature map, the method outline, the baseline simulation and the bibliography. It also includes first results for K1–K3 obtained on a simplified wrist model."),
);

// 2 Literature map
body.push(h1("2. Literature Map"),
  p("We grouped the literature into four areas that together frame the project (Table 1): the clinical problem, existing wrist assistance devices, musculoskeletal simulation with optimal control (Route A), and learning-based control in simulation (Route B)."),
  h2("2.1 Clinical problem"),
  p("Voluntary finger extension early after stroke is one of the strongest predictors of arm recovery (Nijland et al., 2010), which underlines how important the extensor side of the forearm is for hand function. When the wrist extensors are weak, gravity pulls the hand into flexion as soon as the forearm is pronated, and the hand cannot be positioned for grasping."),
  h2("2.2 Wrist assistance devices"),
  p("Hussain et al. (2020) review wrist rehabilitation robots and distinguish end-effector devices from wearable orthoses. The eWrist (Lambelet et al., 2017; 2020) is a wearable one-degree-of-freedom exoskeleton that supports wrist flexion and extension, weighs under 500 g and can be put on with one hand; it shows that a single actuated axis at the wrist is a realistic device concept. KhalilianMotamed Bonab et al. (2024) used OpenSim to design and optimise an elbow–wrist exosuit for a load-lifting task, but only for healthy users and without learned control. Luo et al. (2024) trained exoskeleton controllers entirely in simulation, which motivates our Route B."),
  h2("2.3 Musculoskeletal simulation and optimal control"),
  p("OpenSim (Delp et al., 2007; Seth et al., 2018) and its optimal-control module Moco (Dembia et al., 2020) allow predictive simulations with muscle-driven models. We use the MoBL-ARMS upper-limb model, which goes back to the kinematic model of Holzbaur et al. (2005), was benchmarked as a dynamic model by Saul et al. (2015) and updated by McFarland et al. (2019). Moco recommends the muscle formulation of De Groote et al. (2016), which converges reliably with direct collocation."),
  h2("2.4 Learning-based control"),
  p("MyoSuite (Caggiano et al., 2022) provides MuJoCo (Todorov et al., 2012) musculoskeletal models, including a wrist-and-hand model derived from MoBL-ARMS (Wang et al., 2022), together with fatigue and sarcopenia options. Chavarrías et al. (2025) trained an exoskeleton torque controller with reinforcement learning in MyoSuite, but for the knee. We will use PPO (Schulman et al., 2017) as implemented in Stable-Baselines3 (Raffin et al., 2021)."),
  ...table(["Source", "What it provides", "How we use it"], [
    ["Nijland et al. 2010", "Early finger extension predicts arm recovery", "Clinical motivation"],
    ["Hussain et al. 2020; Lambelet et al. 2017, 2020", "Wrist robot review; wearable 1-DoF wrist exoskeleton", "Assistance modelled as a torque at the wrist axis"],
    ["KhalilianMotamed Bonab et al. 2024", "Simulation-based exosuit design (healthy users)", "Closest related work; no weakness, no RL"],
    ["Delp 2007; Seth 2018; Dembia 2020", "OpenSim and Moco", "Route A simulation and optimal control"],
    ["Holzbaur 2005; Saul 2015; McFarland 2019", "MoBL-ARMS upper-limb model", "Route A model"],
    ["De Groote et al. 2016", "Muscle model for direct collocation", "Muscle model in every solve"],
    ["Caggiano 2022; Wang 2022; Todorov 2012", "MyoSuite, MyoSim, MuJoCo", "Route B environment"],
    ["Schulman 2017; Raffin 2021; Luo 2024; Chavarrías 2025", "PPO, Stable-Baselines3, RL exoskeleton control", "Route B training (P3/P4)"],
  ], [3000, 3500, 3138], "Literature map: sources and their role in the project."),
  p([b("Gap: "), "we did not find a study that sizes the assistance needed by a weakened, post-stroke wrist in simulation, or one that compares an optimal-control plan with a learned controller for this task."]),
);

// 3 Method outline
body.push(h1("3. Method Outline"),
  ...figure("pipeline_diagram.png", "Simulation pipeline. Solid boxes were built and tested in P2; dashed boxes follow in P3 and P4."),
  h2("3.1 Route A: optimal control with Moco"),
  numbered("Load the musculoskeletal model and write an inventory of its coordinates, muscles and bodies; all names used later are taken from this inventory."),
  numbered("Build a processed model: fix the arm in the task posture, attach the cup, keep the wrist muscles and add a heavily penalised reserve actuator at the wrist."),
  numbered("Solve the lift-and-hold task as an optimal control problem that minimises muscle effort."),
  numbered("Check the solution: if the reserve actuator is needed, the muscles alone cannot perform the task."),
  numbered("K1: scale the extensor strength down and repeat until the task fails. K2/K3: add a spring or an ideal motor at the wrist and repeat."),
  p("The task starts with the wrist dropped at 30° flexion and moves it to 15° extension in 1.0 s, with zero velocity at both ends; the last 30 % of the time is a hold. The arm is at the side with the elbow at 90° and the forearm pronated, so gravity pulls the hand into flexion. The cost is the sum of squared muscle excitations, with the reserve actuator weighted 1000 times higher. A soft tracking term on a minimum-jerk move followed by a hold makes the wrist actually hold the target; without it, the effort optimum only reaches the target at the final instant. How the muscles share the work is still predicted by the optimiser. We use the Moco CasADi solver with Hermite–Simpson transcription, first on 30 and then on 60 mesh intervals."),
  p("A strength level counts as failed if the solver does not converge, if the reserve torque exceeds 10 % of the gravity torque at the wrist, or if the wrist drifts more than 2° during the hold."),
  h2("3.2 Route B: reinforcement learning in MyoSuite"),
  p("Route B uses the MyoSuite environment myoHandObjHoldFixed-v0, in which the MyoHand model holds an object. A PPO policy will control the muscles (and later an assist actuator), with a reward that follows the Moco wrist trajectory, keeps the cup level and penalises effort. In P2 we only checked the environment: it was selected from the 226 registered MyoSuite environments, runs 200 random steps without errors, and exposes the wrist joints (flexion, deviation, pronation–supination) and the six wrist muscles by name. The observation has 91 and the action 39 dimensions."),
);

// 4 Baseline
body.push(h1("4. Baseline Simulation"),
  h2("4.1 Model"),
  p("We use MoBL-ARMS in its OpenSim 4.1 version with the torso fixed to ground (MOBL_ARMS_fixed_41.osim, SimTK project upexdyn). The model has 20 coordinates and 50 Millard muscles. Its wrist is split into two joints whose angles are coupled by constraints, so the hand rotation is shared between the radiocarpal joint and a second, dependent joint. Preparing the model for Moco needed three changes: the shoulder, elbow and forearm joints are replaced by welds that keep the exact task posture (OpenSim's built-in operator did not preserve it for this model); one moving path point of FCU, which depends on forearm rotation, is fixed at its posture location; and wrist deviation is held at 0° by an ideal brace, because a constant constraint interfered with the model's assembly. The six wrist muscles ECRL, ECRB, ECU, FCR, FCU and PL are kept. The finger muscles also cross the wrist but are assumed to be occupied with gripping the cup. A 0.3 kg cup is attached 8 cm distal and 4 cm palmar to the wrist."),
  p(`Gravity flexes the wrist over the whole range of motion. Including the coupled joint, the gravity torque is 0.37${NB}Nm at the start position and 0.54${NB}Nm at the target; the cup contributes about 0.23${NB}Nm.`),
  h2("4.2 Results"),
  p("The optimisation converged on both meshes (224 iterations on the coarse mesh, 233 on the fine mesh, 46 minutes in total). The wrist reaches the target and holds it within 0.11°. The reserve actuator peaks at 0.02 % of the gravity torque, so the six wrist muscles perform the task on their own (Table 2, Figure 2)."),
  ...table(["Quantity", "Value"], [
    ["Solver status (coarse / fine mesh)", "converged / converged"],
    ["Final wrist angle", "−15.00°"],
    ["Largest drift during the hold", "0.11°"],
    ["Gravity torque at start / target", `0.365 / 0.540${NB}Nm`],
    ["Peak reserve torque", `1.3·10⁻⁴${NB}Nm (0.02 % of gravity torque)`],
    ["Hold activation ECRB / ECRL / ECU", "0.106 / 0.089 / 0.034"],
    ["Hold activation FCR, FCU, PL", "0.01 (model minimum)"],
  ], [5000, 4638], "Baseline results on MoBL-ARMS at full strength."),
  ...figurePair("baseline_wrist_angle.png", "baseline_reserve_torque.png", "MoBL-ARMS baseline. Left: wrist angle with target and hold window. Right: reserve torque compared with the gravity torque at the wrist."),
  ...figure("baseline_activations.png", "Muscle activations in the MoBL-ARMS baseline. ECRB and ECRL do most of the work, ECU assists, and the flexors stay at their minimum activation.", 560),
  p("ECRB and ECRL carry most of the load, which agrees with their role as the main wrist extensors. Both also pull the wrist into radial deviation; in the baseline this side effect is taken up by the deviation brace (peak 0.49 Nm), whereas in reality ECU would have to balance it."),
  h2("4.3 Check with a planar model"),
  p("Because a MoBL-ARMS solve takes about 45 minutes, we also built a planar wrist model with one lumped extensor and one lumped flexor. Its muscle forces and moment arms come from the MyoHand model (which is derived from MoBL-ARMS) and the hand mass from Winter (2009); fibre and tendon lengths are assumed. On the same task it gives a gravity torque of 0.36–0.50 Nm, a reserve of 0.02 % and an extensor activation of 0.084 during the hold, close to the MoBL-ARMS result, and it solves in seconds. We therefore used it for the first K1–K3 studies."),
);

// 5 Early K1-K3
body.push(h1("5. First Results for K1–K3 (Planar Model)"),
  p("These results come from the planar model and are meant to show trends; the same scripts will be run on MoBL-ARMS in P3."),
  ...figure("planar_k1_sweep.png", "K1 weakness sweep on the planar model. Left: peak extensor activation. Right: reserve torque relative to the gravity torque, with the 10 % failure limit.", 600),
  p("When the extensor strength is reduced, the peak extensor activation rises from 0.11 at full strength to 1.0 below about 12 %. Bisection places the threshold K1 between 10.62 % and 10.75 % of the unimpaired extensor force. At the threshold, the hold-drift criterion is the first to fail. At 4 % strength the coarse solve stopped at the iteration limit; that level fails on every criterion."),
  ...table(["Extensor strength", "Ideal motor: torque limit", "Spring: stiffness (rest angle −60°)", "Spring torque at start / hold"], [
    ["8 %", `0.27${NB}Nm`, `0.28${NB}Nm/rad`, `0.44 / 0.22${NB}Nm`],
    ["5 %", `0.56${NB}Nm`, `0.69${NB}Nm/rad`, `1.08 / 0.54${NB}Nm`],
  ], [2000, 2300, 2900, 2438], "K2: smallest assistance that restores the task (planar model)."),
  p("Below the threshold, a small ideal motor restores the task (Table 3). A linear spring is also sufficient, but it needs 1.6–1.9 times the peak torque of the motor, because it pushes hardest in the flexed start position where gravity is weakest. With the stiffer spring, the muscle effort drops by 82 % at full strength and by 86 % at 30 % strength (K3). The motor effort weight and the spring rest angle are modelling choices that will be optimised in P3."),
  ...figure("planar_assist.png", "K2 and K3 on the planar model: assist torque needed at 8 % and 5 % strength, and muscle-effort reduction with the spring.", 600),
);

// 6 Limitations and next steps
body.push(h1("6. Limitations and Next Steps"),
  bullet("K1–K3 were obtained on the planar model; the thresholds are model-specific and will be repeated on MoBL-ARMS."),
  bullet("Wrist deviation is held by an ideal brace in the baseline, and the finger muscles are not included."),
  bullet("The hold is shaped by a tracking term, so the wrist kinematics are partly prescribed."),
  bullet("The model represents one generic adult and one 1 s task; the results are relative findings, not clinical predictions."),
  p("For P3 we will run the K1 sweep on MoBL-ARMS (coarse mesh with warm starts between strength levels), test the sensitivity to cup mass, movement time and free wrist deviation, and optimise spring stiffness and rest angle as Moco parameters for K2/K3. Route B training in MyoSuite follows in weeks 48–50, and the robustness comparison (K4) for the P4 demo on 16 December."),
  p("All code, configuration files and results are available in the project repository; the README describes how to reproduce every figure."),
);

// 7 Bibliography
const refs = [
  "Caggiano, V., et al. (2022). MyoSuite: A contact-rich simulation suite for musculoskeletal motor control. Proceedings of L4DC, PMLR 168.",
  "Chavarrías, A., Rodriguez-Cianca, D., & Lanillos, P. (2025). Adaptive torque control of exoskeletons under spasticity conditions via reinforcement learning. arXiv:2503.11433.",
  "De Groote, F., Kinney, A. L., Rao, A. V., & Fregly, B. J. (2016). Evaluation of direct collocation optimal control problem formulations for solving the muscle redundancy problem. Annals of Biomedical Engineering. doi:10.1007/s10439-016-1591-9",
  "Delp, S. L., et al. (2007). OpenSim: Open-source software to create and analyze dynamic simulations of movement. IEEE Transactions on Biomedical Engineering, 54(11).",
  "Dembia, C. L., et al. (2020). OpenSim Moco: Musculoskeletal optimal control. PLOS Computational Biology, 16(12), e1008493.",
  "Holzbaur, K. R. S., Murray, W. M., & Delp, S. L. (2005). A model of the upper extremity for simulating musculoskeletal surgery and analyzing neuromuscular control. Annals of Biomedical Engineering, 33(6), 829–840.",
  "Hussain, S., Jamwal, P. K., Van Vliet, P., & Ghayesh, M. H. (2020). State-of-the-art robotic devices for wrist rehabilitation: Design and control aspects. IEEE Transactions on Human-Machine Systems, 50(5), 361–372.",
  "KhalilianMotamed Bonab, A., Chiaradia, D., Frisoli, A., & Leonardis, D. (2024). A framework for modeling, optimization, and musculoskeletal simulation of an elbow–wrist exosuit. Robotics, 13(4), 60.",
  "Lambelet, C., Lyu, M., Woolley, D., Gassert, R., & Wenderoth, N. (2017). The eWrist – A wearable wrist exoskeleton with sEMG-based force control for stroke rehabilitation. Proceedings of IEEE ICORR, 726–733.",
  "Lambelet, C., et al. (2020). Characterization and wearability evaluation of a fully portable wrist exoskeleton for unsupervised training after stroke. Journal of NeuroEngineering and Rehabilitation, 17, 132.",
  "Luo, S., et al. (2024). Experiment-free exoskeleton assistance via learning in simulation. Nature, 630, 353–359.",
  "McFarland, D. C., McCain, E. M., Poppo, M. N., & Saul, K. R. (2019). Spatial dependency of glenohumeral joint stability during dynamic unimanual and bimanual pushing and pulling. Journal of Biomechanical Engineering. doi:10.1115/1.4043035",
  "Nijland, R. H. M., et al. (2010). Presence of finger extension and shoulder abduction within 72 hours after stroke predicts functional recovery: the EPOS cohort study. Stroke, 41(4), 745–750.",
  "Raffin, A., et al. (2021). Stable-Baselines3: Reliable reinforcement learning implementations. Journal of Machine Learning Research, 22(268), 1–8.",
  "Saul, K. R., et al. (2015). Benchmarking of dynamic simulation predictions in two software platforms using an upper limb musculoskeletal model. Computer Methods in Biomechanics and Biomedical Engineering.",
  "Schulman, J., Wolski, F., Dhariwal, P., Radford, A., & Klimov, O. (2017). Proximal policy optimization algorithms. arXiv:1707.06347.",
  "Seth, A., et al. (2018). OpenSim: Simulating musculoskeletal dynamics and neuromuscular control to study human and animal movement. PLOS Computational Biology, 14(7).",
  "Todorov, E., Erez, T., & Tassa, Y. (2012). MuJoCo: A physics engine for model-based control. Proceedings of IEEE/RSJ IROS, 5026–5033.",
  "Wang, H., Caggiano, V., Durandau, G., Sartori, M., & Kumar, V. (2022). MyoSim: Fast and physiologically realistic MuJoCo models for musculoskeletal and exoskeletal studies. Proceedings of IEEE ICRA, 8104–8111.",
  "Winter, D. A. (2009). Biomechanics and Motor Control of Human Movement (4th ed.). Wiley.",
];
body.push(h1("Bibliography"), ...refs.map((r) => new Paragraph({
  spacing: { after: 80 }, indent: { left: 360, hanging: 360 },
  children: [new TextRun({ text: r, size: 20 })],
})));

// ------------------------------------------------------------------ document
const doc = new Document({
  creator: "Team 7",
  title: "P2 Report: Literature Map, Method Outline and Baseline Simulation",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Cambria", size: 26, bold: true },
        paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Cambria", size: 23, bold: true },
        paragraph: { spacing: { before: 180, after: 80 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "Team 7 · P2 Report · ", size: 18, color: "595959" }),
      new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "595959" }),
    ] })] }) },
    children: body,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log(`wrote ${OUT}`);
});
