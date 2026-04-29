// ======================================================
// GEN - Strong Core with Blue-White Edge Glow Version
// p5.js sketch.js
// ======================================================

let cycleDuration = 108.0;

const CONFIG = {
  pulseCycle: 20.0,
  maxRotSpeed: 0.00095,

  // 放射
  beamCount: 32,
  beamInnerR: 8,
  beamOuterR: 360,

  // 中心星（核）
  centerCoreMin: 3.0,
  centerCoreMax: 8.4,

  // 中心ハロー
  halo1Min: 11.0,
  halo1Max: 22.0,
  halo2Min: 20.0,
  halo2Max: 38.0,

  // 縁光
  edgeGlowMin: 4.8,
  edgeGlowMax: 10.5,
  edgeRingMin: 5.8,
  edgeRingMax: 12.2,

  // 背景グロー
  bgGlow1Scale: 0.075,
  bgGlow2Scale: 0.13,

  // 外周霧
  outerMistRadii: [250, 330, 430, 560],
  outerMistAlpha: [5.0, 3.5, 2.2, 1.2],

  // 同心円
  ringRadii: [12, 18, 26, 34, 46, 62, 84, 130, 205, 290],

  // 花弁
  petalRadiusOuter: 86,
  petalRadiusInner: 42,
  petalCountOuter: 12,
  petalCountInner: 16,

  // 多角形
  polygonSides: [6, 8, 10, 12],
  polygonRadii: [10, 18, 32, 64]
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(RADIANS);
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);
}

function draw() {
  background(0);

  const cx = width / 2;
  const cy = height / 2;
  const t = (millis() / 1000.0) % cycleDuration;

  const phaseState = getPhaseState(t);

  drawDeepSpacePresence(cx, cy);

  if (phaseState.geometryAppear > 0.001) {
    push();
    translate(cx, cy);

    const rot = millis() * CONFIG.maxRotSpeed * phaseState.rotationStrength;
    rotate(rot);

    drawMandala(phaseState.geometryAppear, phaseState.geometryFade, t);

    pop();
  }

  drawCenterStar(cx, cy, t, phaseState.pulseOnly);
}

// ======================================================
// Phase control
// ======================================================
function getPhaseState(t) {
  const phase1End = 26.0;
  const phase2End = 46.0;
  const phase3End = 76.0;
  const phase4End = 92.0;
  const phase5End = 108.0;

  let pulseOnly = 0;
  let geometryAppear = 0;
  let rotationStrength = 0;
  let geometryFade = 0;

  if (t < phase1End) {
    pulseOnly = easeInOutSine(t / phase1End);
    geometryAppear = 0;
    rotationStrength = 0;
    geometryFade = 0;
  } else if (t < phase2End) {
    pulseOnly = 1;
    geometryAppear = easeInOutSine((t - phase1End) / (phase2End - phase1End));
    rotationStrength = 0.05 * geometryAppear;
    geometryFade = 0;
  } else if (t < phase3End) {
    pulseOnly = 1;
    geometryAppear = 1;
    rotationStrength = 1.0;
    geometryFade = 0;
  } else if (t < phase4End) {
    const p = easeInOutSine((t - phase3End) / (phase4End - phase3End));
    pulseOnly = 1;
    geometryAppear = 1;
    rotationStrength = 1.0 - p;
    geometryFade = 0.25 * p;
  } else {
    const p = easeInOutSine((t - phase4End) / (phase5End - phase4End));
    pulseOnly = 1.0 - 0.2 * p;
    geometryAppear = 1.0 - p;
    rotationStrength = 0;
    geometryFade = p;
  }

  return { pulseOnly, geometryAppear, rotationStrength, geometryFade };
}

