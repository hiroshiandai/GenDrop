// Sacred Generative Architect - p5.js
// Clean Crest-Oriented version (REMOVE non-kamon-looking parts)
// - Keep: particles + radial rays + enso barrier (gap aligns to prayer direction in B hold)
// - Remove: 5-3-5 dots/strips/brush + Kiri clover-like center motif
// Goal: more "kamon-like" minimal structure

const DEBUG = false;

let fps = 30;
let DURATION = 60;
let particles = [];
let seed;

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

  drawParticles(t, scene, global);

  push();
  translate(width / 2, height / 2);

  // rays
  drawRadialLines(t, scene);

  // enso barrier (kamon-friendly circle with Ma gap)
  drawEnsoBarrierEnsoAligned(t, scene);

  pop();

  vignetteSoft();
  if (DEBUG) drawDebugOverlay(t, scene);
}

function getScene(t) {
  if (t < 10) return { name: "A", p: t / 10 };
  if (t < 25) return { name: "B", p: (t - 10) / 15 };
  if (t < 40) return { name: "C", p: (t - 25) / 15 };
  if (t < 55) return { name: "D", p: (t - 40) / 15 };
  return { name: "E", p: (t - 55) / 5 };
}

// ---------------- PARTICLES ----------------

function drawParticles(t, scene, global) {
  const alpha = 22 + 34 * global;
  noStroke();
  for (const p of particles) {
    p.update(t, 0.1);
    fill(255, alpha * p.twinkle(t));
    circle(p.x, p.y, p.r);
  }
}

// ---------------- RADIAL RAYS ----------------

function drawRadialLines(t, scene) {
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

  const baseA = (scene.name === "B") ? 34 : 20;
  const baseW = (scene.name === "B") ? 1.5 : 1.1;

  const totalLines = floor(lerp(0, 72, appear));

  for (let i = 0; i < totalLines; i++) {
    const a = (TWO_PI * i) / max(1, totalLines);
    const n = noise(i * 0.03, t * 0.10);

    const wobble = 0.05;
    const ang = a + wobble * (n - 0.5);
    const len = baseLen * (0.90 + 0.12 * n);

    stroke(255, baseA);
    strokeWeight(baseW);
    line(0, 0, cos(ang) * len, sin(ang) * len);
  }

  // tiny center presence (very subtle)
  if (scene.name !== "A") {
    noStroke();
    fill(255, scene.name === "B" ? 55 : 30);
    circle(0, 0, 3.5);
  }
}

// ---------------- ENSO BARRIER (KAMON-FRIENDLY) ----------------

function drawEnsoBarrierEnsoAligned(t, scene) {
  let strength = 0.0;
  if (scene.name === "A") strength = 0.0;
  else if (scene.name === "B") strength = 1.0;
  else if (scene.name === "C") strength = 0.65;
  else if (scene.name === "D") strength = 0.55;
  else if (scene.name === "E") strength = 0.35;

  if (strength <= 0) return;

  const R = min(width, height) * 0.34; // a bit larger for "crest-like" ring
  const alpha = lerp(0, 90, strength);
  const weight = lerp(1.8, 3.8, strength);

  let gap = 0.0;
  let align = 0.0;

  if (scene.name === "B") {
    const p = scene.p;
    // hold window
    const inHold = smoothstep(0.50, 0.62, p) * (1.0 - smoothstep(0.74, 0.88, p));
    gap = lerp(0.16, 0.30, inHold);
    align = constrain(inHold, 0, 1);
  } else if (scene.name === "C") gap = 0.16;
  else if (scene.name === "D") gap = 0.12;
  else gap = 0.10;

  // drift for life
  const gapCenterDrift = -HALF_PI + 0.30 * sin((frameCount / fps) * 0.20);

  // prayer direction: north/up
  const gapCenterPrayer = -HALF_PI;

  // snap only during B hold
  const gapCenter = lerpAngle(gapCenterDrift, gapCenterPrayer, align);

  const startA = gapCenter + gap;
  const endA = gapCenter + TWO_PI - gap;

  noFill();
  stroke(255, alpha);
  strokeWeight(weight);

  // slight hand wobble
  const tt = frameCount / fps;
  const wob = 1.0 + 0.006 * (noise(500, tt * 0.12) - 0.5);
  arc(0, 0, R * 2 * wob, R * 2 * wob, startA, endA);

  // inner soft field (kept subtle)
  noStroke();
  fill(255, lerp(0, 10, strength));
  circle(0, 0, R * 1.05);

  // OPTIONAL: tiny mark at prayer direction during alignment (comment out if unwanted)
  if (scene.name === "B" && align > 0.01) {
    const markA = lerp(0, 26, align);
    const markW = lerp(0.0, 2.0, align);
    stroke(255, markA);
    strokeWeight(markW);
    const rr = R * 1.02;
    line(
      cos(gapCenterPrayer) * rr,
      sin(gapCenterPrayer) * rr,
      cos(gapCenterPrayer) * (rr + 9),
      sin(gapCenterPrayer) * (rr + 9)
    );
  }
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

function drawDebugOverlay(t, scene) {
  noStroke();
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text(`t=${nf(t, 2, 2)} scene=${scene.name} p=${nf(scene.p, 1, 2)}`, 12, 12);
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

  update(t, k) {
    const nx = noise(this.off, t * 0.08) - 0.5;
    const ny = noise(this.off + 99.9, t * 0.08) - 0.5;
    this.x += nx * this.spd;
    this.y += ny * this.spd;

    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  twinkle(t) {
    return 0.6 + 0.4 * noise(this.off * 0.02, t * 0.35);
  }
}
