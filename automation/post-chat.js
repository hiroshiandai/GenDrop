// Post automation/output/<sketchId>-post.txt to Google Chat (Incoming Webhook).
// Usage: node post-chat.js <sketch_id>
//
// Env: GOOGLE_CHAT_WEBHOOK_URL (required)

const fs = require('fs');
const path = require('path');

const sketchId = process.argv[2];
const WEBHOOK = process.env.GOOGLE_CHAT_WEBHOOK_URL || '';

if (!sketchId) {
  console.error('Usage: node post-chat.js <sketch_id>');
  process.exit(1);
}

if (!WEBHOOK) {
  console.log('GOOGLE_CHAT_WEBHOOK_URL not set — skip Chat post.');
  process.exit(0);
}

const postPath = path.join(__dirname, 'output', `${sketchId}-post.txt`);
if (!fs.existsSync(postPath)) {
  console.error(`Missing ${postPath} — run generate-metadata.js first.`);
  process.exit(1);
}

const content = fs.readFileSync(postPath, 'utf8');
const max = 4000;
const body = content.length > max ? content.slice(0, max) + '\n\n…(truncated)' : content;
const payload = { text: `*GenDrop · ${sketchId}*\n${body}` };

async function main() {
  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Chat webhook HTTP ${res.status}: ${t}`);
  }
  console.log('Posted to Google Chat.');
}

main().catch(err => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
