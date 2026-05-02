// GenDrop - Puppeteer recording script
// Usage: node record.js <sketch_path> [duration] [fps] [start_time]
// Example: node record.js ../sketches/001-ma-26039 30 30 60
//          (records seconds 60-90 of the sketch animation)

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const sketchPath = process.argv[2] || '../sketches/001-ma-26039';
const duration = parseInt(process.argv[3] || '30', 10);
const fps = parseInt(process.argv[4] || '30', 10);
const startTime = parseInt(process.argv[5] || '0', 10);

const SKETCH_DIR = path.resolve(__dirname, sketchPath);
const SKETCH_ID = path.basename(SKETCH_DIR);
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(__dirname, 'output');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const PORT = 8765;
const sketchUrlPath = path
  .relative(REPO_ROOT, SKETCH_DIR)
  .replace(/\\/g, '/');

console.log('=== GenDrop Recorder ===');
console.log(`Sketch ID:   ${SKETCH_ID}`);
console.log(`Sketch dir:  ${SKETCH_DIR}`);
console.log(`URL path:    /${sketchUrlPath}/`);
console.log(`Duration:    ${duration}s`);
console.log(`FPS:         ${fps}`);
console.log(`Start time:  ${startTime}s (offset from sketch start)`);
console.log('');

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

async function record() {
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

  let webmBuffer;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });

    page.on('console', msg => {
      const t = msg.type();
      if (t === 'error' || t === 'warn') {
        console.log(`[browser ${t}] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => console.log(`[pageerror] ${err.message}`));

    const url = `http://127.0.0.1:${PORT}/${sketchUrlPath}/`;
    console.log(`Loading ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('DOM loaded. Waiting for canvas...');

    await page.waitForSelector('canvas', { timeout: 30000 });
    const canvasInfo = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return { width: c.width, height: c.height };
    });
    console.log(`Canvas detected: ${canvasInfo.width}x${canvasInfo.height}. Warming up 2s...`);
    await new Promise(r => setTimeout(r, 2000));

    if (startTime > 0) {
      console.log(`Letting sketch run for ${startTime}s before recording...`);
    }
    console.log(`Recording ${duration}s @ ${fps}fps via MediaRecorder...`);

    page.on('console', msg => {
      const t = msg.type();
      if (t === 'log' || t === 'info') console.log(`[browser] ${msg.text()}`);
    });

    const base64 = await page.evaluate(
      async (durationMs, frameRate, startMs) => {
        const log = m => console.log(`[rec] ${m}`);
        const canvas = document.querySelector('canvas');
        if (!canvas) throw new Error('canvas not found');
        log(`canvas ${canvas.width}x${canvas.height}`);

        if (startMs > 0) {
          log(`waiting startTime ${startMs}ms`);
          await new Promise(r => setTimeout(r, startMs));
        }

        const stream = canvas.captureStream(frameRate);
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
          videoBitsPerSecond: 4_000_000
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
        log(`recording ${durationMs}ms started`);
        await new Promise(r => setTimeout(r, durationMs));
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
      duration * 1000,
      fps,
      startTime * 1000
    );

    const data = base64.replace(/^data:[^,]+,/, '');
    webmBuffer = Buffer.from(data, 'base64');
  } finally {
    await browser.close();
    server.close();
  }

  const webmPath = path.join(OUTPUT_DIR, `${SKETCH_ID}-raw.webm`);
  fs.writeFileSync(webmPath, webmBuffer);
  const sizeMB = (webmBuffer.length / 1024 / 1024).toFixed(2);
  console.log(`Saved: ${webmPath} (${sizeMB} MB)`);
}

record().catch(err => {
  console.error('Recording failed:', err);
  process.exit(1);
});
