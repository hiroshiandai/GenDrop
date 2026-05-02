// GenDrop - One-time OAuth setup
//
// Google Cloud Console → OAuth 2.0 クライアント →「承認済みのリダイレクト URI」に必ず登録:
//   http://localhost:3000/oauth2callback
// （GitHub ユーザー名・Pages URL はこのスクリプトでは使いません）
// Usage: node auth-setup.js
//
// This script does:
//   1. Reads client_secret.json (downloaded from Google Cloud Console)
//   2. Opens your default browser for Google sign-in
//   3. Receives the OAuth callback on http://localhost:3000
//   4. Exchanges the auth code for a refresh token
//   5. Prints the values you need to register as GitHub Secrets
//
// You only need to run this ONCE per Google account.

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const { exec } = require('child_process');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const CALLBACK_PORT = 3000;
const CALLBACK_PATH = '/oauth2callback';
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`;

const credPath = path.resolve(__dirname, 'client_secret.json');

if (!fs.existsSync(credPath)) {
  console.error('client_secret.json not found at:', credPath);
  console.error('Place the OAuth client JSON file there first.');
  process.exit(1);
}

const credRaw = JSON.parse(fs.readFileSync(credPath, 'utf8'));
const cred = credRaw.installed || credRaw.web;
if (!cred || !cred.client_id || !cred.client_secret) {
  console.error('Invalid client_secret.json - missing client_id / client_secret.');
  console.error('The file should look like: { "installed": { "client_id": "...", "client_secret": "...", ... } }');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  cred.client_id,
  cred.client_secret,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES
});

function openBrowser(targetUrl) {
  const platform = process.platform;
  let cmd;
  if (platform === 'win32') {
    cmd = `start "" "${targetUrl}"`;
  } else if (platform === 'darwin') {
    cmd = `open "${targetUrl}"`;
  } else {
    cmd = `xdg-open "${targetUrl}"`;
  }
  exec(cmd, err => {
    if (err) {
      console.log('(Could not open browser automatically. Please open the URL manually.)');
    }
  });
}

async function main() {
  console.log('=== GenDrop OAuth Setup ===');
  console.log('');
  console.log('Client ID:', cred.client_id);
  console.log('Redirect : ', REDIRECT_URI);
  console.log('Scope    : ', SCOPES.join(' '));
  console.log('');
  console.log('Opening browser for Google sign-in...');
  console.log('If browser does not open, copy this URL manually:');
  console.log('');
  console.log(authUrl);
  console.log('');

  openBrowser(authUrl);

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsed = url.parse(req.url, true);
        if (!parsed.pathname.startsWith(CALLBACK_PATH)) {
          res.writeHead(404).end('Not found');
          return;
        }
        const q = parsed.query;
        if (q.error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h1>Authorization error</h1><p>${q.error}</p>`);
          server.close();
          reject(new Error('OAuth error: ' + q.error));
          return;
        }
        if (!q.code) {
          res.writeHead(400).end('No code provided');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html><body style="font-family:sans-serif;padding:40px;background:#0b0b0b;color:#eee;">
            <h1>GenDrop OAuth - Success</h1>
            <p>You can close this window and return to the terminal.</p>
          </body></html>
        `);
        server.close();
        resolve(q.code);
      } catch (e) {
        reject(e);
      }
    });
    server.listen(CALLBACK_PORT, () => {
      console.log(`Local callback server listening on port ${CALLBACK_PORT}...`);
      console.log('Waiting for you to approve access in the browser...');
    });
  });

  console.log('');
  console.log('Authorization code received. Exchanging for tokens...');

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.error('');
    console.error('ERROR: No refresh_token returned.');
    console.error('This usually means you have already authorized this client before.');
    console.error('Solution: revoke access at https://myaccount.google.com/permissions');
    console.error('then re-run this script.');
    process.exit(1);
  }

  const tokenPath = path.resolve(__dirname, 'token.json');
  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));

  console.log('');
  console.log('=== SUCCESS ===');
  console.log('');
  console.log('Refresh token saved locally to: token.json');
  console.log('(Already gitignored - this file will NOT be committed.)');
  console.log('');
  console.log('-----------------------------------------------------------');
  console.log('Add the following 3 values to your GitHub Secrets:');
  console.log('  Repository -> Settings -> Secrets and variables -> Actions');
  console.log('-----------------------------------------------------------');
  console.log('');
  console.log('GOOGLE_OAUTH_CLIENT_ID');
  console.log(cred.client_id);
  console.log('');
  console.log('GOOGLE_OAUTH_CLIENT_SECRET');
  console.log(cred.client_secret);
  console.log('');
  console.log('GOOGLE_OAUTH_REFRESH_TOKEN');
  console.log(tokens.refresh_token);
  console.log('');
  console.log('-----------------------------------------------------------');
  console.log('');
  console.log('Done.');
}

main().catch(err => {
  console.error('Setup failed:', err && err.message ? err.message : err);
  process.exit(1);
});
