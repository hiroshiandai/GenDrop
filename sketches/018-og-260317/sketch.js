// ============================================================
// Time-synced sacred geometry reconstruction
// p5.js / sketch.js
// based on the uploaded reference video's second-by-second flow
// ============================================================

const W = 1080;
const H = 1920;
const LOOP = 56.0;
const FPS = 30;

let BASE_R;

function setup() {
  createCanvas(W, H);
  pixelDensity(1);
  frameRate(FPS);
  smooth();
  BASE_R = min(width, height) * 0.348;
}

function draw() {
  background(0);

  const t = (millis() / 1000) % LOOP;

  translate(width * 0.5, height * 0.5 - 10);

  // ----------------------------------------------------------
  // global zoom = closer to original timing
  // ----------------------------------------------------------
  let zoom = 1.0;
  zoom += 0.06 * easeInOut(norm(t, 0, 10));
  zoom += 0.10 * easeInOut(norm(t, 10, 20));
  zoom += 0.18 * easeInOut(norm(t, 20, 32));
  zoom += 0.28 * easeInOut(norm(t, 32, 44));
  zoom += 0.34 * easeInOut(norm(t, 44, 53));
  scale(zoom);

  blendMode(ADD);

  // ----------------------------------------------------------
  // palette over time
  // ----------------------------------------------------------
  const coldA = color(230, 235, 245, 120);
  const coldB = color(205, 215, 235, 80);
  const goldA = color(255, 205, 105, 110);
  const goldB = color(255, 170, 52, 95);
  const orangeA = color(238, 118, 26, 85);

  const warmMix = easeInOut(norm(t, 7, 16));
  const orangeMix = easeInOut(norm(t, 24, 42));

  const mainCol = lerpColor(coldA, goldA, warmMix);
  const subCol = lerpColor(coldB, goldB, warmMix);
  const lateCol = lerpColor(goldB, orangeA, orangeMix);

  // subtle base glow
  drawSoftGlow(BASE_R * 1.55, lateCol, 0.16);

  // ==========================================================
  // 0 - 2 sec : radial spokes + white center
  // ==========================================================
  if (t < 2.2) {
    const a = easeOut(norm(t, 0, 2.2));
    const spokes = floor(lerp(24, 38, a));
    const rr = BASE_R * lerp(0.92, 1.10, a);
    drawRadialSpokes(rr, spokes, color(235, 240, 255, lerp(40, 100, a)), 1.0);
    drawCore(BASE_R * 0.040, color(255, 255, 255, 240), t, 0.85);
  }

  // ==========================================================
  // 2 - 5 sec : tri-lobed white twist -> star
  // ==========================================================
  if (t >= 1.2 && t < 5.5) {
    const a = easeInOut(norm(t, 1.2, 5.5));

    drawOuterRing(BASE_R * 1.07, color(225, 230, 245, 20 + 30 * a), 1);

    drawTriLobeShape(
      BASE_R * lerp(0.28, 0.43, a),
      3,
      t * 0.70,
      color(255, 255, 255, lerp(20, 70, a)),
      0.9
    );

    drawStringStar(
      BASE_R * lerp(0.50, 0.82, a),
      floor(lerp(42, 72, a)),
      floor(lerp(11, 17, a)),
      t * 0.12,
      color(235, 238, 245, lerp(10, 52, a)),
      1
    );
  }

  // ==========================================================
  // 5 - 9 sec : white string-art orb grows dense
  // ==========================================================
  if (t >= 4.0 && t < 9.5) {
    const a = easeInOut(norm(t, 4.0, 9.5));

    for (let i = 0; i < 6; i++) {
      const rr = BASE_R * (0.60 + i * 0.07);
      const nodes = floor(lerp(56, 108, a)) + i * 6;
      const step = 13 + i * 2;
      const rot = i * 0.14 - t * (0.03 + i * 0.004);
      drawStringStar(
        rr,
        nodes,
        step,
        rot,
        color(236, 230, 220, lerp(8, 24, a) * (1.0 - i * 0.08)),
        1
      );
    }

    drawRosetteField(
      BASE_R * lerp(0.30, 0.52, a),
      floor(lerp(8, 18, a)),
      color(240, 236, 232, lerp(10, 24, a)),
      t,
      6,
      0.07
    );

    drawInnerMeshOrb(
      BASE_R * lerp(0.28, 0.50, a),
      floor(lerp(34, 58, a)),
      color(245, 242, 240, lerp(12, 34, a)),
      t
    );
  }

  // ==========================================================
  // 9 - 14 sec : gold compact orb + petal rim appears
  // ==========================================================
  if (t >= 8.5 && t < 14.5) {
    const a = easeInOut(norm(t, 8.5, 14.5));

    drawRosetteField(
      BASE_R * lerp(0.42, 0.68, a),
      floor(lerp(16, 28, a)),
      color(255, 220, 145, lerp(12, 34, a)),
      t,
      8,
      0.05
    );

    drawInnerMeshOrb(
      BASE_R * lerp(0.46, 0.68, a),
      floor(lerp(58, 88, a)),
      color(255, 200, 115, lerp(10, 28, a)),
      t
    );

    drawPetalRing(
      BASE_R * lerp(0.83, 1.02, a),
      floor(lerp(10, 18, a)),
      color(255, 210, 125, lerp(6, 18, a)),
      t * 0.06
    );
  }

  // ==========================================================
  // 14 - 20 sec : gold orb becomes clean mandala
  // ==========================================================
  if (t >= 13.0 && t < 20.5) {
    const a = easeInOut(norm(t, 13.0, 20.5));

    drawMandalaDisc(
      BASE_R * lerp(0.62, 0.88, a),
      floor(lerp(20, 34, a)),
      color(255, 204, 110, lerp(10, 28, a)),
      color(255, 145, 55, lerp(6, 16, a)),
      t
    );

    drawPetalRing(
      BASE_R * lerp(0.96, 1.07, a),
      floor(lerp(14, 22, a)),
      color(255, 190, 90, lerp(8, 22, a)),
      -t * 0.04
    );

    drawStringStar(
      BASE_R * lerp(0.98, 1.12, a),
      floor(lerp(84, 128, a)),
      floor(lerp(19, 27, a)),
      t * 0.02,
      color(255, 185, 80, lerp(5, 14, a)),
      1
    );
  }

  // ==========================================================
  // 20 - 28 sec : strong sunburst star
  // ==========================================================
  if (t >= 19.0 && t < 28.5) {
    const a = easeInOut(norm(t, 19.0, 28.5));

    drawSunburst(
      BASE_R * lerp(0.92, 1.18, a),
      BASE_R * lerp(0.26, 0.17, a),
      floor(lerp(18, 28, a)),
      color(255, 175, 55, lerp(12, 34, a)),
      color(255, 145, 35, lerp(10, 20, a)),
      -t * 0.015
    );

    drawMandalaDisc(
      BASE_R * lerp(0.42, 0.34, a),
      floor(lerp(18, 14, a)),
      color(255, 170, 72, lerp(10, 22, a)),
      color(255, 110, 28, lerp(4, 10, a)),
      t
    );

    drawAtmosphereDust(
      BASE_R * 1.18,
      floor(lerp(900, 1800, a)),
      color(255, 140, 30, lerp(2, 8, a)),
      t
    );
  }

  // ==========================================================
  // 28 - 36 sec : center disc expands / outer spikes maintained
  // ==========================================================
  if (t >= 27.0 && t < 36.5) {
    const a = easeInOut(norm(t, 27.0, 36.5));

    drawSunburst(
      BASE_R * lerp(1.10, 1.26, a),
      BASE_R * lerp(0.24, 0.34, a),
      floor(lerp(24, 22, a)),
      color(255, 150, 34, lerp(14, 32, a)),
      color(255, 120, 24, lerp(6, 14, a)),
      -t * 0.012
    );

    drawDotDisc(
      BASE_R * lerp(0.38, 0.62, a),
      floor(lerp(1200, 2600, a)),
      color(255, 132, 28, lerp(7, 16, a)),
      t
    );

    drawOuterRing(BASE_R * 1.28, color(255, 140, 30, lerp(1, 5, a)), 1);
  }

  // ==========================================================
  // 36 - 44 sec : large disc + diamond lattice around
  // ==========================================================
  if (t >= 35.0 && t < 44.5) {
    const a = easeInOut(norm(t, 35.0, 44.5));

    drawDiamondLattice(
      BASE_R * lerp(1.14, 1.40, a),
      floor(lerp(14, 10, a)),
      color(255, 118, 24, lerp(4, 10, a)),
      t * 0.01
    );

    drawDotDisc(
      BASE_R * lerp(0.58, 0.92, a),
      floor(lerp(2500, 4600, a)),
      color(235, 108, 22, lerp(8, 16, a)),
      t
    );

    drawAtmosphereDust(
      BASE_R * 1.45,
      floor(lerp(1800, 2800, a)),
      color(235, 110, 22, lerp(2, 5, a)),
      t
    );
  }

  // ==========================================================
  // 44 - 53 sec : huge orange sphere fills screen
  // ==========================================================
  if (t >= 43.0 && t < 53.2) {
    const a = easeInOut(norm(t, 43.0, 53.2));

    drawDotDisc(
      BASE_R * lerp(0.95, 1.42, a),
      floor(lerp(5200, 9000, a)),
      color(220, 95, 20, lerp(9, 18, a)),
      t
    );

    drawDiamondLattice(
      BASE_R * lerp(1.38, 1.90, a),
      floor(lerp(10, 8, a)),
      color(220, 96, 20, lerp(3, 6, a)),
      t * 0.008
    );

    drawOuterFade(
      BASE_R * lerp(1.20, 1.52, a),
      color(220, 100, 20, lerp(2, 6, a))
    );
  }

  // ==========================================================
  // 53 - 56 sec : fade tail
  // ==========================================================
  if (t >= 53.0) {
    const a = 1.0 - easeInOut(norm(t, 53.0, 56.0));
    drawDotDisc(
      BASE_R * 1.42,
      9000,
      color(210, 92, 18, 12 * a),
      t
    );
    drawDiamondLattice(
      BASE_R * 1.90,
      8,
      color(210, 95, 20, 4 * a),
      t * 0.006
    );
  }

  // center kernel always
  drawCore(BASE_R * 0.050, color(255, 215, 130, 180), t, 1.0);

  blendMode(BLEND);
}

