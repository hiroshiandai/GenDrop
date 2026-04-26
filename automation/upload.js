// GenDrop - Upload generated assets to Google Drive (OAuth user delegation)
// Usage: node upload.js <sketch_id> [start_time]
//
// Required env vars:
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET
//   GOOGLE_OAUTH_REFRESH_TOKEN
//   DRIVE_SHORTS_FOLDER_ID
//   DRIVE_THUMBS_FOLDER_ID
//
// Why OAuth instead of Service Account?
//   Service Accounts have 0 storage quota on personal Google Drive,
//   so file uploads always fail with 'storageQuotaExceeded'.
//   OAuth user delegation uploads files as the user, using the user's quota.

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const sketchId = process.argv[2] || '001-ma-26039';
const startTime = process.argv[3] || '0';

const OUTPUT_DIR = path.resolve(__dirname, 'output');
const mp4Path = path.join(OUTPUT_DIR, `${sketchId}-shorts.mp4`);
const jpgPath = path.join(OUTPUT_DIR, `${sketchId}-thumb.jpg`);

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
const shortsFolderId = process.env.DRIVE_SHORTS_FOLDER_ID;
const thumbsFolderId = process.env.DRIVE_THUMBS_FOLDER_ID;

const missing = [];
if (!clientId) missing.push('GOOGLE_OAUTH_CLIENT_ID');
if (!clientSecret) missing.push('GOOGLE_OAUTH_CLIENT_SECRET');
if (!refreshToken) missing.push('GOOGLE_OAUTH_REFRESH_TOKEN');
if (!shortsFolderId) missing.push('DRIVE_SHORTS_FOLDER_ID');
if (!thumbsFolderId) missing.push('DRIVE_THUMBS_FOLDER_ID');
if (missing.length > 0) {
  console.error('Missing required env vars:');
  for (const k of missing) console.error('  -', k);
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
oauth2Client.setCredentials({ refresh_token: refreshToken });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

async function uploadFile(localPath, folderId, displayName, mimeType) {
  if (!fs.existsSync(localPath)) {
    throw new Error(`File not found: ${localPath}`);
  }
  const stat = fs.statSync(localPath);

  const res = await drive.files.create({
    requestBody: {
      name: displayName,
      parents: [folderId]
    },
    media: {
      mimeType,
      body: fs.createReadStream(localPath)
    },
    fields: 'id, name, webViewLink, size'
  });

  return {
    ...res.data,
    localSize: stat.size
  };
}

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`
  );
}

async function main() {
  console.log('=== GenDrop Drive Uploader (OAuth) ===');
  console.log(`Sketch ID:     ${sketchId}`);
  console.log(`Auth method:   OAuth 2.0 user delegation (drive.file scope)`);
  console.log(`shorts folder: ${shortsFolderId}`);
  console.log(`thumbs folder: ${thumbsFolderId}`);
  console.log('');

  const ts = timestamp();
  const startStr = startTime !== '0' ? `-s${startTime}` : '';
  const baseName = `${sketchId}${startStr}-${ts}`;

  console.log(`Uploading ${baseName}.mp4 to shorts/ ...`);
  const mp4 = await uploadFile(mp4Path, shortsFolderId, `${baseName}.mp4`, 'video/mp4');
  console.log(`  ok id=${mp4.id} (${(mp4.localSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  ${mp4.webViewLink}`);

  console.log(`Uploading ${baseName}.jpg to thumbs/ ...`);
  const jpg = await uploadFile(jpgPath, thumbsFolderId, `${baseName}.jpg`, 'image/jpeg');
  console.log(`  ok id=${jpg.id} (${(jpg.localSize / 1024).toFixed(1)} KB)`);
  console.log(`  ${jpg.webViewLink}`);

  console.log('');
  console.log('Upload complete.');

  const summary = {
    sketchId,
    startTime,
    uploadedAt: new Date().toISOString(),
    baseName,
    mp4: { id: mp4.id, name: mp4.name, link: mp4.webViewLink },
    thumb: { id: jpg.id, name: jpg.name, link: jpg.webViewLink }
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${sketchId}-upload.json`),
    JSON.stringify(summary, null, 2)
  );
}

main().catch(err => {
  console.error('Upload failed:', err && err.message ? err.message : err);
  if (err && err.errors) console.error(err.errors);
  process.exit(1);
});
