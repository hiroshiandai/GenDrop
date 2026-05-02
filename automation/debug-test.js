// Quick diagnostic for failed sketches: load page, capture all console + errors
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const sketchId = process.argv[2] || '008-ma-26037';
const SKETCH_DIR = path.resolve(__dirname, '..', 'sketches', sketchId);
const REPO_ROOT = path.resolve(__dirname, '..');
const PORT = 8766;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let url = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      if (url === '' || url.endsWith('/')) url += 'index.html';
      const filePath = path.join(REPO_ROOT, url);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.log(`[404] /${url}`);
          res.writeHead(404); res.end('Not Found'); return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  const server = await startServer();
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 540 });

  page.on('console', m => console.log(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => console.log(`[PAGEERROR] ${e.message}`));
  page.on('requestfailed', r => console.log(`[REQFAIL] ${r.url()} - ${r.failure()?.errorText}`));
  page.on('response', r => {
    if (r.status() >= 400) console.log(`[HTTP ${r.status()}] ${r.url()}`);
  });

  const url = `http://127.0.0.1:${PORT}/sketches/${sketchId}/`;
  console.log(`>>> Loading ${url}`);
  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('>>> Page loaded.');
    await new Promise(r => setTimeout(r, 2000));
    const info = await page.evaluate(() => ({
      hasCanvas: !!document.querySelector('canvas'),
      canvasW: document.querySelector('canvas')?.width,
      canvasH: document.querySelector('canvas')?.height,
      bodyHTML: document.body?.innerHTML?.slice(0, 200),
      p5Loaded: typeof window.p5 !== 'undefined',
      setupExists: typeof window.setup === 'function',
      drawExists: typeof window.draw === 'function'
    }));
    console.log('>>> Page info:', JSON.stringify(info, null, 2));
  } catch (e) {
    console.log(`>>> goto error: ${e.message}`);
  }

  await browser.close();
  server.close();
})();
