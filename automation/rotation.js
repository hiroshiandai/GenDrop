// GenDrop - Pick next sketch index from automation/state.json (repo-backed rotation).
// Usage:
//   node rotation.js pick          → prints sketch folder name to stdout
//   node rotation.js advance     → increments cursor after a successful pipeline run

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SKETCHES_DIR = path.join(REPO_ROOT, 'sketches');
const STATE_FILE = path.join(__dirname, 'state.json');

function listSketches() {
  if (!fs.existsSync(SKETCHES_DIR)) {
    throw new Error(`Sketches directory not found: ${SKETCHES_DIR}`);
  }
  return fs
    .readdirSync(SKETCHES_DIR)
    .filter(name => fs.statSync(path.join(SKETCHES_DIR, name)).isDirectory())
    .sort();
}

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`Missing ${STATE_FILE}; commit the initial state.json from the repo.`);
  }
  const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  if (typeof data.cursor !== 'number' || data.cursor < 0 || !Number.isInteger(data.cursor)) {
    throw new Error('state.json: cursor must be a non-negative integer');
  }
  return data;
}

function saveState(state) {
  state.last_success_at = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

const cmd = process.argv[2];

if (cmd === 'pick') {
  const sketches = listSketches();
  if (sketches.length === 0) throw new Error('No sketch folders under sketches/');
  const state = loadState();
  const sketchId = sketches[state.cursor % sketches.length];
  process.stdout.write(sketchId);
} else if (cmd === 'advance') {
  const sketches = listSketches();
  if (sketches.length === 0) throw new Error('No sketch folders under sketches/');
  const state = loadState();
  const currentId = sketches[state.cursor % sketches.length];
  state.last_sketch_id = currentId;
  state.cursor = (state.cursor + 1) % sketches.length;
  saveState(state);
  console.error(`Advanced rotation: ran ${currentId}, next cursor=${state.cursor}`);
} else {
  console.error('Usage: node rotation.js pick | advance');
  process.exit(1);
}
