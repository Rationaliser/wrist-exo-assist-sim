// P2 literature review (Team 7, MDM2 case study), IEEE numbered references.
// Usage:  NODE_PATH=<dir with docx> node presentation/build_p2_litreview.js
// Output: documents/Team7_P2_Literature_Review.docx  (figures are read from results/)
const fs = require("fs");
const path = require("path");
const {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, ImageRun, LevelFormat, Packer,
  PageBreak, PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const RES = (f) => path.join(ROOT, "results", f);
const OUT = path.join(ROOT, "documents", "Team7_P2_Literature_Review.docx");

const CONTENT_W = 9026; // A4 width 11906 dxa minus 2 x 1440 dxa margins
const PX_W = 600;
const GREY = "D9D9D9";
const LIGHT = "F2F2F2";
const NB = " ";
const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border };

// ------------------------------------------------------------------ references (IEEE)
const REFS = {
  gbd2021: 'GBD 2019 Stroke Collaborators, "Global, regional, and national burden of stroke and its risk factors, 1990–2019: A systematic analysis for the Global Burden of Disease Study 2019," Lancet Neurol., vol. 20, no. 10, pp. 795–820, 2021, doi: 10.1016/S1474-4422(21)00252-0.',
  kwakkel2003: 'G. Kwakkel, B. J. Kollen, J. van der Grond, and A. J. H. Prevo, "Probability of regaining dexterity in the flaccid upper limb: Impact of severity of paresis and time since onset in acute stroke," Stroke, vol. 34, no. 9, pp. 2181–2186, 2003.',
  nijland2010: 'R. H. M. Nijland et al., "Presence of finger extension and shoulder abduction within 72 hours after stroke predicts functional recovery: Early prediction of functional outcome after stroke: The EPOS cohort study," Stroke, vol. 41, no. 4, pp. 745–750, 2010.',
  kamper2006: 'D. G. Kamper, H. C. Fischer, E. G. Cruz, and W. Z. Rymer, "Weakness is the primary contributor to finger impairment in chronic stroke," Arch. Phys. Med. Rehabil., vol. 87, no. 9, pp. 1262–1269, 2006, doi: 10.1016/j.apmr.2006.05.013.',
  gonzalez1997: 'R. V. Gonzalez, T. S. Buchanan, and S. L. Delp, "How muscle architecture and moment arms affect wrist flexion-extension moments," J. Biomech., vol. 30, no. 7, pp. 705–712, 1997.',
  bos2016: 'R. A. Bos et al., "A structured overview of trends and technologies used in dynamic hand orthoses," J. NeuroEng. Rehabil., vol. 13, art. no. 62, 2016, doi: 10.1186/s12984-016-0168-z.',
  hussain2020: 'S. Hussain, P. K. Jamwal, P. Van Vliet, and M. H. Ghayesh, "State-of-the-art robotic devices for wrist rehabilitation: Design and control aspects," IEEE Trans. Human-Mach. Syst., vol. 50, no. 5, pp. 361–372, 2020.',
  ates2017: 'S. Ates, C. J. W. Haarman, and A. H. A. Stienen, "SCRIPT passive orthosis: Design of interactive hand and wrist exoskeleton for rehabilitation at home after stroke," Auton. Robots, vol. 41, no. 3, pp. 711–723, 2017, doi: 10.1007/s10514-016-9589-6.',
  lambelet2017: 'C. Lambelet, M. Lyu, D. Woolley, R. Gassert, and N. Wenderoth, "The eWrist – A wearable wrist exoskeleton with sEMG-based force control for stroke rehabilitation," in Proc. IEEE Int. Conf. Rehabil. Robot. (ICORR), 2017, pp. 726–733.',
  lambelet2020: 'C. Lambelet et al., "Characterization and wearability evaluation of a fully portable wrist exoskeleton for unsupervised training after stroke," J. NeuroEng. Rehabil., vol. 17, art. no. 132, 2020, doi: 10.1186/s12984-020-00749-4.',
  peters2017: 'H. T. Peters, S. J. Page, and A. C. Persch, "Giving them a hand: Wearing a myoelectric elbow-wrist-hand orthosis reduces upper extremity impairment in chronic stroke," Arch. Phys. Med. Rehabil., 2017.',
  zhang2017: 'J. Zhang et al., "Human-in-the-loop optimization of exoskeleton assistance during walking," Science, vol. 356, no. 6344, pp. 1280–1284, 2017, doi: 10.1126/science.aal5054.',
  delp2007: 'S. L. Delp et al., "OpenSim: Open-source software to create and analyze dynamic simulations of movement," IEEE Trans. Biomed. Eng., vol. 54, no. 11, 2007.',
  seth2018: 'A. Seth et al., "OpenSim: Simulating musculoskeletal dynamics and neuromuscular control to study human and animal movement," PLoS Comput. Biol., vol. 14, no. 7, 2018.',
  holzbaur2005: 'K. R. S. Holzbaur, W. M. Murray, and S. L. Delp, "A model of the upper extremity for simulating musculoskeletal surgery and analyzing neuromuscular control," Ann. Biomed. Eng., vol. 33, no. 6, pp. 829–840, 2005.',
  saul2015: 'K. R. Saul et al., "Benchmarking of dynamic simulation predictions in two software platforms using an upper limb musculoskeletal model," Comput. Methods Biomech. Biomed. Eng., 2015.',
  mcfarland2019: 'D. C. McFarland, E. M. McCain, M. N. Poppo, and K. R. Saul, "Spatial dependency of glenohumeral joint stability during dynamic unimanual and bimanual pushing and pulling," J. Biomech. Eng., 2019, doi: 10.1115/1.4043035.',
  millard2013: 'M. Millard, T. Uchida, A. Seth, and S. L. Delp, "Flexing computational muscle: Modeling and simulation of musculotendon dynamics," J. Biomech. Eng., vol. 135, no. 2, art. no. 021005, 2013, doi: 10.1115/1.4023390.',
  crowninshield1981: 'R. D. Crowninshield and R. A. Brand, "A physiologically based criterion of muscle force prediction in locomotion," J. Biomech., vol. 14, no. 11, pp. 793–801, 1981.',
  degroote2016: 'F. De Groote, A. L. Kinney, A. V. Rao, and B. J. Fregly, "Evaluation of direct collocation optimal control problem formulations for solving the muscle redundancy problem," Ann. Biomed. Eng., 2016, doi: 10.1007/s10439-016-1591-9.',
  dembia2020: 'C. L. Dembia et al., "OpenSim Moco: Musculoskeletal optimal control," PLoS Comput. Biol., vol. 16, no. 12, art. no. e1008493, 2020.',
  falisse2019: 'A. Falisse, G. Serrancolí, C. L. Dembia, J. Gillis, I. Jonkers, and F. De Groote, "Rapid predictive simulations with complex musculoskeletal models suggest that diverse healthy and pathological human gaits can emerge from similar control strategies," J. R. Soc. Interface, vol. 16, no. 157, art. no. 20190402, 2019, doi: 10.1098/rsif.2019.0402.',
  ong2019: 'C. F. Ong, T. Geijtenbeek, J. L. Hicks, and S. L. Delp, "Predicting gait adaptations due to ankle plantarflexor muscle weakness and contracture using physics-based musculoskeletal simulations," PLoS Comput. Biol., vol. 15, no. 10, art. no. e1006993, 2019.',
  uchida2016: 'T. K. Uchida, A. Seth, S. Pouya, C. L. Dembia, J. L. Hicks, and S. L. Delp, "Simulating ideal assistive devices to reduce the metabolic cost of running," PLoS ONE, vol. 11, no. 9, art. no. e0163417, 2016.',
  khalilian2024: 'A. KhalilianMotamed Bonab, D. Chiaradia, A. Frisoli, and D. Leonardis, "A framework for modeling, optimization, and musculoskeletal simulation of an elbow–wrist exosuit," Robotics, vol. 13, no. 4, art. no. 60, 2024.',
  winter2009: 'D. A. Winter, Biomechanics and Motor Control of Human Movement, 4th ed. Hoboken, NJ, USA: Wiley, 2009.',
  recht2019: 'B. Recht, "A tour of reinforcement learning: The view from continuous control," Annu. Rev. Control Robot. Auton. Syst., 2019, arXiv:1806.09460.',
  schulman2017: 'J. Schulman, F. Wolski, P. Dhariwal, A. Radford, and O. Klimov, "Proximal policy optimization algorithms," arXiv:1707.06347, 2017.',
  raffin2021: 'A. Raffin et al., "Stable-Baselines3: Reliable reinforcement learning implementations," J. Mach. Learn. Res., vol. 22, no. 268, pp. 1–8, 2021.',
  todorov2012: 'E. Todorov, T. Erez, and Y. Tassa, "MuJoCo: A physics engine for model-based control," in Proc. IEEE/RSJ Int. Conf. Intell. Robots Syst. (IROS), 2012, pp. 5026–5033.',
  caggiano2022: 'V. Caggiano et al., "MyoSuite: A contact-rich simulation suite for musculoskeletal motor control," in Proc. Learning for Dynamics and Control Conf. (L4DC), PMLR vol. 168, 2022.',
  wang2022: 'H. Wang, V. Caggiano, G. Durandau, M. Sartori, and V. Kumar, "MyoSim: Fast and physiologically realistic MuJoCo models for musculoskeletal and exoskeletal studies," in Proc. IEEE Int. Conf. Robot. Autom. (ICRA), 2022, pp. 8104–8111.',
  song2021: 'S. Song et al., "Deep reinforcement learning for modeling human locomotion control in neuromechanical simulation," J. NeuroEng. Rehabil., vol. 18, art. no. 126, 2021, doi: 10.1186/s12984-021-00919-y.',
  luo2024: 'S. Luo et al., "Experiment-free exoskeleton assistance via learning in simulation," Nature, vol. 630, pp. 353–359, 2024.',
  chavarrias2025: 'A. Chavarrías, D. Rodriguez-Cianca, and P. Lanillos, "Adaptive torque control of exoskeletons under spasticity conditions via reinforcement learning," arXiv:2503.11433, 2025.',
  peng2018: 'X. B. Peng, P. Abbeel, S. Levine, and M. van de Panne, "DeepMimic: Example-guided deep reinforcement learning of physics-based character skills," ACM Trans. Graph., vol. 37, no. 4, art. no. 143, 2018, doi: 10.1145/3197517.3201311.',
  levine2013: 'S. Levine and V. Koltun, "Guided policy search," in Proc. Int. Conf. Mach. Learn. (ICML), PMLR vol. 28, 2013.',
  mordatch2014: 'I. Mordatch and E. Todorov, "Combining the benefits of function approximation and trajectory optimization," in Proc. Robotics: Science and Systems X, 2014.',
  tobin2017: 'J. Tobin, R. Fong, A. Ray, J. Schneider, W. Zaremba, and P. Abbeel, "Domain randomization for transferring deep neural networks from simulation to the real world," in Proc. IEEE/RSJ Int. Conf. Intell. Robots Syst. (IROS), 2017, pp. 23–30, doi: 10.1109/IROS.2017.8202133.',
};
const order = [];
function c(...keys) { // IEEE citation, numbered in order of first appearance
  const nums = keys.map((k) => {
    if (!REFS[k]) throw new Error(`unknown reference ${k}`);
    if (!order.includes(k)) order.push(k);
    return order.indexOf(k) + 1;
  }).sort((a, b) => a - b);
  return "[" + nums.join("], [") + "]";
}