// ======================================================
// Center star
// 中央核に青白い縁光を追加して立体感を出す
// ======================================================
function drawCenterStar(cx, cy, t, intensity) {
  const p = pulseValue(t, CONFIG.pulseCycle, 1.45);

  const coreSize = lerp(CONFIG.centerCoreMin, CONFIG.centerCoreMax, p);
  const coreAlpha = lerp(225, 255, p) * lerp(0.96, 1.0, intensity);

  const halo1Size = lerp(CONFIG.halo1Min, CONFIG.halo1Max, p);
  const halo1Alpha = lerp(14, 38, p);

  const halo2Size = lerp(CONFIG.halo2Min, CONFIG.halo2Max, p);
  const halo2Alpha = lerp(4, 13, p);

  // 青白い縁光
  const edgeGlowSize = lerp(CONFIG.edgeGlowMin, CONFIG.edgeGlowMax, p);
  const edgeGlowAlpha = lerp(10, 26, p);

  const edgeRingSize = lerp(CONFIG.edgeRingMin, CONFIG.edgeRingMax, p);
  const edgeRingAlpha = lerp(22, 52, p);

  noStroke();

  // 外側ハロー
  fill(236, 243, 255, halo2Alpha);
  circle(cx, cy, halo2Size);

  // 中間ハロー
  fill(248, 250, 255, halo1Alpha);
  circle(cx, cy, halo1Size);

  // 青白い縁光のにじみ
  fill(195, 225, 255, edgeGlowAlpha);
  circle(cx, cy, edgeGlowSize);

  // 青白い縁リング（立体感の芯）
  fill(205, 232, 255, edgeRingAlpha);
  circle(cx, cy, edgeRingSize);

  // 中心核
  fill(255, 255, 255, coreAlpha);
  circle(cx, cy, coreSize);

  // 十字スパーク
  stroke(255, 255, 255, lerp(82, 165, p));
  strokeWeight(1.05);
  line(cx - 14, cy, cx + 14, cy);
  line(cx, cy - 14, cx, cy + 14);

  // 斜めスパーク
  stroke(246, 248, 255, lerp(20, 50, p));
  strokeWeight(0.56);
  line(cx - 5.8, cy - 5.8, cx + 5.8, cy + 5.8);
  line(cx - 5.8, cy + 5.8, cx + 5.8, cy - 5.8);
}

// ======================================================
// Deep space presence
// ======================================================
function drawDeepSpacePresence(cx, cy) {
  noStroke();

  fill(28, 42, 90, 0.75);
  circle(cx, cy, width * CONFIG.bgGlow1Scale);

  fill(74, 34, 120, 0.28);
  circle(cx, cy, width * CONFIG.bgGlow2Scale);
}

// ======================================================
// Mandala master
// ======================================================
function drawMandala(appear, fade, t) {
  const alphaBase = 1.0 - fade;

  const cLight = color(90, 125, 255, 132 * appear * alphaBase);
  const cMid   = color(130, 70, 255, 102 * appear * alphaBase);
  const cOuter = color(135, 52, 235, 95 * appear * alphaBase);
  const cSoft  = color(180, 125, 255, 58 * appear * alphaBase);

  const p = pulseValue(t, CONFIG.pulseCycle, 1.0);
  const breathe = lerp(0.988, 1.028, p);

  scale(breathe);

  drawOuterPurpleMist(cOuter, appear, alphaBase, t);
  drawLightToInkRadialBeams(cLight, cMid, cOuter, appear, alphaBase, t);
  drawConcentricRings(cLight, cMid, cOuter, appear, alphaBase);
  drawPetalLayers(cLight, cMid, cOuter, appear, alphaBase);
  drawPolygonLayer(cSoft, cLight, appear, alphaBase);
}

