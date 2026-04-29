// =========================================
// Sacred Core Temple / orbital dark dots version
// p5.js / full sketch.js
// 内周黒ドット増量 + 軌道感を強めた版
// =========================================

let cell = 6;
let cols, rows;

let bgCol;
let whiteCol;
let goldCol;
let paleGold;
let blueWhite;
let violetMist;
let darkDotCol;

let baseCX, baseCY;

function setup() {
  createCanvas(1200, 1500);
  frameRate(30);

  cols = floor(width / cell);
  rows = floor(height / cell);

  bgCol = color(4, 5, 8);
  whiteCol = color(248, 246, 240);
  goldCol = color(214, 190, 128);
  paleGold = color(245, 229, 185);
  blueWhite = color(210, 228, 255);
  violetMist = color(150, 140, 210);
  darkDotCol = color(24, 28, 46);

  baseCX = width * 0.5;
  baseCY = height * 0.515;

  rectMode(CORNER);
  noStroke();
}

function draw() {
  background(bgCol);

  let t = frameCount * 0.016;
  let breath = sin(t);
  let pulse = 0.5 + 0.5 * sin(t);

  let cx = baseCX + sin(t * 0.18) * 1.0;
  let cy = baseCY + cos(t * 0.15) * 1.0;

  drawDeepSpace(t);
  drawTempleHaloBack(cx, cy, t, pulse);

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      let x = gx * cell;
      let y = gy * cell;
      let px = x + cell * 0.5;
      let py = y + cell * 0.5;

      if (templePattern(px, py, cx, cy, t, breath)) {
        fill(templeCellColor(px, py, cx, cy, t, pulse));
        rect(x, y, cell, cell);
      }
    }
  }

  // 軌道化した黒ドット
  drawOrbitalDarkDots(cx, cy, t, pulse);

  drawTempleRings(cx, cy, t);
  drawCoreFrontTemple(cx, cy, t, pulse);
  drawTempleLabel();
}

