// ==========================================================
// MA - Complete Sacred Geometry Loop Edition
// p5.js
// ==========================================================

// ---------- Global ----------
let scene;

const PHI = 1.61803398875;

const PALETTE = {
  bg: [2, 2, 5],
  core: [255, 255, 255],
  main: [140, 120, 255],
  sub: [190, 170, 255],
  outer: [110, 150, 255]
};

// ---------- Setup ----------
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  angleMode(RADIANS);
  smooth();
  strokeCap(ROUND);
  strokeJoin(ROUND);

  scene = new SceneController(120.0); // 120 sec loop
}

// ---------- Draw ----------
function draw() {
  const phase = scene.getPhase();
  const breath = scene.getBreath();
  const bloom = scene.getBloomStrength();
  const orbit = scene.getOrbitStrength();
  const collapse = scene.getCollapse();
  const seed = scene.getSeedStrength();
  const silence = scene.getSilenceStrength();
  const microPulse = scene.getMicroPulse();

  background(...PALETTE.bg);

  translate(width / 2, height / 2);

  drawAura(phase, breath, bloom, collapse, seed, silence);
  drawDustField(phase, bloom, collapse, silence);
  drawResonanceRings(phase, bloom, collapse, silence, breath);

  // 外側→内側の順で描く
  drawOuterOrbit(phase, bloom, collapse, orbit, silence);
  drawBloomLayer({
    phase,
    breath,
    bloom,
    collapse,
    seed,
    silence,
    baseRadius: min(width, height) * 0.165,
    amp1: min(width, height) * 0.020,
    amp2: min(width, height) * 0.010,
    nMin: 13,
    nMax: 21,
    color: PALETTE.sub,
    alpha: 64,
    strokeW: 1.25,
    rotSpeed: 0.05,
    openFactor: 0.12,
    vesMin: 0.90,
    vesMax: 1.10,
    vesPow: 1.18,
    phiBloom: 0.10,
    bloomScale: 0.05,
    collapseScale: 0.16,
    phase1: 0.42,
    phase2: 1.18
  });

  drawBloomLayer({
    phase,
    breath,
    bloom,
    collapse,
    seed,
    silence,
    baseRadius: min(width, height) * 0.255,
    amp1: min(width, height) * 0.028,
    amp2: min(width, height) * 0.014,
    nMin: 13,
    nMax: 21,
    color: PALETTE.main,
    alpha: 92,
    strokeW: 1.6,
    rotSpeed: 0.065,
    openFactor: 0.16,
    vesMin: 0.88,
    vesMax: 1.12,
    vesPow: 1.22,
    phiBloom: 0.12,
    bloomScale: 0.06,
    collapseScale: 0.18,
    phase1: 0.45,
    phase2: 1.25
  });

  drawBrushBeams(phase, bloom, collapse, silence, microPulse, breath);
  drawCore(phase, breath, bloom, collapse, seed, silence);

  drawVignette();
}

// ---------- Resize ----------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ==========================================================
// Scene Controller
// 円環時間エンジン：ここが最重要アルゴリズム
// ==========================================================
class SceneController {
  constructor(cycleDurationSec = 120.0) {
    this.cycleDuration = cycleDurationSec;
    this.startMillis = millis();
  }

  getPhase() {
    const elapsed = (millis() - this.startMillis) / 1000.0;
    return (elapsed % this.cycleDuration) / this.cycleDuration;
  }

  // 0..1 の完全ループ呼吸
  getBreath() {
    const p = this.getPhase();
    return 0.5 - 0.5 * cos(TWO_PI * p);
  }

  // 開花
  getBloomStrength() {
    const p = this.getPhase();
    return phaseWindow(p, 0.18, 0.74, 0.10);
  }

  // 拡張・安定
  getOrbitStrength() {
    const p = this.getPhase();
    return phaseWindow(p, 0.46, 0.84, 0.10);
  }

  // 収束
  getCollapse() {
    const p = this.getPhase();
    return phaseWindow(p, 0.72, 1.00, 0.16);
  }

  // 冒頭と終端の種
  getSeedStrength() {
    const p = this.getPhase();
    const a = phaseWindow(p, 0.92, 1.00, 0.06);
    const b = phaseWindow(p, 0.00, 0.20, 0.08);
    return max(a, b);
  }

  // 静寂
  getSilenceStrength() {
    const p = this.getPhase();
    return phaseWindow(p, 0.88, 1.00, 0.10);
  }