// ============================================================
// drawing functions
// ============================================================

function drawRadialSpokes(r, count, col, sw) {
  stroke(col);
  strokeWeight(sw);
  noFill();
  for (let i = 0; i < count; i++) {
    const a = TWO_PI * i / count - HALF_PI;
    line(0, 0, cos(a) * r, sin(a) * r);
  }
}

function drawOuterRing(r, col, sw) {
  noFill();
  stroke(col);
  strokeWeight(sw);
  circle(0, 0, r * 2);
}

function drawStringStar(r, nodes, step, rot, col, repeats = 1) {
  noFill();
  stroke(col);
  strokeWeight(0.48);

  for (let k = 0; k < repeats; k++) {
    const rr = rot + k * 0.014;
    for (let i = 0; i < nodes; i++) {
      const a1 = TWO_PI * i / nodes + rr - HALF_PI;
      const a2 = TWO_PI * ((i + step) % nodes) / nodes + rr - HALF_PI;
      const x1 = cos(a1) * r;
      const y1 = sin(a1) * r;
      const x2 = cos(a2) * r;
      const y2 = sin(a2) * r;
      line(x1, y1, x2, y2);
    }
  }
}

function drawTriLobeShape(r, lobes, rot, col, sw = 1) {
  noFill();
  stroke(col);
  strokeWeight(sw);
  beginShape();
  const samples = 300;
  for (let i = 0; i <= samples; i++) {
    const a = TWO_PI * i / samples;
    const q = r * (0.34 + 0.66 * abs(cos(lobes * a + rot)));
    vertex(cos(a - HALF_PI) * q, sin(a - HALF_PI) * q);
  }
  endShape();
}

