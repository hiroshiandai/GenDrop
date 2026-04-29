// Sacred Generative Architect - p5.js
// Phase 7: In Scene B hold, strips become "brush strokes" (tapered ends + subtle scratch)
// - Enso gap aligns briefly to prayer direction (north)
// - 5-3-5 arcs align during B hold
// - During B hold: dots -> brush-like strokes (taper + fray) = "crest drawn texture"
// FIX: drawMandalaPetals uses tt

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

  drawRadialLines535(t, scene);

  const barrierR = drawEnsoBarrierEnsoAligned(t, scene);

  // ✅ Presence: dots normally, brush-strokes during B hold
  drawGosanPresenceBrush(t, scene, barrierR);

  drawKiriHintHold(t, scene, barrierR);

  drawBreathingRings(t, scene);
  drawMandalaPetals(t, scene);

  if (scene.name === "E") drawPseudoSphere(t, scene);

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

// ---------------- RADIAL (5-3-5) ----------------

function drawRadialLines535(t, scene) {
  let appear = 0.0;

  if (scene.name === "A") appear = 0.0;
  else if (scene.name === "B") {
    const p = scene.p;
    const rise = smoothstep(0.0, 0.55, p);
    const hold = smoothstep(0.55, 0.80, p);
    const base = rise * (1.0 - hold) + 1.0 * hold;
    const breatheGate = smoothstep(0.80, 1.0, p);
    const breathe = 0.02 * breatheGate * sin(t * 0.65);
    appear = constrain(base + breathe, 0, 1);
  } else if (scene.name === "C") appear = 0.85;
  else if (scene.name === "D") appear = 0.80;
  else if (scene.name === "E") appear = 0.55;

  const baseLen = min(width, height) * 0.46;

  const groups = [5, 3, 5];
  const groupAlpha = [0.75, 1.0, 0.80];
  const groupWeight = [0.85, 1.35, 0.95];

  const baseA = (scene.name === "B") ? 34 : 20;
  const baseW = (scene.name === "B") ? 1.6 : 1.1;

  const totalLines = floor(lerp(0, 66, appear));

  let gIndex = 0;
  let gPos = 0;

  for (let i = 0; i < totalLines; i++) {
    const a = (TWO_PI * i) / max(1, totalLines);

    const ga = groupAlpha[gIndex];
    const gw = groupWeight[gIndex];

    const n = noise(i * 0.03, t * 0.10);
    const wobble = 0.06;
    const ang = a + wobble * (n - 0.5);
    const len = baseLen * (0.92 + 0.10 * n);

    stroke(255, baseA * ga);
    strokeWeight(baseW * gw);
    line(0, 0, cos(ang) * len, sin(ang) * len);

    gPos++;
    if (gPos >= groups[gIndex]) {
      gPos = 0;
      gIndex = (gIndex + 1) % groups.length;
    }
  }

  if (scene.name !== "A") {
    noStroke();
    fill(255, scene.name === "B" ? 70 : 38);
    circle(0, 0, 4);
  }
}

// ---------------- ENSO BARRIER (WITH GAP / MA + PRAYER ALIGN) ----------------

function drawEnsoBarrierEnsoAligned(t, scene) {
  let strength = 0.0;
  if (scene.name === "A") strength = 0.0;
  else if (scene.name === "B") strength = 1.0;
  else if (scene.name === "C") strength = 0.65;
  else if (scene.name === "D") strength = 0.55;
  else if (scene.name === "E") strength = 0.35;

  if (strength <= 0) return 0;

  const R = min(width, height) * 0.32;
  const alpha = lerp(0, 78, strength);
  const weight = lerp(1.6, 3.6, strength);

  let gap = 0.0;
  let align = 0.0;

  if (scene.name === "B") {
    const p = scene.p;
    const inHold = smoothstep(0.50, 0.62, p) * (1.0 - smoothstep(0.74, 0.88, p));
    gap = lerp(0.18, 0.34, inHold);
    align = constrain(inHold, 0, 1);
  } else if (scene.name === "C") gap = 0.18;
  else if (scene.name === "D") gap = 0.14;
  else gap = 0.10;

  const gapCenterDrift = -HALF_PI + 0.35 * sin(t * 0.22);
  const gapCenterPrayer = -HALF_PI;
  const gapCenter = lerpAngle(gapCenterDrift, gapCenterPrayer, align);

  const startA = gapCenter + gap;
  const endA = gapCenter + TWO_PI - gap;

  noFill();
  stroke(255, alpha);
  strokeWeight(weight);

  const wob = 1.0 + 0.006 * (noise(500, t * 0.12) - 0.5);
  arc(0, 0, R * 2 * wob, R * 2 * wob, startA, endA);

  noStroke();
  fill(255, lerp(0, 10, strength));
  circle(0, 0, R * 1.06);

  if (scene.name === "B" && align > 0.01) {
    const markA = lerp(0, 38, align);
    const markW = lerp(0.0, 2.2, align);
    stroke(255, markA);
    strokeWeight(markW);
    const rr = R * 1.02;
    line(
      cos(gapCenterPrayer) * rr,
      sin(gapCenterPrayer) * rr,
      cos(gapCenterPrayer) * (rr + 10),
      sin(gapCenterPrayer) * (rr + 10)
    );
  }

  return R;
}

