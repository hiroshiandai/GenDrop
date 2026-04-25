// GenDrop - Upload generated assets to Google Drive
// Usage: node upload.js <sketch_id> [start_time]
// Required env vars:
//   GOOGLE_SERVICE_ACCOUNT_KEY - JSON content of service account key
//   DRIVE_FOLDER_ID            - Drive folder ID of "GenDrop" parent folder

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const sketchId = process.argv[2] || '001-ma-26039';
const startTime = process.argv[3] || '0';

const OUTPUT_DIR = path.resolve(__dirname, 'output');
const mp4Path = path.join(OUTPUT_DIR, `${sketchId}-shorts.mp4`);
const jpgPath = path.join(OUTPUT_DIR, `${sketchId}-thumb.jpg`);

const credentialsRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const parentFolderId = process.env.DRIVE_FOLDER_ID;

if (!credentialsRaw) {
  console.error('GOOGLE_SERVICE_ACCOUNT_KEY env var is missing.');
  process.exit(1);
}
if (!parentFolderId) {
  console.error('DRIVE_FOLDER_ID env var is missing.');
  process.exit(1);
}

let credentials;
try {
  credentials = JSON.parse(credentialsRaw);
} catch (err) {
  console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY as JSON:', err.message);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

async function findSubfolder(name) {
  const safeName = name.replace(/'/g, "\\'");
  const q = [
    `'${parentFolderId}' in parents`,
    `name = '${safeName}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`
  ].join(' and ');

  const res = await drive.files.list({
    q,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 10
  });

  if (!res.data.files || res.data.files.length === 0) {
    throw new Error(`Subfolder '${name}' not found in parent ${parentFolderId}`);
  }
  return res.data.files[0].id;
}

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
    fields: 'id, name, webViewLink, size',
    supportsAllDrives: true
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
  console.log('=== GenDrop Drive Uploader ===');
  console.log(`Sketch ID:      ${sketchId}`);
  console.log(`Service acct:   ${credentials.client_email}`);
  console.log(`Parent folder:  ${parentFolderId}`);
  console.log('');

  console.log('Locating subfolders...');
  const shortsFolderId = await findSubfolder('shorts');
  const thumbsFolderId = await findSubfolder('thumbs');
  console.log(`  shorts/  -> ${shortsFolderId}`);
  console.log(`  thumbs/  -> ${thumbsFolderId}`);
  console.log('');

  const ts = timestamp();
  const startStr = startTime !== '0' ? `-s${startTime}` : '';
  const baseName = `${sketchId}${startStr}-${ts}`;

  console.log(`Uploading ${baseName}.mp4 to shorts/ ...`);
  const mp4 = await uploadFile(mp4Path, shortsFolderId, `${baseName}.mp4`, 'video/mp4');
  console.log(`  ✓ id=${mp4.id} (${(mp4.localSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  ${mp4.webViewLink}`);

  console.log(`Uploading ${baseName}.jpg to thumbs/ ...`);
  const jpg = await uploadFile(jpgPath, thumbsFolderId, `${baseName}.jpg`, 'image/jpeg');
  console.log(`  ✓ id=${jpg.id} (${(jpg.localSize / 1024).toFixed(1)} KB)`);
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
