// Sacred Generative Architect - p5.js
// Pulse rebuild (thicker/stronger rays + slower core heartbeat):
// - Center core glow: slower heartbeat (scale + alpha + soft halo)
// - Radial rays: thicker + brighter, synced heartbeat + per-ray shimmer
// - Macro modulation: slowly weak <-> strong over time
// Keeps: particles + rays + enso (kamon-friendly)

const DEBUG = false;

let fps = 30;
let DURATION = 60;
let particles = [];
let seed;

// ---- Pulse tuning (updated per request) ----
const PULSE = {
  // slower heartbeat
  bpm: 36, // ✅ slower than before (was 54)

  // macro weak <-> strong
  strengthMin: 0.45,
  strengthMax: 1.25,
  macroSpeed: 0.10,

  // core glow
  coreBase: 3.2,
  coreAmp: 7.0,
  coreAlphaBase: 35,
  coreAlphaAmp: 120,
  haloLayers: 10,
  haloSize: 22,
  haloAlpha: 26,

  // rays (✅ thicker + stronger)
  raysBaseAlpha: 22,   // was 14
  raysAlphaAmp: 48,    // was 26 (stronger pulse brightness)
  raysBaseW: 1.8,      // was 1.0 (thicker base)
  raysWAmp: 1.8,       // was 0.9 (thicker with pulse)
  raysLenJitter: 0.18, // was 0.14 (slightly stronger breathing)
  shimmerAmt: 0.22,
};

function setup() {
  createCanvas(960, 540);
  frameRate(fps);
  pixelDensity(1);

  seed = 12345;
  randomSeed(seed);
  noiseSeed(seed);

  for (let i = 0; i < 520; i++) particles.push(new Particle());
}

function draw() {
  const t = (frameCount / fps) % DURATION;
  background(0);

  const scene = getScene(t);
  const global = smoothstep(0.0, 1.0, t / 58.0);

  drawParticles(t, global);

  // --- pulse signals ---
  const tt = frameCount / fps;

  // macro modulation: slowly weak <-> strong
  const macro = lerp(
    PULSE.strengthMin,
    PULSE.strengthMax,
    0.5 + 0.5 * sin(tt * PULSE.macroSpeed)
  );

  // heartbeat (0..1)
  const beat = heartbeat(tt, PULSE.bpm);
  const pulse = beat * macro;

  push();
  translate(width / 2, height / 2);

  drawRadialLines(tt, scene, pulse);
  drawEnsoBarrierEnsoAligned(tt, scene);

  // core glow last so it sits on top
  drawCoreGlow(tt, scene, pulse);

  pop();

  vignetteSoft();
  if (DEBUG) drawDebugOverlay(tt, scene, pulse, macro);
}

function getScene(t) {
  if (t < 10) return { name: "A", p: t / 10 };
  if (t < 25) return { name: "B", p: (t - 10) / 15 };
  if (t < 40) return { name: "C", p: (t - 25) / 15 };
  if (t < 55) return { name: "D", p: (t - 40) / 15 };
  return { name: "E", p: (t - 55) / 5 };
}

// ---------------- HEARTBEAT SHAPE ----------------
// Returns 0..1 with two quick peaks per beat ("lub-dub"), now slower via bpm
function heartbeat(tt, bpm) {
  const hz = bpm / 60.0;
  const x = (tt * hz) % 1.0;

  const p1 = expPulse(x, 0.20, 0.055, 1.0);  // slightly wider for slow feel
  const p2 = expPulse(x, 0.38, 0.075, 0.55); // second peak
  const base = 0.06;

  return constrain(base + p1 + p2, 0, 1);
}

function expPulse(x, mu, sigma, amp) {
  const d = x - mu;
  const g = Math.exp(-(d * d) / (2 * sigma * sigma));
  return amp * g;
}

// ---------------- PARTICLES ----------------
function drawParticles(tt, global) {
  const alpha = 22 + 34 * global;
  noStroke();
  for (const p of particles) {
    p.update(tt);
    fill(255, alpha * p.twinkle(tt));
    circle(p.x, p.y, p.r);
  }
}

