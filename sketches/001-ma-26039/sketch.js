// Sacred Generative Architect - Cosmic Pulse Mandala Loop
// Error-fixed version
// Fixes:
// 1) renamed reserved variable name "phase" -> "scenePhase"
// 2) fixed undefined function call "getRotation" -> "getRotationAmount"

const DEBUG = false;

let fps = 30;
let DURATION = 90;
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

  seed = 20260309;
  randomSeed(seed);
  noiseSeed(seed);

  for (let i = 0; i < 700; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  const t = (frameCount / fps) % DURATION;
  const scenePhase = getScenePhase(t);

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
  const pulseEnv = getPulseEnvelope(scenePhase);
  const geoEnv = getGeometryEnvelope(scenePhase);
  const mandalaEnv = getMandalaEnvelope(scenePhase);
  const rotEnv = getRotationEnvelope(scenePhase);

  // radius flow: center -> expand -> rotate expanded -> contract -> center
  const radiusFlow = getRadiusFlow(scenePhase);

  // density flow: sparse -> dense -> sparse
  const densityFlow = getDensityFlow(scenePhase);

  push();
  translate(width / 2, height / 2);

  // ✅ fixed function call
  rotate(getRotationAmount(t, rotEnv));

  drawEmergingGeometry(t, geoEnv, pulse, radiusFlow, densityFlow);
  drawMandala(t, mandalaEnv, pulse, radiusFlow, densityFlow);
  drawEnsoBarrier(t, scenePhase, radiusFlow);
  drawCenterStar(t, pulseEnv, pulse);

  pop();

  vignetteUltraSoft();

  if (DEBUG) {
    drawDebug(t, scenePhase, pulseEnv, geoEnv, mandalaEnv, rotEnv, radiusFlow, densityFlow);
  }
}

// -------------------- scene structure --------------------

function getScenePhase(t) {
  if (t < 14) return { name: "PULSE", p: t / 14 };
  if (t < 28) return { name: "EMERGE", p: (t - 14) / 14 };
  if (t < 48) return { name: "FORM", p: (t - 28) / 20 };
  if (t < 66) return { name: "ROTATE", p: (t - 48) / 18 };
  if (t < 78) return { name: "CONTRACT", p: (t - 66) / 12 };
  return { name: "RETURN", p: (t - 78) / 12 };
}

function getPulseEnvelope(scenePhase) {
  if (scenePhase.name === "PULSE") return 1.0;
  if (scenePhase.name === "EMERGE") return 1.0;
  if (scenePhase.name === "FORM") return 0.9;
  if (scenePhase.name === "ROTATE") return 0.7;
  if (scenePhase.name === "CONTRACT") return 0.8;
  if (scenePhase.name === "RETURN") return lerp(0.85, 1.0, scenePhase.p);
  return 1.0;
}

function getGeometryEnvelope(scenePhase) {
  if (scenePhase.name === "PULSE") return 0.0;
  if (scenePhase.name === "EMERGE") return smoothstep(0, 1, scenePhase.p);
  if (scenePhase.name === "FORM") return 1.0;
  if (scenePhase.name === "ROTATE") return 1.0;
  if (scenePhase.name === "CONTRACT") return 0.9;
  if (scenePhase.name === "RETURN") return lerp(0.8, 0.15, scenePhase.p);
  return 0.0;
}

function getMandalaEnvelope(scenePhase) {
  if (scenePhase.name === "PULSE") return 0.0;
  if (scenePhase.name === "EMERGE") return lerp(0.0, 0.35, scenePhase.p);
  if (scenePhase.name === "FORM") return smoothstep(0, 1, scenePhase.p);
  if (scenePhase.name === "ROTATE") return 1.0;
  if (scenePhase.name === "CONTRACT") return 0.95;
  if (scenePhase.name === "RETURN") return lerp(0.9, 0.10, scenePhase.p);
  return 0.0;
}

