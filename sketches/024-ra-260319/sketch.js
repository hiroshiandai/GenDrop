// ============================================================
// A. 添付画像にさらに近づけた完全再現寄せ版
// p5.js / sketch.js
// ============================================================

const SIZE = 1080;

let cx, cy;
let outerR;
let coreR;

function setup() {
  createCanvas(SIZE, SIZE);
  pixelDensity(2);
  smooth();
  cx = width * 0.5;
  cy = height * 0.5;
  outerR = width * 0.43;
  coreR = width * 0.23;
}

function draw() {
  background(0);
  translate(cx, cy);

  let t = frameCount * 0.012;
  let loopDur = 36.0;                  // 1周の長さ
  let ph = (t % loopDur) / loopDur;    // 0..1

  // 進行に応じて色味を白→淡金へ
  let warm = smoothstep(0.50, 0.95, ph);

  // 外周放射線
  let radialCount = floor(56 + 32 * smoothstep(0.15, 0.85, ph));
  drawRadialField(radialCount, outerR, t, warm);

  // フェーズに応じて中心構造を変化
  if (ph < 0.10) {
    drawPhaseSeed(ph / 0.10, t, warm);
  } else if (ph < 0.22) {
    drawPhaseTriangle(norm(ph, 0.10, 0.22), t, warm);
  } else if (ph < 0.38) {
    drawPhaseStar5(norm(ph, 0.22, 0.38), t, warm);
  } else if (ph < 0.58) {
    drawPhaseStar7(norm(ph, 0.38, 0.58), t, warm);
  } else if (ph < 0.78) {
    drawPhaseRosette(norm(ph, 0.58, 0.78), t, warm);
  } else {
    drawPhaseMandala(norm(ph, 0.78, 1.00), t, warm);
  }

  drawCoreGlow(t, ph, warm);
}

// ============================================================
// 放射線
// ============================================================

function drawRadialField(count, radius, t, warm) {
  push();
  rotate(t * 0.07);

  for (let i = 0; i < count; i++) {
    let a = TWO_PI * i / count;

    // わずかな揺れ
    let aa = a + 0.02 * sin(t * 1.7 + i * 0.31);

    // 中心始点
    let innerR = 18 + 14 * sin(t * 1.2 + i * 0.17);
    // 外周終点
    let outerRR = radius * (0.985 + 0.025 * sin(t * 0.9 + i * 0.11));

    let x1 = cos(aa) * innerR;
    let y1 = sin(aa) * innerR;
    let x2 = cos(aa) * outerRR;
    let y2 = sin(aa) * outerRR;

    // 薄いグロー
    stroke(255, 250 - 20 * warm, 235 - 70 * warm, 18);
    strokeWeight(2.3);
    line(x1, y1, x2, y2);

    // 本線
    stroke(255, 250 - 18 * warm, 238 - 65 * warm, 72);
    strokeWeight(0.95);
    line(x1, y1, x2, y2);
  }

  pop();
}

// ============================================================
// フェーズ 1: 種
// ============================================================

function drawPhaseSeed(k, t, warm) {
  let r = lerp(30, coreR * 0.22, k);
  let pts = buildPolygon(2, r, t * 0.8 + PI * 0.15);

  // 2点から徐々に3点の気配へ
  drawStringFigure(pts, [1], 42, warm, 1.05);
  drawNodes(pts, 20, warm);

  // 中心周辺の揺らぎ
  for (let i = 0; i < 22; i++) {
    let a = t * 1.8 + i * TWO_PI / 22.0;
    let rr = r * 0.45 + 8 * sin(t * 1.4 + i);
    let x = cos(a) * rr;
    let y = sin(a) * rr;
    noStroke();
    fill(255, 255, 255, 16);
    circle(x, y, 2.2);
  }
}

// ============================================================
// フェーズ 2: 三角
// ============================================================