// =========================================
// パターン判定
// =========================================
function templePattern(x, y, cx, cy, t, breath) {
  let dx = x - cx;
  let dy = y - cy;
  let r = sqrt(dx * dx + dy * dy);
  let ang = atan2(dy, dx);

  let gx = floor(x / cell);
  let gy = floor(y / cell);

  let coreScale = 1.0 + breath * 0.055;
  let flowerScale = 1.0 + sin(t * 0.85) * 0.022;
  let shellScale = 1.0 + sin(t * 0.52 + 1.1) * 0.012;

  // 中心核
  let coreRing1 = inCircle(x, y, cx, cy, 132 * coreScale) &&
                  !inCircle(x, y, cx, cy, 96 * coreScale);

  let coreRing2 = inCircle(x, y, cx, cy, 92 * coreScale) &&
                  !inCircle(x, y, cx, cy, 62 * coreScale);

  let coreRing3 = inCircle(x, y, cx, cy, 54 * coreScale) &&
                  !inCircle(x, y, cx, cy, 28 * coreScale);

  let holyDiamond1 = inDiamond(x, y, cx, cy, 104 * coreScale, 138 * coreScale) &&
                     !inDiamond(x, y, cx, cy, 62 * coreScale, 84 * coreScale);

  let holyDiamond2 = inDiamond(x, y, cx, cy, 46 * coreScale, 62 * coreScale) &&
                     !inDiamond(x, y, cx, cy, 18 * coreScale, 24 * coreScale);

  // Flower of Life
  let sacredR = 128 * flowerScale;
  let layer1Offset = 128;
  let layer2Offset = 256;
  let layer3Offset = 384;

  let c0 = inCircle(x, y, cx, cy, sacredR);
  let layer1 = sixCircleMask(x, y, cx, cy, layer1Offset, sacredR);
  let layer2 = sixCircleMask(x, y, cx, cy, layer2Offset, sacredR);
  let layer3 = sixCircleMask(x, y, cx, cy, layer3Offset, sacredR * 0.965);

  let flower1 = layer1 && c0;
  let flower2 = layer2 && (layer1 || c0);
  let flower3 = layer3 && (layer2 || layer1);

  let contour1 = layer1 && !inCircle(x, y, cx, cy, sacredR * 0.72);
  let contour2 = layer2 && !inCircle(x, y, cx, cy, sacredR * 1.52);
  let contour3 = layer3 && !inCircle(x, y, cx, cy, sacredR * 2.30);

  // 外殻リング
  let shellRing1 = inCircle(x, y, cx, cy, 500 * shellScale) &&
                   !inCircle(x, y, cx, cy, 448 * shellScale);

  let shellRing2 = inCircle(x, y, cx, cy, 430 * shellScale) &&
                   !inCircle(x, y, cx, cy, 386 * shellScale);

  let shellRing3 = inCircle(x, y, cx, cy, 360 * shellScale) &&
                   !inCircle(x, y, cx, cy, 322 * shellScale);

  // 放射
  let radial6 = abs(sin(6 * ang + t * 0.22)) > 0.976 && r > 70 && r < 520;
  let radial12 = abs(sin(12 * ang - t * 0.16)) > 0.993 && r > 100 && r < 470;
  let radial24 = abs(sin(24 * ang + t * 0.08)) > 0.998 && r > 140 && r < 430;

  // 十字軸
  let axisV = abs(x - cx) < 7 && r < 430;
  let axisH = abs(y - cy) < 7 && r < 430;

  // 量子化
  let checkerA = ((gx + gy) % 2 === 0);
  let checkerB = ((gx * 2 + gy) % 3 === 0);
  let checkerC = ((gx + gy * 2) % 5 === 0);
  let checkerD = ((gx * 3 + gy * 5) % 7 === 0);
  let checkerE = ((gx * 5 + gy * 7) % 11 === 0);

  let shape = false;

  shape = shape || coreRing1;
  shape = shape || coreRing2;
  shape = shape || coreRing3;
  shape = shape || holyDiamond1;
  shape = shape || holyDiamond2;

  if (flower1 && checkerA) shape = true;
  if (flower2 && checkerB) shape = true;
  if (flower3 && checkerC) shape = true;

  if (contour1 && checkerB) shape = true;
  if (contour2 && checkerC) shape = true;
  if (contour3 && checkerD) shape = true;

  if (shellRing1 && checkerB) shape = true;
  if (shellRing2 && checkerD) shape = true;
  if (shellRing3 && checkerE) shape = true;

  if (radial6 && checkerA) shape = true;
  if (radial12 && checkerC) shape = true;
  if (radial24 && checkerE) shape = true;

  if ((axisV || axisH) && checkerD) shape = true;

  // 中央空洞
  let coreVoid = inCircle(x, y, cx, cy, 16);
  let diamondVoid = inDiamond(x, y, cx, cy, 10, 14);
  if (coreVoid || diamondVoid) shape = false;

  // 核近傍の密度
  if (r < 96 && ((gx + gy) % 3 === 0)) shape = true;

  // 外周フリンジ
  let fringe = r > 504 && r < 555 && ((gx + gy) % 17 === 0);
  if (fringe) shape = true;

  if (r > 565 && !fringe) shape = false;

  return shape;
}

// =========================================
// 六方向円マスク
// =========================================
function sixCircleMask(x, y, cx, cy, offsetR, circleR) {
  for (let k = 0; k < 6; k++) {
    let a = -HALF_PI + k * TWO_PI / 6.0;
    let ox = cx + cos(a) * offsetR;
    let oy = cy + sin(a) * offsetR;
    if (inCircle(x, y, ox, oy, circleR)) return true;
  }
  return false;
}

// =========================================
// セル色
// =========================================
function templeCellColor(x, y, cx, cy, t, pulse) {
  let d = dist(x, y, cx, cy);
  let ang = atan2(y - cy, x - cx);

  let centerWeight = constrain(map(d, 0, 560, 1.0, 0.0), 0, 1);
  let ringWave = 0.5 + 0.5 * sin(d * 0.030 - t * 0.8);
  let angleWave = 0.5 + 0.5 * sin(6 * ang + t * 0.33);
  let fineWave = 0.5 + 0.5 * sin(12 * ang - t * 0.21);

  let base = lerpColor(violetMist, goldCol, (1.0 - centerWeight) * 0.40 + angleWave * 0.18);
  base = lerpColor(base, blueWhite, ringWave * 0.28 + fineWave * 0.10);
  base = lerpColor(base, paleGold, (1.0 - centerWeight) * 0.20);
  base = lerpColor(base, whiteCol, centerWeight * 0.70 + pulse * 0.05);

  return color(
    constrain(red(base), 0, 255),
    constrain(green(base), 0, 255),
    constrain(blue(base), 0, 255)
  );
}