  // 共鳴用の内部脈動
  getMicroPulse() {
    const p = this.getPhase();
    const v = 0.5 - 0.5 * cos(TWO_PI * 4.0 * p);
    return pow(v, 3.0) * this.getBloomStrength();
  }
}

// ==========================================================
// Aura
// ==========================================================
function drawAura(phase, breath, bloom, collapse, seed, silence) {
  push();

  const s = min(width, height);
  const glowStrength = 0.18 + bloom * 0.65 + seed * 0.25 - silence * 0.08;

  blendMode(ADD);
  noFill();

  const minR = s * 0.06;
  const maxR = s * 0.60;
  const steps = 150;

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = lerp(minR, maxR, t);
    const falloff = pow(1.0 - t, 2.25);
    const alpha = (12 + breath * 10 + bloom * 12) * falloff * glowStrength;

    const rr = lerp(PALETTE.sub[0], PALETTE.core[0], 0.15 * (1.0 - t));
    const gg = lerp(PALETTE.sub[1], PALETTE.core[1], 0.15 * (1.0 - t));
    const bb = lerp(PALETTE.sub[2], PALETTE.core[2], 0.15 * (1.0 - t));

    stroke(rr, gg, bb, alpha);
    strokeWeight(2.0);
    circle(0, 0, r * 2);
  }

  blendMode(BLEND);
  pop();
}

// ==========================================================
// Dust / Particles
// 状態を持たず、位相から直接描くのでループが切れない
// ==========================================================
function drawDustField(phase, bloom, collapse, silence) {
  push();

  const s = min(width, height);
  const count = 180;

  for (let i = 0; i < count; i++) {
    const h1 = hash1(i * 19.17 + 1.0);
    const h2 = hash1(i * 27.31 + 7.0);
    const h3 = hash1(i * 11.73 + 9.0);

    let angle = TWO_PI * h1 + phase * TWO_PI * lerp(0.04, 0.18, h2);
    let baseR = lerp(s * 0.12, s * 0.48, h2);

    // 終盤は中心へ戻す
    let collapseMix = pow(collapse, 1.15);
    let r = lerp(baseR, s * 0.055 + h3 * s * 0.03, collapseMix);

    const x = cos(angle) * r;
    const y = sin(angle) * r;

    const len = lerp(2, 18, h3) * (0.35 + bloom * 0.9) * (1.0 - silence * 0.65);
    const dir = angle + HALF_PI * lerp(-1, 1, h1);
    const x2 = x + cos(dir) * len;
    const y2 = y + sin(dir) * len;

    const a = lerp(10, 120, h3) * (0.20 + bloom * 0.75) * (1.0 - silence * 0.5);

    stroke(PALETTE.core[0], PALETTE.core[1], PALETTE.core[2], a);
    strokeWeight(lerp(0.6, 2.2, h2));
    line(x, y, x2, y2);
  }

  pop();
}

// ==========================================================
// Resonance Rings
// 離散発生ではなく、位相差から直接描いて完全ループ化
// ==========================================================
function drawResonanceRings(phase, bloom, collapse, silence, breath) {
  push();

  const s = min(width, height);
  const centers = [0.14, 0.30, 0.46, 0.62, 0.78, 0.94];
  const lifeFrac = 0.18;

  const r0 = s * 0.072;
  const r1 = r0 * PHI;
  const r2 = r1 * PHI;
  const r3 = r2 * PHI;
  const r4 = r3 * PHI;

  const targets = [r1 * 1.05, r2 * 1.00, r3 * 0.94, r4 * 0.70];

  blendMode(ADD);
  noFill();

  for (let i = 0; i < centers.length; i++) {
    const age = wrappedAge(phase, centers[i]);

    if (age < lifeFrac) {
      const t = age / lifeFrac;
      const r = lerp(r1 * (0.66 + breath * 0.04), targets[i % targets.length], easeOutCubic(t));

      const envIn = sin(min(1, t * 1.25) * HALF_PI);
      const envOut = pow(1.0 - t, 1.35);
      const alpha = (22 + bloom * 18) * envIn * envOut * (1.0 - silence * 0.55);

      for (let g = 0; g < 3; g++) {
        stroke(PALETTE.sub[0], PALETTE.sub[1], PALETTE.core[2], alpha * (0.16 - g * 0.04));
        strokeWeight(1.2 + g * 1.4);
        drawOrganicRing(r + g * 0.7, 0.35 + g * 0.18, phase + i * 0.1);
      }

      stroke(PALETTE.sub[0], PALETTE.sub[1], PALETTE.core[2], alpha);
      strokeWeight(1.2);
      drawOrganicRing(r, 1.0, phase + i * 0.1);
    }
  }

  blendMode(BLEND);
  pop();
}

