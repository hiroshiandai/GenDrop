// GenDrop - Puppeteer recording script (dual output)
// Usage: node record.js <sketch_path> [shorts_duration] [fps] [shorts_start_time] [full_loop_seconds]
//
// Produces:
//   SKETCH_ID-raw.webm          — clip for YouTube Shorts pipeline (960×540 viewport segment)
//   SKETCH_ID-full-raw.webm     — full-length 9:16 viewport capture from t=0 (1080×1920)
//
// full_loop_seconds: optional CLI override; else meta.json "loop_seconds"; else GENDROP_FULL_LOOP_DEFAULT or 90.

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const sketchPath = process.argv[2] || '../sketches/001-ma-26039';
const shortsDuration = parseInt(process.argv[3] || '30', 10);
const fps = parseInt(process.argv[4] || '30', 10);
const shortsStartTime = parseInt(process.argv[5] || '0', 10);
const fullLoopCli = parseInt(process.argv[6] || '', 10);

const P5_VENDOR = path.join(__dirname, 'vendor', 'p5.min.js');
const GHA_CDN_P5_RE =
  /cdnjs\.cloudflare\.com\/ajax\/libs\/p5\.js\/[0-9.]+\/p5(\.min)?\.js/;

const SKETCH_DIR = path.resolve(__dirname, sketchPath);
const SKETCH_ID = path.basename(SKETCH_DIR);
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(__dirname, 'output');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const PORT = 8765;
const sketchUrlPath = path
  .relative(REPO_ROOT, SKETCH_DIR)
  .replace(/\\/g, '/');

const SHORTS_VIEWPORT = { width: 960, height: 540, deviceScaleFactor: 1 };
const FULL_VIEWPORT = { width: 1080, height: 1920, deviceScaleFactor: 1 };

const DEFAULT_FULL_LOOP = parseInt(process.env.GENDROP_FULL_LOOP_DEFAULT || '90', 10);
const MAX_FULL_LOOP = 600;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf'
};