// ======================================================
// Outer purple mist
// ======================================================
function drawOuterPurpleMist(cOuter, appear, alphaBase, t) {
  push();
  noStroke();

  const p = pulseValue(t, CONFIG.pulseCycle, 1.0);
  const mistBreath = lerp(0.985, 1.02, p);

  const driftX = sin(t * 0.08) * 18.0;
  const driftY = cos(t * 0.06) * 12.0;

  for (let i = 0; i < CONFIG.outerMistRadii.length; i++) {
    const baseR = CONFIG.outerMistRadii[i] * appear * mistBreath;
    const alphaV = CONFIG.outerMistAlpha[i] * alphaBase;

    const ox = driftX * (0.35 + i * 0.22) + sin(t * 0.11 + i) * 6.0;
    const oy = driftY * (0.35 + i * 0.18) + cos(t * 0.09 + i * 1.7) * 5.0;

    const sx1 = 2.0;
    const sy1 = 1.86 + i * 0.015;

    const sx2 = 1.82 + i * 0.02;
    const sy2 = 2.0;

    fill(110, 40, 185, alphaV);
    ellipse(ox, oy, baseR * sx1, baseR * sy1);

    fill(145, 60, 225, alphaV * 0.50);
    ellipse(-ox * 0.38, oy * 0.32, baseR * sx2, baseR * sy2);
  }

  pop();
}

// ======================================================
// Radial beams
// ======================================================
function drawLightToInkRadialBeams(cLight, cMid, cOuter, appear, alphaBase, timeSec) {
  push();

  const count = CONFIG.beamCount;
  const innerR = CONFIG.beamInnerR;
  const outerR = CONFIG.beamOuterR * appear;

  for (let i = 0; i < count; i++) {
    const a = TWO_PI * i / count;

    const seed = i * 151.731;
    const sway = 0.016 * sin(timeSec * 0.22 + i * 0.7);
    const beamAngle = a + sway;

    drawLightToInkBeam(
      innerR, outerR, beamAngle, 6.0,
      cLight, cMid, cOuter,
      seed, 1.65, 0.85, alphaBase
    );

    drawLightToInkBeam(
      innerR, outerR, beamAngle, 3.0,
      cLight, cMid, cOuter,
      seed + 9.3, 1.0, 0.52, alphaBase
    );

    drawLightToInkBeam(
      innerR, outerR, beamAngle, 1.28,
      cLight, cMid, cOuter,
      seed + 21.7, 0.38, 0.18, alphaBase
    );
  }

  pop();
}

