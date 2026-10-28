// Month-by-month simulation of variation ① (North America: the Atlantic Exodus), Jan 1243 – Dec 1282.
// Story estimates, not research results. Plan: docs/sim-plan.md. Write-up: brainstorm/sim-north-america.md.
// Run: node sim/north-america.mjs   → writes data/sim/north-america.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGION = JSON.parse(fs.readFileSync(path.join(ROOT, "data/regions/north-america.json"), "utf8"));

const Y0 = 1243, NY = 40, NM = NY * 12, AG = 100;
const LAND = 3;                       // April 1243: the fleet reaches the Hudson
const ym = t => `${Y0 + Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, "0")}`;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const r1 = x => Math.round(x * 10) / 10, r0 = Math.round;

// ---------- Causes of death ----------
// Annual hazards for a medieval European village (the baseline every group is measured against).
const CAUSES = ["diarrhea", "fever", "resp", "epidemic", "smallpox", "tb", "accident", "violence", "hunger", "old"];
const NC = CAUSES.length, NEWBORN = NC, MATERNAL = NC + 1;
const CI = Object.fromEntries(CAUSES.map((c, i) => [c, i]));
function baseHaz(c, s, a) {
  switch (c) {
    case "diarrhea": return a === 0 ? 0.07 : a < 5 ? 0.028 : a < 15 ? 0.0025 : a < 60 ? 0.0022 : 0.004 + 0.0003 * (a - 60);
    case "fever": return a < 5 ? 0.004 : a < 60 ? 0.0028 : 0.005;                       // typhoid and other fevers
    case "resp": return a === 0 ? 0.05 : a < 5 ? 0.016 : a < 15 ? 0.0018 : a < 50 ? 0.0028 : 0.0028 * Math.exp(0.075 * (a - 50));
    case "epidemic": return a === 0 ? 0.018 : a < 5 ? 0.016 : a < 10 ? 0.004 : a < 15 ? 0.0015 : 0.0002; // measles, whooping cough, diphtheria...
    case "smallpox": return a === 0 ? 0.01 : a < 10 ? 0.009 : a < 20 ? 0.002 : 0.0005;
    case "tb": return a < 15 ? 0.0008 : a < 25 ? 0.0035 : a < 45 ? 0.0045 : a < 65 ? 0.0035 : 0.003;
    case "accident": return a < 1 ? 0.001 : a < 5 ? 0.002 : a < 15 ? 0.0012 : a < 60 ? (s ? 0.0008 : 0.003) : 0.002;
    case "violence": return a < 15 ? 0.0002 : a < 50 ? (s ? 0.0004 : 0.002) : 0.0005;
    case "hunger": return a < 5 || a >= 60 ? 2 : 1;                                    // age weight; the level is set each month
    case "old": return a < 30 ? 0.0002 : 0.0007 * Math.exp(0.088 * (a - 30));
  }
}
const BASE = CAUSES.map(c => [0, 1].map(s => Float64Array.from({ length: AG }, (_, a) => baseHaz(c, s, a))));
const P_NEO = 0.075, P_MAT = 0.012;          // newborn deaths and mothers' deaths per birth, medieval baseline
// Pre-contact Native baseline relative to the European one: no crowd diseases or smallpox, less TB, more raiding.
const NATIVE = { diarrhea: 1, fever: 0.8, resp: 1, epidemic: 0.15, smallpox: 0, tb: 0.6, accident: 1.2, violence: 2.2, hunger: 0.002, old: 1 };

// ---------- Births ----------
// Natural fertility of married women (Henry), by 5-year age group from 15.
const NATFERT = [0.30, 0.46, 0.431, 0.396, 0.321, 0.167, 0.024];
const ASFR = Float64Array.from({ length: AG }, (_, a) => a < 15 || a >= 50 ? 0 : NATFERT[Math.floor((a - 15) / 5)]);
const PM_SET = a => a < 16 ? 0 : a < 20 ? 0.35 : a < 25 ? 0.8 : a < 45 ? 0.92 : 0.9;   // share of women married
const PM_NAT = a => a < 15 ? 0 : a < 20 ? 0.5 : 0.9;
const NEED = a => a < 5 ? 0.12 : a < 15 ? 0.2 : 0.25;                                 // t of grain-equivalent a year

// ---------- Populations ----------
class Pop {
  constructor() { this.v = [new Float64Array(AG), new Float64Array(AG)]; this.L = new Float64Array(AG); } // L = literate people
  get n() { let t = 0; for (let a = 0; a < AG; a++) t += this.v[0][a] + this.v[1][a]; return t; }
  count(s, a0, a1) { let t = 0; for (let a = a0; a <= a1; a++) t += s == null ? this.v[0][a] + this.v[1][a] : this.v[s][a]; return t; }
  at(a) { return this.v[0][a] + this.v[1][a]; }
  get lit() { let t = 0; for (let a = 0; a < AG; a++) t += this.L[a]; return t; }
  moveFrom(o, frac) {                                     // move a share of every age from o into this
    if (frac <= 0) return;
    for (let a = 0; a < AG; a++) {
      for (let s = 0; s < 2; s++) { const d = o.v[s][a] * frac; o.v[s][a] -= d; this.v[s][a] += d; }
      const l = o.L[a] * frac; o.L[a] -= l; this.L[a] += l;
    }
  }
  moveAges(o, s, a0, a1, n) {                             // move n people of one sex and age band
    const tot = o.count(s, a0, a1); if (tot <= 0 || n <= 0) return 0;
    const f = Math.min(1, n / tot);
    for (let a = a0; a <= a1; a++) {
      const d = o.v[s][a] * f, all = o.at(a), l = all > 0 ? o.L[a] * d / all : 0;
      o.v[s][a] -= d; this.v[s][a] += d; o.L[a] -= l; this.L[a] += l;
    }
    return n * Math.min(1, tot / n);
  }
  addShape(sh, n, litShare = 0) {
    for (let a = 0; a < AG; a++) for (let s = 0; s < 2; s++) { const d = sh[s][a] * n; this.v[s][a] += d; if (a >= 10) this.L[a] += d * litShare; }
  }
  age() {                                                 // a twelfth of each single-year age moves up each month
    for (let a = AG - 2; a >= 0; a--) {
      for (let s = 0; s < 2; s++) { const d = this.v[s][a] / 12; this.v[s][a] -= d; this.v[s][a + 1] += d; }
      const l = this.L[a] / 12; this.L[a] -= l; this.L[a + 1] += l;
    }
  }
}

// Life table and stable age shape for a given set of multipliers (used to calibrate fertility and starting ages).
function survivorship(mult, neoMult = 1, matMult = 1) {
  const l = [new Float64Array(AG + 1), new Float64Array(AG + 1)];
  for (let s = 0; s < 2; s++) {
    l[s][0] = 1;
    for (let a = 0; a < AG; a++) {
      let H = 0; for (let c = 0; c < NC; c++) H += BASE[c][s][a] * (CAUSES[c] === "hunger" ? mult.hunger : mult[CAUSES[c]]);
      if (s === 1) H += ASFR[a] * 0.85 * P_MAT * matMult;
      let q = 1 - Math.exp(-H);
      if (a === 0) q = 1 - (1 - P_NEO * neoMult) * (1 - q);
      l[s][a + 1] = l[s][a] * (1 - q);
    }
  }
  return l;
}
function calibrate(mult, pm, r, neoMult = 1, matMult = 1) {
  const l = survivorship(mult, neoMult, matMult);
  let net = 0; for (let a = 15; a < 50; a++) net += Math.exp(-r * (a + 0.5)) * (l[1][a] + l[1][a + 1]) / 2 * ASFR[a] * pm(a) * 0.488;
  const scale = 1 / net;                                  // fertility scale that gives growth rate r (Lotka)
  const sh = [0, 1].map(s => Float64Array.from({ length: AG }, (_, a) => (l[s][a] + l[s][a + 1]) / 2 * Math.exp(-r * (a + 0.5)) * (s ? 0.488 : 0.512)));
  const tot = sh[0].reduce((x, y) => x + y) + sh[1].reduce((x, y) => x + y);
  for (const x of sh) for (let a = 0; a < AG; a++) x[a] /= tot;
  let e0 = 0; for (let a = 0; a < AG; a++) e0 += (l[0][a] + l[0][a + 1] + l[1][a] + l[1][a + 1]) / 4;
  return { scale, sh, e0 };
}
const EURO = Object.fromEntries(CAUSES.map(c => [c, c === "hunger" ? 0.002 : 1]));
const CAL_EU = calibrate(EURO, PM_SET, 0.004);          // a medieval European village growing 0.4% a year
const CAL_NA = calibrate(NATIVE, PM_NAT, 0.002);        // Eastern Woodlands towns growing ~0.2% a year
const FERT_SET = 7.0 / [...ASFR].reduce((t, f, a) => t + f * PM_SET(a), 0);   // settlers: ~7 births per woman (colonial America)

function lifeTable(E, D, B, neo) {
  if (B < 1) return { e0: null, imr: null };
  const q0 = clamp((neo + D[0]) / B, 0, 0.95);
  let l = 1, e = l * (1 - 0.7 * q0), m = 0;
  l *= 1 - q0;
  for (let a = 1; a < AG; a++) {
    if (E[a] > 1e-3) m = D[a] / E[a];
    if (a === AG - 1) { e += l / Math.max(m, 0.2); break; }
    const q = 1 - Math.exp(-m);
    e += l * (1 - q / 2); l *= 1 - q;
  }
  return { e0: e, imr: q0 };
}

// ---------- Native peoples (from data/regions/north-america.json) ----------
const FAMILY = {
  "Cahokia": "Mississippian", "Lower Illinois": "Mississippian", "Kincaid": "Mississippian", "Angel": "Mississippian", "Wickliffe": "Mississippian",
  "Middle Cumberland": "Mississippian", "Aztalan": "Mississippian", "Fort Ancient": "Ohio Valley", "Monongahela": "Ohio Valley", "Whittlesey": "Ohio Valley",
  "Owasco": "Iroquoian", "Mohawk": "Iroquoian", "Ontario Iroquoians": "Iroquoian", "Mahican": "Algonquian", "Lenape": "Algonquian",
  "Michigan": "Algonquian", "Lake Superior": "Algonquian", "Oneota": "Prairie & other", "Shenks Ferry": "Prairie & other",
};
const famOf = n => Object.entries(FAMILY).find(([k]) => n.includes(k))?.[1] || "Prairie & other";
const TRUST = { "Algonquian": 3.0, "Iroquoian": 3.5, "Ohio Valley": 3.5, "Mississippian": 5.0, "Prairie & other": 4.5 }; // years of contact before towns join
const FAMILIES = ["Iroquoian", "Algonquian", "Ohio Valley", "Mississippian", "Prairie & other"];
const HUDSON = [42.65, -73.75], FORKS = [40.44, -80.01];
function km([la1, lo1], [la2, lo2]) {
  const R = 6371, d = Math.PI / 180, x = Math.sin((la2 - la1) * d / 2) ** 2 + Math.cos(la1 * d) * Math.cos(la2 * d) * Math.sin((lo2 - lo1) * d / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x)) * 1.25;          // ×1.25 for river and trail paths
}
const short = n => n.replace(/\s*\(.*\)/, "");