function lerpAngle(a, b, t) {
  let d = ((b - a + PI) % (TWO_PI)) - PI;
  return a + d * t;
}

// ---------------- BRUSH STROKE UTILS ----------------

// Draw a short brush-like stroke centered at (x,y), oriented at angle dir
// - core line with weight wCore
// - tapered ends via small blobs
// - fray: tiny specks along the segment
function brushStroke(x, y, dir, len, alpha, wCore, fray, seedKey) {
  const dx = cos(dir) * (len * 0.5);
  const dy = sin(dir) * (len * 0.5);

  const x1 = x - dx, y1 = y - dy;
  const x2 = x + dx, y2 = y + dy;

  // core
  stroke(255, alpha);
  strokeWeight(wCore);
  line(x1, y1, x2, y2);

  // taper ends (slightly thicker blobs)
  noStroke();
  fill(255, alpha * 0.75);
  const endR = max(1.6, wCore * 0.9);
  circle(x1, y1, endR);
  circle(x2, y2, endR);

  // subtle fray (specks)
  const specks = floor(fray);
  if (specks <= 0) return;

  for (let i = 0; i < specks; i++) {
    const u = (i + 0.5) / specks; // 0..1
    const sx = lerp(x1, x2, u);
    const sy = lerp(y1, y2, u);

    // perpendicular jitter
    const px = -sin(dir);
    const py = cos(dir);

    const n = noise(seedKey + i * 0.17, (frameCount / fps) * 0.35);
    const off = (n - 0.5) * 6.0; // fray width
    const jx = sx + px * off;
    const jy = sy + py * off;

    const a2 = alpha * (0.20 + 0.35 * n);
    fill(255, a2);
    circle(jx, jy, 1.2 + 0.8 * n);
  }
}

// ---------------- 5-3-5 PRESENCE: DOTS -> BRUSH STROKES DURING B HOLD ----------------

function drawGosanPresenceBrush(t, scene, barrierR) {
  if (barrierR <= 0) return;

  let strength = 0.0;
  let align = 0.0;

  if (scene.name === "B") {
    const p = scene.p;
    const inHold = smoothstep(0.52, 0.62, p) * (1.0 - smoothstep(0.76, 0.86, p));
    strength = constrain(inHold, 0, 1);
    align = strength;
  } else if (scene.name === "C") {
    strength = 0.22;
    align = 0.0;
  } else if (scene.name === "D") {
    strength = 0.10;
    align = 0.0;
  } else {
    strength = 0.0;
    align = 0.0;
  }

  if (strength <= 0.001) return;

  const ringR = barrierR * 0.78;
  const alpha = lerp(0, 170, strength);

  // prayer direction (must match Enso)
  const prayer = -HALF_PI;

  // base arrangement
  const baseArcs = [
    { cnt: 5, rot: -HALF_PI, spread: 0.55 },
    { cnt: 3, rot: 0.0,      spread: 0.38 },
    { cnt: 5, rot: HALF_PI,  spread: 0.55 },
  ];

  // aligned arrangement around prayer direction
  const alignedArcs = [
    { cnt: 5, rot: prayer - 0.42, spread: 0.40 },
    { cnt: 3, rot: prayer,        spread: 0.22 },
    { cnt: 5, rot: prayer + 0.42, spread: 0.40 },
  ];

  // order increases -> jitter decreases
  const jitterAmt = lerp(0.010, 0.0025, align);

  // brush stroke parameters (only meaningful when align>0)
  const len = lerp(0.0, 18.0, align);          // longer than strips for brush feel
  const wCore = lerp(0.0, 2.6, align);         // slightly thicker
  const fray = lerp(0.0, 8.0, align);          // more specks => ink texture
  const dotR = 2.8;

  for (let g = 0; g < 3; g++) {
    const cnt = baseArcs[g].cnt;

    const rot = lerpAngle(baseArcs[g].rot, alignedArcs[g].rot, align);
    const spread = lerp(baseArcs[g].spread, alignedArcs[g].spread, align);

    for (let i = 0; i < cnt; i++) {
      const u = (cnt === 1) ? 0.0 : map(i, 0, cnt - 1, -1, 1);

      const tt = frameCount / fps;
      const j = (noise(300 + g * 10 + i * 0.2, tt * 0.2) - 0.5) * jitterAmt;

      const ang = rot + u * spread + j;

      const x = cos(ang) * ringR;
      const y = sin(ang) * ringR;

      if (align > 0.01) {
        // brush stroke oriented to prayer direction (crest skeleton)
        brushStroke(
          x, y,
          prayer,
          len,
          alpha,
          wCore,
          fray,
          900 + g * 100 + i * 10
        );

        // faint core dot to keep "presence"
        noStroke();
        fill(255, alpha * 0.45);
        circle(x, y, 1.8);
      } else {
        // normal dots
        noStroke();
        fill(255, alpha);
        circle(x, y, dotR);
      }
    }
  }
}