// ------------------------------------------------------------------ helpers
const runs = (text) => (Array.isArray(text) ? text : [text]).map((t) => (typeof t === "string" ? new TextRun(t) : t));
const p = (text, opts = {}) => new Paragraph({ spacing: { after: 140, line: 276 }, alignment: AlignmentType.JUSTIFIED, ...opts, children: runs(text) });
const b = (t) => new TextRun({ text: t, bold: true });
const i = (t) => new TextRun({ text: t, italics: true });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const bullet = (text) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80, line: 276 }, alignment: AlignmentType.JUSTIFIED, children: runs(text) });
const numbered = (ref, text) => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: 276 }, alignment: AlignmentType.JUSTIFIED, children: runs(text) });

function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), buf };
}
let figNo = 0;
function figure(file, caption, widthPx = PX_W) {
  figNo += 1;
  const { w, h, buf } = pngSize(RES(file));
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true,
      children: [new ImageRun({ type: "png", data: buf, transformation: { width: widthPx, height: Math.round(widthPx * h / w) },
        altText: { title: file, description: caption, name: file } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 },
      children: [new TextRun({ text: `Fig. ${figNo}. `, bold: true, size: 19 }), new TextRun({ text: caption, size: 19 })] }),
  ];
}
let tabNo = 0;
function table(header, rows, widths, caption, fontSize = 19) {
  tabNo += 1;
  const total = widths.reduce((a, x) => a + x, 0);
  const mk = (text, w, head) => new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: head ? { fill: GREY, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: head, size: fontSize })] })],
  });
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160, after: 80 }, keepNext: true,
      children: [new TextRun({ text: `TABLE ${tabNo}`, bold: true, size: 19 }), new TextRun({ text: `. ${caption}`, size: 19 })] }),
    new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths,
      rows: [new TableRow({ tableHeader: true, children: header.map((t, k) => mk(t, widths[k], true)) }),
        ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((t, k) => mk(t, widths[k], false)) }))] }),
    new Paragraph({ spacing: { after: 140 }, children: [] }),
  ];
}
function infoTable(rows) {
  const w = [2700, CONTENT_W - 2700];
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: w,
    rows: rows.map(([k, v], n) => new TableRow({ children: [
      new TableCell({ borders, width: { size: w[0], type: WidthType.DXA }, shading: { fill: n % 2 ? GREY : LIGHT, type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 40, bottom: 40, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 21 })] })] }),
      new TableCell({ borders, width: { size: w[1], type: WidthType.DXA }, shading: { fill: n % 2 ? GREY : "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 40, bottom: 40, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: v, size: 21 })] })] }),
    ] })) });
}

// ------------------------------------------------------------------ content
const body = [];