// =========================================
// 黒ドットを軌道っぽく整理した描画
// =========================================
function drawOrbitalDarkDots(cx, cy, t, pulse) {
  push();
  noStroke();

  // 1. 内周メイン軌道：ドット数を増やす
  drawOrbitDots(cx, cy, {
    count: 28,
    rx: 72 + sin(t * 0.7) * 3,
    ry: 68 + sin(t * 0.6 + 0.8) * 3,
    speed: 0.42,
    phase: 0.0,
    sizeMin: 3,
    sizeMax: 6,
    alpha: 210,
    jitter: 0.015,
    alternate: true
  }, t);

  // 2. 内周サブ軌道：逆回転
  drawOrbitDots(cx, cy, {
    count: 20,
    rx: 92 + sin(t * 0.5 + 1.2) * 4,
    ry: 84 + sin(t * 0.55 + 0.5) * 4,
    speed: -0.28,
    phase: 1.1,
    sizeMin: 2,
    sizeMax: 5,
    alpha: 170,
    jitter: 0.012,
    alternate: false
  }, t);

  // 3. 中周軌道
  drawOrbitDots(cx, cy, {
    count: 24,
    rx: 142 + sin(t * 0.35) * 6,
    ry: 126 + sin(t * 0.4 + 0.4) * 6,
    speed: 0.16,
    phase: 0.7,
    sizeMin: 2,
    sizeMax: 4,
    alpha: 150,
    jitter: 0.010,
    alternate: true
  }, t);

  // 4. 6方向の楕円軌道アーム
  for (let arm = 0; arm < 6; arm++) {
    let baseA = -HALF_PI + arm * TWO_PI / 6.0;
    drawArmOrbit(cx, cy, baseA, t, arm);
  }

  // 5. ごく薄い外周流
  drawOuterStreamDots(cx, cy, t);

  pop();
}

// 楕円軌道上にドットを並べる
function drawOrbitDots(cx, cy, cfg, t) {
  for (let i = 0; i < cfg.count; i++) {
    let u = i / cfg.count;
    let a = cfg.phase + t * cfg.speed + u * TWO_PI;

    // 少しだけゆらぎを入れる
    a += sin(t * 0.33 + i * 0.7) * cfg.jitter;

    let x = cx + cos(a) * cfg.rx;
    let y = cy + sin(a) * cfg.ry;

    let sz = map(sin(t * 0.8 + i * 1.3), -1, 1, cfg.sizeMin, cfg.sizeMax);

    // 交互に少し明暗を付ける
    let alpha = cfg.alpha;
    if (cfg.alternate && i % 2 === 0) alpha *= 0.78;

    fill(18, 22, 38, alpha);
    rect(x - sz * 0.5, y - sz * 0.5, sz, sz);
  }
}

// 六方向アーム上の軌道
function drawArmOrbit(cx, cy, baseA, t, armIndex) {
  // アームごとに3本の軌道
  for (let band = 0; band < 3; band++) {
    let points = 7 + band * 2;
    let bandOffset = 172 + band * 54;
    let localPhase = t * (0.11 + band * 0.02) + armIndex * 0.35;

    for (let j = 0; j < points; j++) {
      let rr = bandOffset + j * 22 + sin(t * 0.9 + armIndex + j * 0.5) * 6;
      let a = baseA + sin(localPhase + j * 0.45) * 0.035;

      let x = cx + cos(a) * rr;
      let y = cy + sin(a) * rr;

      let s = 2 + ((j + band) % 3);
      let alpha = 90 + band * 18;

      fill(20, 24, 42, alpha);
      rect(x - s * 0.5, y - s * 0.5, s, s);
    }
  }
}

// 外周の流れ
function drawOuterStreamDots(cx, cy, t) {
  let count = 54;
  for (let i = 0; i < count; i++) {
    let u = i / count;
    let a = t * 0.045 + u * TWO_PI;

    let rx = 355 + sin(t * 0.23 + i * 0.3) * 10;
    let ry = 332 + sin(t * 0.19 + i * 0.25) * 10;

    let x = cx + cos(a) * rx;
    let y = cy + sin(a) * ry;

    let s = (i % 4 === 0) ? 3 : 2;
    fill(16, 20, 34, 52);
    rect(x - s * 0.5, y - s * 0.5, s, s);
  }
}

