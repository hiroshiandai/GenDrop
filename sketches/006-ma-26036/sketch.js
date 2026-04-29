let cycleDuration = 92.0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(RADIANS);
  noFill();
  strokeCap(ROUND);
}

function draw() {
  background(0);

  const cx = width / 2;
  const cy = height / 2;
  const t = (millis() / 1000.0) % cycleDuration;

  const phase1End = 22.0; // 鼓動
  const phase2End = 40.0; // 幾何学出現
  const phase3End = 66.0; // 回転安定
  const phase4End = 80.0; // 回転減衰
  const phase5End = 92.0; // 原点へ戻る

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
    rotationStrength = 0.06 * geometryAppear;
    geometryFade = 0;
  } else if (t < phase3End) {
    pulseOnly = 1;
    geometryAppear = 1;
    rotationStrength = 1.0;
    geometryFade = 0;
  } else if (t < phase4End) {
    pulseOnly = 1;
    geometryAppear = 1;
    rotationStrength = 1.0 - easeInOutSine((t - phase3End) / (phase4End - phase3End));
    geometryFade = 0.28 * easeInOutSine((t - phase3End) / (phase4End - phase3End));
  } else {
    const p = easeInOutSine((t - phase4End) / (phase5End - phase4End));
    pulseOnly = 1.0 - 0.22 * p;
    geometryAppear = 1.0 - p;
    rotationStrength = 0;
    geometryFade = p;
  }

  drawVerySubtleSpaceGlow(cx, cy);

  if (geometryAppear > 0.001) {
    push();
    translate(cx, cy);

    // 回転はかなりゆっくり
    const maxRotSpeed = 0.00145;
    const rot = millis() * maxRotSpeed * rotationStrength;
    rotate(rot);

    drawMandala(geometryAppear, geometryFade, t);

    pop();
  }

  // 最後に中心星を描く
  drawCenterStar(cx, cy, t, pulseOnly);
}

// =====================================
// 中心の星（鼓動をさらに遅く）
// =====================================
function drawCenterStar(cx, cy, t, intensity) {
  // 鼓動をさらに遅く
  const pulseCycle = 20.0;
  const p = 0.5 - 0.5 * cos(TWO_PI * ((t % pulseCycle) / pulseCycle));
  const pulse = pow(p, 1.9);

  // 中心は小さく保つ
  const coreSize = lerp(1.5, 3.0, pulse);
  const coreAlpha = lerp(185, 255, pulse) * lerp(0.9, 1.0, intensity);

  // ハローは控えめ
  const halo1Size = lerp(6, 11, pulse);
  const halo1Alpha = lerp(10, 24, pulse);

  const halo2Size = lerp(12, 20, pulse);
  const halo2Alpha = lerp(2, 7, pulse);

  noStroke();

  fill(255, halo2Alpha);
  circle(cx, cy, halo2Size);

  fill(255, halo1Alpha);
  circle(cx, cy, halo1Size);

  fill(255, coreAlpha);
  circle(cx, cy, coreSize);

  // 星らしい鋭さ
  stroke(255, 100);
  strokeWeight(0.7);
  line(cx - 5, cy, cx + 5, cy);
  line(cx, cy - 5, cx, cy + 5);
}

// =====================================
// 背景の微かな宇宙感
// =====================================
function drawVerySubtleSpaceGlow(cx, cy) {
  noStroke();

  fill(40, 60, 120, 1.0);
  circle(cx, cy, width * 0.10);

  fill(70, 40, 120, 0.45);
  circle(cx, cy, width * 0.18);
}

// =====================================
// 曼荼羅全体
// =====================================
function drawMandala(appear, fade, t) {
  const alphaBase = 1.0 - fade;

  const c1 = color(90, 120, 255, 120 * appear * alphaBase);
  const c2 = color(120, 70, 255, 95 * appear * alphaBase);
  const c3 = color(170, 120, 255, 55 * appear * alphaBase);

  // 中心の呼吸と微同期
  const pulseCycle = 20.0;
  const p = 0.5 - 0.5 * cos(TWO_PI * ((t % pulseCycle) / pulseCycle));
  const breathe = lerp(0.985, 1.025, p);

  scale(breathe);

  drawRadialBeams(c1, c2, appear, alphaBase);
  drawConcentricRings(c2, appear, alphaBase);
  drawPetalLayer(c1, c2, appear, alphaBase);
  drawPolygonLayer(c3, appear, alphaBase);
}

// =====================================
// 放射線（太く・強く）
// =====================================
function drawRadialBeams(c1, c2, appear, alphaBase) {
  push();

  const count = 24;
  const innerR = 9;
  const outerR = 205 * appear;

  for (let i = 0; i < count; i++) {
    const a = TWO_PI * i / count;
    const x1 = cos(a) * innerR;
    const y1 = sin(a) * innerR;
    const x2 = cos(a) * outerR;
    const y2 = sin(a) * outerR;

    // 外側グロー線
    stroke(
      lerp(red(c1), red(c2), 0.35),
      lerp(green(c1), green(c2), 0.35),
      lerp(blue(c1), blue(c2), 0.35),
      26 * appear * alphaBase
    );
    strokeWeight(4.4);
    line(x1, y1, x2, y2);

    // 中心線
    stroke(
      red(c1),
      green(c1),
      blue(c1),
      95 * appear * alphaBase
    );
    strokeWeight(1.7);
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

    // 柔らかい外側
    stroke(red(c2), green(c2), blue(c2), 20 * appear * alphaBase);
    strokeWeight(2.0);
    ellipse(0, 0, rr * 2, rr * 2);

    // シャープな内側
    stroke(red(c2), green(c2), blue(c2), 62 * appear * alphaBase);
    strokeWeight(0.9);
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
      18 * alphaBase
    );
    strokeWeight(2.2);

    beginShape();
    for (let t = 0; t <= PI; t += PI / 28) {
      const x = cos(t) * petalRadius * 0.52;
      const y = sin(t) * petalRadius * 0.23;
      vertex(x, y);
    }
    for (let t = PI; t >= 0; t -= PI / 28) {
      const x = cos(t) * petalRadius * 0.52;
      const y = -sin(t) * petalRadius * 0.23;
      vertex(x, y);
    }
    endShape(CLOSE);

    // シャープ線
    stroke(
      lerp(red(c1), red(c2), 0.5),
      lerp(green(c1), green(c2), 0.5),
      lerp(blue(c1), blue(c2), 0.5),
      62 * alphaBase
    );
    strokeWeight(0.9);

    beginShape();
    for (let t = 0; t <= PI; t += PI / 28) {
      const x = cos(t) * petalRadius * 0.52;
      const y = sin(t) * petalRadius * 0.23;
      vertex(x, y);
    }
    for (let t = PI; t >= 0; t -= PI / 28) {
      const x = cos(t) * petalRadius * 0.52;
      const y = -sin(t) * petalRadius * 0.23;
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
    stroke(red(c3), green(c3), blue(c3), 18 * appear * alphaBase);
    strokeWeight(2.0);
    drawPolygon(0, 0, radii[i] * appear, sidesList[i], -HALF_PI);

    stroke(red(c3), green(c3), blue(c3), 60 * appear * alphaBase);
    strokeWeight(0.85);
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