function drawOrganicRing(radius, irregularityScale, seedPhase) {
  beginShape();
  const detail = 220;
  for (let i = 0; i <= detail; i++) {
    const a = map(i, 0, detail, 0, TWO_PI);

    const n =
      (noise(
        cos(a) * 0.8 + cos(TWO_PI * seedPhase) * 0.7,
        sin(a) * 0.8 + sin(TWO_PI * seedPhase) * 0.7
      ) - 0.5) *
      2.0 *
      irregularityScale;

    const rr = radius + n;
    vertex(cos(a) * rr, sin(a) * rr);
  }
  endShape(CLOSE);
}

// ==========================================================
// Bloom Layers
// ==========================================================
function drawBloomLayer(cfg) {
  const {
    phase, breath, bloom, collapse, seed, silence,
    baseRadius, amp1, amp2, nMin, nMax,
    color, alpha, strokeW, rotSpeed, openFactor,
    vesMin, vesMax, vesPow, phiBloom, bloomScale, collapseScale,
    phase1, phase2
  } = cfg;

  const s = min(width, height);

  const petalN = lerp(nMin, nMax, smoothstep(0.20, 0.82, bloom));
  const openEnv = bloom * (1.0 - collapse * 0.65);
  const visible = (0.08 * seed + 0.95 * bloom) * (1.0 - silence * 0.55);

  if (visible <= 0.001) return;

  push();
  rotate(TWO_PI * phase * rotSpeed);

  const detail = 420;

  // glow
  noFill();
  for (let g = 0; g < 3; g++) {
    stroke(color[0], color[1], color[2], alpha * visible * (0.13 - g * 0.03));
    strokeWeight(strokeW + g * 1.8);
    beginShape();
    for (let i = 0; i <= detail; i++) {
      const thetaBase = map(i, 0, detail, 0, TWO_PI);
      const p = bloomPoint(
        thetaBase, petalN, baseRadius, amp1, amp2,
        phase1, phase2, breath, openFactor, openEnv,
        vesMin, vesMax, vesPow, phiBloom, bloomScale, collapse, collapseScale
      );
      vertex(p.x, p.y);
    }
    endShape(CLOSE);
  }

  // main line
  stroke(color[0], color[1], color[2], alpha * visible);
  strokeWeight(strokeW);
  beginShape();
  for (let i = 0; i <= detail; i++) {
    const thetaBase = map(i, 0, detail, 0, TWO_PI);
    const p = bloomPoint(
      thetaBase, petalN, baseRadius, amp1, amp2,
      phase1, phase2, breath, openFactor, openEnv,
      vesMin, vesMax, vesPow, phiBloom, bloomScale, collapse, collapseScale
    );
    vertex(p.x, p.y);
  }
  endShape(CLOSE);

  // inner duplicate line for richness
  stroke(color[0], color[1], color[2], alpha * visible * 0.40);
  strokeWeight(max(0.6, strokeW * 0.5));
  beginShape();
  for (let i = 0; i <= detail; i++) {
    const thetaBase = map(i, 0, detail, 0, TWO_PI);
    const p = bloomPoint(
      thetaBase, petalN, baseRadius * 0.992, amp1 * 0.96, amp2 * 0.95,
      phase1, phase2, breath, openFactor, openEnv,
      vesMin, vesMax, vesPow, phiBloom, bloomScale, collapse, collapseScale
    );
    vertex(p.x, p.y);
  }
  endShape(CLOSE);

  pop();
}