function getRotationEnvelope(scenePhase) {
  if (scenePhase.name === "PULSE") return 0.0;
  if (scenePhase.name === "EMERGE") return 0.0;
  if (scenePhase.name === "FORM") return lerp(0.0, 0.3, scenePhase.p);
  if (scenePhase.name === "ROTATE") return 1.0;
  if (scenePhase.name === "CONTRACT") return lerp(1.0, 0.0, scenePhase.p);
  if (scenePhase.name === "RETURN") return 0.0;
  return 0.0;
}

function getRadiusFlow(scenePhase) {
  if (scenePhase.name === "PULSE") return 0.08;
  if (scenePhase.name === "EMERGE") return lerp(0.08, 0.30, smoothstep(0, 1, scenePhase.p));
  if (scenePhase.name === "FORM") return lerp(0.30, 1.00, smoothstep(0, 1, scenePhase.p));
  if (scenePhase.name === "ROTATE") return 1.00;
  if (scenePhase.name === "CONTRACT") return lerp(1.00, 0.24, smoothstep(0, 1, scenePhase.p));
  if (scenePhase.name === "RETURN") return lerp(0.24, 0.08, smoothstep(0, 1, scenePhase.p));
  return 0.08;
}

function getDensityFlow(scenePhase) {
  if (scenePhase.name === "PULSE") return 0.06;
  if (scenePhase.name === "EMERGE") return lerp(0.06, 0.32, smoothstep(0, 1, scenePhase.p));
  if (scenePhase.name === "FORM") return lerp(0.32, 1.00, smoothstep(0, 1, scenePhase.p));
  if (scenePhase.name === "ROTATE") return 1.00;
  if (scenePhase.name === "CONTRACT") return lerp(1.00, 0.22, smoothstep(0, 1, scenePhase.p));
  if (scenePhase.name === "RETURN") return lerp(0.22, 0.06, smoothstep(0, 1, scenePhase.p));
  return 0.06;
}

// -------------------- heartbeat --------------------

function heartbeat(t, bpm) {
  const hz = bpm / 60.0;
  const x = (t * hz) % 1.0;

  const p1 = gaussianPulse(x, 0.22, 0.10, 1.0);
  const p2 = gaussianPulse(x, 0.48, 0.14, 0.45);

  return constrain(0.08 + p1 + p2, 0, 1);
}

function gaussianPulse(x, mu, sigma, amp) {
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

  const ringCount = max(1, floor(lerp(1, 8, densityFlow)));
  const maxR = min(width, height) * lerp(0.06, 0.26, radiusFlow) * (1.0 + 0.04 * pulse);

  noFill();

  for (let i = 1; i <= ringCount; i++) {
    const r = (i / ringCount) * maxR;

    stroke(
      PALETTE.blue[0],
      PALETTE.blue[1],
      PALETTE.blue[2],
      18 + 46 * geoEnv
    );
    strokeWeight(1.2 + 0.4 * pulse);
    circle(0, 0, r * 2);
  }

  const spokeCount = max(6, floor(lerp(6, 64, densityFlow)));
  const spokeLen = min(width, height) * lerp(0.10, 0.34, radiusFlow) * (1.0 + 0.08 * pulse);

  for (let i = 0; i < spokeCount; i++) {
    const a = (TWO_PI * i) / spokeCount;
    const n = noise(i * 0.17, t * 0.55);
    const shimmer = 0.72 + 0.40 * n;
    const wob = (noise(i * 0.11, t * 0.20) - 0.5) * 0.08;

    stroke(
      PALETTE.violet[0],
      PALETTE.violet[1],
      PALETTE.violet[2],
      (22 + 58 * geoEnv) * shimmer
    );
    strokeWeight(1.4 + 0.9 * pulse);

    line(
      0,
      0,
      cos(a + wob) * spokeLen,
      sin(a + wob) * spokeLen
    );
  }
}

// -------------------- mandala --------------------