function drawPhaseTriangle(k, t, warm) {
  let r = lerp(coreR * 0.20, coreR * 0.58, k);
  let rot = t * 0.65 - HALF_PI * 0.2;
  let pts = buildPolygon(3, r, rot);

  // 三角糸掛け
  drawStringFigure(pts, [1], lerp(36, 70, k), warm, 1.05);

  // 内部補助層
  let pts2 = buildPolygon(3, r * 0.86, -rot * 0.65 + 0.18);
  drawStringFigure(pts2, [1], lerp(18, 36, k), warm, 0.9);

  drawNodes(pts, 24, warm);
}

// ============================================================
// フェーズ 3: 5芒星
// ============================================================

function drawPhaseStar5(k, t, warm) {
  let r = lerp(coreR * 0.52, coreR * 0.92, k);
  let rot = t * 0.45 - HALF_PI;
  let pts = buildPolygon(5, r, rot);

  // 5芒星の張り線
  drawStringFigure(pts, [2], lerp(40, 64, k), warm, 1.0);

  // 密度増し
  let pts2 = buildPolygon(5, r * 0.92, -rot * 0.72);
  drawStringFigure(pts2, [1, 2], lerp(12, 24, k), warm, 0.9);

  drawNodes(pts, 22, warm);
}

// ============================================================
// フェーズ 4: 7芒星寄り
// ============================================================

function drawPhaseStar7(k, t, warm) {
  let r = lerp(coreR * 0.88, coreR * 1.18, k);
  let rot = t * 0.38 - HALF_PI * 0.8;
  let pts = buildPolygon(7, r, rot);

  drawStringFigure(pts, [2, 3], lerp(24, 46, k), warm, 0.95);

  // 補助リング
  let pts2 = buildPolygon(7, r * 0.84, -rot * 0.6 + 0.2);
  drawStringFigure(pts2, [2], lerp(12, 22, k), warm, 0.8);

  drawNodes(pts, 18, warm);

  // 中央へ少し収束
  drawConcentricWeb(5, coreR * 0.22, coreR * 0.72, 10 + 12 * k, warm, t);
}

// ============================================================
// フェーズ 5: ロゼット化
// ============================================================

function drawPhaseRosette(k, t, warm) {
  let petals = floor(lerp(8, 14, k));
  let base = lerp(coreR * 0.80, coreR * 1.15, k);

  for (let j = 0; j < 4; j++) {
    let q = j / 3.0;
    let r = base * lerp(0.42, 1.0, q);
    let rot = t * (0.20 + q * 0.15) + q * 0.7;
    let pts = buildPolygon(petals, r, rot);

    let alpha = lerp(16, 36, 1.0 - q);
    drawStringFigure(pts, [2, 3, 4], alpha, warm, 0.72);
  }

  // 外周に点ノード感
  let rimPts = buildPolygon(petals, base * 1.05, -t * 0.18);
  drawNodes(rimPts, 14, warm);

  drawConcentricWeb(8, coreR * 0.20, coreR * 1.00, 14 + 20 * k, warm, t);
}

// ============================================================
// フェーズ 6: 高密度円形マンダラ
// ============================================================

function drawPhaseMandala(k, t, warm) {
  let rings = floor(lerp(8, 18, k));
  let segments = floor(lerp(14, 28, k));

  // 複数リングを重ねて高密度化
  for (let r = 0; r < rings; r++) {
    let q = r / max(1, rings - 1);
    let rr = lerp(coreR * 0.18, coreR * 1.18, pow(q, 0.92));
    let rot = t * (0.06 + q * 0.10) + q * TWO_PI * 0.7;

    let n = max(6, floor(segments + q * 10));
    let pts = buildPolygon(n, rr, rot);

    let alpha = lerp(26, 8, q);
    let sw = lerp(0.95, 0.55, q);

    // 交差パターン
    let skips = chooseMandalaSkips(n);
    drawStringFigure(pts, skips, alpha, warm, sw);
  }

  // 輪郭リング
  for (let i = 0; i < 6; i++) {
    let q = i / 5.0;
    let rr = lerp(coreR * 0.35, coreR * 1.15, q);
    rr *= 1.0 + 0.012 * sin(t * 1.1 + i * 1.5);

    noFill();
    stroke(255, 225, 175, 10);
    strokeWeight(0.8);
    circle(0, 0, rr * 2);
  }

  // 周縁ノード
  let rimN = floor(lerp(12, 18, k));
  let rimPts = buildPolygon(rimN, coreR * 1.16, -t * 0.09);
  drawNodes(rimPts, 16, warm);
}