// ======================================================
// Beam segment generator
// ======================================================
function drawLightToInkBeam(
  innerR, outerR, angleBase, baseWeight,
  cLight, cMid, cOuter,
  seed, wiggleAmp, sideDrift, alphaBase
) {
  const segments = 72;

  for (let s = 0; s < segments; s++) {
    const u1 = s / segments;
    const u2 = (s + 1) / segments;

    const r1 = lerp(innerR, outerR, u1);
    const r2 = lerp(innerR, outerR, u2);

    const organicZone1 = smoothstep(0.42, 1.0, u1);
    const organicZone2 = smoothstep(0.42, 1.0, u2);

    const wobbleScale1 = lerp(0.08, 1.0, organicZone1);
    const wobbleScale2 = lerp(0.08, 1.0, organicZone2);

    const wobble1 =
      wiggleAmp * wobbleScale1 * pow(u1, 1.12) *
      sin(seed + u1 * 7.0 + frameCount * 0.003);

    const wobble2 =
      wiggleAmp * wobbleScale2 * pow(u2, 1.12) *
      sin(seed + u2 * 7.0 + frameCount * 0.003);

    const driftScale1 = smoothstep(0.50, 1.0, u1);
    const driftScale2 = smoothstep(0.50, 1.0, u2);

    const drift1 =
      sideDrift * driftScale1 * pow(u1, 1.35) *
      sin(seed * 0.73 + u1 * 10.5 + frameCount * 0.0025);

    const drift2 =
      sideDrift * driftScale2 * pow(u2, 1.35) *
      sin(seed * 0.73 + u2 * 10.5 + frameCount * 0.0025);

    const a1 = angleBase + wobble1 * 0.01;
    const a2 = angleBase + wobble2 * 0.01;

    const x1 = cos(a1) * r1 + cos(a1 + HALF_PI) * drift1;
    const y1 = sin(a1) * r1 + sin(a1 + HALF_PI) * drift1;
    const x2 = cos(a2) * r2 + cos(a2 + HALF_PI) * drift2;
    const y2 = sin(a2) * r2 + sin(a2 + HALF_PI) * drift2;

    const taper = lerp(1.0, 0.18, pow(u1, 0.92));

    const pressureBase = 0.86 + 0.16 * sin(seed * 1.11 + u1 * 8.5);
    const pressureNoise = lerp(0.0, 0.22, smoothstep(0.62, 1.0, u1));
    const pressure = pressureBase + pressureNoise * sin(seed * 2.3 + u1 * 18.0);

    let alphaMul = 1.0;
    if (u1 > 0.66) {
      const k = map(u1, 0.66, 1.0, 1.0, 0.0);
      alphaMul = pow(constrain(k, 0, 1), 1.55);
    }

    const mix1 = smoothstep(0.0, 0.45, u1);
    const mix2 = smoothstep(0.45, 1.0, u1);

    const rColA = lerp(red(cLight), red(cMid), mix1);
    const gColA = lerp(green(cLight), green(cMid), mix1);
    const bColA = lerp(blue(cLight), blue(cMid), mix1);

    const rCol = lerp(rColA, red(cOuter), mix2);
    const gCol = lerp(gColA, green(cOuter), mix2);
    const bCol = lerp(bColA, blue(cOuter), mix2);

    let skip = false;
    if (u1 > 0.78) {
      const n = noise(seed * 0.012 + u1 * 11.0, frameCount * 0.002);
      if (n > 0.56) skip = true;
    }
    if (u1 > 0.89) {
      const n2 = noise(seed * 0.023 + u1 * 24.0, frameCount * 0.0025 + 77.0);
      if (n2 > 0.47) skip = true;
    }

    if (!skip) {
      const a = 96 * alphaBase * alphaMul;

      stroke(rCol, gCol, bCol, a);
      strokeWeight(max(0.12, baseWeight * taper * pressure * max(0.14, alphaMul)));
      line(x1, y1, x2, y2);

      if (u1 > 0.82) {
        const fuzzAmount = map(u1, 0.82, 1.0, 0.0, 1.0);
        const fuzzAlpha = a * 0.24 * fuzzAmount;
        const fuzzLen = lerp(0.0, 4.8, fuzzAmount);
        const fuzzSpread = lerp(0.0, 0.50, fuzzAmount);

        const fuzzA = a2 + random(-fuzzSpread, fuzzSpread);
        const fx = x2 + cos(fuzzA) * fuzzLen;
        const fy = y2 + sin(fuzzA) * fuzzLen;

        stroke(rCol, gCol, bCol, fuzzAlpha);
        strokeWeight(max(0.16, baseWeight * 0.14 * alphaMul));
        line(x2, y2, fx, fy);
      }
    }
  }
}

// ======================================================
// Rings
// ======================================================
function drawConcentricRings(cLight, cMid, cOuter, appear, alphaBase) {
  push();
  noFill();

  for (let i = 0; i < CONFIG.ringRadii.length; i++) {
    const rr = CONFIG.ringRadii[i] * appear;
    const u = i / (CONFIG.ringRadii.length - 1);

    const mix1 = smoothstep(0.0, 0.45, u);
    const mix2 = smoothstep(0.45, 1.0, u);

    const rA = lerp(red(cLight), red(cMid), mix1);
    const gA = lerp(green(cLight), green(cMid), mix1);
    const bA = lerp(blue(cLight), blue(cMid), mix1);

    const rrCol = lerp(rA, red(cOuter), mix2);
    const ggCol = lerp(gA, green(cOuter), mix2);
    const bbCol = lerp(bA, blue(cOuter), mix2);

    const glowWeight = i >= CONFIG.ringRadii.length - 2 ? 2.6 : 2.2;
    const coreWeight = i >= CONFIG.ringRadii.length - 2 ? 0.9 : 0.78;

    stroke(rrCol, ggCol, bbCol, 18 * alphaBase);
    strokeWeight(glowWeight);
    ellipse(0, 0, rr * 2, rr * 2);

    stroke(rrCol, ggCol, bbCol, 62 * alphaBase);
    strokeWeight(coreWeight);
    ellipse(0, 0, rr * 2, rr * 2);
  }

  pop();
}