body.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: "MDM2 – Case Study: Assistive Robotics for", bold: true, size: 30, font: "Cambria" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: "Improvement of Life Quality", bold: true, size: 30, font: "Cambria" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 0 }, children: [new TextRun({ text: "Literature Review", bold: true, size: 28, font: "Cambria" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 280 }, children: [new TextRun({ text: "Sizing and Controlling Wrist Assistance after Stroke: Why Compare Optimal Control and Reinforcement Learning?", italics: true, size: 24, font: "Cambria" })] }),
  infoTable([
    ["Team", "Team 7"],
    ["Members", "Vedant Joshi, Navya Nagendra, Harshil Safi"],
    ["Project Title", "Simulation-based design of wrist exoskeleton assistance for post-stroke wrist-extensor weakness: optimal control vs. reinforcement learning"],
    ["Supervisor", "Prof. Hamidreza Heidari"],
    ["GitHub Repository", "https://github.com/Rationaliser/wrist-exo-assist-sim"],
    ["Submission Date", "2026-11-08"],
  ]),
  new Paragraph({ spacing: { after: 200 }, children: [] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "Abstract", bold: true, font: "Cambria", size: 24 })] }),
  p(`Weak wrist extensors after stroke let the hand drop under gravity, so that simple tasks such as lifting a cup and holding it level become difficult. Wrist exoskeletons can compensate, but two engineering questions have to be answered before such a device is built: how much assistance is needed, and how should the device produce it while the user moves? This review collects the literature that informs both questions. It covers the clinical background of upper-limb impairment, passive and powered wrist and hand orthoses, musculoskeletal simulation with optimal control, and reinforcement learning (RL) for musculoskeletal and exoskeleton control. The central argument is that optimal control and RL answer different parts of the device problem. Optimal control computes the best possible movement for a known model and task, which makes it the right tool for sizing assistance and for providing a reference. RL produces a feedback controller that can react to disturbances, which is what a device needs in use, but it gives no guarantee of optimality. Comparing the two on the same task therefore does not ask which algorithm is better in general. It measures how close a practical controller comes to the best case, how much robustness costs in effort and torque, and whether a passive spring or an actuated, controlled device is the better design for a given level of weakness. We found no published study that makes this comparison for a weakened wrist, which defines the gap our project addresses.`),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Contents", bold: true, font: "Cambria", size: 26 })] }),
  ...[
    "1. Introduction",
    "2. Clinical and Biomechanical Background",
    "3. Wrist and Hand Assistive Devices",
    "4. Musculoskeletal Simulation and Optimal Control",
    "5. Learning-Based Control",
    "6. Why Compare Optimal Control and Reinforcement Learning?",
    "7. Research Gap",
    "8. Implications for Our Methodology",
    "9. Threats to Validity",
    "10. Conclusion",
    "References",
  ].map((t) => new Paragraph({ spacing: { after: 60 }, indent: { left: 360 }, children: [new TextRun(t)] })),
  new Paragraph({ spacing: { before: 360, after: 120 }, children: [new TextRun({ text: "Abbreviations", bold: true, font: "Cambria", size: 26 })] }),
  ...(() => {
    const rows = [
      ["ECRL, ECRB, ECU", "Extensor carpi radialis longus, extensor carpi radialis brevis, extensor carpi ulnaris"],
      ["FCR, FCU, PL", "Flexor carpi radialis, flexor carpi ulnaris, palmaris longus"],
      ["K1–K4", "Project outcome measures: strength threshold, minimum assist torque, effort reduction, robustness"],
      ["MoBL-ARMS", "Upper-limb musculoskeletal model (Stanford/NCSU), used in OpenSim"],
      ["Moco", "OpenSim Moco, optimal control toolkit for OpenSim models"],
      ["MuJoCo", "Multi-Joint dynamics with Contact, physics engine"],
      ["MyoSuite", "Musculoskeletal simulation and learning suite built on MuJoCo"],
      ["OC", "Optimal control"],
      ["PPO", "Proximal Policy Optimization, an RL algorithm"],
      ["RL", "Reinforcement learning"],
      ["sEMG", "Surface electromyography"],
    ];
    const w = [2200, CONTENT_W - 2200];
    return [new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: w,
      rows: rows.map(([k, v]) => new TableRow({ children: [
        new TableCell({ borders, width: { size: w[0], type: WidthType.DXA }, shading: { fill: LIGHT, type: ShadingType.CLEAR, color: "auto" },
          margins: { top: 40, bottom: 40, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20 })] })] }),
        new TableCell({ borders, width: { size: w[1], type: WidthType.DXA },
          margins: { top: 40, bottom: 40, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: v, size: 20 })] })] }),
      ] })) })];
  })(),
  new Paragraph({ children: [new PageBreak()] }),
);

// 1 Introduction
body.push(h1("1. Introduction"),
  p(`Stroke remains one of the leading causes of death and disability worldwide ${c("gbd2021")}. Many survivors live with lasting impairment of the arm and hand, and the chances of regaining dexterity depend strongly on how severe the paresis is in the first weeks ${c("kwakkel2003")}. One common consequence is weakness of the wrist and finger extensors. When the forearm is turned palm down, the weight of the hand and of anything held in it pulls the wrist into flexion, and a weak extensor group cannot hold it level. This "wrist drop" makes the hand hard to position for grasping and turns everyday actions such as drinking from a cup into a struggle.`),
  p(`Wearable wrist exoskeletons and dynamic orthoses can add extension torque at the wrist. They range from passive devices with springs or elastic bands to powered devices with motors and sensors ${c("bos2016", "hussain2020")}. For a designer, two questions come first. The first is about sizing: how much torque has to be added at a given level of weakness, and is a simple spring enough, or does the device need a motor? The second is about control: if a motor is used, how should it decide in real time how much to push, given that the user, the load and the movement change from moment to moment?`),
  p(`Our project studies both questions in simulation, using two routes. Route A uses OpenSim Moco ${c("dembia2020")} with the MoBL-ARMS upper-limb model ${c("holzbaur2005", "saul2015")} to predict the movement and muscle activity for lifting and holding a cup, to find the extensor strength at which the task fails, and to find the smallest spring or motor torque that restores it. Route B trains a reinforcement-learning (RL) controller in MyoSuite ${c("caggiano2022")} for the same task and compares its behaviour with the optimal-control plan when the task is disturbed.`),
  p([`Our supervisor has repeatedly asked a fair question: `, i("why compare these two approaches at all, and what do we gain from the comparison?"), ` This review is organised to answer that question from the literature. Section 2 summarises the clinical and biomechanical background of the task. Section 3 reviews wrist and hand assistive devices and how their assistance is currently chosen. Section 4 covers musculoskeletal simulation and optimal control, including studies that predict the effect of weakness and studies that simulate ideal assistive devices. Section 5 covers RL for musculoskeletal and exoskeleton control. Section 6 brings these lines together and explains why we compare optimal control and RL, what each contributes, how the comparison will be evaluated and what its possible outcomes would mean. Section 7 states the research gap, Section 8 explains how the literature shapes our methodology, Section 9 discusses threats to validity, and Section 10 concludes.`]),
);