function drawInnerMeshOrb(r, rings, col, t) {
  noFill();
  strokeWeight(0.42);

  for (let ring = 1; ring <= rings; ring++) {
    const rr = r * ring / rings;
    const pts = 28 + ring * 2;
    const j1 = max(3, floor(pts * 0.17));
    const j2 = max(4, floor(pts * 0.29));
    const rot = t * 0.03 + ring * 0.08;

    stroke(red(col), green(col), blue(col), alpha(col) * map(ring, 1, rings, 0.7, 1.0));

    let arr = [];
    for (let i = 0; i < pts; i++) {
      const a = TWO_PI * i / pts + rot - HALF_PI;
      arr.push(createVector(cos(a) * rr, sin(a) * rr));
    }

    for (let i = 0; i < pts; i++) {
      const p1 = arr[i];
      const p2 = arr[(i + j1) % pts];
      const p3 = arr[(i + j2) % pts];
      line(p1.x, p1.y, p2.x, p2.y);
      line(p1.x, p1.y, p3.x, p3.y);
    }
  }
}

function drawRosetteField(maxR, rings, col, t, petalBase = 6, amp = 0.06) {
  noFill();
  strokeWeight(0.42);

  for (let j = 1; j <= rings; j++) {
    const rr = maxR * j / rings;
    const petals = petalBase + j;
    stroke(red(col), green(col), blue(col), alpha(col) * map(j, 1, rings, 0.6, 1.0));

    beginShape();
    const samples = 260;
    for (let i = 0; i <= samples; i++) {
      const a = TWO_PI * i / samples;
      const mod = 1.0 + amp * sin(petals * a + t * 0.18 + j * 0.22);
      vertex(cos(a - HALF_PI) * rr * mod, sin(a - HALF_PI) * rr * mod);
    }
    endShape();
  }
}

