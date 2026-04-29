let LOOP_SEC = 56.0;
let baseScale;
let zoomStart = 1.0;
let zoomEnd = 2.45;

function setup() {
  createCanvas(1080, 1920);
  pixelDensity(1);
  smooth();
  baseScale = min(width, height) * 0.34;
}

function draw() {
  background(0);

  let t = (millis() / 1000.0) % LOOP_SEC;
  let p = t / LOOP_SEC;

  translate(width / 2, height / 2 - 30);

  // 全体ズーム（後半でかなり寄る）
  let zoomAmt = easeInOutCubic(constrain(map(t, 0, 52, 0, 1), 0, 1));
  let zoom = lerp(zoomStart, zoomEnd, zoomAmt);
  scale(zoom);

  // 色相：冷たい白灰 → 金色 → 濃い橙
  let cold = color(210, 215, 225, 110);
  let warm = color(255, 180, 60, 120);
  let deep = color(220, 110, 20, 90);

  let warmMix = constrain(map(t, 4, 24, 0, 1), 0, 1);
  let cMain = lerpColor(cold, warm, warmMix);
  let cDeep = lerpColor(cold, deep, constrain(map(t, 10, 34, 0, 1), 0, 1));

  blendMode(ADD);

  // 微細な全体グロー
  drawBackgroundGlow(baseScale * 1.35, cDeep, t);

  // ステージ1：最初の放射線
  if (t < 8) {
    let appear = easeOutCubic(constrain(map(t, 0, 5, 0, 1), 0, 1));
    let spokes = floor(lerp(24, 44, appear));
    let r = baseScale * lerp(0.95, 1.15, appear);
    let alpha = lerp(40, 95, appear);
    drawSpokes(r, spokes, color(220, 225, 235, alpha), 1.0);
    drawCenterCore(baseScale * 0.045, color(255, 255, 255, 220), t);
  }

  // ステージ2以降：外周のサークル
  if (t >= 3) {
    let ringA = constrain(map(t, 3, 10, 0, 1), 0, 1);
    drawOuterHalo(baseScale * lerp(0.9, 1.18, ringA), cMain, 180 * ringA);
  }

  // 星型レイヤー群
  if (t >= 4) {
    let starIn = easeInOutCubic(constrain(map(t, 4, 12, 0, 1), 0, 1));
    let starAlpha = lerp(0, 85, starIn);

    for (let i = 0; i < 5; i++) {
      let rr = baseScale * lerp(0.72, 1.08, i / 4);
      let step = 5 + i * 2;
      let points = 120 + i * 28;
      let rot = t * 0.06 * (i % 2 === 0 ? 1 : -1) + i * 0.22;
      let cc = color(red(cMain), green(cMain), blue(cMain), starAlpha * (1.0 - i * 0.1));
      drawStarPolygon(rr, points, step, rot, cc, 1);
    }
  }

  // 密な幾何学メッシュ球体
  if (t >= 7) {
    let meshIn = easeInOutCubic(constrain(map(t, 7, 18, 0, 1), 0, 1));
    let meshR = baseScale * lerp(0.28, 0.62, meshIn);

    drawOrbitalMesh(
      meshR,
      floor(lerp(16, 44, meshIn)),
      floor(lerp(28, 90, meshIn)),
      lerpColor(cMain, cDeep, 0.35),
      t
    );

    drawConcentricRosette(
      meshR * 1.05,
      floor(lerp(6, 22, meshIn)),
      lerpColor(cold, warm, meshIn),
      t
    );
  }

  // 大きな花弁状スター
  if (t >= 14) {
    let petalIn = easeInOutCubic(constrain(map(t, 14, 28, 0, 1), 0, 1));
    let petalAlpha = lerp(0, 70, petalIn);

    for (let k = 0; k < 4; k++) {
      let rr = baseScale * (1.02 + k * 0.075);
      let points = 240;
      let step = 19 + k * 3;
      let rot = -t * (0.03 + k * 0.01) + k * 0.17;
      let cc = color(255, 175, 55, petalAlpha * (0.95 - k * 0.15));
      drawStarPolygon(rr, points, step, rot, cc, 1);
    }
  }

  // 中央球体の密度上昇
  if (t >= 18) {
    let denseIn = easeInOutCubic(constrain(map(t, 18, 36, 0, 1), 0, 1));
    let denseR = baseScale * lerp(0.46, 0.82, denseIn);
    let cc = color(255, 150, 35, lerp(18, 48, denseIn));

    for (let i = 0; i < 8; i++) {
      let rot = t * 0.03 * (i % 2 === 0 ? 1 : -1) + i * 0.11;
      drawSphereLattice(
        denseR * (0.78 + i * 0.035),
        72 + i * 10,
        0.55 + i * 0.08,
        rot,
        cc
      );
    }
  }

  // きめ細かい外縁粒子感
  if (t >= 20) {
    let hazeIn = constrain(map(t, 20, 34, 0, 1), 0, 1);
    drawRadialDust(baseScale * 1.28, floor(lerp(600, 2200, hazeIn)), t);
  }

  // 最終的な中央核
  drawCenterCore(baseScale * 0.06, color(255, 190, 70, 200), t);

  blendMode(BLEND);
}

// --------------------------------------------------
// 描画関数
// --------------------------------------------------

function drawSpokes(r, count, col, weight = 1) {
  stroke(col);
  strokeWeight(weight);
  noFill();

  for (let i = 0; i < count; i++) {
    let a = TWO_PI * i / count;
    let x = cos(a) * r;
    let y = sin(a) * r;
    line(0, 0, x, y);
  }
}