function bloomPoint(
  thetaBase, petalN, baseRadius, amp1, amp2,
  phase1, phase2, breath, openFactor, openEnv,
  vesMin, vesMax, vesPow, phiBloom, bloomScale, collapse, collapseScale
) {
  const thetaWarp =
    sin(thetaBase * 0.5 + phase1) *
    openFactor *
    easeInOutSine(constrain(openEnv, 0, 1)) *
    0.55;

  const theta = thetaBase + thetaWarp;

  const waveA = amp1 * sin(petalN * theta + phase1 + breath * 0.9);
  const waveB = amp2 * sin((petalN * 2.0) * theta + phase2 - breath * 0.55);

  let r = baseRadius + waveA + waveB;

  const vesicaGate = pow(abs(sin(thetaBase * petalN * 0.5)), vesPow);
  const vesicaShape = lerp(vesMin, vesMax, vesicaGate);

  const phiGain = openEnv * baseRadius * (PHI - 1.0) * phiBloom;

  r = (r + phiGain) * vesicaShape;

  // 開花時のほどけ感
  r += sin(thetaBase * 0.5 + phase2) * baseRadius * 0.045 * openEnv;

  // bloomで少し拡張、collapseで少し収束
  r *= 1.0 + openEnv * bloomScale;
  r *= 1.0 - collapse * collapseScale;

  return createVector(cos(theta) * r, sin(theta) * r);
}

// ==========================================================
// Outer Orbit
// ==========================================================
function drawOuterOrbit(phase, bloom, collapse, orbit, silence) {
  push();

  const s = min(width, height);
  const baseR = s * 0.41;
  const visible = (0.20 + orbit * 0.80) * (1.0 - silence * 0.60);

  if (visible <= 0.001) {
    pop();
    return;
  }

  rotate(-TWO_PI * phase * 0.045);

  noFill();

  for (let g = 0; g < 3; g++) {
    stroke(PALETTE.outer[0], PALETTE.outer[1], PALETTE.outer[2], 28 * visible * (0.8 - g * 0.22));
    strokeWeight(1.2 + g * 1.5);

    beginShape();
    const detail = 360;
    for (let i = 0; i <= detail; i++) {
      const a = map(i, 0, detail, 0, TWO_PI);
      const petalN = 12.0;
      let r =
        baseR +
        s * 0.018 * sin(petalN * a + phase * TWO_PI * 0.35) +
        s * 0.008 * sin((petalN * 2.0) * a - phase * TWO_PI * 0.20);

      r *= 1.0 - collapse * 0.08;
      vertex(cos(a) * r, sin(a) * r);
    }
    endShape(CLOSE);
  }

  pop();
}

// ==========================================================
// Brush-light Beams
// ==========================================================
function drawBrushBeams(phase, bloom, collapse, silence, microPulse, breath) {
  push();

  const s = min(width, height);
  const stateStrength = microPulse * (1.0 - collapse * 0.55) * (1.0 - silence * 0.55);

  if (stateStrength <= 0.001) {
    pop();
    return;
  }

  const beamCount = floor(lerp(10, 22, bloom));
  const innerR = s * 0.050 + breath * s * 0.008;
  const outerR = s * 0.19 + bloom * s * 0.07 - collapse * s * 0.035;

  for (let i = 0; i < beamCount; i++) {
    const baseA =
      map(i, 0, beamCount, 0, TWO_PI) +
      phase * TWO_PI * 0.12 +
      sin(phase * TWO_PI * 2.0 + i * 0.7) * 0.014;

    const localOuter = outerR * nrand(i + 10, 0.95, 1.05);
    const localInner = innerR * nrand(i + 100, 0.97, 1.03);
    const alphaBase = 20 + stateStrength * 52;
    const bundleCount = floor(lerp(3, 7, bloom));

    drawBrushBeam(baseA, localInner, localOuter, bundleCount, alphaBase, stateStrength, i, breath);
  }

  pop();
}

