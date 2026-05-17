// GenDrop - FFmpeg post-processing (dual full-loop outputs)
// Usage: node process.js <sketch_id> [shorts_duration_seconds] [fps]
//
// Inputs:
//   SKETCH_ID-vertical-raw.webm   → SKETCH_ID-shorts.mp4  (9:16 full loop → Drive shorts/)
//   SKETCH_ID-landscape-raw.webm  → SKETCH_ID-full.mp4    (16:9 full loop → Drive full/)
//
// shorts_duration is only used for thumbnail seek offset (legacy argv compat).

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const sketchId = process.argv[2] || '001-ma-26039';
const shortsDuration = parseInt(process.argv[3] || '30', 10);
const fps = parseInt(process.argv[4] || '30', 10);

const OUTPUT_DIR = path.resolve(__dirname, 'output');
const verticalInput = path.join(OUTPUT_DIR, `${sketchId}-vertical-raw.webm`);
const landscapeInput = path.join(OUTPUT_DIR, `${sketchId}-landscape-raw.webm`);
const shortsOutput = path.join(OUTPUT_DIR, `${sketchId}-shorts.mp4`);
const fullOutput = path.join(OUTPUT_DIR, `${sketchId}-full.mp4`);
const thumbPath = path.join(OUTPUT_DIR, `${sketchId}-thumb.jpg`);

if (!fs.existsSync(verticalInput)) {
  console.error(`Input not found: ${verticalInput}`);
  process.exit(1);
}

if (!fs.existsSync(landscapeInput)) {
  console.error(`Input not found: ${landscapeInput}`);
  process.exit(1);
}

const verticalFilterComplex = [
  '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos',
  'pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black[out]'
].join(',');

const landscapeFilterComplex = [
  '[0:v]scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos',
  'pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black[out]'
].join(',');

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log(`> ffmpeg ${args.join(' ')}`);
    const proc = spawn('ffmpeg', args, { stdio: 'inherit' });
    proc.on('close', code => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
    proc.on('error', reject);
  });
}

async function main() {
  console.log('=== GenDrop Processor ===');
  console.log(`Sketch:          ${sketchId}`);
  console.log(`9:16 input:      ${verticalInput} → ${shortsOutput} (Drive shorts/)`);
  console.log(`16:9 input:      ${landscapeInput} → ${fullOutput} (Drive full/)`);
  console.log(`fps:             ${fps}`);
  console.log('');

  await runFFmpeg([
    '-y',
    '-i', verticalInput,
    '-filter_complex', verticalFilterComplex,
    '-map', '[out]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '16',
    '-preset', 'slow',
    '-r', String(fps),
    '-an',
    shortsOutput
  ]);

  await runFFmpeg([
    '-y',
    '-i', landscapeInput,
    '-filter_complex', landscapeFilterComplex,
    '-map', '[out]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '16',
    '-preset', 'slow',
    '-r', String(fps),
    '-an',
    fullOutput
  ]);

  await runFFmpeg([
    '-y',
    '-ss', String(Math.min(3, Math.floor(shortsDuration / 2))),
    '-i', shortsOutput,
    '-frames:v', '1',
    '-q:v', '2',
    thumbPath
  ]);

  const shortsStat = fs.statSync(shortsOutput);
  const fullStat = fs.statSync(fullOutput);
  console.log('');
  console.log(`9:16 (shorts): ${shortsOutput} (${(shortsStat.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`16:9 (full):   ${fullOutput} (${(fullStat.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Thumb:         ${thumbPath}`);
}

main().catch(err => {
  console.error('Processing failed:', err);
  process.exit(1);
});