// 2 Clinical background
body.push(h1("2. Clinical and Biomechanical Background"),
  h2("2.1 Upper-limb impairment after stroke"),
  p(`The burden of stroke is large and global; the Global Burden of Disease analysis reports incidence, prevalence, mortality and disability for 204 countries and territories between 1990 and 2019 and attributes much of the burden to modifiable risk factors ${c("gbd2021")}. For the upper limb, recovery is limited. In a cohort of 102 patients with a flaccid arm after stroke, Kwakkel et al. found that only 38 % regained some dexterity after six months and 11.6 % recovered fully, and that the outcome could be predicted within about four weeks after onset from the Fugl-Meyer motor score ${c("kwakkel2003")}.`),
  p(`The extensor side of the forearm plays a special role in this prognosis. In the EPOS cohort, patients who could voluntarily extend their fingers and abduct the shoulder within 72 hours after stroke had a probability of about 0.98 of regaining some dexterity at six months, compared with about 0.25 for patients without these movements ${c("nijland2010")}. Simple bedside tests of finger extension are now widely used for early prediction. In chronic stroke, Kamper et al. compared survivors with severe and moderate hand impairment and found that weakness, especially of grip and finger extension, explained most of the difference, while biomechanical factors such as passive stiffness played a smaller role; they linked the weakness to a loss of corticospinal drive ${c("kamper2006")}. For our project this supports the simplifying assumption that the main deficit to be compensated is a loss of extensor force, which can be modelled by scaling the maximum force of the extensor muscles.`),
  h2("2.2 Biomechanics of the wrist and of the cup task"),
  p(`Wrist flexion and extension are produced by several muscles that cross the wrist. The main extensors are extensor carpi radialis longus (ECRL), extensor carpi radialis brevis (ECRB) and extensor carpi ulnaris (ECU); the main flexors are flexor carpi radialis (FCR), flexor carpi ulnaris (FCU) and palmaris longus (PL). Extrinsic finger muscles also cross the wrist and contribute to its moments. Gonzalez et al. built a three-dimensional model of 15 wrist muscles and showed that the maximum flexion moment exceeds the maximum extension moment, mainly because the flexors have about 110 % of the summed physiological cross-sectional area of the extensors, and that the flexion moment varies more with wrist angle because the moment arms of the main flexors change more ${c("gonzalez1997")}. The extensor side is therefore weaker to begin with, and a stroke-related loss of extensor force leaves little reserve.`),
  p(`The task we study is quasi-static but demanding for the extensors. With the forearm pronated, gravity acting on the hand and on a cup held in it produces a torque about the wrist flexion axis that pulls the wrist into flexion. The size of this torque follows from the segment mass and centre of mass, for which standard anthropometric tables are available ${c("winter2009")}. In our MoBL-ARMS set-up with a 0.3${NB}kg cup, the gravity torque at the wrist is about 0.37${NB}Nm with the wrist flexed by 30° and about 0.54${NB}Nm with the wrist extended by 15°. Lifting the hand from the dropped position and then holding it requires the extensors to supply at least this torque, plus whatever is needed to overcome passive tissue and any co-contraction of the flexors.`),
);

// 3 Devices
body.push(h1("3. Wrist and Hand Assistive Devices"),
  h2("3.1 Overview and classification"),
  p(`Bos et al. collected 165 dynamic hand orthoses and organised their mechatronic components into signal, energy and mechanical domains ${c("bos2016")}. Their overview shows that devices differ mainly in where the assisting energy comes from (springs, elastic elements or actuators) and how the device decides when to assist (no decision at all, a fixed schedule, or a signal from the user such as electromyography). Hussain et al. reviewed robotic devices for wrist rehabilitation and distinguished end-effector robots, which the patient holds, from wearable orthoses, which are attached to the forearm and hand; they also summarised the control strategies used, from position control to assist-as-needed and interaction control ${c("hussain2020")}. For daily-life assistance, as opposed to clinical training, wearable devices are the relevant class, and weight, comfort and simplicity become important design constraints.`),
  h2("3.2 Passive devices"),
  p(`Passive orthoses use springs or elastic elements to add an extension torque without motors or batteries. The SCRIPT passive orthosis is a hand and wrist exoskeleton for home rehabilitation after stroke that provides compliant, adjustable extension assistance at the wrist and fingers and connects to motivational games; prototypes were evaluated by therapists and used independently at home by 33 patients ${c("ates2017")}. Passive devices are light, cheap and safe, and they do not need a controller. Their limitation is that a spring follows a fixed torque–angle law. It cannot tell whether the user is trying to lift, hold or put down the cup, and its torque cannot adapt to a heavier load or to fatigue. If the spring is stiff enough for the hardest part of the task, it may push too much elsewhere and resist the user's own flexion.`),
  h2("3.3 Powered devices"),
  p(`Powered devices replace or complement the spring with an actuator and a sensor-based controller. The eWrist is a wearable one-degree-of-freedom wrist exoskeleton that supports flexion and extension with a DC motor and uses surface electromyography (sEMG) for force control ${c("lambelet2017")}. A later version weighs less than 500${NB}g and can be put on and taken off with one hand; its wearability was evaluated with 15 healthy participants and two stroke survivors ${c("lambelet2020")}. Commercial myoelectric orthoses follow the same principle: in a cohort of 18 chronic stroke survivors with moderate impairment, wearing a myoelectric elbow-wrist-hand orthosis was associated with lower impairment on the Fugl-Meyer scale and better dexterity on the Box and Block test ${c("peters2017")}. Powered devices can adapt their assistance, but they are heavier, need energy and, above all, need a controller that works reliably for a user whose strength, intention and environment vary.`),
  ...table(["Aspect", "Passive (spring, elastic)", "Powered (motor + controller)"], [
    ["Source of torque", "Stored elastic energy; fixed torque–angle law", "Actuator; torque set by a controller at every instant"],
    ["Adaptation", "None, unless adjusted manually", "Can adapt to task phase, load, fatigue and intention"],
    ["Main design question", "Stiffness and rest angle", "Torque capacity and control law"],
    ["Advantages", "Light, cheap, safe, no energy or electronics", "Flexible, can assist only when needed"],
    ["Disadvantages", "Cannot react; may resist voluntary flexion", "Weight, energy, cost, safety; controller must be robust"],
    ["Examples", `SCRIPT passive orthosis ${c("ates2017")}`, `eWrist ${c("lambelet2017", "lambelet2020")}; myoelectric orthosis ${c("peters2017")}`],
  ], [1900, 3563, 3563], "Passive and powered wrist assistance compared."),
  h2("3.4 How the amount of assistance is chosen today"),
  p(`In most device studies the assistance is chosen by the designers and then tuned on the user. Zhang et al. showed how much this tuning matters: by measuring metabolic cost while adjusting the torque profile of an ankle exoskeleton online, they reduced the metabolic cost of walking by about 24 % on average in 11 participants compared with walking with the device unpowered ${c("zhang2017")}. Their result also shows the cost of this approach: every user has to be tested, the search takes time, and the measured quantity has to be available in the lab. For stroke survivors, long experimental sessions are tiring, and the quantities that matter, such as the activation of individual wrist muscles, are hard to measure.`),
  p(`This is where simulation becomes attractive. A musculoskeletal model can estimate the torque a weakened wrist needs, test springs and motors of different sizes, and predict how muscle activity changes, before a prototype exists. The next two sections review the two families of simulation methods we use for this purpose.`),
);