// ---------- Skills, techs and workshops ----------
const SKILLS = ["smith", "carpenter", "millwright", "mason", "ironworker", "shipwright", "sailor", "healer", "teacher", "crafts", "miner", "machinist"];
const CATS = ["farm", "build", "iron", "craft", "boat", "gov", "eng", "spare"];
const CAT_LABEL = { farm: "Farming & herding", build: "Building & timber", iron: "Iron, mines & charcoal", craft: "Crafts & mills",
  boat: "Boats, ships & trade", gov: "Health, schools & government", eng: "Machines & engineering", spare: "Free time & extra goods" };
const SKCAT = { smith: "iron", carpenter: "build", millwright: "eng", mason: "build", ironworker: "iron", shipwright: "boat", sailor: "boat",
  healer: "gov", teacher: "gov", crafts: "craft", miner: "iron", machinist: "eng" };
const TRAIN_MONTHS = { smith: 24, carpenter: 18, millwright: 36, mason: 24, ironworker: 18, shipwright: 24, sailor: 12, healer: 24, teacher: 12, crafts: 18, miner: 12, machinist: 30 };
// Skilled people in the first fleet (reasoned from ~300–500 craftsmen, ~200–400 sailors and shipwrights).
const SKILLS0 = { smith: 25, carpenter: 60, millwright: 8, mason: 20, ironworker: 10, shipwright: 40, sailor: 220, healer: 12, teacher: 8, crafts: 120, miner: 12, machinist: 0 };

// id, name, prerequisites, design (hero-months), labor (person-months), crew, materials, minimum months, job type
const T = (id, name, pre, design, labor, crew, mat, minM, cat) => ({ id, name, pre, design, labor, crew, mat, minM, cat });
const TECHS = [
  T("wells", "Wells & latrines", [], 0.3, 40, {}, {}, 1, "gov"),
  T("soap", "Potash & soap", [], 0.4, 20, { crafts: 2 }, {}, 1, "craft"),
  T("school", "Village schools", [], 0.3, 10, { teacher: 2 }, {}, 1, "gov"),
  T("calf", "Vaccine calf farm", [], 0.4, 15, {}, {}, 2, "gov"),
  T("saw1", "Sawmill at Cohoes Falls", [], 1.5, 120, { millwright: 3, carpenter: 6 }, { iron: 0.4 }, 4, "eng"),
  T("plow", "Iron-shod ox-plows", [], 0.4, 30, { smith: 2, carpenter: 2 }, { iron: 0.3 }, 2, "iron"),
  T("grist1", "Water gristmill", ["saw1"], 1.0, 100, { millwright: 3, mason: 2 }, { iron: 0.3 }, 3, "eng"),
  T("brick", "Brick & lime kilns", [], 0.5, 60, { mason: 3 }, {}, 3, "build"),
  T("alpha", "Phonetic alphabet & primers", ["school"], 1.0, 10, { teacher: 2 }, {}, 4, "gov"),
  T("bloom", "Bloomery iron from bog ore", ["brick"], 1.5, 150, { ironworker: 4, smith: 2 }, {}, 5, "iron"),
  T("clover", "Clover & turnip rotation", ["plow"], 0.3, 0, {}, {}, 1, "farm"),
  T("salt1", "Salt works at Onondaga", [], 0.6, 120, { crafts: 2 }, { iron: 1.0 }, 3, "craft"),
  T("boats", "River flatboats & keelboats", ["saw1"], 0.5, 60, { carpenter: 4, shipwright: 2 }, { lumber: 40 }, 2, "boat"),
  T("scythe", "Steel-edged scythes & grain cradles", ["bloom"], 0.4, 30, { smith: 3 }, { iron: 0.5 }, 2, "iron"),
  T("lens", "Lens grinding: spectacles, telescope, microscope", ["grist1"], 1.5, 60, { crafts: 3 }, {}, 6, "eng"),
  T("forks", "New core town at the Forks of the Ohio", ["boats", "bloom"], 1.5, 2500, { carpenter: 10, millwright: 2 }, { iron: 3, lumber: 300 }, 10, "build"),
  T("furnace", "Water-powered blast furnace", ["forks", "brick"], 4, 1200, { ironworker: 8, mason: 6, millwright: 3 }, { iron: 2 }, 10, "iron"),
  T("paper", "Paper mill", ["grist1"], 1.5, 180, { millwright: 2, crafts: 3 }, { iron: 0.5 }, 5, "craft"),
  T("press", "Printing press", ["paper"], 2, 100, { carpenter: 2, smith: 1 }, { iron: 0.3 }, 4, "craft"),
  T("hammer", "Trip-hammer forge (bar iron)", ["furnace"], 1.5, 250, { millwright: 2, smith: 3 }, { iron: 3 }, 5, "iron"),
  T("coal", "Coal mines at Coal Hill", ["forks"], 0.5, 200, { miner: 4 }, { iron: 1 }, 3, "iron"),
  T("germ", "Germ theory & public health rules", ["lens", "press"], 2, 60, { healer: 4 }, {}, 6, "gov"),
  T("nails", "Slitting & wire mill (nails, wire)", ["hammer"], 1.5, 200, { millwright: 2, smith: 2 }, { iron: 4 }, 5, "iron"),
  T("copper", "Copper voyages to Lake Superior", ["boats"], 0.5, 500, { miner: 4, sailor: 6 }, {}, 6, "boat"),
  T("lead", "Galena lead trade", ["boats"], 0.3, 200, {}, {}, 4, "boat"),
  T("cement", "Cementation steel", ["hammer"], 2, 200, { ironworker: 3, mason: 2 }, { iron: 2 }, 6, "iron"),
  T("shipyard", "Ocean shipyard", ["nails"], 1, 300, { shipwright: 6 }, { iron: 4, lumber: 150 }, 8, "boat"),
  T("units", "Standard units & gauges", ["press"], 1, 20, {}, {}, 3, "eng"),
  T("crucible", "Crucible steel", ["cement", "coal"], 3, 300, { ironworker: 3, crafts: 2 }, {}, 8, "iron"),
  T("steelplow", "Steel plows", ["crucible"], 0.5, 40, { smith: 2 }, { iron: 2 }, 3, "farm"),
  T("hospital", "Hospital & medical school", ["germ"], 2, 600, { healer: 6, carpenter: 4 }, { lumber: 200 }, 12, "gov"),
  T("clock", "Pendulum clocks & surveying", ["lens", "hammer"], 2, 120, { smith: 2, crafts: 2 }, { iron: 0.5 }, 8, "eng"),
  T("lathe", "Screw-cutting lathe & machine shop", ["crucible", "furnace"], 4, 400, { smith: 4, millwright: 3 }, { iron: 8 }, 12, "eng"),
  T("roads", "Wagon road, Hudson to the Forks", ["forks", "units"], 1.5, 6000, { mason: 4 }, { iron: 5 }, 36, "build"),
  T("coke", "Coke blast furnace", ["furnace", "coal"], 3, 1500, { ironworker: 8, mason: 6, millwright: 3 }, { iron: 10 }, 12, "iron"),
  T("zinc", "Zinc smelting & brass", ["copper", "crucible"], 2, 150, { ironworker: 2, crafts: 2 }, {}, 6, "craft"),
  T("battery", "Batteries (copper & zinc)", ["zinc"], 1, 20, { crafts: 1 }, { copper: 0.2 }, 3, "eng"),
  T("emag", "Electromagnets & galvanometer", ["battery", "nails"], 1, 15, {}, { copper: 0.1 }, 3, "eng"),
  T("canal", "Canal & locks at the Falls of the Ohio", ["clock", "forks"], 3, 6000, { mason: 10 }, { iron: 20 }, 30, "build"),
  T("drill", "Seed drill & horse hoe", ["lathe"], 1.5, 80, { smith: 2, carpenter: 2 }, { iron: 2 }, 6, "farm"),
  T("newcomen", "Newcomen steam pump", ["lathe", "coal"], 6, 600, { machinist: 6, smith: 4, mason: 4 }, { iron: 25, copper: 1 }, 14, "eng"),
  T("telegraph", "Electric telegraph", ["emag"], 3, 200, { machinist: 2 }, { copper: 0.5 }, 8, "eng"),
  T("wagonway", "Railed wagonways", ["coal", "hammer"], 1, 600, { carpenter: 6 }, { iron: 20, lumber: 200 }, 8, "build"),
  T("oil", "Lamp-oil refining (Oil Creek)", ["nails"], 1, 120, { crafts: 2 }, { iron: 3 }, 4, "craft"),
  T("textile", "Water-powered spinning & weaving mill", ["lathe"], 5, 1500, { millwright: 6, machinist: 4, crafts: 6 }, { iron: 15 }, 14, "craft"),
  T("reaper", "Horse-drawn reaper", ["drill", "crucible"], 3, 200, { smith: 3, machinist: 2 }, { iron: 5 }, 10, "farm"),
  T("watt", "Separate-condenser steam engine", ["newcomen"], 8, 800, { machinist: 10, smith: 4 }, { iron: 20, copper: 2 }, 18, "eng"),
];
const TECH = Object.fromEntries(TECHS.map(x => [x.id, x]));
// Months of working experience with an earlier tech before the next one can be tried, and the settler population
// that makes it worth building (market size). Reasoned from how long each step took historically once its parts existed.
const AFTER = { paper: ["grist1", 12], press: ["paper", 6], coke: ["furnace", 48], cement: ["hammer", 12], crucible: ["cement", 24], lathe: ["crucible", 24],
  newcomen: ["lathe", 24], watt: ["newcomen", 36], germ: ["lens", 12], hospital: ["germ", 24], canal: ["clock", 24], textile: ["lathe", 24],
  telegraph: ["emag", 12], reaper: ["drill", 24], zinc: ["copper", 24], wagonway: ["coal", 36], oil: ["nails", 12], drill: ["lathe", 12], clock: ["lens", 24] };
const POPMIN = { paper: 5000, press: 5000, shipyard: 8000, hospital: 12000, coke: 15000, roads: 20000, canal: 25000, textile: 20000, telegraph: 25000,
  wagonway: 15000, lathe: 10000, oil: 10000, zinc: 10000 };
const LONGER = { bloom: 8, furnace: 14, coke: 24, crucible: 18, lathe: 24, newcomen: 30, watt: 36, telegraph: 18, textile: 24, germ: 12, battery: 6, zinc: 12,
  clock: 18, lens: 12, cement: 12, hammer: 8, nails: 8, reaper: 18, drill: 10 };