// ---------------- KIRI HINT (HOLD PEAK) ----------------

function drawKiriHintHold(t, scene, barrierR) {
  if (scene.name === "A" || barrierR <= 0) return;

  let strength = 0.0;
  if (scene.name === "B") {
    const p = scene.p;
    const inHold = smoothstep(0.52, 0.62, p) * (1.0 - smoothstep(0.76, 0.86, p));
    strength = constrain(inHold * (0.92 + 0.08 * noise(200, t * 0.25)), 0, 1);
  } else if (scene.name === "C") strength = 0.28;
  else if (scene.name === "D") strength = 0.12;
  else strength = 0.0;

  if (strength <= 0.001) return;

  const R = barrierR * 0.70;

  const alpha = lerp(0, 105, strength);
  const weight = lerp(2.0, 3.6, strength);

  stroke(255, alpha);
  strokeWeight(weight);
  noFill();

  const leafW = R * 0.30;
  const leafH = R * 0.45;
  const stem = R * 0.18;

  for (let k = 0; k < 3; k++) {
    push();
    rotate((TWO_PI / 3) * k);

    line(0, 0, 0, -stem);

    beginShape();
    vertex(0, -stem);
    bezierVertex(leafW, -leafH * 0.3, leafW * 0.6, -leafH, 0, -leafH);
    bezierVertex(-leafW * 0.6, -leafH, -leafW, -leafH * 0.3, 0, -stem);
    endShape(CLOSE);

    pop();
  }

  noStroke();
  fill(255, lerp(0, 85, strength));
  circle(0, 0, 6.5);
}

// ---------------- SUPPORT LAYERS ----------------

function drawBreathingRings(t, scene) {
  if (scene.name === "A" || scene.name === "B") return;

  const breath = 0.98 + 0.02 * sin((frameCount / fps) * 0.45);
  const R = min(width, height) * 0.42 * breath;

  noFill();
  stroke(255, 18);
  strokeWeight(1.2);
  circle(0, 0, R * 2);
}

function drawMandalaPetals(t, scene) {
  let appear = 0.0;
  if (scene.name === "C") appear = smoothstep(0, 1, scene.p);
  else if (scene.name === "D") appear = 1.0;
  else if (scene.name === "E") appear = 0.6;
  else appear = 0.0;

  if (appear <= 0.001) return;

  const petals = floor(lerp(0, 18, appear));
  const layers = floor(lerp(0, 2, appear));
  if (petals <= 0 || layers <= 0) return;

  const tt = frameCount / fps;

  const breath = 0.985 + 0.015 * sin(tt * 0.42);
  const base = min(width, height) * 0.10 * breath;

  stroke(255, 16);
  strokeWeight(1.1);
  noFill();

  for (let L = 0; L < layers; L++) {
    const r0 = base * (1.0 + L * 1.25);
    for (let i = 0; i < petals; i++) {
      const a = (TWO_PI * i) / petals;
      const w = r0 * 0.35;
      const h = r0 * 0.90;

      push();
      rotate(a);

      beginShape();
      vertex(0, -r0 * 0.12);
      bezierVertex(w, -h * 0.25, w, -h * 0.85, 0, -h);
      bezierVertex(-w, -h * 0.85, -w, -h * 0.25, 0, -r0 * 0.12);
      endShape();

      pop();
    }
  }
}

function drawPseudoSphere(t, scene) {
  const p = smoothstep(0, 1, scene.p);
  const R = min(width, height) * lerp(0.18, 0.32, p);

  noFill();
  strokeWeight(1.2);

  const bands = 14;
  for (let i = 0; i <= bands; i++) {
    const v = map(i, 0, bands, -1, 1);
    const y = v * R;
    const r = sqrt(max(0, 1 - v * v)) * R;

    const a = lerp(6, 26, p) * (0.6 + 0.4 * noise(i * 0.2, t * 0.2));
    stroke(255, a);
    circle(0, y, r * 2);
  }
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