function drawPetalRing(r, petals, col, rot) {
  noFill();
  stroke(col);
  strokeWeight(0.75);

  beginShape();
  for (let i = 0; i <= petals * 2; i++) {
    const a = TWO_PI * i / (petals * 2) + rot - HALF_PI;
    const rr = (i % 2 === 0) ? r : r * 0.84;
    vertex(cos(a) * rr, sin(a) * rr);
  }
  endShape(CLOSE);
}

function drawMandalaDisc(r, rings, colA, colB, t) {
  drawRosetteField(r, rings, colA, t, 8, 0.05);

  noFill();
  for (let i = 1; i <= rings; i += 2) {
    const rr = r * i / rings;
    stroke(red(colB), green(colB), blue(colB), alpha(colB) * map(i, 1, rings, 0.6, 1.0));
    strokeWeight(0.42);
    circle(0, 0, rr * 2);
  }
}

function drawSunburst(outerR, innerR, rays, col, glowCol, rot) {
  noFill();

  for (let g = 0; g < 3; g++) {
    stroke(
      red(glowCol),
      green(glowCol),
      blue(glowCol),
      alpha(glowCol) * (0.50 - g * 0.14)
    );
    strokeWeight(1.8 - g * 0.35);

    beginShape();
    for (let i = 0; i <= rays * 2; i++) {
      const a = TWO_PI * i / (rays * 2) + rot - HALF_PI;
      const rr = (i % 2 === 0) ? outerR + g * 3 : innerR;
      vertex(cos(a) * rr, sin(a) * rr);
    }
    endShape(CLOSE);
  }

  stroke(col);
  strokeWeight(0.9);
  beginShape();
  for (let i = 0; i <= rays * 2; i++) {
    const a = TWO_PI * i / (rays * 2) + rot - HALF_PI;
    const rr = (i % 2 === 0) ? outerR : innerR;
    vertex(cos(a) * rr, sin(a) * rr);
  }
  endShape(CLOSE);
}