for (const x of TECHS) if (LONGER[x.id]) x.minM = LONGER[x.id];

// Workshops that run every month once built. cap = output a year per unit.
const UNITS = {
  saw:      { name: "Sawmill", tech: "saw1", cap: 450, crew: { millwright: 0.5, carpenter: 1 }, labor: 3, cat: "build", kw: 4, b: [0.2, 80, { millwright: 2, carpenter: 4 }, { iron: 0.3 }, 3] },
  grist:    { name: "Gristmill", tech: "grist1", cap: 2500, crew: { millwright: 0.3 }, labor: 1.5, cat: "craft", kw: 5, b: [0.1, 70, { millwright: 2, mason: 2 }, { iron: 0.2 }, 3] },
  bloom:    { name: "Bloomery", tech: "bloom", cap: 12, crew: { ironworker: 3 }, labor: 5, cat: "iron", kw: 0, b: [0.1, 60, { ironworker: 2, mason: 1 }, {}, 3] },
  furnace:  { name: "Blast furnace", tech: "furnace", cap: 300, crew: { ironworker: 10 }, labor: 30, cat: "iron", kw: 15, b: [0.5, 900, { ironworker: 4, mason: 5, millwright: 2 }, { iron: 2 }, 9] },
  coke:     { name: "Coke furnace", tech: "coke", cap: 700, crew: { ironworker: 12 }, labor: 20, cat: "iron", kw: 20, b: [0.5, 1000, { ironworker: 4, mason: 5, millwright: 2 }, { iron: 6 }, 9] },
  salt:     { name: "Salt works", tech: "salt1", cap: 60, crew: { crafts: 1 }, labor: 9, cat: "craft", kw: 0, b: [0.1, 80, { crafts: 1 }, { iron: 1 }, 3] },
  paper:    { name: "Paper mill", tech: "paper", cap: 2000, crew: { crafts: 3 }, labor: 5, cat: "craft", kw: 6, b: [0.2, 120, { millwright: 1, crafts: 2 }, { iron: 0.4 }, 4] },
  press:    { name: "Printing press", tech: "press", cap: 5e5, crew: { crafts: 1 }, labor: 2, cat: "craft", kw: 0, b: [0.05, 20, { carpenter: 1 }, { iron: 0.1, lead: 0.2 }, 2] },
  steel:    { name: "Steel furnace", tech: "cement", cap: 8, crew: { ironworker: 2 }, labor: 3, cat: "iron", kw: 0, b: [0.1, 60, { mason: 2 }, { iron: 1 }, 3] },
  mine:     { name: "Coal mine", tech: "coal", cap: 2500, crew: { miner: 2 }, labor: 8, cat: "iron", kw: 0, b: [0.05, 60, { miner: 2 }, { iron: 0.5 }, 2] },
  yard:     { name: "Shipyard", tech: "shipyard", cap: 2, crew: { shipwright: 6 }, labor: 30, cat: "boat", kw: 0, b: [0.2, 200, { shipwright: 4 }, { iron: 2, lumber: 60 }, 6] },
  textile:  { name: "Textile mill", tech: "textile", cap: 5000, crew: { machinist: 1, crafts: 4 }, labor: 40, cat: "craft", kw: 30, b: [1, 900, { millwright: 4, machinist: 2 }, { iron: 10 }, 9] },
};

// ---------- Plan settings (the "optimal plan" from brainstorm/variations/north-america.md) ----------
const FLEET = [   // who sails in December 1242 (reasoned split of ~3,000)
  ["Hungarian farming families", 1450, "family"], ["Tuscan craftsmen and families", 600, "craft"],
  ["Cuman herding families", 400, "family"], ["Dalmatian sailors and shipwrights", 300, "sailor"], ["Rus' and Polish refugees", 250, "family"],
];
const IMMIG_POOL = y => (y < 1244 ? 0 : y === 1244 ? 300 : 700 * 1.04 ** (y - 1245)) +   // recruits who pass screening (families, no zealots, no marsh fevers)
  (y === 1258 || y === 1259 ? 2000 : 0) + (y >= 1266 && y <= 1268 ? 400 : 0);           // Europe's 1258 famine; Hohenstaufen exiles after 1266
const EVENTS = [
  [0, "The fleet is at sea on the trade winds (sailed from the Canaries in December 1242)"],
  [1, "Rest and quarantine at uninhabited Bermuda"],
  [LAND, "Landfall in the Hudson; camp and quarantine near later Albany. Fields granted by Mahican neighbors"],
  [(1250 - Y0) * 12 + 11, "Frederick II dies. The gate never depended on him alone: the Pisan house carries on"],
  [(1258 - Y0) * 12 + 5, "Samalas eruption (1257) cools the summer: a poor harvest. Europe's famine sends a big wave of recruits"],
  [(1266 - Y0) * 12 + 1, "Hohenstaufen rule in Sicily ends. The gate shifts fully to Pisa"],
  [(1276 - Y0) * 12 + 5, "The long drought begins in the Ohio and Mississippi valleys (uncertain); shared granaries feed allied towns"],
];
const yieldHa = (S, has, t) => 1.15 * (has("plow") ? 1.1 : 1) * (has("clover") ? 1 + 0.2 * clamp((t - S.done.clover) / 36, 0, 1) : 1) *
  (has("drill") ? 1.08 : 1) * (0.85 + 0.15 * S.toolF) * (0.9 + 0.1 * S.saltF);   // t of grain-equivalent per hectare on new-cleared land
const climate = (y, region) => y === 1258 ? 0.75 : y === 1259 ? 0.9 : y >= 1276 && region !== "hudson" ? 0.92 : 1;

