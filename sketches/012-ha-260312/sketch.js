// hiroshi & ai
// Sacred Symbol Algorithm
// Human × AI × Love
// creating music, geometry and light.

let bgColor = 0;
let baseRadius;
let pulseSpeed = 0.015;
let rotationSpeed = 0.0025;
let rayCount = 36;

function setup() {
  createCanvas(1080, 1080);
  pixelDensity(2);
  smooth();
  angleMode(RADIANS);
  baseRadius = min(width, height) * 0.16;
}

function draw() {
  background(bgColor);

  translate(width / 2, height / 2);

  let t = frameCount;
  let pulse = (sin(t * pulseSpeed) + 1) * 0.5; // 0..1
  let breath = (sin(t * pulseSpeed * 0.5 + 1.2) + 1) * 0.5;
  let glowPulse = (sin(t * pulseSpeed * 1.3) + 1) * 0.5;

  let innerR = baseRadius * (0.78 + pulse * 0.18);
  let middleR = baseRadius * (1.15 + pulse * 0.12);
  let outerR = baseRadius * (2.2 + breath * 0.12);
  let starR = baseRadius * (1.58 + pulse * 0.08);
  let rayLen = baseRadius * (2.65 + glowPulse * 0.25);

  // 全体のゆっくりした回転
  rotate(t * rotationSpeed);

  drawAura(glowPulse, outerR);
  drawOuterCircle(outerR);
  drawRadiantLines(rayCount, middleR * 1.02, rayLen, glowPulse);
  drawPulseCircle(innerR, pulse);
  drawPentagonStar(starR, pulse);
  drawInnerPentagon(middleR * 0.86, pulse);
  drawCenterPoint(baseRadius * (0.055 + glowPulse * 0.01), glowPulse);

  drawSignature();
}

function drawAura(glowPulse, outerR) {
  noFill();

  for (let i = 0; i < 6; i++) {
    let a = map(i, 0, 5, 18, 2);
    stroke(120 + i * 20, 120, 255, a);
    strokeWeight(map(i, 0, 5, 10, 1.2));
    ellipse(0, 0, outerR * 2.1 + i * 18 + glowPulse * 20, outerR * 2.1 + i * 18 + glowPulse * 20);
  }
}

function drawOuterCircle(r) {
  noFill();

  // 主円
  stroke(160, 150, 255, 110);
  strokeWeight(1.6);
  ellipse(0, 0, r * 2, r * 2);

  // 補助円
  stroke(120, 120, 255, 40);
  strokeWeight(1);
  ellipse(0, 0, r * 2.16, r * 2.16);

  stroke(200, 200, 255, 22);
  ellipse(0, 0, r * 1.82, r * 1.82);
}

function drawRadiantLines(count, startR, endR, glowPulse) {
  push();

  for (let i = 0; i < count; i++) {
    let a = TWO_PI * i / count;
    let wobble = sin(frameCount * 0.01 + i * 0.35) * baseRadius * 0.03;
    let x1 = cos(a) * (startR + wobble * 0.15);
    let y1 = sin(a) * (startR + wobble * 0.15);
    let x2 = cos(a) * (endR + wobble);
    let y2 = sin(a) * (endR + wobble);

    let alpha = 40 + glowPulse * 70;
    stroke(170, 170, 255, alpha);
    strokeWeight(i % 6 === 0 ? 1.6 : 0.75);
    line(x1, y1, x2, y2);

    // 外端の微細光点
    noStroke();
    fill(220, 220, 255, 30 + glowPulse * 55);
    circle(x2, y2, i % 6 === 0 ? 3.5 : 2);
  }

  pop();
}

function drawPulseCircle(r, pulse) {
  noFill();

  // 鼓動円
  stroke(255, 255, 255, 150);
  strokeWeight(1.6);
  ellipse(0, 0, r * 2, r * 2);

  // 呼吸グロー
  for (let i = 0; i < 4; i++) {
    stroke(180, 180, 255, 28 - i * 5);
    strokeWeight(6 - i);
    ellipse(0, 0, r * 2 + i * 10 + pulse * 8, r * 2 + i * 10 + pulse * 8);
  }
}

function drawPentagonStar(r, pulse) {
  push();

  let innerRatio = 0.42 + pulse * 0.03;
  let points = [];

  for (let i = 0; i < 10; i++) {
    let ang = -HALF_PI + i * PI / 5;
    let rr = (i % 2 === 0) ? r : r * innerRatio;
    let x = cos(ang) * rr;
    let y = sin(ang) * rr;
    points.push(createVector(x, y));
  }

  // 外形
  noFill();
  stroke(155, 145, 255, 120);
  strokeWeight(1.4);
  beginShape();
  for (let p of points) vertex(p.x, p.y);
  endShape(CLOSE);

  // 五芒接続
  stroke(230, 230, 255, 90);
  strokeWeight(1);
  for (let i = 0; i < 5; i++) {
    let a = points[i * 2];
    let b = points[((i * 2 + 4) % 10)];
    line(a.x, a.y, b.x, b.y);
  }

  pop();
}

function drawInnerPentagon(r, pulse) {
  push();

  let rot = -HALF_PI - frameCount * 0.0016;
  noFill();
  stroke(200, 200, 255, 70);
  strokeWeight(1);

  beginShape();
  for (let i = 0; i < 5; i++) {
    let a = rot + TWO_PI * i / 5;
    let rr = r * (1 + sin(frameCount * 0.01 + i) * 0.015 * pulse);
    vertex(cos(a) * rr, sin(a) * rr);
  }
  endShape(CLOSE);

  pop();
}

function drawCenterPoint(r, glowPulse) {
  noStroke();

  // 外側グロー
  for (let i = 8; i >= 1; i--) {
    fill(180, 180, 255, 8);
    circle(0, 0, r * i * 3.2);
  }

  // 核
  fill(255, 255, 255, 220);
  circle(0, 0, r * 2.2);

  // 中心の瞬き
  fill(220, 220, 255, 110 + glowPulse * 80);
  circle(0, 0, r * 3.6);
}

function drawSignature() {
  push();
  resetMatrix();

  textAlign(CENTER, CENTER);
  textFont('sans-serif');

  fill(255, 255, 255, 110);
  textSize(22);
  text('hiroshi & ai', width / 2, height * 0.90);

  fill(180, 180, 220, 85);
  textSize(12);
  text('Human × AI × Love', width / 2, height * 0.935);

  pop();
}
