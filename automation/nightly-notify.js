// GenDrop - Nightly: pick a random .txt under sketches/, or fall back to Gemini post.txt for a random sketch.
// Sends body to Google Chat Incoming Webhook when enabled.
//
// Env:
//   GOOGLE_CHAT_WEBHOOK_URL  — Chat webhook URL (required to actually post)
//   GENDROP_CHAT_NOTIFY      — if "0" or "false", exit immediately without posting
//   GEMINI_API_KEY           — required only when no .txt exists under sketches/

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const SKETCHES_DIR = path.join(REPO_ROOT, 'sketches');
const OUTPUT_DIR = path.join(__dirname, 'output');

const WEBHOOK = process.env.GOOGLE_CHAT_WEBHOOK_URL || '';
const NOTIFY = process.env.GENDROP_CHAT_NOTIFY;
const GEMINI = process.env.GEMINI_API_KEY || '';

function chatNotifyDisabled() {
  if (!NOTIFY) return false;
  const v = String(NOTIFY).trim().toLowerCase();
  return v === '0' || v === 'false' || v === 'off' || v === 'no';
}

function walkTxts(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkTxts(p, acc);
    else if (ent.isFile() && ent.name.endsWith('.txt')) acc.push(p);
  }
  return acc;
}

function listSketchIds() {
  if (!fs.existsSync(SKETCHES_DIR)) throw new Error(`Missing ${SKETCHES_DIR}`);
  return fs
    .readdirSync(SKETCHES_DIR)
    .filter(n => fs.statSync(path.join(SKETCHES_DIR, n)).isDirectory())
    .sort();
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function postChat(text) {
  const max = 3500;
  const body = text.length > max ? text.slice(0, max) + '\n\n…(truncated)' : text;
  const payload = {
    text: `*GenDrop nightly*\n${body}`
  };
  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Chat webhook HTTP ${res.status}: ${t}`);
  }
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

async function main() {
  console.log('=== GenDrop nightly notify ===');

  if (chatNotifyDisabled()) {
    console.log('GENDROP_CHAT_NOTIFY is off — skipping.');
    return;
  }

  if (!WEBHOOK) {
    console.log('GOOGLE_CHAT_WEBHOOK_URL not set — nothing to post (exit 0).');
    return;
  }

  const txts = walkTxts(SKETCHES_DIR);
  let sourceLabel;
  let content;

  if (txts.length > 0) {
    const picked = pickRandom(txts);
    sourceLabel = path.relative(REPO_ROOT, picked);
    content = readUtf8(picked);
    console.log(`Picked random TXT: ${sourceLabel} (${content.length} chars)`);
  } else {
    if (!GEMINI) {
      console.error(
        'No .txt under sketches/ and GEMINI_API_KEY is missing — cannot fall back to generate-metadata.js'
      );
      process.exit(1);
    }
    const sketches = listSketchIds();
    if (sketches.length === 0) throw new Error('No sketch folders');
    const sketchId = pickRandom(sketches);
    sourceLabel = `${sketchId} (Gemini post.txt fallback)`;
    console.log(`No sketches/**/*.txt — generating post for random sketch: ${sketchId}`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const r = spawnSync(process.execPath, ['generate-metadata.js', sketchId], {
      cwd: __dirname,
      env: process.env,
      stdio: 'inherit'
    });
    if (r.status !== 0) {
      process.exit(r.status || 1);
    }
    const postPath = path.join(OUTPUT_DIR, `${sketchId}-post.txt`);
    if (!fs.existsSync(postPath)) {
      console.error(`Expected output missing: ${postPath}`);
      process.exit(1);
    }
    content = readUtf8(postPath);
  }

  await postChat(`_${sourceLabel}_\n\n${content}`);
  console.log('Posted to Google Chat.');
}

main().catch(err => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