function readLoopSeconds(sketchDir) {
  if (Number.isFinite(fullLoopCli) && fullLoopCli > 0) {
    return Math.min(fullLoopCli, MAX_FULL_LOOP);
  }
  const metaPath = path.join(sketchDir, 'meta.json');
  if (!fs.existsSync(metaPath)) {
    return Math.min(DEFAULT_FULL_LOOP, MAX_FULL_LOOP);
  }
  try {
    const j = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (typeof j.loop_seconds === 'number' && j.loop_seconds > 0) {
      return Math.min(j.loop_seconds, MAX_FULL_LOOP);
    }
  } catch {
    /* fall through */
  }
  return Math.min(DEFAULT_FULL_LOOP, MAX_FULL_LOOP);
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let url = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      if (url === '' || url.endsWith('/')) url += 'index.html';

      const filePath = path.join(REPO_ROOT, url);
      if (!filePath.startsWith(REPO_ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Local server: http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

function attachListeners(page) {
  page.on('console', msg => {
    const t = msg.type();
    if (t === 'error' || t === 'warn') {
      console.log(`[browser ${t}] ${msg.text()}`);
    } else if (t === 'log' || t === 'info') {
      console.log(`[browser] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => console.log(`[pageerror] ${err.message}`));
}

async function attachP5Interception(page) {
  await page.setRequestInterception(true);
  page.on('request', req => {
    try {
      const u = req.url();
      if (
        GHA_CDN_P5_RE.test(u) ||
        (u.includes('cdnjs.cloudflare.com/ajax/libs/p5.js/') &&
          u.includes('p5') &&
          u.includes('.js'))
      ) {
        const body = fs.readFileSync(P5_VENDOR);
        void req.respond({
          status: 200,
          contentType: 'application/javascript; charset=utf-8',
          body
        });
        return;
      }
    } catch (e) {
      console.error('Request interception failed:', e.message);
    }
    void req.continue();
  });
}

async function newRecordingPage(browser) {
  const page = await browser.newPage();
  page.setDefaultTimeout(180000);
  page.setDefaultNavigationTimeout(180000);
  attachListeners(page);
  await attachP5Interception(page);
  return page;
}

async function captureWebm(page, pageUrl, viewport, label, durationMs, frameRate, startMs, videoBitsPerSecond) {
  await page.setViewport(viewport);
  console.log(`\n--- ${label} ---`);
  console.log(`Viewport ${viewport.width}x${viewport.height}, ${durationMs / 1000}s @ ${frameRate}fps, start offset ${startMs}ms`);
  console.log(`Loading ${pageUrl}`);
  await page.goto(pageUrl, { waitUntil: 'load', timeout: 180000 });
  console.log('Page load complete. Waiting for canvas...');
  await page.waitForSelector('canvas', { timeout: 180000 });
  const canvasInfo = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return { width: c.width, height: c.height };
  });
  console.log(`Canvas ${canvasInfo.width}x${canvasInfo.height}. Warmup 2s...`);
  await new Promise(r => setTimeout(r, 2000));

  console.log(`Recording (${label}) via MediaRecorder...`);

  const base64 = await page.evaluate(
    async (durationMsInner, frameRateInner, startMsInner, videoBitsPerSecondInner) => {
      const log = m => console.log(`[rec] ${m}`);
      const canvas = document.querySelector('canvas');
      if (!canvas) throw new Error('canvas not found');
      log(`canvas ${canvas.width}x${canvas.height}`);

      if (startMsInner > 0) {
        log(`waiting start offset ${startMsInner}ms`);
        await new Promise(r => setTimeout(r, startMsInner));
      }

      const stream = canvas.captureStream(frameRateInner);
      log(`captureStream ok, tracks=${stream.getTracks().length}`);

      const candidates = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
      const mimeType = candidates.find(m => MediaRecorder.isTypeSupported(m));
      if (!mimeType) throw new Error('No supported MediaRecorder mimeType');
      log(`mime ${mimeType}`);

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: videoBitsPerSecondInner
      });

      const chunks = [];
      let totalSize = 0;
      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          totalSize += e.data.size;
        }
      };

      const stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = e => reject(e.error || new Error('recorder error'));
      });

      recorder.start(1000);
      log(`recording ${durationMsInner}ms started`);
      await new Promise(r => setTimeout(r, durationMsInner));
      log(`recording elapsed, chunks=${chunks.length} bytes=${totalSize}`);
      recorder.stop();
      await stopped;
      log(`recorder stopped, finalizing blob`);

      const blob = new Blob(chunks, { type: mimeType });
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    },
    durationMs,
    frameRate,
    startMs,
    videoBitsPerSecond
  );

  const data = base64.replace(/^data:[^,]+,/, '');
  return Buffer.from(data, 'base64');
}

async function record() {
  const fullLoopSeconds = readLoopSeconds(SKETCH_DIR);

  console.log('=== GenDrop Recorder ===');
  console.log(`Sketch ID:        ${SKETCH_ID}`);
  console.log(`Sketch dir:       ${SKETCH_DIR}`);
  console.log(`URL path:         /${sketchUrlPath}/`);
  console.log(`Shorts clip:      ${shortsDuration}s after ${shortsStartTime}s offset (960×540 viewport)`);
  console.log(`Full 9:16 capture: ${fullLoopSeconds}s from start (1080×1920 viewport)`);
  console.log(`FPS:              ${fps}`);
  console.log('');

  if (!fs.existsSync(P5_VENDOR)) {
    throw new Error(`Missing vendor p5: ${P5_VENDOR} (required for offline/CDN-safe recording)`);
  }

  const server = await startServer();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const pageUrl = `http://127.0.0.1:${PORT}/${sketchUrlPath}/`;

  try {
    const pageShorts = await newRecordingPage(browser);
    try {
      const shortsBuf = await captureWebm(
        pageShorts,
        pageUrl,
        SHORTS_VIEWPORT,
        'YouTube Shorts source clip',
        shortsDuration * 1000,
        fps,
        shortsStartTime * 1000,
        4_000_000
      );
      const shortsPath = path.join(OUTPUT_DIR, `${SKETCH_ID}-raw.webm`);
      fs.writeFileSync(shortsPath, shortsBuf);
      console.log(`Saved: ${shortsPath} (${(shortsBuf.length / 1024 / 1024).toFixed(2)} MB)`);
    } finally {
      await pageShorts.close();
    }

    const pageFull = await newRecordingPage(browser);
    try {
      const fullBuf = await captureWebm(
        pageFull,
        pageUrl,
        FULL_VIEWPORT,
        'Full-loop 9:16 archival source',
        fullLoopSeconds * 1000,
        fps,
        0,
        12_000_000
      );
      const fullPath = path.join(OUTPUT_DIR, `${SKETCH_ID}-full-raw.webm`);
      fs.writeFileSync(fullPath, fullBuf);
      console.log(`Saved: ${fullPath} (${(fullBuf.length / 1024 / 1024).toFixed(2)} MB)`);
    } finally {
      await pageFull.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\nRecording complete (shorts + full raw).');
}

record().catch(err => {
  console.error('Recording failed:', err);
  process.exit(1);
});