function drawAtmosphereDust(r, count, col, t) {
  noStroke();
  for (let i = 0; i < count; i++) {
    const a = TWO_PI * fract(i * 0.6180339) - HALF_PI;
    const rr = r * (0.82 + 0.20 * noise(i * 0.023, t * 0.035));
    const x = cos(a) * rr;
    const y = sin(a) * rr;
    const s = 0.4 + 1.0 * noise(100 + i * 0.019, t * 0.04);
    fill(red(col), green(col), blue(col), alpha(col));
    circle(x, y, s);
  }
}

function drawDotDisc(r, count, col, t) {
  noStroke();
  for (let i = 0; i < count; i++) {
    const u = fract(i * 0.754877666);
    const v = fract(i * 0.569840291);
    const a = TWO_PI * u - HALF_PI;
    const rr = r * sqrt(v) * (0.96 + 0.04 * noise(i * 0.01, t * 0.03));
    const x = cos(a) * rr;
    const y = sin(a) * rr;
    const s = 0.28 + 0.72 * noise(200 + i * 0.015, t * 0.03);
    fill(red(col), green(col), blue(col), alpha(col));
    circle(x, y, s);
  }
}

function drawDiamondLattice(r, divisions, col, rot) {
  noFill();
  stroke(col);
  strokeWeight(0.7);

  for (let i = 0; i < divisions; i++) {
    const a = TWO_PI * i / divisions + rot - HALF_PI;
    const b = a + PI / divisions;

    const x1 = cos(a) * r;
    const y1 = sin(a) * r;
    const x2 = cos(b) * r;
    const y2 = sin(b) * r;

    line(-x1, -y1, x2, y2);
    line(x1, y1, -x2, -y2);
  }
}

function drawOuterFade(r, col) {
  noFill();
  for (let i = 0; i < 10; i++) {
    stroke(red(col), green(col), blue(col), alpha(col) * (1.0 - i / 10));
    strokeWeight(0.8);
    circle(0, 0, (r + i * 4.0) * 2);
  }
}

function drawSoftGlow(r, col, strength = 0.15) {
  noStroke();
  for (let i = 10; i >= 1; i--) {
    const rr = r * (0.42 + i * 0.09);
    fill(red(col), green(col), blue(col), alpha(col) * strength * i * 0.25);
    circle(0, 0, rr * 2);
  }
}

function drawCore(r, col, t, gain = 1.0) {
  const pulse = 1.0 + 0.10 * sin(t * 1.25) + 0.04 * sin(t * 2.7 + 1.1);
  const rr = r * pulse;

  noStroke();

  for (let i = 7; i >= 1; i--) {
    fill(red(col), green(col), blue(col), (8 + i * 4) * gain);
    circle(0, 0, rr * (2.0 + i * 0.42) * 2);
  }

  fill(255, 235, 180, 150 * gain);
  circle(0, 0, rr * 1.75 * 2);

  fill(255, 255, 255, 220 * gain);
  circle(0, 0, rr * 0.52 * 2);
}

// ============================================================
// utility
// ============================================================

function norm(v, a, b) {
  return constrain((v - a) / (b - a), 0, 1);
}

function fract(x) {
  return x - floor(x);
}

function easeInOut(x) {
  x = constrain(x, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}

function easeOut(x) {
  x = constrain(x, 0, 1);
  return 1 - pow(1 - x, 3);
}