// 4 Simulation and optimal control
body.push(h1("4. Musculoskeletal Simulation and Optimal Control"),
  h2("4.1 Simulation platforms and the MoBL-ARMS model"),
  p(`OpenSim is an open-source platform for building musculoskeletal models and simulating movement ${c("delp2007")}; its later version extended the software with more efficient muscle models, constraints and tools for studying neuromuscular control ${c("seth2018")}. The upper-limb model we use goes back to Holzbaur et al., who built a model with 15 degrees of freedom and 50 muscle compartments for the shoulder, elbow, forearm, wrist, thumb and index finger and validated its moment arms and moment-generating capacity against experimental data ${c("holzbaur2005")}. Saul et al. turned it into a dynamic model (MoBL-ARMS) and benchmarked its simulation predictions in two software platforms ${c("saul2015")}, and McFarland et al. updated it with a larger range of shoulder motion, ligament models and the Millard muscle model ${c("mcfarland2019")}. The Millard model represents the force–length–velocity behaviour of muscle fibres and the elasticity of tendons; Millard et al. also showed that assuming a rigid tendon, which speeds up simulation, can cause force errors of up to about 21 % of maximum isometric force in some conditions ${c("millard2013")}. This is relevant for our choice to start with rigid tendons and treat elastic tendons as a later refinement.`),
  h2("4.2 Muscle redundancy and effort criteria"),
  p(`Because many muscles cross each joint, there are infinitely many combinations of muscle forces that produce the same joint torque. Simulations therefore resolve this redundancy with an optimisation criterion that represents how the nervous system is assumed to share the load. Crowninshield and Brand proposed a criterion based on muscle endurance and showed that it predicted muscle activity patterns in agreement with electromyography during gait ${c("crowninshield1981")}. Minimising the sum of squared (or higher-power) muscle activations or excitations, as used in our study, belongs to this family of effort criteria. The choice of criterion is an assumption, and part of our validation is to check that the predicted muscle patterns are plausible, for example that the extensors and not the flexors carry the load in the cup task.`),
  h2("4.3 Optimal control with direct collocation"),
  p(`Optimal control generalises this idea from single postures to whole movements. The movement, the muscle states and the controls are all treated as unknowns, the musculoskeletal dynamics act as constraints, and the solver finds the trajectory that minimises a cost such as muscle effort while reaching a task goal. Direct collocation turns this into a large but sparse nonlinear programme. De Groote et al. compared formulations of the muscle redundancy problem and found that implicit formulations of muscle contraction dynamics converged reliably and quickly, whereas some explicit formulations often failed ${c("degroote2016")}. OpenSim Moco packages these methods: it solves tracking and predictive problems for OpenSim models with direct collocation, supports kinematic constraints, and can optimise model parameters together with the motion ${c("dembia2020")}. The last feature is important for device design, because parameters such as the stiffness of an assistive spring can be optimised at the same time as the movement.`),
  p(`Falisse et al. showed how far this approach can go. Using direct collocation, implicit dynamics and algorithmic differentiation, they generated three-dimensional muscle-driven walking simulations in about 36 minutes on average, more than 20 times faster than earlier methods, and found that a single criterion combining energy and effort reproduced healthy walking, the walk-to-run transition and gait deficits caused by muscle weakness and by prosthesis use ${c("falisse2019")}.`),
  h2("4.4 Predicting the effect of weakness"),
  p(`Simulation can isolate the effect of a single impairment in a way that experiments with patients cannot, because patients usually have several deficits at once. Ong et al. trained a planar walking model with 18 musculotendon actuators and then added mild, moderate or severe weakness or contracture to the plantarflexor muscles. The model stayed stable in every case, and severe weakness produced a slower, heel-walking gait, while severe contracture produced toe walking ${c("ong2019")}. Together with the weakness predictions of Falisse et al. ${c("falisse2019")}, this establishes the approach we use for K1: reduce the strength of one muscle group step by step in a predictive simulation and observe when and how the task can no longer be performed. Our contribution is to apply it to the wrist extensors and to a task of daily living rather than to gait.`),
  h2("4.5 Simulating ideal assistive devices"),
  p(`The same models can include assistive devices. Uchida et al. added ideal, massless assistive devices to muscle-driven simulations of ten subjects running at two speeds and examined how muscle recruitment and metabolic power changed ${c("uchida2016")}. They found that the best device does not simply replace the net joint moment produced by the muscles, and that assisting one joint can reduce the activity of muscles that do not cross it. KhalilianMotamed Bonab et al. presented a framework that combines modelling, optimisation and musculoskeletal simulation to design an elbow–wrist exosuit for a load-lifting task ${c("khalilian2024")}. These studies show that optimal control is an accepted way to size assistive devices. They also share three limitations that matter for our question: they consider healthy users, the assistance is optimised for one nominal condition that is known in advance, and the optimised assistance is a plan rather than a controller that could run on a device.`),
);

body.push(h2("4.6 Limits of optimal control for device design"),
  p(`Optimal control has four limitations that are important for this project. First, the solution is only as good as the model: muscle parameters, tendon properties and the effort criterion are assumptions, and a different criterion can change the predicted muscle sharing ${c("crowninshield1981", "millard2013")}. Second, the solvers are local: direct collocation converges to a local optimum near the initial guess, so a good guess and well-scaled problems matter ${c("degroote2016")}. Third, even with modern formulations a complex three-dimensional model takes minutes to hours per solve ${c("falisse2019")}; in our case each MoBL-ARMS solve takes about 18–28 minutes, which limits how many conditions can be explored and rules out using the solver as a real-time controller. Fourth, and most important for our question, a single solution is an open-loop plan: it states what the muscles and the device should do over time for the conditions assumed in the problem, but not how they should respond if the cup is heavier than expected, if the arm is pushed, or if the muscles fatigue.`),
  p(`These limitations do not reduce the value of optimal control for sizing; they define where it ends. The sizing question is asked under nominal, known conditions, and that is exactly the setting in which optimal control is strongest. The control question begins where these limitations start to matter.`),
);

// 5 Learning-based control
body.push(h1("5. Learning-Based Control"),
  h2("5.1 Reinforcement learning as approximate optimal control"),
  p(`Reinforcement learning solves a closely related problem by trial and error. An agent interacts with an environment, receives a reward and gradually improves a policy, a function that maps the current state to an action. Recht describes RL from the perspective of optimisation and control and points out that it addresses the same optimal control problem when the dynamics are unknown or are only available through simulation; he also argues that the role of models and the cost of generality should not be underestimated ${c("recht2019")}. Policy-gradient methods such as Proximal Policy Optimization (PPO) are widely used for continuous control because they are relatively stable and simple to tune ${c("schulman2017")}, and reliable open-source implementations are available in Stable-Baselines3 ${c("raffin2021")}. The key practical difference from trajectory optimisation is the output: RL produces a feedback policy that can be evaluated in milliseconds for any state it encounters, rather than a single trajectory for one initial condition.`),
  h2("5.2 Musculoskeletal environments for learning"),
  p(`RL needs fast simulation, because policies are trained over millions of steps. MuJoCo is a physics engine designed for model-based control that computes multi-joint dynamics in generalised coordinates with efficient contact handling ${c("todorov2012")}. MyoSuite builds on it and provides physiologically realistic musculoskeletal models of the hand, arm and legs together with tasks and benchmarks; it includes options for muscle fatigue, sarcopenia and exoskeleton co-simulation ${c("caggiano2022")}. Its models were generated by an automated pipeline from established OpenSim models, including a wrist-and-hand model derived from MoBL-ARMS, and run more than two orders of magnitude faster than earlier musculoskeletal simulations ${c("wang2022")}. This shared origin is useful for us, because it means that the OpenSim and MyoSuite models of the wrist are related and their results can be compared, although not expected to be identical.`),
  p(`Song et al. reviewed the use of deep RL with neuromechanical simulation for human locomotion and reported on the "Learn to Move" competitions held at NeurIPS from 2017 to 2019, in which participants developed controllers for a musculoskeletal model in the OpenSim-RL environment ${c("song2021")}. The best teams produced fast turning and walk-to-stand transitions that had not been shown before in neuromechanical simulation without reference motion data. The review also discusses the open problems of this approach, including the large amount of training required, the sensitivity to reward design and the difficulty of interpreting learned controllers.`),
  h2("5.3 Learning exoskeleton controllers"),
  p(`RL has recently been used to obtain exoskeleton controllers directly in simulation. Luo et al. trained a controller for a hip exoskeleton entirely in simulation, combining musculoskeletal models with learning, and transferred it to the physical device without per-user experimental tuning, reporting reductions in the metabolic cost of walking, running and stair climbing ${c("luo2024")}. Chavarrías et al. trained an exoskeleton torque controller with RL in MyoSuite to adapt to spasticity, for the knee ${c("chavarrias2025")}. These studies show that learned controllers can deal with variability that a fixed plan cannot, and that musculoskeletal simulation can replace part of the experimental tuning discussed in Section 3.4. None of them addresses the wrist, and none compares the learned controller with an optimal-control benchmark for the same task.`),
  h2("5.4 Reference motions and robustness"),
  p(`Two further ideas from the RL literature shape our Route B. The first is to guide learning with a reference motion. In DeepMimic, Peng et al. trained physics-based characters to imitate motion clips with a reward that combines imitation of the reference and a task objective, and obtained robust policies for highly dynamic skills ${c("peng2018")}. Our plan to reward the RL agent for following the Moco wrist trajectory follows the same principle. The second idea is to train for robustness by randomising the simulation. Tobin et al. showed that randomising simulator properties during training lets policies transfer to conditions they were not explicitly trained for ${c("tobin2017")}. Varying the cup mass, applying pushes and enabling muscle fatigue during training is the equivalent for our task.`),
);

