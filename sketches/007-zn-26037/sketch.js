let cycleDuration = 104.0;

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

  // 時間構成
  const phase1End = 26.0; // 原点の鼓動
  const phase2End = 46.0; // 幾何学出現
  const phase3End = 74.0; // 回転安定
  const phase4End = 90.0; // 回転減衰
  const phase5End = 104.0; // 原点へ戻る

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

  drawDeepSpacePresence(cx, cy);

  if (geometryAppear > 0.001) {
    push();
    translate(cx, cy);

    // 回転をさらに静かに
    const maxRotSpeed = 0.00105;
    const rot = millis() * maxRotSpeed * rotationStrength;
    rotate(rot);

    drawMandala(geometryAppear, geometryFade, t);

    pop();
  }

  // 最後に中心星
  drawCenterStar(cx, cy, t, pulseOnly);
}

// =====================================
// 中心の星（より遅く、神秘的に）
// =====================================
function drawCenterStar(cx, cy, t, intensity) {
  const pulseCycle = 24.0; // さらに遅く
  const p = 0.5 - 0.5 * cos(TWO_PI * ((t % pulseCycle) / pulseCycle));
  const pulse = pow(p, 2.2);

  // 中心はあくまで小さく鋭く
  const coreSize = lerp(1.35, 2.9, pulse);
  const coreAlpha = lerp(188, 255, pulse) * lerp(0.92, 1.0, intensity);

  // ハローはごく近傍のみ
  const halo1Size = lerp(5.5, 9.5, pulse);
  const halo1Alpha = lerp(8, 20, pulse);

  const halo2Size = lerp(10, 17, pulse);
  const halo2Alpha = lerp(1.5, 5.5, pulse);

  noStroke();

  fill(255, halo2Alpha);
  circle(cx, cy, halo2Size);

  fill(255, halo1Alpha);
  circle(cx, cy, halo1Size);

  fill(255, coreAlpha);
  circle(cx, cy, coreSize);

  // 星の微かな十字スパーク
  stroke(255, lerp(55, 105, pulse));
  strokeWeight(0.75);
  line(cx - 6, cy, cx + 6, cy);
  line(cx, cy - 6, cx, cy + 6);

  // ごく微かな斜めスパーク
  stroke(255, lerp(12, 26, pulse));
  strokeWeight(0.45);
  line(cx - 3.2, cy - 3.2, cx + 3.2, cy + 3.2);
  line(cx - 3.2, cy + 3.2, cx + 3.2, cy - 3.2);
}

// =====================================
// 深い宇宙の気配
// =====================================
function drawDeepSpacePresence(cx, cy) {
  noStroke();

  fill(28, 42, 90, 0.85);
  circle(cx, cy, width * 0.08);

  fill(52, 34, 96, 0.35);
  circle(cx, cy, width * 0.14);
}

// =====================================
// 曼荼羅全体
// =====================================
function drawMandala(appear, fade, t) {
  const alphaBase = 1.0 - fade;

  const c1 = color(90, 125, 255, 132 * appear * alphaBase);
  const c2 = color(130, 70, 255, 102 * appear * alphaBase);
  const c3 = color(180, 125, 255, 58 * appear * alphaBase);

  // 星の鼓動と微同期
  const pulseCycle = 24.0;
  const p = 0.5 - 0.5 * cos(TWO_PI * ((t % pulseCycle) / pulseCycle));
  const breathe = lerp(0.988, 1.028, p);

  scale(breathe);

  drawRadialBeams(c1, c2, appear, alphaBase);
  drawConcentricRings(c2, appear, alphaBase);
  drawPetalLayer(c1, c2, appear, alphaBase);
  drawPolygonLayer(c3, appear, alphaBase);
}

