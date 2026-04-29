// =========================================
// A. Sacred Geometry Forward Version
// sketch.js
// 神聖幾何学を前面に出した版
// =========================================

let cell = 8;
let cols, rows;

let bgCol;
let paperCol;
let frameCol;

let baseCX, baseCY;

function setup() {
  createCanvas(1200, 1500);
  frameRate(30);

  cols = floor(width / cell);
  rows = floor(height / cell);

  bgCol = color(216, 210, 199);
  paperCol = color(244, 239, 228);
  frameCol = color(176, 165, 147);

  baseCX = width * 0.5;
  baseCY = height * 0.54;

  rectMode(CORNER);
  noStroke();
}

function draw() {
  background(bgCol);

  let marginX = width * 0.055;
  let marginY = height * 0.055;
  let artX = marginX;
  let artY = marginY;
  let artW = width - marginX * 2;
  let artH = height - marginY * 2;

  fill(paperCol);
  rect(artX, artY, artW, artH);

  noFill();
  stroke(frameCol);
  strokeWeight(2);
  rect(artX + 14, artY + 14, artW - 28, artH - 28);

  let t = frameCount * 0.018;
  let breath = sin(t);
  let pulse = 0.5 + 0.5 * sin(t);

  let cx = baseCX + sin(t * 0.22) * 1.2;
  let cy = baseCY + cos(t * 0.18) * 1.2;

  noStroke();

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      let x = gx * cell;
      let y = gy * cell;
      let px = x + cell * 0.5;
      let py = y + cell * 0.5;

      if (
        px < artX + 42 ||
        px > artX + artW - 42 ||
        py < artY + 42 ||
        py > artY + artH - 72
      ) continue;

      if (sacredGeometryPattern(px, py, cx, cy, t, breath)) {
        fill(sacredColor(px, py, cx, cy, t, pulse));
        rect(x, y, cell, cell);
      }
    }
  }

  drawSacredAura(cx, cy, t, pulse);
  drawLabel(artX, artY, artW, artH, "sacred geometry study");
}

function sacredGeometryPattern(x, y, cx, cy, t, breath) {
  let dx = x - cx;
  let dy = y - cy;
  let r = sqrt(dx * dx + dy * dy);
  let ang = atan2(dy, dx);

  let gx = floor(x / cell);
  let gy = floor(y / cell);

  let mainR = 120 * (1.0 + sin(t * 0.9) * 0.018);
  let ring1Offset = 120;
  let ring2Offset = 240;
  let ring3Offset = 360;

  // 中心円
  let c0 = inCircle(x, y, cx, cy, mainR);

  // 六方向リング
  let layer1 = sixCircleMask(x, y, cx, cy, ring1Offset, mainR);
  let layer2 = sixCircleMask(x, y, cx, cy, ring2Offset, mainR);
  let layer3 = sixCircleMask(x, y, cx, cy, ring3Offset, mainR * 0.96);

  // 花弁交差
  let flower1 = layer1 && c0;
  let flower2 = layer2 && (layer1 || c0);
  let flower3 = layer3 && (layer2 || layer1);

  // リング帯
  let ringA = inCircle(x, y, cx, cy, 450) && !inCircle(x, y, cx, cy, 365);
  let ringB = inCircle(x, y, cx, cy, 330) && !inCircle(x, y, cx, cy, 245);
  let ringC = inCircle(x, y, cx, cy, 150) && !inCircle(x, y, cx, cy, 72);

  // 六芒星に近い軸性
  let starDiamond1 = inDiamond(x, y, cx, cy, 250, 325);
  let starDiamond2 = inDiamond(x, y, cx, cy, 150, 195);
  let starRing = starDiamond1 && !starDiamond2;

  // 放射構造
  let radial6 = abs(sin(6 * ang + t * 0.22)) > 0.972 && r > 88 && r < 445;
  let radial12 = abs(sin(12 * ang - t * 0.17)) > 0.992 && r > 120 && r < 420;

  // 同心構造を強める
  let contour1 = layer1 && !inCircle(x, y, cx, cy, mainR * 0.68);
  let contour2 = layer2 && !inCircle(x, y, cx, cy, mainR * 1.55);
  let contour3 = layer3 && !inCircle(x, y, cx, cy, mainR * 2.25);

  // 中心聖域
  let coreOuter = inCircle(x, y, cx, cy, 118 * (1.0 + breath * 0.03));
  let coreInner = inCircle(x, y, cx, cy, 66 * (1.0 + breath * 0.03));
  let coreRing = coreOuter && !coreInner;

  let holyDiamondOuter = inDiamond(x, y, cx, cy, 86, 116);
  let holyDiamondInner = inDiamond(x, y, cx, cy, 36, 48);
  let holyDiamondRing = holyDiamondOuter && !holyDiamondInner;

  let checkerA = ((gx + gy) % 2 === 0);
  let checkerB = ((gx * 2 + gy) % 3 === 0);
  let checkerC = ((gx + gy * 2) % 5 === 0);
  let checkerD = ((gx * 3 + gy * 5) % 7 === 0);

  let shape = false;

  shape = shape || ringA || ringB || ringC;
  shape = shape || starRing;
  shape = shape || coreRing;
  shape = shape || holyDiamondRing;

  if (flower1 && checkerA) shape = true;
  if (flower2 && checkerB) shape = true;
  if (flower3 && checkerC) shape = true;

  if (contour1 && checkerB) shape = true;
  if (contour2 && checkerC) shape = true;
  if (contour3 && checkerD) shape = true;

  if (radial6 && checkerA) shape = true;
  if (radial12 && checkerC) shape = true;

  // 横十字は弱く、神聖幾何学主体
  let axisV = abs(x - cx) < 10 && r < 410;
  let axisH = abs(y - cy) < 10 && r < 410;
  if ((axisV || axisH) && checkerD) shape = true;

  // 中央白抜き
  let voidCircle = inCircle(x, y, cx, cy, 34);
  let voidDiamond = inDiamond(x, y, cx, cy, 24, 32);
  if (voidCircle || voidDiamond) shape = false;

  // 外周の孤立セルは少なめ
  let fringe = r > 452 && r < 495 && ((gx + gy) % 11 === 0);
  if (fringe) shape = true;

  let halo = r < 505;
  if (!halo && !fringe) shape = false;

  return shape;
}