// ---------------- RADIAL RAYS (THICKER + STRONGER) ----------------
function drawRadialLines(tt, scene, pulse) {
  let appear = 0.0;

  if (scene.name === "A") appear = 0.0;
  else if (scene.name === "B") {
    const p = scene.p;
    const rise = smoothstep(0.0, 0.55, p);
    const hold = smoothstep(0.55, 0.80, p);
    const base = rise * (1.0 - hold) + 1.0 * hold;
    appear = constrain(base, 0, 1);
  } else if (scene.name === "C") appear = 0.85;
  else if (scene.name === "D") appear = 0.80;
  else if (scene.name === "E") appear = 0.55;

  const baseLen = min(width, height) * 0.46;

  // Pulse drives alpha + weight + slight length breathing
  const a = PULSE.raysBaseAlpha + PULSE.raysAlphaAmp * pulse;
  const w = PULSE.raysBaseW + PULSE.raysWAmp * pulse;

  const totalLines = floor(lerp(0, 78, appear));
  const wobble = 0.05;

  for (let i = 0; i < totalLines; i++) {
    const a0 = (TWO_PI * i) / max(1, totalLines);

    const n = noise(i * 0.03, tt * 0.10);
    const ang = a0 + wobble * (n - 0.5);

    // Per-ray shimmer
    const shimmer =
      1.0 + PULSE.shimmerAmt * (noise(1000 + i * 0.17, tt * 0.85) - 0.5);

    // Pulse length breathing
    const lenBreath = 1.0 + PULSE.raysLenJitter * pulse;

    const len = baseLen * (0.90 + 0.12 * n) * shimmer * lenBreath;

    stroke(255, a);
    strokeWeight(w);
    line(0, 0, cos(ang) * len, sin(ang) * len);
  }
}

// ---------------- CORE GLOW (SLOWER HEARTBEAT) ----------------
function drawCoreGlow(tt, scene, pulse) {
  if (scene.name === "A") return;

  const r = PULSE.coreBase + PULSE.coreAmp * pulse;
  const a = PULSE.coreAlphaBase + PULSE.coreAlphaAmp * pulse;

  // Soft halo layers
  noStroke();
  for (let k = 0; k < PULSE.haloLayers; k++) {
    const u = (k + 1) / PULSE.haloLayers;
    const rr = r + u * (PULSE.haloSize * (0.7 + 0.7 * pulse));
    const aa = PULSE.haloAlpha * (1.0 - u) * (0.35 + 0.90 * pulse);
    fill(255, aa);
    circle(0, 0, rr);
  }

  fill(255, a);
  circle(0, 0, r);
}

// ---------------- ENSO BARRIER ----------------
function drawEnsoBarrierEnsoAligned(tt, scene) {
  let strength = 0.0;
  if (scene.name === "A") strength = 0.0;
  else if (scene.name === "B") strength = 1.0;
  else if (scene.name === "C") strength = 0.65;
  else if (scene.name === "D") strength = 0.55;
  else if (scene.name === "E") strength = 0.35;

  if (strength <= 0) return;

  const R = min(width, height) * 0.34;
  const alpha = lerp(0, 90, strength);
  const weight = lerp(1.8, 3.8, strength);

  let gap = 0.0;
  let align = 0.0;

  if (scene.name === "B") {
    const p = scene.p;
    const inHold =
      smoothstep(0.50, 0.62, p) * (1.0 - smoothstep(0.74, 0.88, p));
    gap = lerp(0.16, 0.30, inHold);
    align = constrain(inHold, 0, 1);
  } else if (scene.name === "C") gap = 0.16;
  else if (scene.name === "D") gap = 0.12;
  else gap = 0.10;

  const gapCenterDrift = -HALF_PI + 0.30 * sin(tt * 0.20);
  const gapCenterPrayer = -HALF_PI;
  const gapCenter = lerpAngle(gapCenterDrift, gapCenterPrayer, align);

  const startA = gapCenter + gap;
  const endA = gapCenter + TWO_PI - gap;

  noFill();
  stroke(255, alpha);
  strokeWeight(weight);

  const wob = 1.0 + 0.006 * (noise(500, tt * 0.12) - 0.5);
  arc(0, 0, R * 2 * wob, R * 2 * wob, startA, endA);

  noStroke();
  fill(255, lerp(0, 10, strength));
  circle(0, 0, R * 1.05);
}

function lerpAngle(a, b, t) {
  let d = ((b - a + PI) % (TWO_PI)) - PI;
  return a + d * t;
}

// ---------------- HELPERS ----------------
function smoothstep(edge0, edge1, x) {
  x = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function vignetteSoft() {
  noStroke();
  for (let i = 0; i < 16; i++) {
    const a = map(i, 0, 15, 0, 15);
    fill(0, a);
    rect(i * 2, i * 2, width - i * 4, height - i * 4);
  }
}

function drawDebugOverlay(tt, scene, pulse, macro) {
  noStroke();
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text(
    `t=${nf(tt, 2, 2)} scene=${scene.name} pulse=${nf(pulse, 1, 2)} macro=${nf(
      macro,
      1,
      2
    )}`,
    12,
    12
  );
}

// ---------------- PARTICLE CLASS ----------------
class Particle {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.r = random(0.6, 1.6);
    this.spd = random(0.05, 0.2);
    this.off = random(1000);
  }

  update(tt) {
    const nx = noise(this.off, tt * 0.08) - 0.5;
    const ny = noise(this.off + 99.9, tt * 0.08) - 0.5;
    this.x += nx * this.spd;
    this.y += ny * this.spd;

    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  twinkle(tt) {
    return 0.6 + 0.4 * noise(this.off * 0.02, tt * 0.35);
  }
}
