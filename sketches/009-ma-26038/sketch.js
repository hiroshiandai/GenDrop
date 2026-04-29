// Sacred Generative Architect - Cosmic Pulse Mandala Loop
// Density-linked version:
// - Pulse phase: fewer rays / fewer petals / smaller radius
// - Formation phase: more rays / more petals / radius expands
// - Rotation phase: expanded & dense state rotates slowly
// - Fade phase: radius contracts and density decreases
// - Return: back to a minimal pulse state
//
// Visual flow:
// black cosmos -> tiny star pulse -> blue-violet geometry emerges
// -> mandala expands & densifies -> slow rotation
// -> weakens & contracts -> pulse -> loop

const DEBUG = false;

let fps = 30;
let DURATION = 60;
let particles = [];
let seed;

// palette
const PALETTE = {
  bg: [2, 3, 8],
  star: [235, 245, 255],
  violet: [130, 110, 255],
  blue: [90, 170, 255],
  soft: [170, 150, 255]
};

// pulse tuning
const PULSE = {
  bpm: 36,
  strengthMin: 0.45,
  strengthMax: 1.25,
  macroSpeed: 0.10,

  coreBase: 3.2,
  coreAmp: 7.0,
  coreAlphaBase: 35,
  coreAlphaAmp: 120,
  haloLayers: 10,
  haloSize: 22,
  haloAlpha: 26
};

