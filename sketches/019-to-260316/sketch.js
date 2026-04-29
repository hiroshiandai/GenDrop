// =========================================
// Sacred Core Temple
// p5.js / full sketch.js
// 黒背景・白金・中心核主役・神聖幾何学完成版
// =========================================

let cell = 6;
let cols, rows;

let bgCol;
let whiteCol;
let goldCol;
let paleGold;
let blueWhite;
let violetMist;

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

  // ---------------------------------
  // 中心核
  // ---------------------------------
  let coreRing1 = inCircle(x, y, cx, cy, 160 * coreScale) &&
                  !inCircle(x, y, cx, cy, 118 * coreScale);

  let coreRing2 = inCircle(x, y, cx, cy, 112 * coreScale) &&
                  !inCircle(x, y, cx, cy, 76 * coreScale);

  let coreRing3 = inCircle(x, y, cx, cy, 68 * coreScale) &&
                  !inCircle(x, y, cx, cy, 34 * coreScale);

  let holyDiamond1 = inDiamond(x, y, cx, cy, 118 * coreScale, 156 * coreScale) &&
                     !inDiamond(x, y, cx, cy, 72 * coreScale, 96 * coreScale);

  let holyDiamond2 = inDiamond(x, y, cx, cy, 54 * coreScale, 72 * coreScale) &&
                     !inDiamond(x, y, cx, cy, 22 * coreScale, 30 * coreScale);

  // ---------------------------------
  // Flower of Life 構造
  // ---------------------------------
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

  // ---------------------------------
  // 外殻リング
  // ---------------------------------
  let shellRing1 = inCircle(x, y, cx, cy, 500 * shellScale) &&
                   !inCircle(x, y, cx, cy, 448 * shellScale);

  let shellRing2 = inCircle(x, y, cx, cy, 430 * shellScale) &&
                   !inCircle(x, y, cx, cy, 386 * shellScale);

  let shellRing3 = inCircle(x, y, cx, cy, 360 * shellScale) &&
                   !inCircle(x, y, cx, cy, 322 * shellScale);

  // ---------------------------------
  // 六方向・十二方向の放射
  // ---------------------------------
  let radial6 = abs(sin(6 * ang + t * 0.22)) > 0.976 && r > 70 && r < 520;
  let radial12 = abs(sin(12 * ang - t * 0.16)) > 0.993 && r > 100 && r < 470;
  let radial24 = abs(sin(24 * ang + t * 0.08)) > 0.998 && r > 140 && r < 430;

  // ---------------------------------
  // 十字軸はごく細く
  // ---------------------------------
  let axisV = abs(x - cx) < 7 && r < 430;
  let axisH = abs(y - cy) < 7 && r < 430;

  // ---------------------------------
  // チェッカー量子化
  // ---------------------------------
  let checkerA = ((gx + gy) % 2 === 0);
  let checkerB = ((gx * 2 + gy) % 3 === 0);
  let checkerC = ((gx + gy * 2) % 5 === 0);
  let checkerD = ((gx * 3 + gy * 5) % 7 === 0);
  let checkerE = ((gx * 5 + gy * 7) % 11 === 0);

  let shape = false;

  // 中心核を最優先
  shape = shape || coreRing1;
  shape = shape || coreRing2;
  shape = shape || coreRing3;
  shape = shape || holyDiamond1;
  shape = shape || holyDiamond2;

  // Flower of Life
  if (flower1 && checkerA) shape = true;
  if (flower2 && checkerB) shape = true;
  if (flower3 && checkerC) shape = true;

  if (contour1 && checkerB) shape = true;
  if (contour2 && checkerC) shape = true;
  if (contour3 && checkerD) shape = true;

  // 外殻
  if (shellRing1 && checkerB) shape = true;
  if (shellRing2 && checkerD) shape = true;
  if (shellRing3 && checkerE) shape = true;

  // 放射
  if (radial6 && checkerA) shape = true;
  if (radial12 && checkerC) shape = true;
  if (radial24 && checkerE) shape = true;

  // 十字軸
  if ((axisV || axisH) && checkerD) shape = true;

  // 中央空洞
  let coreVoid = inCircle(x, y, cx, cy, 24);
  let diamondVoid = inDiamond(x, y, cx, cy, 16, 22);
  if (coreVoid || diamondVoid) shape = false;

  // 核近傍の密度上げ
  if (r < 125 && ((gx + gy) % 3 === 0)) shape = true;

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
  base = lerpColor(base, whiteCol, centerWeight * 0.74 + pulse * 0.06);

  return color(
    constrain(red(base), 0, 255),
    constrain(green(base), 0, 255),
    constrain(blue(base), 0, 255)
  );
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
// 外周リングの薄い描画
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
  for (let r = 96; r > 18; r -= 6) {
    let alpha = map(r, 96, 18, 8, 42);
    fill(255, 248, 236, alpha);
    ellipse(cx, cy, r * 2.18, r * 2.18);
  }

  noFill();
  stroke(210, 230, 255, 44);
  strokeWeight(2);
  ellipse(cx, cy, 140 + sin(t) * 5, 140 + sin(t) * 5);
  ellipse(cx, cy, 88 + sin(t * 1.1) * 3, 88 + sin(t * 1.1) * 3);

  stroke(240, 220, 160, 30);
  ellipse(cx, cy, 116 + sin(t * 0.9) * 4, 116 + sin(t * 0.9) * 4);

  noStroke();
  let corePulse = 34 + sin(t * 1.22) * 5;
  fill(255, 249, 242, 245);
  ellipse(cx, cy, corePulse, corePulse);

  fill(240, 220, 160, 175);
  ellipse(cx, cy, 12 + sin(t * 1.5) * 1.6, 12 + sin(t * 1.5) * 1.6);

  fill(255, 255, 255, 180);
  ellipse(cx, cy, 4, 4);

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
    saveCanvas('sacred_core_temple', 'png');
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
