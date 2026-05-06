// GenDrop - Upload generated assets to Google Drive (OAuth user delegation)
// Usage: node upload.js <sketch_id> [start_time]
//
// Required env vars:
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET
//   GOOGLE_OAUTH_REFRESH_TOKEN
//   DRIVE_SHORTS_FOLDER_ID
//   DRIVE_THUMBS_FOLDER_ID
//   DRIVE_FULL_FOLDER_ID      (optional — 9:16 full-length archival MP4)
//   DRIVE_METADATA_FOLDER_ID  (optional - skipped if not set)
//
// Optional env:
//   GENDROP_REQUIRE_FULL_DRIVE_UPLOAD — if "1"/"true": fail when full MP4 exists but
//     DRIVE_FULL_FOLDER_ID is missing/blank (use on GenDrop Record). If unset, full upload
//     is skipped when the secret is missing (e.g. verify-all matrix).
//   GENDROP_SKIP_FULL_DRIVE_UPLOAD — if "1": never upload full to Drive (artifact only).
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
const fullMp4Path = path.join(OUTPUT_DIR, `${sketchId}-full.mp4`);
const jpgPath = path.join(OUTPUT_DIR, `${sketchId}-thumb.jpg`);
const metaJsonPath = path.join(OUTPUT_DIR, `${sketchId}-meta.json`);
const postTxtPath = path.join(OUTPUT_DIR, `${sketchId}-post.txt`);

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
const shortsFolderId = process.env.DRIVE_SHORTS_FOLDER_ID;
const thumbsFolderId = process.env.DRIVE_THUMBS_FOLDER_ID;
const fullFolderIdRaw = process.env.DRIVE_FULL_FOLDER_ID;
const fullFolderId = fullFolderIdRaw ? String(fullFolderIdRaw).trim() : '';
const metadataFolderId = process.env.DRIVE_METADATA_FOLDER_ID;
const requireFullDrive =
  process.env.GENDROP_REQUIRE_FULL_DRIVE_UPLOAD === '1' ||
  /^true$/i.test(process.env.GENDROP_REQUIRE_FULL_DRIVE_UPLOAD || '');
const skipFullDrive = process.env.GENDROP_SKIP_FULL_DRIVE_UPLOAD === '1';

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
  console.log(`full folder:   ${fullFolderId ? '(DRIVE_FULL_FOLDER_ID is set)' : '(not set)'}`);
  console.log('');

  const ts = timestamp();
  const startStr = startTime !== '0' ? `-s${startTime}` : '';
  const baseName = `${sketchId}${startStr}-${ts}`;

  console.log(`Uploading ${baseName}.mp4 to shorts/ ...`);
  const mp4 = await uploadFile(mp4Path, shortsFolderId, `${baseName}.mp4`, 'video/mp4');
  console.log(`  ok id=${mp4.id} (${(mp4.localSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  ${mp4.webViewLink}`);

  const fullMp4Exists = fs.existsSync(fullMp4Path);
  const fullMp4Size = fullMp4Exists ? fs.statSync(fullMp4Path).size : 0;

  let fullMp4 = null;
  if (skipFullDrive) {
    console.log('GENDROP_SKIP_FULL_DRIVE_UPLOAD=1 — full MP4 Drive upload disabled for this run.');
  } else if (fullFolderId) {
    if (fullMp4Exists && fullMp4Size > 0) {
      console.log(`Uploading ${baseName}-full.mp4 to full/ ...`);
      fullMp4 = await uploadFile(fullMp4Path, fullFolderId, `${baseName}-full.mp4`, 'video/mp4');
      console.log(`  ok id=${fullMp4.id} (${(fullMp4.localSize / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`  ${fullMp4.webViewLink}`);
    } else {
      const msg = `Full MP4 missing or empty: ${fullMp4Path}`;
      console.error(msg);
      process.exit(1);
    }
  } else {
    console.log('(DRIVE_FULL_FOLDER_ID not set — full-length MP4 not uploaded to Drive.)');
    if (requireFullDrive && fullMp4Exists && fullMp4Size > 0) {
      console.error('');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('  GenDrop: full-length video was generated but NOT uploaded.');
      console.error('  Add repository Secret DRIVE_FULL_FOLDER_ID = Google Drive');
      console.error('  folder ID for "GenDrop/full" (open the folder in Drive, copy');
      console.error('  the id from the URL: .../folders/THIS_PART).');
      console.error('  Or set workflow input skip_full_drive_upload=true to skip.');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('');
      process.exit(1);
    }
  }

  console.log(`Uploading ${baseName}.jpg to thumbs/ ...`);
  const jpg = await uploadFile(jpgPath, thumbsFolderId, `${baseName}.jpg`, 'image/jpeg');
  console.log(`  ok id=${jpg.id} (${(jpg.localSize / 1024).toFixed(1)} KB)`);
  console.log(`  ${jpg.webViewLink}`);

  let metaUp = null;
  let postUp = null;
  if (metadataFolderId) {
    if (fs.existsSync(metaJsonPath)) {
      console.log(`Uploading ${baseName}.json to metadata/ ...`);
      metaUp = await uploadFile(metaJsonPath, metadataFolderId, `${baseName}.json`, 'application/json');
      console.log(`  ok id=${metaUp.id}`);
      console.log(`  ${metaUp.webViewLink}`);
    } else {
      console.log(`(skip) ${metaJsonPath} not found - metadata generation may have been skipped.`);
    }
    if (fs.existsSync(postTxtPath)) {
      console.log(`Uploading ${baseName}.txt to metadata/ ...`);
      postUp = await uploadFile(postTxtPath, metadataFolderId, `${baseName}.txt`, 'text/plain');
      console.log(`  ok id=${postUp.id}`);
      console.log(`  ${postUp.webViewLink}`);
    } else {
      console.log(`(skip) ${postTxtPath} not found.`);
    }
  } else {
    console.log('(DRIVE_METADATA_FOLDER_ID not set - metadata upload skipped.)');
  }

  console.log('');
  console.log('Upload complete.');

  const summary = {
    sketchId,
    startTime,
    uploadedAt: new Date().toISOString(),
    baseName,
    mp4: { id: mp4.id, name: mp4.name, link: mp4.webViewLink },
    fullMp4: fullMp4
      ? { id: fullMp4.id, name: fullMp4.name, link: fullMp4.webViewLink }
      : null,
    thumb: { id: jpg.id, name: jpg.name, link: jpg.webViewLink },
    meta: metaUp ? { id: metaUp.id, name: metaUp.name, link: metaUp.webViewLink } : null,
    post: postUp ? { id: postUp.id, name: postUp.name, link: postUp.webViewLink } : null
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