// ======================================================
// Petal layers
// ======================================================
function drawPetalLayers(cLight, cMid, cOuter, appear, alphaBase) {
  push();

  drawSinglePetalLayer(
    CONFIG.petalCountInner,
    CONFIG.petalRadiusInner * appear,
    cLight, cMid,
    alphaBase,
    0.50, 0.22, 1.5, 0.68
  );

  drawSinglePetalLayer(
    CONFIG.petalCountOuter,
    CONFIG.petalRadiusOuter * appear,
    cMid, cOuter,
    alphaBase,
    0.54, 0.24, 1.9, 0.8
  );

  pop();
}

function drawSinglePetalLayer(count, radius, cA, cB, alphaBase, xScale, yScale, glowW, coreW) {
  for (let i = 0; i < count; i++) {
    const a = TWO_PI * i / count;
    push();
    rotate(a);

    const rr = lerp(red(cA), red(cB), 0.5);
    const gg = lerp(green(cA), green(cB), 0.5);
    const bb = lerp(blue(cA), blue(cB), 0.5);

    stroke(rr, gg, bb, 18 * alphaBase);
    strokeWeight(glowW);
    drawPetalShape(radius, xScale, yScale);

    stroke(rr, gg, bb, 62 * alphaBase);
    strokeWeight(coreW);
    drawPetalShape(radius, xScale, yScale);

    pop();
  }
}

function drawPetalShape(radius, xScale, yScale) {
  beginShape();
  for (let t = 0; t <= PI; t += PI / 28) {
    const x = cos(t) * radius * xScale;
    const y = sin(t) * radius * yScale;
    vertex(x, y);
  }
  for (let t = PI; t >= 0; t -= PI / 28) {
    const x = cos(t) * radius * xScale;
    const y = -sin(t) * radius * yScale;
    vertex(x, y);
  }
  endShape(CLOSE);
}

// ======================================================
// Polygon layer
// ======================================================
function drawPolygonLayer(cSoft, cLight, appear, alphaBase) {
  push();
  noFill();

  for (let i = 0; i < CONFIG.polygonSides.length; i++) {
    const sides = CONFIG.polygonSides[i];
    const radius = CONFIG.polygonRadii[i] * appear;
    const u = i / (CONFIG.polygonSides.length - 1);

    const rr = lerp(red(cLight), red(cSoft), u);
    const gg = lerp(green(cLight), green(cSoft), u);
    const bb = lerp(blue(cLight), blue(cSoft), u);

    stroke(rr, gg, bb, 14 * alphaBase);
    strokeWeight(1.8);
    drawPolygon(0, 0, radius, sides, -HALF_PI);

    stroke(rr, gg, bb, 58 * alphaBase);
    strokeWeight(0.76);
    drawPolygon(0, 0, radius, sides, -HALF_PI);
  }

  pop();
}

function drawPolygon(x, y, radius, npoints, rot = 0) {
  beginShape();
  for (let a = 0; a < TWO_PI; a += TWO_PI / npoints) {
    const sx = x + cos(a + rot) * radius;
    const sy = y + sin(a + rot) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// ======================================================
// Utilities
// ======================================================
function pulseValue(t, cycle, powerValue) {
  const p = 0.5 - 0.5 * cos(TWO_PI * ((t % cycle) / cycle));
  return pow(p, powerValue);
}

function easeInOutSine(x) {
  return -(cos(PI * x) - 1) / 2;
}

function smoothstep(edge0, edge1, x) {
  let tt = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return tt * tt * (3 - 2 * tt);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