function drawBrushBeam(angleBase, innerR, outerR, bundleCount, alphaBase, stateStrength, beamIndex, breath) {
  push();
  blendMode(ADD);

  for (let k = 0; k < bundleCount; k++) {
    const t = bundleCount <= 1 ? 0 : k / (bundleCount - 1);

    const angleOffset = map(t, 0, 1, -0.016, 0.016);
    const r1 = innerR + map(t, 0, 1, -3, 3);
    const r2 = outerR + map(t, 0, 1, -12, 12);

    const a1 = angleBase + angleOffset;
    const a2 = angleBase + angleOffset + sin(frameCount * 0.003 + beamIndex * 0.55) * 0.008;

    const x1 = cos(a1) * r1;
    const y1 = sin(a1) * r1;
    const x2 = cos(a2) * r2;
    const y2 = sin(a2) * r2;

    const segments = 18;
    let prevX = x1;
    let prevY = y1;

    for (let s = 1; s <= segments; s++) {
      const u = s / segments;

      let px = lerp(x1, x2, u);
      let py = lerp(y1, y2, u);

      const normalA = atan2(y2 - y1, x2 - x1) + HALF_PI;
      const curveAmp = (1.0 - u) * 2.4 + breath * 1.6;
      const curve = sin(u * PI + beamIndex * 0.4 + k) * curveAmp;

      px += cos(normalA) * curve;
      py += sin(normalA) * curve;

      const sw = lerp(2.2, 0.35, u) * (0.60 + stateStrength * 0.80);
      const a = alphaBase * pow(1.0 - u, 1.35) * nrand(beamIndex * 10 + k * 3 + s, 0.85, 1.08);

      const rr = lerp(PALETTE.core[0], PALETTE.sub[0], u * 0.65);
      const gg = lerp(PALETTE.core[1], PALETTE.sub[1], u * 0.65);
      const bb = lerp(PALETTE.core[2], PALETTE.outer[2], u * 0.75);

      stroke(rr, gg, bb, a);
      strokeWeight(sw);
      line(prevX, prevY, px, py);

      prevX = px;
      prevY = py;
    }
  }

  blendMode(BLEND);
  pop();
}

// ==========================================================
// Core
// ==========================================================
function drawCore(phase, breath, bloom, collapse, seed, silence) {
  push();

  const s = min(width, height);

  const base = s * 0.012;
  const pulse = base + breath * s * 0.018 + seed * s * 0.004;
  const maxGlow = pulse * (9.5 + bloom * 1.5);

  blendMode(ADD);
  noFill();

  const steps = 90;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = lerp(pulse * 1.08, maxGlow, t);
    const falloff = pow(1.0 - t, 2.8);
    const a = (22 + bloom * 10 - silence * 4) * falloff;

    const rr = lerp(PALETTE.core[0], PALETTE.sub[0], t * 0.22);
    const gg = lerp(PALETTE.core[1], PALETTE.sub[1], t * 0.22);
    const bb = lerp(PALETTE.core[2], PALETTE.sub[2], t * 0.22);

    stroke(rr, gg, bb, a);
    strokeWeight(2);
    circle(0, 0, r * 2);
  }

  blendMode(BLEND);
  noFill();

  stroke(PALETTE.core[0], PALETTE.core[1], PALETTE.core[2], 76 * (1.0 - silence * 0.45));
  strokeWeight(1.0 + breath * 0.25);
  circle(0, 0, pulse * 4.1);

  stroke(PALETTE.sub[0], PALETTE.sub[1], PALETTE.sub[2], 36 * (1.0 - silence * 0.45));
  strokeWeight(0.8);
  circle(0, 0, pulse * 5.9);

  stroke(PALETTE.outer[0], PALETTE.outer[1], PALETTE.outer[2], 18 * (1.0 - silence * 0.45));
  strokeWeight(0.7);
  circle(0, 0, pulse * 9.4);

  noStroke();
  fill(PALETTE.core[0], PALETTE.core[1], PALETTE.core[2], 255);
  circle(0, 0, pulse * 1.9);

  fill(255, 255, 255, 180);
  circle(0, 0, pulse * 1.10);

  pop();
}

// ==========================================================
// Vignette
// ==========================================================
function drawVignette() {
  noFill();
  for (let i = 0; i < 44; i++) {
    const a = map(i, 0, 43, 0, 10);
    stroke(0, 0, 0, a);
    rect(i * 2, i * 2, width - i * 4, height - i * 4);
  }
}

// ==========================================================
// Utilities
// ==========================================================
function smoothstep(a, b, x) {
  const t = constrain((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function phaseWindow(p, start, end, edge = 0.06) {
  if (start <= end) {
    const on = smoothstep(start - edge, start + edge, p);
    const off = 1.0 - smoothstep(end - edge, end + edge, p);
    return constrain(on * off, 0, 1);
  } else {
    return max(
      phaseWindow(p, start, 1.0, edge),
      phaseWindow(p, 0.0, end, edge)
    );
  }
}

function wrappedAge(phase, center) {
  let a = phase - center;
  if (a < 0) a += 1.0;
  return a;
}

function easeInOutSine(x) {
  return -(cos(PI * x) - 1) / 2;
}

function easeOutCubic(x) {
  return 1 - pow(1 - x, 3);
}

function hash1(n) {
  const x = sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - floor(x);
}

function nrand(n, minVal, maxVal) {
  return lerp(minVal, maxVal, hash1(n));
}