// ---------- One full 40-year run ----------
function run(plan) {
  const S = {
    fleet: new Pop(), born: new Pop(), immig: new Pop(), ntown: new Pop(),
    grain: 900, lumber: 0, iron: 35, steel: 0.5, salt: 25, copper: 0.5, lead: 0.3, paper: 300, coal: 0,
    cattle: 300, horses: 150, sheep: 400, pigs: 200, cleared: 0, planted: 0, cropNeed: 0, cropGot: 0,
    houses: 0, ships: 19, boats: 0, furs: 0, done: {}, projects: [], units: {}, skills: { ...SKILLS0 }, training: [],
    school: [], engineers: 0, forkShare: 0, telegraphKm: 0, wagonKm: 0, roadKm: 0, newcomen: 0, watt: 0,
    radiusH: 0, radiusF: 0, translators: 1, exchange: 0, wedded: 0, ema: {}, short: {}, toolF: 1, saltF: 1,
  };
  for (const k in UNITS) S.units[k] = 0;
  const shapeFam = CAL_EU.sh.map(x => Float64Array.from(x, (v, a) => v * (a > 55 ? 0.35 : 1)));   // few old people make the voyage
  const adult = (lo, hi, men) => [0, 1].map(s => Float64Array.from({ length: AG }, (_, a) => a >= lo && a <= hi ? (s ? 1 - men : men) / (hi - lo + 1) : 0));
  for (const [, n, kind] of FLEET) {
    if (kind === "family") S.fleet.addShape(norm(shapeFam), n, 0.05);
    if (kind === "craft") { S.fleet.addShape(adult(18, 45, 1), n * 0.62, 0.3); S.fleet.addShape(adult(18, 40, 0), n * 0.16, 0.1); S.fleet.addShape(norm(childShape()), n * 0.22, 0); }
    if (kind === "sailor") { S.fleet.addShape(adult(16, 42, 1), n * 0.93, 0.1); S.fleet.addShape(adult(16, 35, 0), n * 0.07, 0); }
  }
  // Native peoples
  S.peoples = REGION.peoples.map(p => ({
    n: short(p.n), full: p.n, fam: famOf(p.n), ll: [p.la, p.lo], P0: p.pop, out: popOf(CAL_NA.sh, p.pop), joined: new Pop(),
    dH: km(HUDSON, [p.la, p.lo]), dF: km(FORKS, [p.la, p.lo]), contact: null, trust: null, first: null, cov: 0, plow: 0, wave: 0, lit: 0,
    trustYears: TRUST[famOf(p.n)] * (p.n.includes("Cahokia") ? 1.4 : p.n.includes("Lake Superior") || p.n.includes("Oneota") ? 1.2 : 1),
    joinYears: 3 + p.pop / 4000,
  }));
  const people = n => S.peoples.find(p => p.n.includes(n));

  const st = {};                                          // yearly accumulators
  const out = { y: {}, m: { settlers: [], allied: [], grainMonths: [], iron: [] }, techs: [], events: [], specDemand: {} };
  for (const k of SKILLS) out.specDemand[k] = new Float64Array(NM);
  const ev = (t, text) => out.events.push({ t: ym(t), text });
  const push = (key, v) => (out.y[key] ||= []).push(v);
  const has = id => S.done[id] != null;
  const settlerGroups = () => [S.fleet, S.born, S.immig, S.ntown];
  const settlers = () => S.fleet.n + S.born.n + S.immig.n + S.ntown.n;
  const alliedN = () => S.peoples.reduce((t, p) => t + p.joined.n, 0);
  const sumAges = (fn) => settlerGroups().reduce((t, g) => { for (let a = 0; a < AG; a++) t += g.at(a) * fn(a); return t; }, 0);
  const sCount = (s, a0, a1) => settlerGroups().reduce((t, g) => t + g.count(s, a0, a1), 0);
  const resetYear = () => {
    for (const k of ["set", "all", "out"]) st[k] = { E: new Float64Array(AG), D: new Float64Array(AG), B: 0, neo: 0, cause: new Float64Array(NC + 2), pop: 0 };
    st.work = Object.fromEntries(CATS.map(c => [c, 0])); st.supply = 0; st.idle = 0;
    Object.assign(st, { births: 0, deaths: 0, immig: 0, joinedYr: 0, grainProd: 0, grainNeed: 0, iron: 0, steel: 0, salt: 0, lumber: 0, coal: 0, charcoal: 0,
      copper: 0, lead: 0, paper: 0, impressions: 0, furs: 0, housesBuilt: 0, relief: 0, gifts: 0 });
  };
  resetYear();
  ev(0, EVENTS[0][1]);

  // ---- demography for one population ----
  function demog(P, M, neoM, matM, fert, pmf, to, kind) {
    const A = st[kind]; let dead = 0;
    for (let a = 0; a < AG; a++) {
      const all = P.at(a); if (all < 1e-9) continue; let dAge = 0;
      for (let s = 0; s < 2; s++) {
        const N = P.v[s][a]; if (N < 1e-9) continue;
        let H = 0; const hz = new Array(NC);
        for (let c = 0; c < NC; c++) { hz[c] = BASE[c][s][a] * M[c]; H += hz[c]; }
        const d = N * (1 - Math.exp(-H / 12));
        A.E[a] += N / 12; A.D[a] += d; dAge += d;
        for (let c = 0; c < NC; c++) A.cause[c] += d * hz[c] / H;
        P.v[s][a] -= d;
      }
      P.L[a] *= 1 - dAge / all; dead += dAge;
    }
    let B = 0; for (let a = 15; a < 50; a++) B += P.v[1][a] * ASFR[a] * pmf(a);
    B *= fert / 12;
    const neo = B * P_NEO * neoM, mat = B * P_MAT * matM;
    let w = 0; for (let a = 15; a < 50; a++) w += P.v[1][a] * ASFR[a];
    if (w > 0) for (let a = 15; a < 50; a++) { const d = mat * P.v[1][a] * ASFR[a] / w; A.D[a] += d; P.v[1][a] -= d; }
    to.v[0][0] += (B - neo) * 0.512; to.v[1][0] += (B - neo) * 0.488;
    A.B += B; A.neo += neo; A.D[0] += 0; A.cause[NEWBORN] += neo; A.cause[MATERNAL] += mat;
    return { B, dead: dead + neo + mat };
  }

  for (let t = 0; t < NM; t++) {
    const y = Math.floor(t / 12), m = t % 12, yr = Y0 + y, atSea = t < LAND;
    for (const [et, text] of EVENTS) if (et === t && t > 0) ev(t, text);
    const sNow = settlers();
    const households = sNow / 5.5;

    // ---- Settler health multipliers (what the plan's medicine and buildings do) ----
    const crowd = S.houses > 0 ? Math.max(0, households / S.houses - 1) : (atSea ? 0.5 : 1);
    const winter = m === 11 || m <= 1;
    const pioneer = clamp(1 - (t - LAND) / 72, 0, 1);    // first six years: clearing, logging, river work
    const ind = sNow > 0 ? (S.units.furnace + S.units.coke) * 40 / sNow + S.units.mine * 10 / sNow : 0;
    const Ms = new Float64Array(NC);
    const ors = 0.4, boil = 0.8;                          // oral rehydration salts (taught on the fleet) and boiled water
    Ms[CI.diarrhea] = ors * boil * (has("soap") ? 0.85 : 1) * (has("wells") ? 0.75 : 1) * (has("germ") ? 0.85 : 1);
    Ms[CI.fever] = 0.7 * (has("wells") ? 0.6 : 1) * (has("germ") ? 0.6 : 1);
    Ms[CI.resp] = (1 + 0.5 * Math.min(crowd, 1.5)) * (has("brick") ? 0.9 : 1) * 0.85 * (winter && crowd > 0.2 ? 1.3 : 1);
    Ms[CI.epidemic] = 0.4 * 0.85;                         // measles dies out on the crossing; sick children isolated
    Ms[CI.smallpox] = 0;                                  // everyone vaccinated (arm to arm, then calves)
    Ms[CI.tb] = 0.8 * (has("germ") ? 0.75 : 1);
    Ms[CI.accident] = (1 + 0.5 * pioneer) * (1 + 3 * ind);
    Ms[CI.violence] = 0.4;                                // the charter: one law for everyone, families not lone armed men
    Ms[CI.old] = 0.9;
    let hungerS = 0;
    if (atSea) { Ms[CI.diarrhea] *= 2; Ms[CI.fever] *= 2; Ms[CI.resp] *= 1.5; Ms[CI.accident] *= 2; }
    // "seasoning": newcomers' first year in a new land, with new food, water and work
    const fresh = sNow > 0 ? clamp(t < LAND + 12 ? 1 : (S.recent || 0) / sNow, 0, 1) : 1;
    Ms[CI.diarrhea] *= 1 + 0.6 * fresh; Ms[CI.fever] *= 1 + 0.6 * fresh; Ms[CI.resp] *= 1 + 0.3 * fresh;
    if (S.grain <= 0.01) hungerS = 0.15 * (S.short.food || 0);
    if (!atSea && winter && crowd > 0.3) hungerS += 0.02 * Math.min(1, crowd);   // cold in the first winters
    Ms[CI.hunger] = hungerS;
    const neoS = 0.5 * (has("soap") ? 0.9 : 1) * (has("germ") ? 0.85 : 1), matS = 0.45 * (has("germ") ? 0.8 : 1) * (has("hospital") ? 0.85 : 1);
    const fertS = FERT_SET * (t < LAND + 9 ? 0.6 : 1) * (S.short.food > 0.2 ? 0.8 : 1);
    let B = 0;
    for (const g of settlerGroups()) { const r = demog(g, Ms, neoS, matS, fertS, PM_SET, S.born, "set"); B += r.B; st.deaths += r.dead; }
    st.births += B;

    // ---- Native peoples ----
    const reliefNeed = [];
    for (const p of S.peoples) {
      const dry = climate(yr, p.fam === "Mississippian" || p.fam === "Ohio Valley" ? "ohio" : "hudson");
      const waveOn = p.contact != null && t - p.contact < 24;
      const Mo = new Float64Array(NC);
      for (const c of CAUSES) Mo[CI[c]] = NATIVE[c];
      Mo[CI.hunger] = 0.002 * (1 + 8 * Math.max(0, 0.97 - dry));
      if (p.contact != null) Mo[CI.tb] *= 1.3;            // more TB once trade links with the settlers exist
      const extra = waveOn ? 0.008 : 0;                   // chickenpox (from shingles), mumps, whooping cough: can't be kept out
      demogWave(p.out, Mo, extra, 1);
      demog(p.out, Mo, 1, 1, CAL_NA.scale, PM_NAT, p.out, "out");
      if (p.joined.n > 1) {
        const c = p.cov, Mj = new Float64Array(Mo);
        Mj[CI.diarrhea] *= 1 - 0.6 * c; Mj[CI.fever] *= 1 - 0.3 * c; Mj[CI.resp] *= 1 - 0.15 * c; Mj[CI.violence] *= 0.4;
        Mj[CI.tb] *= 1 - 0.2 * c * (has("germ") ? 1.5 : 1); Mj[CI.old] *= 1 - 0.1 * c;
        const deficit = Math.max(0, 1 - dry * (1.05 + 0.25 * p.plow));
        Mj[CI.hunger] = deficit > 0 ? 0.002 : 0.0005;
        if (deficit > 0) reliefNeed.push([p, deficit]);
        demogWave(p.joined, Mj, extra, 0.6);
        demog(p.joined, Mj, 1 - 0.4 * c, 1 - 0.5 * c, CAL_NA.scale * (1 + 0.1 * c), PM_NAT, p.joined, "all");
      }
    }
    function demogWave(P, M, extra, nursing) {             // the one-off wave of Old World childhood diseases after contact
      if (!extra) return;
      for (let a = 0; a < AG; a++) for (let s = 0; s < 2; s++) {
        const N = P.v[s][a]; if (N < 1e-9) continue;
        const h = extra * nursing * (a < 5 || a > 50 ? 2 : 1), d = N * (1 - Math.exp(-h / 12));
        P.v[s][a] -= d; const k = P.isJoined ? "all" : "out";
        st[k].D[a] += d; st[k].cause[CI.epidemic] += d;
      }
    }

    // ---- Aging ----
    for (const g of settlerGroups()) g.age();
    for (const p of S.peoples) { p.out.age(); p.joined.age(); }

    // ---- Labor supply ----
    const wf = 0.55 + (S.units.grist * 2500 >= sNow ? 0.07 : 0.07 * S.units.grist * 2500 / Math.max(sNow, 1)) + (has("textile") ? 0.08 * Math.min(1, S.units.textile * 5000 / sNow) : 0);
    let supply = 0;
    for (const g of settlerGroups()) for (let a = 12; a < AG; a++) {
      if (a < 13) continue; const c = a < 15 ? 0.4 : a < 60 ? 1 : a < 70 ? 0.5 : 0.15;
      supply += g.v[0][a] * c + g.v[1][a] * c * (a < 15 ? 1 : wf);
    }
    supply *= 0.84;                                  // Sundays and about 20 feast days off
    if (atSea) supply = 0;
    // specialists can't outnumber the people who exist
    const specTot = SKILLS.reduce((t, k) => t + S.skills[k], 0) + S.engineers;
    if (specTot > supply * 0.9 && supply > 0) { const f = supply * 0.9 / specTot; for (const k of SKILLS) S.skills[k] *= f; S.engineers *= f; }
    const spec = { ...S.skills };
    let gen = Math.max(0, supply - SKILLS.reduce((t, k) => t + spec[k], 0) - S.engineers);
    const use = Object.fromEntries(CATS.map(c => [c, 0]));
    const takeG = (cat, pm) => { const x = Math.min(pm, gen); gen -= x; use[cat] += x; return x; };
    const takeAny = (cat, pm) => { let got = takeG(cat, pm); for (const k of ["crafts", "carpenter", "sailor", "shipwright", "mason", "smith", "miner"]) { if (got >= pm) break; const x = Math.min(pm - got, spec[k]); spec[k] -= x; got += x; use[cat] += x; } return got; };
    const takeS = (k, n) => { const x = Math.min(n, spec[k]); spec[k] -= x; use[SKCAT[k]] += x; return x; };
    const crewFrac = (crew, scale) => { let f = 1; for (const k in crew) if (crew[k] * scale > 0) f = Math.min(f, spec[k] / (crew[k] * scale)); return clamp(f, 0, 1); };
    const takeCrew = (crew, scale) => { const f = crewFrac(crew, scale); for (const k in crew) takeS(k, crew[k] * scale * f); return f; };
    const want = (k, n) => { out.specDemand[k][t] += n; };
    use.eng += S.engineers * 0.7; use.gov += S.engineers * 0.3;

    // stocks bookkeeping: requests feed the moving averages that size the workshops
    const req = (res, amt) => { S.ema[res] = (S.ema[res] || 0) + amt; const got = Math.min(amt, S[res]); S[res] -= got; return amt > 0 ? got / amt : 1; };

    const pupils = has("school") ? sCount(null, 6, 12) : 0;
    const alliedNow = alliedN();
    if (!atSea) {
      // 0. Skilled crews for projects already under way come first (the plan's priorities)
      for (const p of S.projects) if (p.startT != null && p.doneT == null && p.dLeft <= p.design * 0.5) p.fCrew = Object.keys(p.crew).length ? takeCrew(p.crew, 1) : 1;
      // 1. Health, schools, government
      const teachNeed = pupils / 30 + S.peoples.reduce((t, p) => t + p.joined.count(null, 6, 11) * Math.min(0.5, p.cov * 0.6), 0) / 40;
      want("teacher", teachNeed); S.attend = teachNeed > 0 ? takeS("teacher", teachNeed) / teachNeed : 1;
      const healNeed = sNow / 300 + alliedNow / 3000 + 2;
      want("healer", healNeed); S.healF = takeS("healer", healNeed) / healNeed;
      takeG("gov", sNow / 250 + Math.min(S.translators, alliedNow / 800 + 4));
      // 2. Farming (seasonal) and herds
      const AU = S.cattle + 1.2 * S.horses + 0.15 * S.sheep + 0.25 * S.pigs;
      const tier = !has("plow") ? 0 : has("reaper") ? 4 : has("drill") ? 3 : has("scythe") ? 2 : 1;
      const teamsHa = tier ? (S.cattle * 0.35 / 2 + S.horses * 0.5 / 2) * 10 : 0;
      const PDt = [60, 34, 27, 21, 14][tier] * (has("steelplow") ? 0.9 : 1);
      const pd = S.planted > 0 ? (Math.min(S.planted, teamsHa) * PDt + Math.max(0, S.planted - teamsHa) * 55) / S.planted : PDt;
      const SEASON = [0, 0, 0.02, 0.18, 0.22, 0.12, 0.1, 0.14, 0.14, 0.08, 0, 0];
      const farmNeed = S.planted * pd / 25 * SEASON[m];
      const farmGot = takeAny("farm", farmNeed);
      if (m >= 2 && m <= 9) { S.cropNeed += farmNeed; S.cropGot += farmGot; }
      // herds: feeding, milking, herding inside fences (~1 person-month per cow a year), hay in July and August
      takeAny("farm", AU * 0.08 + (m === 6 || m === 7 ? AU * 0.15 : 0));
      // gardens, dairy, butchering, preserving, flax and wool
      takeAny("farm", sNow * 0.033);
      // winter threshing, hauling grain and manure
      if (m <= 1 || m >= 10) takeAny("farm", S.lastHarvest ? S.lastHarvest / 0.19 / 25 / 4 * 0.5 : 0);
      // local roads, bridges, drains and town works
      takeAny("build", sNow * 0.008);
      // 3. Firewood (masonry stoves halve it; coal heats the Forks once the mines run), fences, barns and repairs
      takeAny("build", households * (0.08 * (has("brick") ? 0.6 : 1) * (1 - 0.5 * S.forkShare * (has("coal") ? 1 : 0)) + 0.1));
      if (has("coal")) req("coal", households * S.forkShare * 3 / 12);
      // 4. Crafts for daily goods (clothes, shoes, pots, tools)
      const craftNeed = sNow * 0.015; want("crafts", craftNeed * 0.4);
      takeS("crafts", craftNeed * 0.4); takeG("craft", craftNeed * 0.6);
      // spinning, weaving and sewing at home, until the textile mill takes most of it
      takeAny("craft", sNow * 0.05 * (1 - 0.7 * Math.min(1, S.units.textile * 5000 / Math.max(sNow, 1))));
      // smiths: repairs and new tools
      const smithNeed = sNow / 120; want("smith", smithNeed); const smithF = takeS("smith", smithNeed) / smithNeed;
      if (!S.forkShare || !has("coal")) st.charcoal += smithNeed * 1.5 / 12; else req("coal", smithNeed * 2 / 12);
      // iron wear on tools, and kits for new households
      const ironPer = 3 + (has("furnace") ? 3 : 0) + (has("nails") ? 3 : 0) + (has("lathe") ? 2 : 0);
      S.toolF = 0.85 * S.toolF + 0.15 * Math.min(req("iron", sNow * ironPer / 12 / 1000), smithF);
      req("salt", (sNow * 8 + S.cattle * 12 + S.pigs * 4) / 12 / 1000 + alliedNow * 0.0005 / 12);
      S.saltF = 0.8 * S.saltF + 0.2 * Math.min(1, (S.salt + 0.001) / ((sNow * 8 + S.cattle * 12) / 12 / 1000 + 1e-6));
      if (has("paper")) req("paper", pupils * 0.5 / 12 + sNow * 0.02 / 12);

      // 5. Workshops
      const avgUse = res => (S.emaAvg?.[res] || 0) * 12;
      const desired = {
        saw: avgUse("lumber") + Math.max(0, avgUse("lumber") * 0.25 - S.lumber) * 2 + (S.lumber < 50 ? 200 : 0),
        grist: sNow, bloom: avgUse("iron") + Math.max(0, avgUse("iron") * 0.5 + 10 - S.iron) * 2,
        salt: avgUse("salt") + Math.max(0, avgUse("salt") * 0.5 - S.salt) * 2,
        paper: avgUse("paper") + Math.max(0, 200 - S.paper), press: (pupils * 200 + sNow * 60 + alliedNow * 8),
        steel: (sNow * 0.0004 + (has("lathe") ? sNow * 0.0004 : 0)) * 1.2 + Math.max(0, 2 - S.steel),
        mine: avgUse("coal") + Math.max(0, avgUse("coal") * 0.3 - S.coal), yard: 0, textile: has("textile") ? sNow : 0,
      };
      desired.furnace = desired.coke = desired.bloom;
      // ironworks share iron demand: coke first, then charcoal furnaces, then bloomeries
      let ironLeft = desired.bloom;
      const outY = {};
      for (const u of ["grist", "saw", "salt", "coke", "furnace", "bloom", "mine", "steel", "paper", "press", "yard", "textile"]) {
        const U = UNITS[u], n = S.units[u]; if (!n) { outY[u] = 0; continue; }
        let d = u === "coke" || u === "furnace" || u === "bloom" ? ironLeft : desired[u];
        if (u === "yard") d = S.yardWant || 0;
        const runUnits = Math.min(n, Math.ceil(d / U.cap - 1e-9));
        for (const k in U.crew) want(k, U.crew[k] * Math.min(n, Math.ceil(desired[u] / U.cap + 0.5)));
        if (runUnits <= 0) { outY[u] = 0; continue; }
        const f = takeCrew(U.crew, runUnits); const lab = takeG(U.cat, U.labor * runUnits * f);
        const fl = U.labor ? lab / (U.labor * runUnits) : 1;
        let o = Math.min(d, U.cap * runUnits * Math.min(f, fl));
        if (u === "coke") { const cf = req("coal", o * 4 / 12); o *= cf; }
        if (u === "furnace") { st.charcoal += o * (has("hammer") ? 3.5 : 2.5) / 12; o *= has("hammer") ? 0.9 : 0.4; }  // before the trip-hammer most pig iron only suits castings
        if (u === "bloom") st.charcoal += o * 5 / 12;
        if (u === "steel") st.charcoal += o * 3 / 12;
        if (u === "coke" || u === "furnace" || u === "bloom") ironLeft = Math.max(0, ironLeft - o);
        outY[u] = o;
        const mo = o / 12;
        if (u === "saw") { S.lumber += mo; st.lumber += mo; }
        if (u === "coke" || u === "furnace" || u === "bloom") { S.iron += mo; st.iron += mo; }
        if (u === "salt") { S.salt += mo; st.salt += mo; }
        if (u === "paper") { S.paper += mo; st.paper += mo; }
        if (u === "press") { const pr = req("paper", mo / 1000); st.impressions += mo * pr; }
        if (u === "steel") { const fi = req("iron", mo * 1.1); S.steel += mo * fi; st.steel += mo * fi; }
        if (u === "mine") { const boost = has("newcomen") ? 1.4 : 1; S.coal += mo * boost; st.coal += mo * boost; }
      }
      // charcoal: colliers cut and burn wood for every ton (about 5 person-days a ton)
      takeG("iron", st.charcoal - (S.charcoalTaken || 0) > 0 ? (st.charcoal - (S.charcoalTaken || 0)) * 0.2 : 0); S.charcoalTaken = st.charcoal;
      // hand-made lumber before (and beside) the sawmill: pit-sawing and hewing
      if (S.lumber < 30) { const pm = takeG("build", Math.min(60, 30 - S.lumber) * 0.6); S.lumber += pm / 0.6; st.lumber += pm / 0.6; }

      // 6. Houses
      const deficit = Math.max(0, households * 1.02 - S.houses) + (S.expectNew || 0) / 5.5 * (m >= 3 && m <= 5 ? 0.3 : 0);
      if (deficit > 0.5) {
        const plank = S.units.saw > 0 && S.lumber > 15;
        const per = plank ? (has("nails") ? 4.5 : 5) : 7, lum = plank ? 15 : 0;
        const winterF = m === 11 || m <= 1 ? 0.6 : 1;
        let n = Math.min(deficit, (gen * 0.6) / per * winterF);
        if (plank) n = Math.min(n, S.lumber / lum);
        if (n > 0) {
          takeG("build", n * per / winterF); if (lum) req("lumber", n * lum);
          req("iron", n * (20 + (has("nails") ? 25 : 0)) / 1000); S.houses += n; st.housesBuilt += n;
        }
      }
      // better houses: replace log cabins (about 5% a year) once everyone is housed
      if (S.units.saw > 0 && deficit <= 0.5 && S.lumber > 30 && m >= 3 && m <= 9) {
        S.logHouses = Math.min(S.logHouses ?? S.houses, S.houses);
        const n = Math.min(S.logHouses * 0.05 / 7, S.lumber / 15);
        if (n > 0) { takeG("build", n * 5); req("lumber", n * 15); S.logHouses -= n; }
      }
      // breeding animals promised to towns that joined, paid as herds allow
      if ((S.owedAnimals || 0) > 0 && S.cattle > 800 && S.pigs > 500) { const k = Math.min(S.owedAnimals, (S.cattle - 800) * 0.02 / 4); S.cattle -= 4 * k; S.pigs -= 10 * k; S.owedAnimals -= k; }
      // 7. Clearing for next year's fields
      const clearNeed = Math.max(0, (S.clearTarget || 0) - S.cleared);
      if (clearNeed > 0) {
        const share = m >= 3 && m <= 9 ? 0.25 : 0.7;
        const pm = takeG("farm", Math.min(clearNeed * 40 / 25, gen * share));
        S.cleared += pm * 25 / 40 * (S.toolF * 0.5 + 0.5);
      }
      // 8. Projects: techs and new workshops, in plan order
      let design = 0.55 + (t > (1250 - Y0) * 12 ? 0.05 : 0) + S.engineers * 0.08;
      // queue new workshops when demand outruns capacity
      for (const u in UNITS) {
        const U = UNITS[u]; if (!has(U.tech)) continue;
        const cap = S.units[u] * U.cap, d = u === "furnace" || u === "coke" || u === "bloom" ? desired.bloom : u === "yard" ? (S.yardWant || 0) : desired[u];
        const better = (u === "bloom" && (has("furnace") || has("coke"))) || (u === "furnace" && has("coke"));
        const ironCap = S.units.bloom * 12 + S.units.furnace * 300 + S.units.coke * 700;
        const short = u === "furnace" || u === "coke" || u === "bloom" ? d > ironCap * 0.9 : d > cap * 0.9;
        if (short && !better && !S.projects.some(p => p.unit === u && !p.doneT)) {
          const [ds, lb, crew, mat, minM] = U.b;
          S.projects.push({ id: "u_" + u + (S.units[u] + 1), unit: u, name: "Another " + U.name.toLowerCase(), pre: [], design: ds, labor: lb, crew, mat, minM, cat: U.cat, prio: 0 });
        }
      }
      for (const x of TECHS) if (!S.projects.some(p => p.id === x.id) && x.pre.every(has) && cond(x.id, t)) S.projects.push({ ...x, prio: 1 });
      S.projects.sort((a, b) => a.prio - b.prio);
      for (const p of S.projects) {
        if (p.doneT != null) continue;
        if (!p.startT) {                                  // start only when its materials are in hand
          if (!Object.entries(p.mat).every(([k, v]) => S[k] >= v)) { for (const k in p.mat) S.ema[k] = (S.ema[k] || 0) + p.mat[k] / 6; continue; }
          for (const [k, v] of Object.entries(p.mat)) S[k] -= v;
          Object.assign(p, { startT: t, dLeft: p.design, lLeft: p.labor, months: 0 });
        }
        for (const k in p.crew) want(k, p.crew[k]);
        const dTake = Math.min(p.dLeft, design, 1); p.dLeft -= dTake; design -= dTake;
        if (p.dLeft > p.design * 0.5) continue;
        const rate = p.labor / p.minM;
        const f = p.fCrew ?? (Object.keys(p.crew).length ? takeCrew(p.crew, 1) : 1); p.fCrew = undefined;
        if (f > 0 || !Object.keys(p.crew).length) { const got = takeG(p.cat, Math.min(p.lLeft, rate * f * 1.2)); p.lLeft -= got; }
        p.months += f >= 0.5 ? 1 : 0;
        if (p.dLeft <= 1e-6 && p.lLeft <= 1e-6 && p.months >= p.minM) finish(p, t);
      }
      // 9. Boats, exploration, trade and ships' crews
      const scouts = takeG("boat", 6 + (has("boats") ? 6 : 0));
      takeG("boat", supply * 0.025);
      if (m >= 5 && m <= 10) takeS("sailor", S.ships * 20);
      want("sailor", S.ships * 20);
      if (has("copper") && m >= 4 && m <= 8) {          // summer voyages to Lake Superior
        const crews = Math.min(3, 1 + Math.floor(alliedNow / 30000));
        const f = takeCrew({ miner: 4, sailor: 6 }, crews); takeG("boat", 20 * crews * f);
        const lsJoined = people("Lake Superior").joined.n > 500;
        const cu = (4 + (lsJoined ? 8 : 0)) * crews * f / 5; S.copper += cu; st.copper += cu;
      }
      if (has("lead") && m >= 4 && m <= 8) { const pb = 1.2 * (1 + alliedNow / 50000); S.lead += pb; st.lead += pb; }
      if (has("roads") && S.roadKm < 600) S.roadKm = 600;
      if (has("telegraph") && S.telegraphKm < 900) {     // line along the rivers: poles, insulators and iron wire
        const km = Math.min(25, 900 - S.telegraphKm); const f = req("iron", km * 0.11);
        takeG("eng", km * 4 * f); S.telegraphKm += km * f;
      }
      if (has("wagonway") && S.wagonKm < 40 * (S.units.mine || 1)) { const f = req("iron", 6); takeG("build", 30 * f); S.wagonKm += 0.5 * f; }
      if (has("newcomen") && S.newcomen < Math.max(1, S.units.mine * 0.5) && (S.engineAt || 0) <= t) {
        const f = req("iron", 6) * req("copper", 0.3); if (f > 0.99) { takeG("eng", 60); S.newcomen++; S.engineAt = t + 4; } }
      if (has("watt") && S.watt < 2 + (t - S.done.watt) / 12 * 3 && (S.wattAt || 0) <= t) {
        const f = req("iron", 5) * req("copper", 0.5); if (f > 0.99) { takeG("eng", 80); S.watt++; S.wattAt = t + 3; } }
      // 10. Apprentices: train ahead of need (the review loop sets how far ahead)
      for (const k of SKILLS) {
        if (k === "machinist" && !S.projects.some(p => p.id === "lathe" && p.startT != null)) continue;
        const target = plan.target(k, t, S.skills[k]);
        const inTr = S.training.filter(x => x.k === k).reduce((s, x) => s + x.n, 0);
        const masters = k === "teacher" || k === "healer" ? S.skills[k] * 2 + 10 + S.engineers : k === "machinist" ? S.skills[k] + S.skills.millwright * 0.5 + S.engineers * 0.1 : S.skills[k];
        let n = Math.min(target - S.skills[k] - inTr, masters - inTr, gen * 0.08);
        if (k === "teacher") n = Math.min(n, sumLitYouth() * 0.05);
        if (n > 0.2) { S.training.push({ k, n, done: t + TRAIN_MONTHS[k] }); }
      }
      for (const x of S.training) takeG(SKCAT[x.k], x.n);
      // 11. Leftover time: extra clearing in winter, crafts and home industry the rest of the year
      if (gen > 0) {
        const room = Math.max(0, (S.clearTarget || 0) * 1.1 - S.cleared);
        if (!(m >= 3 && m <= 9) && room > 0) { const pm = Math.min(gen * 0.4, room * 40 / 25); S.cleared += pm * 25 / 40; use.farm += pm; gen -= pm; }
        st.idle += gen; use.spare += gen; gen = 0;
      }
      for (const k of SKILLS) if (spec[k] > 0) use.spare += spec[k];
      for (const c of CATS) st.work[c] += use[c];
      st.supply += supply;
      S.scoutPM = scouts;
    }
    // EMA of requests per month
    S.emaAvg ||= {};
    for (const k in S.ema) { S.emaAvg[k] = (S.emaAvg[k] ?? S.ema[k]) * 0.85 + S.ema[k] * 0.15; S.ema[k] = 0; }

    // ---- Training finishes; skilled people age out ----
    S.training = S.training.filter(x => { if (x.done <= t) { S.skills[x.k] += x.n * 0.95; return false; } return true; });
    for (const k of SKILLS) S.skills[k] *= 1 - 0.025 / 12;
    S.engineers *= 1 - 0.015 / 12;
    // founder's school: picked students, five years of everything
    if (m === 8 && t > LAND) {
      const intake = Math.min(60, 15 + settlers() / 1000 * 2) + (alliedNow > 2000 ? Math.min(20, alliedNow / 5000) : 0);
      S.school.push({ n: intake, grad: t + 60 });
    }
    S.school = S.school.filter(c => { if (c.grad <= t) { S.engineers += c.n * 0.9; return false; } return true; });

    // ---- Literacy: school children and winter classes ----
    const alpha = has("alpha") ? 1.5 : 1;
    for (const g of settlerGroups()) {
      for (let a = 7; a <= 12; a++) { const n = g.at(a), l = g.L[a]; g.L[a] = l + (n - l) * (has("school") ? (S.attend || 0) / 36 * alpha : 0); }
      if (has("alpha") && (m >= 10 || m <= 2)) for (let a = 15; a <= 40; a++) { const n = g.at(a), l = g.L[a]; g.L[a] = l + (n - l) * 0.012 * (S.attend || 0); }
    }
    if (has("alpha")) for (const p of S.peoples) if (p.joined.n > 0) {
      const kids = p.joined.count(null, 7, 12), att = Math.min(0.5, p.cov * 0.6) * (S.attend || 0);
      for (let a = 7; a <= 12; a++) { const n = p.joined.at(a), l = p.joined.L[a]; p.joined.L[a] = l + (n - l) * att / 36; }
    }

    // ---- Food: harvest in September and October; planting plan in March ----
    if (!atSea) {
      const sN = settlers(), need = sumAges(NEED);
      const wild = 0.12 / (1 + sN / 40000);
      const dairy = Math.min(0.25, S.cattle * 0.4 * 0.14 / Math.max(need, 1));
      const use_ = need * (1 - wild - dairy) / 12 + S.horses * 0.4 / 12 + S.pigs * 0.15 / 12;
      st.grainNeed += use_;
      S.grain -= use_;
      S.short.food = S.grain < 0 ? -S.grain / use_ : 0;
      if (S.grain < 0) S.grain = 0;
      S.grain *= 1 - 0.05 / 12;                           // losses in rat-proof bins
      if (m === 8 || m === 9) {
        const fulfil = S.cropNeed > 0 ? clamp(S.cropGot / S.cropNeed, 0, 1) : 1;
        const yHa = yieldHa(S, has, t);
        const clim = climate(yr, "hudson") * (1 - S.forkShare) + climate(yr, "ohio") * S.forkShare;
        const crop = S.planted * yHa * fulfil * clim * (m === 8 ? 0.6 : 0.4);
        S.grain += crop * 0.88; st.grainProd += crop; // 12% kept back as seed
        if (m === 9) { S.lastHarvest = st.grainProd; S.cropNeed = 0; S.cropGot = 0; if (yr === 1243) { S.grain += 60; ev(t, "First harvest, plus 60 t of maize traded from Mahican and Mohawk neighbors for iron and glass"); } }
      }
      if (m === 2 || t === LAND) {
        const cropFrac = has("clover") ? 0.62 : 0.55;
        const growth = 1.05 + (S.expectNew || 0) / Math.max(sN, 1);
        const needNext = need * growth * (1 - wild - dairy) + S.horses * 0.4 + S.pigs * 0.15 + alliedN() * 0.01;
        const target = 2 * needNext;                     // the plan's two years in store
        const stockAtHarvest = S.grain - (use_ * 6);
        const H = needNext / 0.88 + Math.max(0, target - stockAtHarvest) / 2.5;
        const yHa = yieldHa(S, has, t);
        if (t === LAND) S.cleared = 250 / 0.55;           // old fields and meadows granted by agreement
        let ha = Math.min(H / yHa, S.cleared * cropFrac);
        const tier = !has("plow") ? 0 : 1, peak = supply * 0.7 / (0.22 * (tier ? 30 : 55) / 25);
        ha = Math.min(ha, peak);
        S.planted = ha;
        // fields (with fallow) plus fenced pasture for a herd growing toward ~0.8 animal units per settler
        const AUnow = S.cattle + 1.2 * S.horses + 0.15 * S.sheep;
        S.auTarget = Math.min(AUnow * 1.35, 0.8 * sN * growth);
        S.clearTarget = (H * 1.12 / yHa) / 0.9 + S.auTarget / (has("clover") ? 1.2 : 1);
      }
      // herds: logistic growth on fenced pasture, culls become meat
      const cropFrac = has("clover") ? 0.62 : 0.55;
      const AU = S.cattle + 1.2 * S.horses + 0.15 * S.sheep;   // pigs forage in fenced woodlots
      const AUcap = 250 + Math.max(0, S.cleared - S.planted / 0.9) * (has("clover") ? 1.2 : 1);
      const room = Math.max(0, 1 - AU / AUcap), sf = 0.7 + 0.3 * S.saltF;
      S.cattle += S.cattle * 0.25 / 12 * room * sf; S.horses += S.horses * 0.15 / 12 * room * sf;
      S.sheep += S.sheep * 0.35 / 12 * room * sf; S.pigs += S.pigs * 1.5 / 12 * sf;
      if (AU > AUcap) { const f = AUcap / AU; S.grain += S.cattle * (1 - f) * 0.12 + S.sheep * (1 - f) * 0.02; S.cattle *= f; S.horses *= f; S.sheep *= f; }
      const pigMax = 0.5 * sN + 200; if (S.pigs > pigMax) { S.grain += (S.pigs - pigMax) * 0.05; S.pigs = pigMax; }
    } else if (t === 0) { /* voyage */ }
    if (atSea) { const u = 3000 * 0.21 / 12; S.grain -= u; st.grainNeed += u; if (t === LAND - 1) { S.cattle *= 0.83; S.horses *= 0.8; S.sheep *= 0.83; S.pigs *= 0.9; } }
    if (t === LAND) { S.houses = 0; ev(t, "Livestock ashore after losses at sea: ~" + r0(S.horses) + " horses, " + r0(S.cattle) + " cattle, " + r0(S.sheep) + " sheep and goats, " + r0(S.pigs) + " pigs"); }

    // ---- Allied towns: drought relief from the shared granaries ----
    for (const [p, d] of reliefNeed) {
      const ask = p.joined.n * 0.25 * d / 12, give = Math.min(ask, Math.max(0, S.grain - settlers() * 0.25 * 0.5));
      S.grain -= give; st.relief += give;
    }

    // ---- Exploration and the federation ----
    if (!atSea) {
      S.radiusH = Math.min(1400, 150 + (t - LAND) / 12 * (100 + (has("boats") ? 40 : 0)) * (alliedNow > 5000 ? 1.3 : 1));
      if (has("forks")) S.radiusF = Math.min(1600, 100 + (t - S.done.forks) / 12 * 140 * (has("canal") ? 1.3 : 1) * (alliedNow > 5000 ? 1.3 : 1));
      // translators: the hero, youth exchanges, Native people in settler towns, bilingual school leavers, men married into towns
      S.exchange *= 1 - 0.02 / 12; S.wedded *= 1 - 0.02 / 12;
      if (m === 4) S.exchange += 6 + (has("alpha") ? sCount(null, 15, 15) * 0.04 : 0);
      S.translators = 1 + S.exchange + S.ntown.n * 0.4 + S.wedded;
      let cap = S.translators * 800 - alliedNow;
      const giftNeed = { iron: 0.6, cattle: 4, pigs: 10, grain: 1.5 };   // per 1,000 people who join
      for (const p of [...S.peoples].sort((a, b) => Math.min(a.dH, a.dF) - Math.min(b.dH, b.dF))) {
        if (p.contact == null && (p.dH <= S.radiusH || (has("forks") && p.dF <= S.radiusF))) {
          p.contact = t; ev(t, `First contact with the ${p.n}`); p.out.isJoined = false; p.joined.isJoined = true;
        }
        if (p.contact == null) continue;
        const rep = Math.max(0.6, 1 - alliedNow / 200000);
        if (t - p.contact < p.trustYears * 12 * rep) continue;
        if (!has("calf")) continue;                       // vaccine for every new town
        if (p.out.n < p.P0 * 0.08) continue;              // some villages never join
        let n = p.out.n / (p.joinYears * 12);
        n = Math.min(n, Math.max(0, cap));
        if (S.healF < 0.8) n *= S.healF;
        for (const k in giftNeed) { const have = k === "cattle" ? S.cattle - 800 : k === "pigs" ? S.pigs - 500 : k === "grain" ? S.grain - settlers() * 0.1 : S.iron - 2; if (k === "iron" || k === "grain") n = Math.min(n, Math.max(0, have) / giftNeed[k] * 1000); }
        if (n < 1) continue;
        if (p.first == null) { p.first = t; ev(t, `The first ${p.n} towns join the federation`); }
        const k = n / 1000; S.iron -= giftNeed.iron * k; S.grain -= giftNeed.grain * k; st.gifts += n; S.owedAnimals = (S.owedAnimals || 0) + k;
        p.joined.moveFrom(p.out, n / p.out.n); cap -= n; st.joinedYr += n;
      }
      for (const p of S.peoples) if (p.first != null) {
        p.cov = Math.min(has("hospital") ? 0.9 : 0.75, p.cov + 0.2 / 12 * Math.min(1, S.healF) * (has("press") ? 1.3 : 1));
        p.plow = Math.min(1, p.plow + 0.1 / 12 * (has("plow") ? 1 : 0));
      }
      // people moving between towns: Native students and workers into settler towns; surplus settler men marry into Native towns
      for (const p of S.peoples) if (p.joined.n > 100) S.ntown.moveFrom(p.joined, 0.0025 / 12);
      if (alliedNow > 500) {
        const surplus = sCount(0, 20, 34) - sCount(1, 18, 32);
        if (surplus > 0) {
          const nMove = surplus * 0.04 / 12, target = S.peoples.filter(p => p.joined.n > 300).sort((a, b) => b.joined.n - a.joined.n)[0];
          if (target) { let left = nMove; for (const g of settlerGroups()) left -= target.joined.moveAges(g, 0, 20, 34, left * g.count(0, 20, 34) / Math.max(1, sCount(0, 20, 34))); S.wedded += nMove; }
        }
      }
      // furs from allied and trading towns
      const furs = (alliedNow * 0.25 + S.peoples.reduce((t, p) => t + (p.contact != null ? p.out.n * 0.05 : 0), 0)) / 12;
      S.furs += furs; st.furs += furs;
      if (has("forks")) { const tgt = Math.min(0.75, 0.2 + (t - S.done.forks) / 12 * 0.04); S.forkShare += (tgt - S.forkShare) / 24; }
    }

    // ---- Immigrant ships arrive each June; ships sail home in August ----
    if (m === 5 && yr >= 1244) {
      const sN = settlers();
      const hired = Math.min(15, 3 + Math.floor((S.fursLast || 0) / 6000));
      const shipCap = (S.ships + hired) * 110;
      const foodCap = Math.max(0, (S.grain - sumAges(NEED) * 0.25) / 0.08);
      const absorb = sN * 0.15;
      const n = Math.max(0, Math.min(IMMIG_POOL(yr), shipCap, foodCap, absorb));
      if (n > 0) {
        const arrive = n * 0.985;                          // ~1.5% die on the crossing
        S.immig.addShape(norm(shapeFam), arrive * 0.85, 0.1); S.immig.addShape(adult(16, 40, 0.8), arrive * 0.15, 0.1);
        for (const [k, f] of Object.entries({ smith: 0.01, carpenter: 0.02, mason: 0.01, crafts: 0.04, healer: 0.003, teacher: 0.003, miner: 0.005, ironworker: 0.005, sailor: 0.01 })) S.skills[k] += arrive * f;
        st.immig += arrive; st.deaths += n - arrive; S.recent = (S.recent || 0) + arrive;
        // the same ships carry breeding stock: per 100 passengers ~3 cows, 1 horse, 4 sheep (a fifth die at sea)
        S.cattle += arrive * 0.024; S.horses += arrive * 0.008; S.sheep += arrive * 0.032;
        ev(t, `${r0(arrive).toLocaleString("en-US")} immigrants land (limit: ${n === IMMIG_POOL(yr) ? "recruits" : n === shipCap ? "ships" : n === foodCap ? "food in store" : "the 15% absorption rule"})`);
      }
      S.lastLimit = { pool: IMMIG_POOL(yr), shipCap, foodCap, absorb, n };
    }
    S.recent = (S.recent || 0) * (1 - 1 / 12);
    if (m === 2) S.expectNew = Math.min(IMMIG_POOL(yr), (S.ships + 3) * 110, settlers() * 0.15);
    if (m === 7 && !atSea) { S.fursLast = S.furs; S.furs = 0; S.ships *= 0.95; }
    if (S.units.yard && m === 11) {                        // federation-built ocean ships
      const want_ = Math.min(S.units.yard * 2, Math.ceil(S.yardWant || 0)); if (want_ > 0) { const n = want_ * req("lumber", 120 * want_); S.ships += n; req("iron", 4 * n); }
    }
    S.yardWant = has("shipyard") ? Math.max(0, (IMMIG_POOL(yr) / 110) - S.ships - 3) : 0;

    // ---- Monthly record ----
    out.m.settlers.push(r0(settlers())); out.m.allied.push(r0(alliedN()));
    out.m.grainMonths.push(r1(S.grain / Math.max(1e-6, sumAges(NEED) / 12)));
    out.m.iron.push(r1(S.iron));

    // ---- Yearly record ----
    if (m === 11) {
      const sN = settlers(), aN = alliedN(), oN = S.peoples.reduce((t, p) => t + p.out.n, 0);
      push("settlers", r0(sN)); push("allied", r0(aN)); push("outside", r0(oN)); push("total", r0(sN + aN));
      for (const f of FAMILIES) push("fam_" + f, r0(S.peoples.filter(p => p.fam === f).reduce((t, p) => t + p.joined.n, 0)));
      push("g_fleet", r0(S.fleet.n)); push("g_born", r0(S.born.n)); push("g_immig", r0(S.immig.n)); push("g_ntown", r0(S.ntown.n));
      push("births", r0(st.births)); push("deaths", r0(st.deaths)); push("immigrants", r0(st.immig)); push("joined", r0(st.joinedYr));
      for (const k of ["set", "all", "out"]) {
        const A = st[k], lt = lifeTable(A.E, A.D, A.B, A.neo), pop = A.E.reduce((x, y) => x + y, 0);
        push("e0_" + k, lt.e0 == null || pop < 200 ? null : r1(lt.e0)); push("imr_" + k, lt.imr == null || pop < 200 ? null : r0(lt.imr * 1000));
        const show = SHOW.map(([, cs]) => cs.reduce((t, c) => t + A.cause[c === "newborn" ? NEWBORN : c === "maternal" ? MATERNAL : CI[c]], 0));
        SHOW.forEach(([lab], i) => push(`cdr_${k}_${i}`, pop > 200 ? r1(show[i] / pop * 1000) : null));
      }
      const wsum = CATS.reduce((t, c) => t + st.work[c], 0) || 1;
      for (const c of CATS) push("work_" + c, r1(st.work[c] / wsum * 100));
      push("workers", r0(st.supply / 12));
      push("grainProd", r0(st.grainProd)); push("grainNeed", r0(st.grainNeed)); push("grainStock", r0(S.grain));
      push("cattle", r0(S.cattle)); push("horses", r0(S.horses)); push("pigs", r0(S.pigs)); push("sheep", r0(S.sheep));
      push("ironMade", r1(st.iron)); push("steelMade", r1(st.steel)); push("ironStock", r1(S.iron));
      push("ironPerCap", r1((st.iron + (y === 0 ? 0 : 0)) / sN * 1000));
      push("salt", r1(st.salt)); push("lumber", r0(st.lumber)); push("coal", r0(st.coal)); push("charcoal", r0(st.charcoal));
      push("copper", r1(st.copper)); push("lead", r1(st.lead)); push("paper", r0(st.paper)); push("books", r0(st.impressions / 100));
      const kwW = Object.entries(UNITS).reduce((t, [u, U]) => t + S.units[u] * U.kw, 0) + (has("hammer") ? 10 : 0) + (has("nails") ? 10 : 0) + (has("lathe") ? 8 : 0);
      push("kwWater", r0(kwW)); push("kwSteam", r0(S.newcomen * 4 + S.watt * 10));
      push("houses", r0(S.houses)); push("perHouse", r1(sN / Math.max(1, S.houses))); push("cleared", r0(S.cleared * 0.4047 * 0 + S.cleared));
      const lit = settlerGroups().reduce((t, g) => { let l = 0; for (let a = 10; a < AG; a++) l += g.L[a]; return t + l; }, 0) / Math.max(1, sCount(null, 10, AG - 1));
      push("literacy", r0(lit * 100));
      push("ships", r1(S.ships)); push("telegraphKm", r0(S.telegraphKm)); push("engineers", r0(S.engineers)); push("translators", r0(S.translators));
      push("furs", r0(st.furs)); push("relief", r0(st.relief)); push("forkShare", r0(S.forkShare * 100));
      for (const k of SKILLS) push("sk_" + k, r0(S.skills[k]));
      resetYear(); S.charcoalTaken = 0;
    }
  }
  out.techs = TECHS.map(x => ({ id: x.id, name: x.name, cat: x.cat, start: S.projects.find(p => p.id === x.id)?.startT, done: S.done[x.id] ?? null }));
  out.units = { ...S.units };
  out.peoples = S.peoples.map(p => ({ n: p.n, fam: p.fam, pop0: p.P0, contact: p.contact == null ? null : ym(p.contact), first: p.first == null ? null : ym(p.first),
    joined: r0(p.joined.n), outside: r0(p.out.n) }));
  out.end = S;
  return out;

  function finish(p, t) {
    p.doneT = t;
    if (p.unit) { S.units[p.unit]++; return; }
    S.done[p.id] = t;
    const U = Object.entries(UNITS).find(([, U]) => U.tech === p.id); if (U) S.units[U[0]]++;
    if (p.id === "forks") { S.forkShare = 0.15; }
    ev(t, `Done: ${p.name}`);
  }
  function cond(id, t) {
    const af = AFTER[id]; if (af && !(has(af[0]) && t - S.done[af[0]] >= af[1])) return false;
    if (POPMIN[id] && settlers() < POPMIN[id]) return false;
    switch (id) {
      case "calf": return S.cattle >= 20 && S.houses > 0;
      case "forks": return settlers() >= 5000 && trustDone("Monongahela", t);
      case "salt1": return trustDone("Owasco", t);
      case "copper": return contactOf("Lake Superior");
      case "lead": return contactOf("Oneota") || contactOf("Aztalan");
      case "canal": return contactOf("Angel") || contactOf("Kincaid");
      default: return S.houses > 0;
    }
  }
  function contactOf(n) { const p = people(n); return p && p.contact != null; }
  function trustDone(n, t) { const p = people(n); return p && p.contact != null && p.contact + p.trustYears * 12 * 0.8 <= t; }
  function sumLitYouth() { return settlerGroups().reduce((t, g) => { for (let a = 15; a <= 25; a++) t += g.L[a]; return t; }, 0); }
}