body.push(h2("5.5 Limits of reinforcement learning for assistive devices"),
  p(`RL brings its own difficulties. It needs a large number of simulated trials, so it depends on fast simulators such as MuJoCo and MyoSuite ${c("todorov2012", "caggiano2022")}. Its outcome depends on the reward: a reward that only asks for the cup to be held may produce strategies with heavy co-contraction or unnatural postures, and a reward that tracks a reference motion depends on the quality of that reference ${c("song2021", "peng2018")}. The learned policy gives no guarantee that it is optimal, and because it is a neural network it is difficult to explain why it produces a given muscle pattern. Finally, a policy trained in simulation inherits the simulator's errors; randomising the simulation during training reduces but does not remove this sim-to-real gap ${c("tobin2017")}. Luo et al. showed that the gap can be bridged for an exoskeleton, but with a carefully designed training framework ${c("luo2024")}.`),
  p(`For a wrist device used by stroke survivors, these limitations translate into practical risks: a controller that is robust but wasteful, a controller that behaves well in training conditions but not outside them, and a controller whose decisions are hard to justify to clinicians. The comparison with an optimal-control benchmark, described next, addresses the first and the third of these risks directly.`),
);

// 6 Why compare
body.push(h1("6. Why Compare Optimal Control and Reinforcement Learning?"),
  p(`This section answers the question that motivates this review. In short: optimal control and RL are not competing answers to the same engineering question. They answer two different questions that a wrist exoskeleton designer has to answer together, and comparing them on the same task tells us how the two answers relate. Fig. 1 summarises the argument.`),
  ...figure("comparison_concept.png", "What optimal control and reinforcement learning each contribute, and what the comparison adds.", 560),
  h2("6.1 Two questions in device development"),
  p([b("The sizing question. "), `Before building a device, the designer needs to know the minimum assistance that restores the task at a given level of weakness, and whether a passive spring can provide it. This calls for a best-case answer under controlled, known conditions. Optimal control is designed for exactly this: for a given model, task and cost, it returns the movement with the least effort, and the assistance torque in that solution is a lower bound on what any device would need ${c("uchida2016", "dembia2020")}. RL is poorly suited to this question, because it gives no guarantee that the learned policy is optimal, and its result depends on the reward design.`]),
  p([b("The control question. "), `Once a powered device exists, it needs a controller that decides at every instant how much to push, using the information available from sensors, while the load, the user's strength and the movement change. Optimal control solutions are plans: they are computed for one initial condition and one known set of parameters, and recomputing them takes minutes rather than milliseconds (about 18–28 minutes per solve for our MoBL-ARMS model). Replayed without feedback, such a plan cannot react to a push or to a heavier cup. RL produces a feedback policy that can react to disturbances it has seen in training ${c("song2021", "luo2024")}, which is what a device needs in daily use.`]),
  p(`A real device needs both answers, and the two answers are linked. A passive spring is effectively an open-loop design: its torque–angle law is fixed in advance, much like an optimal-control plan. A motor only makes sense together with a controller. Whether the extra complexity of a motor is worth it therefore depends on how much a feedback controller gains over a fixed plan or a fixed spring when conditions change. That is precisely what the comparison measures.`),
  ...table(["", "Optimal control (Moco)", "Reinforcement learning (MyoSuite, PPO)"], [
    ["Problem solved", "Minimise a cost subject to the model dynamics for a known task", "Maximise expected reward by trial and error in simulation"],
    ["Output", "One optimal trajectory with muscle activations and assist torque", "A feedback policy: state → muscle and device commands"],
    ["Optimality", "Locally optimal by construction; clear benchmark", "No guarantee; depends on reward and training"],
    ["Reaction to disturbances", "None when replayed open loop; must be re-solved", "Built in, for disturbances covered in training"],
    ["Computation", "Minutes per solve; nothing to train", "Hours of training; milliseconds per decision"],
    ["Interpretability", "Costs, constraints and muscle forces are explicit", "Policy is a neural network; harder to interpret"],
    ["Best use in our project", "Sizing: K1, K2, K3; reference motion for RL", "Control: robustness under perturbations (K4)"],
  ], [1900, 3563, 3563], "Strengths and limitations of the two approaches for the wrist-assistance problem."),
  h2("6.2 What the comparison achieves"),
  p("Comparing the two approaches on the same task, with the same weakness and the same perturbations, achieves five things that neither approach achieves alone."),
  numbered("aims", [b("A benchmark for the learned controller. "), `The optimal-control solution is the best the musculoskeletal system can do for the nominal task. An RL controller evaluated on its own has no reference: a policy that lifts the cup might still use far more muscle effort or assist torque than necessary. Measuring the RL policy against the Moco optimum turns its performance into a meaningful number, for example "the learned controller needs X % more extensor effort than the optimum".`]),
  numbered("aims", [b("The price of robustness. "), `A controller that can cope with a heavier cup or a push usually pays for this in nominal conditions, for example through more co-contraction or more assist torque. The difference between the RL policy and the Moco optimum in nominal conditions quantifies this price. This trade-off between optimality and robustness is central to device design, but it can only be measured when both an optimal and a robust solution exist for the same task.`]),
  numbered("aims", [b("A fair robustness test (K4). "), `Under perturbations we compare three cases. The Moco plan replayed without feedback is a lower bound, because a fixed plan cannot react. A Moco solution re-computed with full knowledge of the perturbation is an upper bound, because it is optimal for the disturbed task but would not be available in real time. The RL policy, which only sees the current state, should lie between them. Where it lies shows how much of the possible benefit of feedback the learned controller recovers.`]),
  numbered("aims", [b("Cross-validation of models and methods. "), `The OpenSim and MyoSuite models of the wrist are related but not identical ${c("wang2022")}, and the two methods use different numerical machinery. If an RL policy trained independently in MyoSuite converges to similar muscle patterns and assist torques as the Moco solution in OpenSim, both results become more credible. If they differ, the difference points to modelling assumptions (for example the effort criterion or the tendon model) that need attention.`]),
  numbered("aims", [b("Design guidance: spring or motor. "), `The comparison connects directly to K2. If a fixed spring sized with optimal control keeps the task successful under the perturbations, a passive device is sufficient for that level of weakness. If only a feedback controller keeps it successful, a powered device is justified, and the RL policy is a candidate controller for it.`]),
  p(`It is equally important to say what the comparison is not. It is not a contest to decide whether optimal control or RL is the better algorithm in general. Both address the same underlying optimal control problem under different assumptions about what is known and when the answer is needed ${c("recht2019", "mordatch2014")}. Our aim is to quantify, for one clinically motivated task, what each assumption costs and what it buys.`),
  h2("6.3 The two approaches work together"),
  p(`The literature also shows that the two approaches are most useful in combination. Levine and Koltun used trajectory optimisation to generate guiding samples that steer policy learning away from poor local optima ${c("levine2013")}, and Mordatch and Todorov trained neural-network policies with both optimised trajectories and their feedback gains as training data ${c("mordatch2014")}. DeepMimic used reference motions to make RL training tractable for complex skills ${c("peng2018")}. In our project the Moco trajectory serves the same purpose: it provides the reference motion for the RL reward and a target for the muscle activity, which should make training faster and keep the learned behaviour physiologically plausible. The comparison is therefore built into the method, not added on top of it.`),
  h2("6.4 Hypotheses and how they map to our outcomes"),
  p("Based on the literature above, we formulate three hypotheses that the comparison will test. Table 3 links them to the methods and outcome measures defined in our proposal."),
  bullet([b("H1 (sizing). "), "There is an extensor strength threshold below which the unassisted lift-and-hold task fails, and above which the remaining extensor capacity is sufficient. Optimal control identifies this threshold (K1)."]),
  bullet([b("H2 (spring versus motor). "), "Below the threshold, both a passive spring and an ideal motor can restore the task in nominal conditions, but the spring needs a higher peak torque because its torque–angle law does not match the gravity profile of the task (K2), and both reduce muscle effort (K3)."]),
  bullet([b("H3 (robustness). "), "Under perturbations (heavier cup, pushes, fatigue), the success rate of the replayed optimal plan drops faster than that of the RL policy, while the RL policy uses more effort than the optimum in nominal conditions (K4 and the price of robustness)."]),
  ...table(["Question", "Method", "Outcome", "Main literature basis"], [
    ["At what strength does the task fail?", "Moco weakness sweep", "K1 threshold (% of max force)", `${c("ong2019", "falisse2019")}`],
    ["How much assistance restores it? Is a spring enough?", "Moco with spring or ideal motor", "K2 minimum torque; spring vs motor", `${c("uchida2016", "khalilian2024", "dembia2020")}`],
    ["How much effort does assistance save?", "Moco effort with and without device", "K3 effort reduction (%)", `${c("crowninshield1981", "uchida2016")}`],
    ["Can a controller achieve it robustly?", "PPO in MyoSuite, guided by Moco", "K4 success rate under perturbations", `${c("luo2024", "peng2018", "tobin2017")}`],
    ["What does robustness cost?", "RL vs Moco on the same task", "Extra effort and torque of the policy", `${c("recht2019", "levine2013", "mordatch2014")}`],
  ], [2500, 2100, 2100, 2326], "Research questions, methods, outcomes and supporting literature."),
);