// ============================================================
// 共通描画
// ============================================================

function drawStringFigure(pts, skips, alphaVal, warm, sw) {
  if (!pts || pts.length < 2) return;

  for (let s of skips) {
    strokeWeight(sw);

    for (let i = 0; i < pts.length; i++) {
      let a = pts[i];
      let b = pts[(i + s) % pts.length];

      // グロー
      stroke(255, 248 - 22 * warm, 228 - 72 * warm, alphaVal * 0.22);
      strokeWeight(sw * 2.0);
      line(a.x, a.y, b.x, b.y);

      // 本線
      stroke(255, 248 - 20 * warm, 232 - 70 * warm, alphaVal);
      strokeWeight(sw);
      line(a.x, a.y, b.x, b.y);
    }
  }
}

function drawNodes(pts, sizeBase, warm) {
  noStroke();

  for (let p of pts) {
    fill(255, 245 - 18 * warm, 220 - 70 * warm, 24);
    circle(p.x, p.y, sizeBase * 1.45);

    fill(255, 248 - 12 * warm, 232 - 58 * warm, 52);
    circle(p.x, p.y, sizeBase * 0.75);

    fill(255, 252, 245, 115);
    circle(p.x, p.y, sizeBase * 0.18);
  }
}

function drawConcentricWeb(ringCount, rMin, rMax, alphaBase, warm, t) {
  for (let i = 0; i < ringCount; i++) {
    let q = i / max(1, ringCount - 1);
    let rr = lerp(rMin, rMax, q);

    let n = floor(6 + q * 16);
    let rot = t * (0.08 + q * 0.08) + q * 0.8;
    let pts = buildPolygon(n, rr, rot);

    let skips = [];
    skips.push(1);
    if (n > 8) skips.push(2);
    if (n > 12) skips.push(3);

    drawStringFigure(pts, skips, alphaBase * (1.0 - q * 0.7), warm, 0.6);
  }
}

function drawCoreGlow(t, ph, warm) {
  let pulse = 1.0 + 0.12 * sin(t * 2.1);

  noStroke();
  fill(255, 250, 242, 160);
  circle(0, 0, 10 * pulse);

  fill(255, 238, 210, 40 + 20 * smoothstep(0.35, 1.0, ph));
  circle(0, 0, 26 * pulse);

  fill(255, 220, 170, 10 + 12 * smoothstep(0.55, 1.0, ph));
  circle(0, 0, 58 * pulse);
}

// ============================================================
// 幾何ユーティリティ
// ============================================================

function buildPolygon(n, radius, rot = 0) {
  let pts = [];
  for (let i = 0; i < n; i++) {
    let a = TWO_PI * i / n + rot;
    let rr = radius * (1.0 + 0.012 * sin(frameCount * 0.02 + i * 1.8));
    pts.push(createVector(cos(a) * rr, sin(a) * rr));
  }
  return pts;
}

function chooseMandalaSkips(n) {
  let out = [1];
  if (n >= 8) out.push(2);
  if (n >= 12) out.push(3);
  if (n >= 16) out.push(5);
  if (n >= 22) out.push(7);
  return out;
}

// ============================================================
// 補助関数
// ============================================================

function norm(v, a, b) {
  return constrain((v - a) / (b - a), 0, 1);
}

function smoothstep(a, b, x) {
  let t = constrain((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

// ============================================================
// 保存
// ============================================================

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveCanvas('geometric_mandala_A', 'png');
  }
}