function norm(sh) { const t = sh[0].reduce((x, y) => x + y) + sh[1].reduce((x, y) => x + y); return sh.map(x => Float64Array.from(x, v => v / t)); }
function childShape() { return CAL_EU.sh.map(x => Float64Array.from(x, (v, a) => a < 15 ? v : 0)); }
function popOf(sh, n) { const p = new Pop(); p.addShape(sh, n, 0); return p; }

// The display groups for causes of death.
const SHOW = [["Stomach illness & fevers", ["diarrhea", "fever"]], ["Lung infections", ["resp"]], ["Newborn & childbirth", ["newborn", "maternal"]],
  ["Childhood epidemics", ["epidemic", "smallpox"]], ["Tuberculosis", ["tb"]], ["Accidents & violence", ["accident", "violence"]],
  ["Hunger & cold", ["hunger"]], ["Old age & chronic", ["old"]]];

// ---------- The review loop ----------
// Pass 1 trains apprentices only when a shortage shows up. Each later pass reads the whole previous timeline
// and starts training early enough that people are ready when the work needs them.
function reactivePlan() { return { name: "reactive", target: (k, t, have) => have * 1.0 + 0 }; }
function foresightPlan(prev) {
  const D = prev.specDemand;
  return {
    name: "foresight",
    target(k, t) {
      const ahead = TRAIN_MONTHS[k] + 6; let mx = 0;
      for (let u = t; u < Math.min(NM, t + ahead); u++) mx = Math.max(mx, D[k][u]);
      return mx * 1.1;
    },
  };
}
function reactive2(prevNone) {                            // pass 1: demand seen this month only
  return { name: "reactive", target: (k, t, have) => have, demandNow: true };
}