function sixCircleMask(x, y, cx, cy, offsetR, circleR) {
  let inside = false;
  for (let k = 0; k < 6; k++) {
    let a = -HALF_PI + k * TWO_PI / 6.0;
    let ox = cx + cos(a) * offsetR;
    let oy = cy + sin(a) * offsetR;
    if (inCircle(x, y, ox, oy, circleR)) {
      inside = true;
      break;
    }
  }
  return inside;
}

function sacredColor(x, y, cx, cy, t, pulse) {
  let d = dist(x, y, cx, cy);
  let a = constrain(map(d, 0, 505, 0, 1), 0, 1);

  let c1 = color(178, 0, 0);
  let c2 = color(240, 60, 18);
  let base = lerpColor(c1, c2, a);

  let wave1 = sin((x - cx) * 0.016 + (y - cy) * 0.010 + t * 0.45);
  let wave2 = cos((x - cx) * 0.009 - (y - cy) * 0.012 - t * 0.25);
  let shimmer = map(wave1 + wave2, -2, 2, -6, 9);
  let breathLift = map(pulse, 0, 1, -1, 6);

  return color(
    constrain(red(base) + shimmer + breathLift, 0, 255),
    constrain(green(base) + shimmer * 0.10 + breathLift * 0.07, 0, 255),
    constrain(blue(base), 0, 255)
  );
}

function drawSacredAura(cx, cy, t, pulse) {
  push();
  noStroke();

  let auraScale = 1.0 + sin(t) * 0.05;

  for (let r = 96; r > 18; r -= 6) {
    let alpha = map(r, 96, 18, 5, 22);
    fill(255, 252, 244, alpha);
    ellipse(cx, cy, r * 2.25 * auraScale, r * 1.55 * auraScale);
  }

  fill(255, 248, 240, 40);
  let corePulse = 22 + sin(t * 1.2) * 4;
  ellipse(cx, cy, corePulse, corePulse);

  noFill();
  stroke(220, 235, 255, 20);
  strokeWeight(2);
  ellipse(cx, cy, 60 + sin(t) * 3, 42 + sin(t) * 2);

  pop();
}

function drawLabel(artX, artY, artW, artH, label) {
  push();
  noStroke();
  fill(90, 80, 72, 160);
  textSize(17);
  text("129 / 150", artX + 86, artY + artH - 36);
  text("’26", artX + artW - 210, artY + artH - 36);
  text(label, artX + artW - 240, artY + artH - 36);
  pop();
}

function inCircle(x, y, cx, cy, r) {
  let dx = x - cx;
  let dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function inDiamond(x, y, cx, cy, w, h) {
  return abs(x - cx) / w + abs(y - cy) / h <= 1;
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveCanvas('sacred_geometry_forward', 'png');
  }
  if (key === 'p' || key === 'P') {
    if (isLooping()) noLoop();
    else loop();
  }
}