body.push(h2("6.5 How the comparison will be evaluated"),
  p(`To make the comparison fair, both approaches must be evaluated on the same task definition, the same level of weakness and the same set of perturbations, and with the same measures. We plan the following protocol for P3 and P4.`),
  bullet([b("Task. "), `Lift the wrist from 30° flexion to 15° extension within 1${NB}s and hold the cup for the rest of the trial. A trial is successful if the wrist stays within 5° of the target during the hold and the cup is not dropped.`]),
  bullet([b("Weakness levels. "), "Unimpaired strength, a level just above the K1 threshold, and a level below it where assistance is required."]),
  bullet([b("Perturbations. "), "Cup mass increased by 50 % and 100 %; short pushes on the hand in the flexion direction during the hold; muscle fatigue enabled through the MyoSuite fatigue model. Each condition is repeated over many randomised trials."]),
  bullet([b("Controllers. "), "(a) the Moco plan replayed without feedback; (b) Moco re-solved with full knowledge of the perturbation, as an upper bound; (c) the RL policy; each with no assistance, with the spring sized in K2 and with the ideal motor."]),
  bullet([b("Measures. "), "Success rate (K4); wrist-angle error during the hold; muscle effort (integral of summed squared excitations); peak and RMS assist torque; and for the RL policy, the difference in effort and torque from the Moco optimum in nominal conditions (the price of robustness)."]),
  p(`One caveat must be handled carefully. The Moco plan is computed in OpenSim, while the RL policy runs in MyoSuite. To avoid confusing a difference between controllers with a difference between simulators, the Moco plan will also be replayed in MyoSuite, and the nominal muscle activity of the two models will be compared before perturbations are applied. Differences that already exist in nominal conditions are model differences, not controller differences.`),
  h2("6.6 Possible outcomes and what they would mean"),
  p("The value of the comparison lies in the fact that every plausible outcome teaches us something about device design. Table 4 lists the main outcomes and their interpretation."),
  ...table(["Possible outcome", "Interpretation for device design"], [
    ["RL policy close to the Moco optimum in nominal conditions and more robust under perturbations", "A learned controller is a strong candidate for a powered device; robustness comes at little cost"],
    ["RL policy robust, but needs clearly more effort or torque than the optimum", "Robustness has a measurable price; the motor must be sized for the policy, not for the optimum"],
    ["Replayed Moco plan with a spring stays successful under perturbations", "A passive spring is sufficient for this level of weakness; a motor and controller are not justified"],
    ["Only the RL policy with a motor stays successful", "A powered, controlled device is required at this weakness level"],
    ["RL and Moco disagree on muscle patterns in nominal conditions", "Model or cost assumptions differ; they must be resolved before conclusions are drawn"],
  ], [4300, 4726], "Possible outcomes of the comparison and their meaning for the device."),
);