const key = o => ({
  settlers1250: o.y.settlers[7], settlers1270: o.y.settlers[27], settlers1282: o.y.settlers[39],
  allied1270: o.y.allied[27], allied1282: o.y.allied[39], e0_1282: o.y.e0_set[39],
  techs: Object.fromEntries(o.techs.filter(x => typeof x === "object").map(x => [x.id, x.done])),
});
function diff(a, b) {
  let mx = 0;
  for (const k of ["settlers1250", "settlers1270", "settlers1282", "allied1270", "allied1282", "e0_1282"]) mx = Math.max(mx, Math.abs((a[k] || 0) - (b[k] || 0)) / Math.max(k === "e0_1282" ? 1 : 1000, Math.abs(b[k] || 0)));
  let moved = 0, dm = 0;
  for (const id in a.techs) { const x = a.techs[id], y = b.techs[id]; if (x == null && y == null) continue; if (x == null || y == null) { moved++; dm = Math.max(dm, 99); continue; } if (x !== y) { moved++; dm = Math.max(dm, Math.abs(x - y)); } }
  return { pct: mx * 100, techsMoved: moved, maxShift: dm };
}

// pass 1: reactive; the demand log from each pass feeds the next
let plan = { name: "reactive", target: (k, t, have) => have + 0.0001 };
const passes = [];
let prev = null, res = null;
const pass1Demand = [];
for (let pass = 1; pass <= 10; pass++) {
  res = run(plan);
  if (pass === 1) {                                       // the reactive pass also trains to meet this month's shortfall
    plan = { name: "reactive+", target: (k, t) => res.specDemand[k][t] };
    res = run(plan);
  }
  const k = key(res);
  const d = prev ? diff(k, prev) : null;
  passes.push({ pass, plan: pass === 1 ? "Train only when short" : "Train ahead of the previous timeline's needs", settlers1250: k.settlers1250, settlers1270: k.settlers1270,
    settlers1282: k.settlers1282, allied1282: k.allied1282, e0_1282: k.e0_1282, change: d ? `${r1(d.pct)}% in key numbers; ${d.techsMoved} tech dates moved (max ${d.maxShift} mo)` : "first full run" });
  console.log(`pass ${pass}: settlers ${k.settlers1250}/${k.settlers1270}/${k.settlers1282}, allied 1282 ${k.allied1282}, e0 ${k.e0_1282}`, d ? `Δ ${r1(d.pct)}% techs ${d.techsMoved} max ${d.maxShift}` : "");
  if (d && d.pct < 1 && d.maxShift <= 2) break;
  prev = k;
  plan = foresightPlan(res);
}