// =========================================
// 背景
// =========================================
function drawDeepSpace(t) {
  push();
  noStroke();

  for (let i = 0; i < 140; i++) {
    let px = (i * 97.31 + 17) % width;
    let py = (i * 57.73 + 83) % height;
    let tw = 0.5 + 0.5 * sin(t * 0.65 + i * 1.173);

    fill(255, 255, 255, 4 + tw * 12);
    rect(px, py, 2, 2);
  }

  pop();
}

// =========================================
// 背後オーラ
// =========================================
function drawTempleHaloBack(cx, cy, t, pulse) {
  push();
  noStroke();

  for (let r = 280; r > 50; r -= 12) {
    let alpha = map(r, 280, 50, 3, 16);
    fill(110, 110, 190, alpha * 0.55);
    ellipse(cx, cy, r * 2.25, r * 2.25);
  }

  for (let r = 220; r > 40; r -= 10) {
    let alpha = map(r, 220, 40, 3, 18);
    fill(180, 205, 255, alpha * 0.35);
    ellipse(cx, cy, r * 1.95, r * 1.95);
  }

  for (let r = 170; r > 30; r -= 8) {
    let alpha = map(r, 170, 30, 3, 22);
    fill(235, 215, 150, alpha * 0.22);
    ellipse(cx, cy, r * 1.65, r * 1.65);
  }

  pop();
}

// =========================================
// 外周リング
// =========================================
function drawTempleRings(cx, cy, t) {
  push();
  noFill();

  stroke(235, 215, 150, 18);
  strokeWeight(2);
  ellipse(cx, cy, 1020 + sin(t * 0.45) * 8, 1020 + sin(t * 0.45) * 8);

  stroke(190, 205, 255, 14);
  ellipse(cx, cy, 860 + sin(t * 0.62) * 6, 860 + sin(t * 0.62) * 6);

  stroke(170, 160, 220, 10);
  ellipse(cx, cy, 720 + sin(t * 0.78) * 5, 720 + sin(t * 0.78) * 5);

  pop();
}

// =========================================
// 中心核前面
// =========================================
function drawCoreFrontTemple(cx, cy, t, pulse) {
  push();

  noStroke();
  for (let r = 68; r > 14; r -= 5) {
    let alpha = map(r, 68, 14, 8, 42);
    fill(255, 248, 236, alpha);
    ellipse(cx, cy, r * 2.0, r * 2.0);
  }

  noFill();
  stroke(210, 230, 255, 44);
  strokeWeight(2);
  ellipse(cx, cy, 108 + sin(t) * 4, 108 + sin(t) * 4);
  ellipse(cx, cy, 70 + sin(t * 1.1) * 3, 70 + sin(t * 1.1) * 3);

  stroke(240, 220, 160, 30);
  ellipse(cx, cy, 90 + sin(t * 0.9) * 3, 90 + sin(t * 0.9) * 3);

  noStroke();
  let corePulse = 22 + sin(t * 1.22) * 3.5;
  fill(255, 249, 242, 245);
  ellipse(cx, cy, corePulse, corePulse);

  fill(240, 220, 160, 175);
  ellipse(cx, cy, 8 + sin(t * 1.5) * 1.2, 8 + sin(t * 1.5) * 1.2);

  fill(255, 255, 255, 180);
  ellipse(cx, cy, 3, 3);

  pop();
}

// =========================================
// ラベル
// =========================================
function drawTempleLabel() {
  push();
  noStroke();
  fill(190, 180, 150, 110);
  textSize(16);
  text("sacred core temple", 48, height - 28);
  pop();
}

// =========================================
// 幾何関数
// =========================================
function inCircle(x, y, cx, cy, r) {
  let dx = x - cx;
  let dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function inDiamond(x, y, cx, cy, w, h) {
  return abs(x - cx) / w + abs(y - cy) / h <= 1;
}

// =========================================
// キー操作
// =========================================
function keyPressed() {
  if (key === 's' || key === 'S') {
    saveCanvas('sacred_core_temple_orbital_darkdots', 'png');
  }

  if (key === 'p' || key === 'P') {
    if (isLooping()) noLoop();
    else loop();
  }

  if (key === '1') {
    cell = 6;
    cols = floor(width / cell);
    rows = floor(height / cell);
  }

  if (key === '2') {
    cell = 5;
    cols = floor(width / cell);
    rows = floor(height / cell);
  }

  if (key === '3') {
    cell = 8;
    cols = floor(width / cell);
    rows = floor(height / cell);
  }
}