// =====================================
// 放射線（さらに太く強く）
// =====================================
function drawRadialBeams(c1, c2, appear, alphaBase) {
  push();

  const count = 24;
  const innerR = 8;
  const outerR = 218 * appear;

  for (let i = 0; i < count; i++) {
    const a = TWO_PI * i / count;
    const x1 = cos(a) * innerR;
    const y1 = sin(a) * innerR;
    const x2 = cos(a) * outerR;
    const y2 = sin(a) * outerR;

    // 広い光のにじみ
    stroke(
      lerp(red(c1), red(c2), 0.35),
      lerp(green(c1), green(c2), 0.35),
      lerp(blue(c1), blue(c2), 0.35),
      22 * appear * alphaBase
    );
    strokeWeight(6.2);
    line(x1, y1, x2, y2);

    // 中間のグロー
    stroke(
      lerp(red(c1), red(c2), 0.15),
      lerp(green(c1), green(c2), 0.15),
      lerp(blue(c1), blue(c2), 0.15),
      38 * appear * alphaBase
    );
    strokeWeight(3.1);
    line(x1, y1, x2, y2);

    // 芯
    stroke(
      red(c1),
      green(c1),
      blue(c1),
      102 * appear * alphaBase
    );
    strokeWeight(1.35);
    line(x1, y1, x2, y2);
  }

  pop();
}

// =====================================
// 同心円
// =====================================
function drawConcentricRings(c2, appear, alphaBase) {
  push();
  noFill();

  const radii = [18, 34, 56, 84, 118, 158];

  for (let i = 0; i < radii.length; i++) {
    const rr = radii[i] * appear;

    // 外側グロー
    stroke(red(c2), green(c2), blue(c2), 16 * appear * alphaBase);
    strokeWeight(2.4);
    ellipse(0, 0, rr * 2, rr * 2);

    // 芯線
    stroke(red(c2), green(c2), blue(c2), 60 * appear * alphaBase);
    strokeWeight(0.8);
    ellipse(0, 0, rr * 2, rr * 2);
  }

  pop();
}

// =====================================
// 花弁状レイヤー
// =====================================
function drawPetalLayer(c1, c2, appear, alphaBase) {
  push();

  const petals = 12;
  const petalRadius = 48 * appear;

  for (let i = 0; i < petals; i++) {
    const a = TWO_PI * i / petals;
    push();
    rotate(a);

    // グロー
    stroke(
      lerp(red(c1), red(c2), 0.5),
      lerp(green(c1), green(c2), 0.5),
      lerp(blue(c1), blue(c2), 0.5),
      16 * alphaBase
    );
    strokeWeight(2.0);

    beginShape();
    for (let t = 0; t <= PI; t += PI / 28) {
      const x = cos(t) * petalRadius * 0.54;
      const y = sin(t) * petalRadius * 0.24;
      vertex(x, y);
    }
    for (let t = PI; t >= 0; t -= PI / 28) {
      const x = cos(t) * petalRadius * 0.54;
      const y = -sin(t) * petalRadius * 0.24;
      vertex(x, y);
    }
    endShape(CLOSE);

    // 芯線
    stroke(
      lerp(red(c1), red(c2), 0.5),
      lerp(green(c1), green(c2), 0.5),
      lerp(blue(c1), blue(c2), 0.5),
      60 * alphaBase
    );
    strokeWeight(0.82);

    beginShape();
    for (let t = 0; t <= PI; t += PI / 28) {
      const x = cos(t) * petalRadius * 0.54;
      const y = sin(t) * petalRadius * 0.24;
      vertex(x, y);
    }
    for (let t = PI; t >= 0; t -= PI / 28) {
      const x = cos(t) * petalRadius * 0.54;
      const y = -sin(t) * petalRadius * 0.24;
      vertex(x, y);
    }
    endShape(CLOSE);

    pop();
  }

  pop();
}

// =====================================
// 多角形レイヤー
// =====================================
function drawPolygonLayer(c3, appear, alphaBase) {
  push();
  noFill();

  const sidesList = [6, 8, 12];
  const radii = [14, 26, 40];

  for (let i = 0; i < sidesList.length; i++) {
    stroke(red(c3), green(c3), blue(c3), 14 * appear * alphaBase);
    strokeWeight(1.8);
    drawPolygon(0, 0, radii[i] * appear, sidesList[i], -HALF_PI);

    stroke(red(c3), green(c3), blue(c3), 54 * appear * alphaBase);
    strokeWeight(0.75);
    drawPolygon(0, 0, radii[i] * appear, sidesList[i], -HALF_PI);
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

function easeInOutSine(x) {
  return -(cos(PI * x) - 1) / 2;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