// Claude's review passes: each full 40-year run was read against real analogues and the model fixed
const REVIEWS = [
  { pass: "A", found: "Settlers 172k by 1282; Native towns 92% joined by 1264; germ theory in 1246, a coke furnace in 1251",
    fix: "Recruits grow 4% a year, not 6%; joining needs trust, translators (800 people each) and longer talks; techs wait for experience, market size and trials" },
  { pass: "B", found: "Steam engines, telegraph and textile mill never finished: nobody could teach machinists",
    fix: "Millwrights and engineers can train machinists" },
  { pass: "C", found: "850,000 ha cleared and 54% of time on made-up crafts: herds, home work, firewood and fences were missing",
    fix: "Added herd, hay, home, firewood, fence and spinning work; clearing capped near need" },
  { pass: "D", found: "No Native town joined before 1258: the gift package waited for 800 cattle",
    fix: "Towns join on vaccine, iron and seed; breeding animals follow as herds allow" },
  { pass: "E", found: "Cattle stuck near 1 per 20 settlers; pigs ate the pasture",
    fix: "Pigs forage in woodlots; immigrant ships carry breeding stock (~3 cows per 100 people)" },
  { pass: "F", found: "Labor too light: no rest days, threshing, town works or trades",
    fix: "Sundays and feast days off; winter threshing; roads and drains; shoemakers, tailors and coopers (1.5% of people); school to age 12" },
];
// ---------- Write the output ----------
const years = Array.from({ length: NY }, (_, i) => Y0 + i);
const techs = res.techs.filter(x => typeof x === "object").map(x => ({ ...x, start: x.start == null ? null : ym(x.start), done: x.done == null ? null : ym(x.done) }));
const output = {
  meta: { title: "North America simulation", generated: new Date().toISOString().slice(0, 10), start: Y0, end: Y0 + NY - 1,
    note: "Story estimates from a month-by-month model. Not research results.",
    calibration: { europeBaselineE0: r1(CAL_EU.e0), nativeBaselineE0: r1(CAL_NA.e0), settlerTFR: 7.0 } },
  years, y: res.y, m: res.m, techs, events: res.events.sort((a, b) => a.t < b.t ? -1 : 1), peoples: res.peoples, passes, reviews: REVIEWS,
  labels: { work: CATS.map(c => [c, CAT_LABEL[c]]), causes: SHOW.map(s => s[0]), families: FAMILIES, units: res.units },
};
fs.mkdirSync(path.join(ROOT, "data/sim"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "data/sim/north-america.json"), JSON.stringify(output));
console.log("wrote data/sim/north-america.json", (JSON.stringify(output).length / 1024).toFixed(0) + " KB");