function setup() {
  createCanvas(960, 540);
  frameRate(fps);
  pixelDensity(1);

  seed = 12345;
  randomSeed(seed);
  noiseSeed(seed);

  for (let i = 0; i < 700; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  const t = (frameCount / fps) % DURATION;
  const scene = getScene(t);

  background(PALETTE.bg[0], PALETTE.bg[1], PALETTE.bg[2]);

  drawSpaceDust(t);

  // pulse signals
  const macro = lerp(
    PULSE.strengthMin,
    PULSE.strengthMax,
    0.5 + 0.5 * sin(t * PULSE.macroSpeed)
  );

  const beat = heartbeat(t, PULSE.bpm);
  const pulse = beat * macro;

  // scene envelopes
  const pulseEnv = getPulseEnvelope(scene);
  const geoEnv = getGeometryEnvelope(scene);
  const mandalaEnv = getMandalaEnvelope(scene);
  const rotEnv = getRotationEnvelope(scene);

  // radius flow: center -> expand -> rotate expanded -> contract -> center
  const radiusFlow = getRadiusFlow(scene);

  // ✅ density flow: sparse -> dense -> sparse
  const densityFlow = getDensityFlow(scene);

  push();
  translate(width / 2, height / 2);

  rotate(getRotationAmount(t, rotEnv));

  drawEmergingGeometry(t, geoEnv, pulse, radiusFlow, densityFlow);
  drawMandala(t, mandalaEnv, pulse, radiusFlow, densityFlow);
  drawEnsoBarrier(t, scene, radiusFlow);
  drawCenterStar(t, pulseEnv, pulse);

  pop();

  vignetteUltraSoft();

  if (DEBUG) {
    drawDebug(t, scene, pulseEnv, geoEnv, mandalaEnv, rotEnv, radiusFlow, densityFlow);
  }
}

// -------------------- scene structure --------------------

function getScene(t) {
  if (t < 10) return { name: "PULSE", p: t / 10 };
  if (t < 20) return { name: "EMERGE", p: (t - 10) / 10 };
  if (t < 32) return { name: "FORM", p: (t - 20) / 12 };
  if (t < 45) return { name: "ROTATE", p: (t - 32) / 13 };
  if (t < 52) return { name: "FADE_ROT", p: (t - 45) / 7 };
  return { name: "RETURN", p: (t - 52) / 8 };
}

function getPulseEnvelope(scene) {
  if (scene.name === "PULSE") return 1.0;
  if (scene.name === "EMERGE") return 1.0;
  if (scene.name === "FORM") return 0.9;
  if (scene.name === "ROTATE") return 0.7;
  if (scene.name === "FADE_ROT") return 0.8;
  if (scene.name === "RETURN") return lerp(0.85, 1.0, scene.p);
  return 1.0;
}

function getGeometryEnvelope(scene) {
  if (scene.name === "PULSE") return 0.0;
  if (scene.name === "EMERGE") return smoothstep(0, 1, scene.p);
  if (scene.name === "FORM") return 1.0;
  if (scene.name === "ROTATE") return 1.0;
  if (scene.name === "FADE_ROT") return 0.9;
  if (scene.name === "RETURN") return lerp(0.8, 0.15, scene.p);
  return 0.0;
}

function getMandalaEnvelope(scene) {
  if (scene.name === "PULSE") return 0.0;
  if (scene.name === "EMERGE") return lerp(0.0, 0.35, scene.p);
  if (scene.name === "FORM") return smoothstep(0, 1, scene.p);
  if (scene.name === "ROTATE") return 1.0;
  if (scene.name === "FADE_ROT") return 0.95;
  if (scene.name === "RETURN") return lerp(0.9, 0.10, scene.p);
  return 0.0;
}

function getRotationEnvelope(scene) {
  if (scene.name === "PULSE") return 0.0;
  if (scene.name === "EMERGE") return 0.0;
  if (scene.name === "FORM") return lerp(0.0, 0.3, scene.p);
  if (scene.name === "ROTATE") return smoothstep(0, 1, scene.p);
  if (scene.name === "FADE_ROT") return lerp(1.0, 0.0, scene.p);
  if (scene.name === "RETURN") return 0.0;
  return 0.0;
}

// center -> expand -> rotate expanded -> contract -> center
function getRadiusFlow(scene) {
  if (scene.name === "PULSE") return 0.10;
  if (scene.name === "EMERGE") return lerp(0.10, 0.35, smoothstep(0, 1, scene.p));
  if (scene.name === "FORM") return lerp(0.35, 1.00, smoothstep(0, 1, scene.p));
  if (scene.name === "ROTATE") return 1.00;
  if (scene.name === "FADE_ROT") return lerp(1.00, 0.28, smoothstep(0, 1, scene.p));
  if (scene.name === "RETURN") return lerp(0.28, 0.10, smoothstep(0, 1, scene.p));
  return 0.10;
}

// ✅ sparse -> dense -> sparse
function getDensityFlow(scene) {
  if (scene.name === "PULSE") return 0.08;
  if (scene.name === "EMERGE") return lerp(0.08, 0.35, smoothstep(0, 1, scene.p));
  if (scene.name === "FORM") return lerp(0.35, 1.00, smoothstep(0, 1, scene.p));
  if (scene.name === "ROTATE") return 1.00;
  if (scene.name === "FADE_ROT") return lerp(1.00, 0.25, smoothstep(0, 1, scene.p));
  if (scene.name === "RETURN") return lerp(0.25, 0.08, smoothstep(0, 1, scene.p));
  return 0.08;
}

// -------------------- heartbeat --------------------

function heartbeat(t, bpm) {
  const hz = bpm / 60.0;
  const x = (t * hz) % 1.0;

  const p1 = expPulse(x, 0.22, 0.10, 1.0);
  const p2 = expPulse(x, 0.48, 0.14, 0.45);

  return constrain(0.08 + p1 + p2, 0, 1);
}

function expPulse(x, mu, sigma, amp) {
  const d = x - mu;
  return amp * Math.exp(-(d * d) / (2 * sigma * sigma));
}

// -------------------- particles --------------------

function drawSpaceDust(t) {
  noStroke();
  for (const p of particles) {
    p.update(t);
    const tw = p.twinkle(t);

    fill(
      PALETTE.star[0],
      PALETTE.star[1],
      PALETTE.star[2],
      18 + 42 * tw
    );
    circle(p.x, p.y, p.r);
  }
}

// -------------------- center star --------------------

function drawCenterStar(t, pulseEnv, pulse) {
  const coreR = 2.0 + 6.0 * pulse * pulseEnv;
  const haloR = 10 + 34 * pulse * pulseEnv;
  const haloA = 10 + 55 * pulse * pulseEnv;

  noStroke();

  for (let i = 0; i < 8; i++) {
    const u = (i + 1) / 8;
    fill(
      PALETTE.star[0],
      PALETTE.star[1],
      PALETTE.star[2],
      haloA * (1 - u) * 0.55
    );
    circle(0, 0, haloR * u);
  }

  fill(PALETTE.star[0], PALETTE.star[1], PALETTE.star[2], 220);
  circle(0, 0, coreR);

  stroke(PALETTE.star[0], PALETTE.star[1], PALETTE.star[2], 70 + 80 * pulse);
  strokeWeight(1 + 0.8 * pulse);
  line(-8 - 10 * pulse, 0, 8 + 10 * pulse, 0);
  line(0, -8 - 10 * pulse, 0, 8 + 10 * pulse);
}

// -------------------- emerging geometry --------------------

function drawEmergingGeometry(t, geoEnv, pulse, radiusFlow, densityFlow) {
  if (geoEnv <= 0.001) return;

  // ✅ ring count also breathes with density
  const ringCount = max(1, floor(lerp(1, 7, densityFlow)));

  const maxR = min(width, height) * lerp(0.08, 0.24, radiusFlow) * (1.0 + 0.04 * pulse);

  noFill();

  for (let i = 1; i <= ringCount; i++) {
    const r = (i / ringCount) * maxR;

    stroke(
      PALETTE.blue[0],
      PALETTE.blue[1],
      PALETTE.blue[2],
      18 + 40 * geoEnv
    );
    strokeWeight(1.3 + 0.4 * pulse);
    circle(0, 0, r * 2);
  }

  // ✅ spoke count linked to density
  const spokeCount = max(6, floor(lerp(6, 56, densityFlow)));
  const spokeLen = min(width, height) * lerp(0.10, 0.30, radiusFlow) * (1.0 + 0.06 * pulse);

  for (let i = 0; i < spokeCount; i++) {
    const a = (TWO_PI * i) / max(1, spokeCount);
    const shimmer = 0.75 + 0.35 * noise(i * 0.14, t * 0.6);

    stroke(
      PALETTE.violet[0],
      PALETTE.violet[1],
      PALETTE.violet[2],
      (22 + 48 * geoEnv) * shimmer
    );
    strokeWeight(1.6 + 0.8 * pulse);
    line(0, 0, cos(a) * spokeLen, sin(a) * spokeLen);
  }
}

// -------------------- mandala --------------------

function drawMandala(t, mandalaEnv, pulse, radiusFlow, densityFlow) {
  if (mandalaEnv <= 0.001) return;

  // ✅ layer count linked to density
  const layers = max(1, floor(lerp(1, 5, densityFlow)));

  // ✅ petal count linked to density
  const petals = max(4, floor(lerp(4, 28, densityFlow)));

  noFill();

  for (let L = 0; L < layers; L++) {
    const innerScale = lerp(0.05, 0.15, radiusFlow);
    const layerGap = lerp(0.035, 0.075, radiusFlow);
    const baseR = min(width, height) * (innerScale + L * layerGap);

    const rr = baseR * (1.0 + 0.05 * pulse);

    for (let i = 0; i < petals; i++) {
      const a = (TWO_PI * i) / petals;

      push();
      rotate(a);

      const w = rr * 0.34;
      const h = rr * 0.92;

      stroke(
        lerp(PALETTE.blue[0], PALETTE.soft[0], L / max(1, layers - 1)),
        lerp(PALETTE.blue[1], PALETTE.soft[1], L / max(1, layers - 1)),
        lerp(PALETTE.blue[2], PALETTE.soft[2], L / max(1, layers - 1)),
        24 + 78 * mandalaEnv
      );
      strokeWeight(1.2 + 0.9 * pulse);

      beginShape();
      vertex(0, -rr * 0.12);
      bezierVertex(w, -h * 0.25, w, -h * 0.85, 0, -h);
      bezierVertex(-w, -h * 0.85, -w, -h * 0.25, 0, -rr * 0.12);
      endShape();

      pop();
    }

    stroke(
      PALETTE.soft[0],
      PALETTE.soft[1],
      PALETTE.soft[2],
      18 + 52 * mandalaEnv
    );
    strokeWeight(1.2 + 0.5 * pulse);
    circle(0, 0, rr * 1.55);
  }
}

// -------------------- enso barrier --------------------

function drawEnsoBarrier(t, scene, radiusFlow) {
  let strength = 0.0;
  if (scene.name === "PULSE") strength = 0.25;
  else if (scene.name === "EMERGE") strength = 0.45;
  else if (scene.name === "FORM") strength = 0.65;
  else if (scene.name === "ROTATE") strength = 0.75;
  else if (scene.name === "FADE_ROT") strength = 0.60;
  else if (scene.name === "RETURN") strength = lerp(0.50, 0.28, scene.p);

  const R = min(width, height) * lerp(0.12, 0.36, radiusFlow);

  const alpha = lerp(12, 68, strength);
  const weight = lerp(1.3, 2.8, strength);

  let gap = 0.10;
  let align = 0.0;

  if (scene.name === "FORM") {
    align = lerp(0.0, 0.35, scene.p);
    gap = lerp(0.12, 0.18, scene.p);
  } else if (scene.name === "ROTATE") {
    align = 0.25;
    gap = 0.16;
  } else if (scene.name === "FADE_ROT") {
    align = lerp(0.25, 0.0, scene.p);
    gap = 0.13;
  }

  const gapCenterDrift = -HALF_PI + 0.28 * sin(t * 0.18);
  const gapCenterPrayer = -HALF_PI;
  const gapCenter = lerpAngle(gapCenterDrift, gapCenterPrayer, align);

  const startA = gapCenter + gap;
  const endA = gapCenter + TWO_PI - gap;

  noFill();
  stroke(
    PALETTE.soft[0],
    PALETTE.soft[1],
    PALETTE.soft[2],
    alpha
  );
  strokeWeight(weight);

  const wob = 1.0 + 0.005 * (noise(500, t * 0.12) - 0.5);
  arc(0, 0, R * 2 * wob, R * 2 * wob, startA, endA);
}

function lerpAngle(a, b, t) {
  let d = ((b - a + PI) % (TWO_PI)) - PI;
  return a + d * t;
}

// -------------------- rotation --------------------

function getRotationAmount(t, rotEnv) {
  const base = t * 0.022;
  return base * rotEnv;
}

// -------------------- helpers --------------------

function smoothstep(edge0, edge1, x) {
  x = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function vignetteUltraSoft() {
  noStroke();
  for (let i = 0; i < 14; i++) {
    const a = map(i, 0, 13, 0, 12);
    fill(0, a);
    rect(i * 2, i * 2, width - i * 4, height - i * 4);
  }
}

function drawDebug(t, scene, pulseEnv, geoEnv, mandalaEnv, rotEnv, radiusFlow, densityFlow) {
  noStroke();
  fill(255);
  textSize(15);
  textAlign(LEFT, TOP);
  text(
    `t=${nf(t, 2, 2)} scene=${scene.name} pulse=${nf(pulseEnv, 1, 2)} geo=${nf(geoEnv, 1, 2)} mandala=${nf(mandalaEnv, 1, 2)} rot=${nf(rotEnv, 1, 2)} radius=${nf(radiusFlow, 1, 2)} density=${nf(densityFlow, 1, 2)}`,
    12,
    12
  );
}

// -------------------- particle --------------------

class Particle {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.r = random(0.5, 1.6);
    this.spd = random(0.03, 0.16);
    this.off = random(1000);
  }

  update(t) {
    const nx = noise(this.off, t * 0.08) - 0.5;
    const ny = noise(this.off + 77.7, t * 0.08) - 0.5;

    this.x += nx * this.spd;
    this.y += ny * this.spd;

    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  twinkle(t) {
    return 0.55 + 0.45 * noise(this.off * 0.03, t * 0.35);
  }
}