function drawOuterHalo(r, col, alphaAmt) {
  noFill();

  for (let i = 0; i < 7; i++) {
    let rr = r + i * 6;
    stroke(red(col), green(col), blue(col), alphaAmt * (0.20 - i * 0.02));
    strokeWeight(1);
    circle(0, 0, rr * 2);
  }
}

function drawStarPolygon(r, points, step, rot, col, repeatCount = 1) {
  stroke(col);
  strokeWeight(0.7);
  noFill();

  for (let n = 0; n < repeatCount; n++) {
    let ro = rot + n * 0.02;

    for (let i = 0; i < points; i++) {
      let a1 = TWO_PI * i / points + ro;
      let a2 = TWO_PI * ((i + step) % points) / points + ro;

      let x1 = cos(a1) * r;
      let y1 = sin(a1) * r;
      let x2 = cos(a2) * r;
      let y2 = sin(a2) * r;
      line(x1, y1, x2, y2);
    }
  }
}

function drawConcentricRosette(maxR, rings, col, t) {
  noFill();

  for (let j = 1; j <= rings; j++) {
    let rr = maxR * j / rings;
    let petals = 6 + j * 2;
    let alpha = map(j, 1, rings, 18, 48);
    stroke(red(col), green(col), blue(col), alpha);
    strokeWeight(0.6);

    beginShape();
    let samples = 260;
    for (let i = 0; i <= samples; i++) {
      let a = TWO_PI * i / samples;
      let mod = 1.0 + 0.075 * sin(petals * a + t * 0.3 + j * 0.25);
      let x = cos(a) * rr * mod;
      let y = sin(a) * rr * mod;
      vertex(x, y);
    }
    endShape();
  }
}

function drawOrbitalMesh(r, rings, ptsPerRing, col, t) {
  noFill();
  strokeWeight(0.55);

  for (let ring = 1; ring <= rings; ring++) {
    let rr = r * ring / rings;
    let pts = ptsPerRing + floor(ring * 0.7);
    let offset = t * 0.12 + ring * 0.17;

    stroke(red(col), green(col), blue(col), map(ring, 1, rings, 10, 42));

    let arr = [];
    for (let i = 0; i < pts; i++) {
      let a = TWO_PI * i / pts + offset;
      let wobble = 1.0 + 0.035 * sin(a * (3 + ring * 0.05) + t * 0.4);
      arr.push(createVector(cos(a) * rr * wobble, sin(a) * rr * wobble));
    }

    // 周回線
    for (let i = 0; i < pts; i++) {
      let p1 = arr[i];
      let p2 = arr[(i + 1) % pts];
      line(p1.x, p1.y, p2.x, p2.y);
    }

    // 飛び先接続
    let jump = max(2, floor(pts / 7));
    for (let i = 0; i < pts; i += 2) {
      let p1 = arr[i];
      let p2 = arr[(i + jump) % pts];
      line(p1.x, p1.y, p2.x, p2.y);
    }
  }
}

function drawSphereLattice(r, count, warp, rot, col) {
  stroke(col);
  strokeWeight(0.45);
  noFill();

  let pts = [];
  for (let i = 0; i < count; i++) {
    let a = TWO_PI * i / count + rot;
    let rr = r * (0.90 + 0.10 * sin(a * warp * 2.0));
    pts.push(createVector(cos(a) * rr, sin(a) * rr));
  }

  for (let i = 0; i < count; i++) {
    let p1 = pts[i];
    let p2 = pts[(i + 5) % count];
    let p3 = pts[(i + 11) % count];
    line(p1.x, p1.y, p2.x, p2.y);
    line(p1.x, p1.y, p3.x, p3.y);
  }
}

function drawRadialDust(r, num, t) {
  noStroke();

  for (let i = 0; i < num; i++) {
    let a = TWO_PI * i / num + sin(i * 0.07 + t * 0.15) * 0.002;
    let rr = r * (0.78 + 0.22 * noise(i * 0.02, t * 0.03));
    let x = cos(a) * rr;
    let y = sin(a) * rr;
    let sz = 0.5 + 1.1 * noise(i * 0.03 + 100, t * 0.04);
    fill(255, 140 + 60 * noise(i * 0.03), 30, 10);
    circle(x, y, sz);
  }
}

function drawBackgroundGlow(r, col, t) {
  noStroke();
  for (let i = 8; i >= 1; i--) {
    let rr = r * (0.55 + i * 0.12);
    let a = 4 + i * 1.6;
    fill(red(col), green(col), blue(col), a);
    circle(0, 0, rr * 2);
  }
}

function drawCenterCore(r, col, t) {
  noStroke();

  let pulse = 1.0 + 0.18 * sin(t * 1.2);
  let rr = r * pulse;

  for (let i = 8; i >= 1; i--) {
    let k = i / 8;
    fill(red(col), green(col), blue(col), 10 + 26 * (1.0 - k));
    circle(0, 0, rr * (2.8 + i * 0.55));
  }

  fill(255, 230, 170, 180);
  circle(0, 0, rr * 2.0);

  fill(255, 255, 255, 230);
  circle(0, 0, rr * 0.75);

  // 小リング
  stroke(255, 190, 80, 70);
  strokeWeight(1);
  noFill();
  circle(0, 0, rr * 3.4);
}

// --------------------------------------------------
// イージング
// --------------------------------------------------

function easeInOutCubic(x) {
  return x < 0.5
    ? 4 * x * x * x
    : 1 - pow(-2 * x + 2, 3) / 2;
}

function easeOutCubic(x) {
  return 1 - pow(1 - x, 3);
}