function drawMandala(t, mandalaEnv, pulse, radiusFlow, densityFlow) {
  if (mandalaEnv <= 0.001) return;

  const layers = max(1, floor(lerp(1, 6, densityFlow)));
  const petals = max(4, floor(lerp(4, 32, densityFlow)));

  const innerScale = lerp(0.045, 0.15, radiusFlow);
  const layerGap = lerp(0.03, 0.072, radiusFlow);

  noFill();

  for (let L = 0; L < layers; L++) {
    const baseR = min(width, height) * (innerScale + L * layerGap);
    const rr = baseR * (1.0 + 0.06 * pulse);

    for (let i = 0; i < petals; i++) {
      const a = (TWO_PI * i) / petals;

      const drift = (noise(500 + L * 20 + i * 0.3, t * 0.25) - 0.5) * 0.06;
      const petalPulse = 1.0 + 0.08 * pulse;

      push();
      rotate(a + drift);

      const w = rr * 0.32 * petalPulse;
      const h = rr * 0.95 * petalPulse;

      const cMix = L / max(1, layers - 1);
      stroke(
        lerp(PALETTE.blue[0], PALETTE.soft[0], cMix),
        lerp(PALETTE.blue[1], PALETTE.soft[1], cMix),
        lerp(PALETTE.blue[2], PALETTE.soft[2], cMix),
        26 + 84 * mandalaEnv
      );
      strokeWeight(1.1 + 1.0 * pulse);

      beginShape();
      vertex(0, -rr * 0.14);
      bezierVertex(w, -h * 0.24, w, -h * 0.86, 0, -h);
      bezierVertex(-w, -h * 0.86, -w, -h * 0.24, 0, -rr * 0.14);
      endShape();

      pop();
    }

    stroke(PALETTE.soft[0], PALETTE.soft[1], PALETTE.soft[2], 16 + 56 * mandalaEnv);
    strokeWeight(1.0 + 0.4 * pulse);
    circle(0, 0, rr * 1.52);
  }
}

// -------------------- enso --------------------

function drawEnsoBarrier(t, scenePhase, radiusFlow) {
  let strength = 0.0;
  if (scenePhase.name === "PULSE") strength = 0.25;
  else if (scenePhase.name === "EMERGE") strength = 0.45;
  else if (scenePhase.name === "FORM") strength = 0.65;
  else if (scenePhase.name === "ROTATE") strength = 0.75;
  else if (scenePhase.name === "CONTRACT") strength = 0.60;
  else if (scenePhase.name === "RETURN") strength = lerp(0.50, 0.28, scenePhase.p);

  const R = min(width, height) * lerp(0.10, 0.38, radiusFlow);

  const alpha = lerp(10, 70, strength);
  const weight = lerp(1.2, 2.9, strength);

  let gap = 0.10;
  let align = 0.0;

  if (scenePhase.name === "FORM") {
    align = lerp(0.0, 0.35, scenePhase.p);
    gap = lerp(0.12, 0.18, scenePhase.p);
  } else if (scenePhase.name === "ROTATE") {
    align = 0.25;
    gap = 0.16;
  } else if (scenePhase.name === "CONTRACT") {
    align = lerp(0.25, 0.0, scenePhase.p);
    gap = 0.13;
  }

  const gapCenterDrift = -HALF_PI + 0.28 * sin(t * 0.18);
  const gapCenterPrayer = -HALF_PI;
  const gapCenter = lerpAngle(gapCenterDrift, gapCenterPrayer, align);

  const startA = gapCenter + gap;
  const endA = gapCenter + TWO_PI - gap;

  noFill();
  stroke(PALETTE.soft[0], PALETTE.soft[1], PALETTE.soft[2], alpha);
  strokeWeight(weight);

  const wob = 1.0 + 0.005 * (noise(1200, t * 0.12) - 0.5);
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

function drawDebug(t, scenePhase, pulseEnv, geoEnv, mandalaEnv, rotEnv, radiusFlow, densityFlow) {
  noStroke();
  fill(255);
  textSize(15);
  textAlign(LEFT, TOP);
  text(
    `t=${nf(t, 2, 2)} scene=${scenePhase.name} pulse=${nf(pulseEnv, 1, 2)} geo=${nf(geoEnv, 1, 2)} mandala=${nf(mandalaEnv, 1, 2)} rot=${nf(rotEnv, 1, 2)} radius=${nf(radiusFlow, 1, 2)} density=${nf(densityFlow, 1, 2)}`,
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