// 7 Research gap
body.push(h1("7. Research Gap"),
  p(`Table 5 compares the closest related studies with the elements of our question. Simulation studies of assistive devices with optimal control have focused on the lower limb or on healthy users ${c("uchida2016", "khalilian2024")}. Weakness has been studied in predictive simulations of gait, but not for the wrist or for an upper-limb task of daily living ${c("ong2019", "falisse2019")}. Learned exoskeleton controllers have been developed for the hip and the knee ${c("luo2024", "chavarrias2025")}, and wrist devices for stroke exist in passive and powered forms ${c("ates2017", "lambelet2020")}, but their assistance has been chosen experimentally rather than sized in simulation.`),
  ...table(["Study", "Wrist", "Muscle weakness", "Sizes assistance", "Learned controller", "OC vs RL comparison"], [
    [`Uchida et al. ${c("uchida2016")}`, "No", "No", "Yes", "No", "No"],
    [`KhalilianMotamed Bonab et al. ${c("khalilian2024")}`, "Yes (with elbow)", "No", "Yes", "No", "No"],
    [`Ong et al. ${c("ong2019")}; Falisse et al. ${c("falisse2019")}`, "No", "Yes", "No", "No", "No"],
    [`Luo et al. ${c("luo2024")}`, "No", "No", "Indirectly", "Yes", "No"],
    [`Chavarrías et al. ${c("chavarrias2025")}`, "No", "Spasticity", "No", "Yes", "No"],
    [`Ates et al. ${c("ates2017")}; Lambelet et al. ${c("lambelet2020")}`, "Yes", "Stroke users", "Experimentally", "sEMG-based (eWrist)", "No"],
    ["This project", "Yes", "Yes", "Yes (K1–K3)", "Yes (K4)", "Yes"],
  ], [2300, 1050, 1250, 1450, 1500, 1476], "Closest related work compared with this project.", 18),
  p([b("Gap. "), `We found no study that sizes the assistance needed by a weakened, post-stroke wrist in simulation, and none that compares an optimal-control plan with a learned controller for wrist assistance. Closing this gap would give device developers a quantitative basis for choosing between a passive and a powered wrist orthosis and for judging how much a learned controller costs and gains compared with the best possible behaviour.`]),
);

// 8 Implications for methodology
body.push(h1("8. Implications for Our Methodology"),
  p("The literature reviewed above shapes our methodology in the following ways."),
  bullet([b("Model. "), `We use MoBL-ARMS ${c("holzbaur2005", "saul2015", "mcfarland2019")} because it is validated for the upper limb and openly available, and because MyoSuite's wrist model is derived from it ${c("wang2022")}, which makes the two routes comparable.`]),
  bullet([b("Muscle model and cost. "), `We use the DeGroote–Fregly muscle formulation recommended for direct collocation ${c("degroote2016", "dembia2020")} and a sum-of-squared-excitations effort cost, following the effort-criterion tradition ${c("crowninshield1981")}. Rigid tendons are a first simplification whose effect we will check ${c("millard2013")}.`]),
  bullet([b("Weakness and failure detection. "), `Weakness is modelled by scaling the maximum isometric force of ECRL, ECRB and ECU, in line with weakness being the dominant deficit ${c("kamper2006")} and with predictive weakness studies ${c("ong2019", "falisse2019")}. A heavily penalised reserve actuator at the wrist separates "the muscles cannot do the task" from a solver failure.`]),
  bullet([b("Assistance. "), `Following the ideal-device approach ${c("uchida2016")}, the device is modelled as an ideal torque at the wrist axis, either a linear spring or a motor; spring stiffness and rest angle will be optimised as Moco parameters ${c("dembia2020")}.`]),
  bullet([b("Learning. "), `Route B uses PPO ${c("schulman2017", "raffin2021")} in MyoSuite ${c("caggiano2022")}, with a reward that tracks the Moco wrist trajectory ${c("peng2018")} and with randomised cup mass, pushes and fatigue during training ${c("tobin2017")}.`]),
  bullet([b("Comparison protocol. "), "Moco plan replayed open loop, Moco re-solved with known perturbations, and the RL policy are evaluated on the same perturbation set; we report success rate, wrist-angle error, muscle effort and assist torque for each."]),
  p(`A first baseline already supports this plan. The MoBL-ARMS model lifted and held a 0.3${NB}kg cup in our Moco simulation with the wrist muscles alone: the reserve actuator stayed at about 0.02 % of the gravity torque, and ECRB and ECRL carried most of the load at about 10 % activation while the flexors stayed at their minimum. This muscle pattern agrees with the role of the wrist extensors described in Section 2.2. Fig. 2 shows the overall pipeline.`),
  ...figure("pipeline_diagram.png", "Project pipeline. Route A (optimal control) provides the sizing results and the reference motion; Route B (reinforcement learning) provides the controller for the robustness comparison.", 600),
);

body.push(h1("9. Threats to Validity"),
  p(`Several limitations of this approach follow from the literature and should be kept in mind when interpreting our results.`),
  bullet([b("Weakness is not the only deficit. "), `Weakness dominates hand impairment in chronic stroke ${c("kamper2006")}, but spasticity, abnormal co-activation and altered tissue properties also occur. Scaling the maximum force of the extensors captures only the first of these; spasticity could be added later, as in ${c("chavarrias2025")}.`]),
  bullet([b("Generic model. "), `MoBL-ARMS represents one generic adult ${c("holzbaur2005", "saul2015")}. Thresholds and torques will differ between individuals; the results are relative findings rather than clinical predictions.`]),
  bullet([b("Model simplifications. "), `Rigid tendons, a locked forearm posture, fixed wrist deviation and the exclusion of finger muscles simplify the problem. The rigid-tendon assumption in particular can affect muscle forces ${c("millard2013")}.`]),
  bullet([b("Two simulators. "), `The OpenSim and MyoSuite models share an origin but differ in muscle models and numerics ${c("wang2022")}. The comparison protocol (Section 6.5) separates model differences from controller differences, but some mismatch will remain.`]),
  bullet([b("Ideal devices. "), `The spring and motor are modelled as ideal torques at the wrist axis without mass, friction or misalignment, as in ${c("uchida2016")}. Real devices add mass and interaction forces, which would increase the required assistance.`]),
);

// 9 Conclusion
body.push(h1("10. Conclusion"),
  p(`Weak wrist extensors are a common and limiting consequence of stroke, and wrist exoskeletons can compensate for them. Designing such a device requires answering two questions: how much assistance is needed, and how should it be delivered in real time? The literature offers mature tools for each question separately. Optimal control with musculoskeletal models predicts the effect of weakness and sizes ideal assistive devices, but produces plans for known conditions. Reinforcement learning in fast musculoskeletal simulators produces feedback controllers that can cope with variability, but without a guarantee of optimality.`),
  p(`We compare the two because a device designer needs both answers and needs to know how they relate. The optimal-control solution is the benchmark that gives the learned controller's performance a meaning; the difference between them measures the price of robustness; the robustness test shows whether a fixed spring or plan is sufficient or whether a controlled motor is required; and agreement or disagreement between the two cross-checks the models. This combination has not been studied for the wrist or for muscle weakness. Our project addresses it with a Moco-based sizing study (K1–K3) and an RL-based robustness comparison (K4) on the same lift-and-hold task.`),
);

// References
body.push(h1("References"));
order.forEach((k, n) => body.push(new Paragraph({
  spacing: { after: 70 }, indent: { left: 520, hanging: 520 },
  children: [new TextRun({ text: `[${n + 1}]\t`, size: 19 }), new TextRun({ text: REFS[k], size: 19 })],
  tabStops: [{ type: "left", position: 520 }],
})));
const unused = Object.keys(REFS).filter((k) => !order.includes(k));
if (unused.length) console.warn("unused references:", unused.join(", "));

// ------------------------------------------------------------------ document
const doc = new Document({
  creator: "Team 7",
  title: "Literature Review: Sizing and Controlling Wrist Assistance after Stroke",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Cambria", size: 26, bold: true }, paragraph: { spacing: { before: 300, after: 120 }, keepNext: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Cambria", size: 23, bold: true }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    { reference: "aims", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "Team 7 · Literature Review · ", size: 18, color: "595959" }),
      new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "595959" }),
    ] })] }) },
    children: body,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log(`wrote ${OUT} (${order.length} references, ${figNo} figures, ${tabNo} tables)`);
});
