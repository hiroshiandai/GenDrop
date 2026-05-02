// GenDrop - FFmpeg post-processing (dual output)
// Usage: node process.js <sketch_id> [shorts_duration_seconds] [fps]
//
// Inputs:
//   SKETCH_ID-raw.webm      → SKETCH_ID-shorts.mp4  (Shorts look: blurred 9:16 frame)
//   SKETCH_ID-full-raw.webm → SKETCH_ID-full.mp4    (entire full-raw duration, letterboxed 9:16)

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const sketchId = process.argv[2] || '001-ma-26039';
const shortsDuration = parseInt(process.argv[3] || '30', 10);
const fps = parseInt(process.argv[4] || '30', 10);

const OUTPUT_DIR = path.resolve(__dirname, 'output');
const shortsInput = path.join(OUTPUT_DIR, `${sketchId}-raw.webm`);
const fullInput = path.join(OUTPUT_DIR, `${sketchId}-full-raw.webm`);
const shortsOutput = path.join(OUTPUT_DIR, `${sketchId}-shorts.mp4`);
const fullOutput = path.join(OUTPUT_DIR, `${sketchId}-full.mp4`);
const thumbPath = path.join(OUTPUT_DIR, `${sketchId}-thumb.jpg`);

if (!fs.existsSync(shortsInput)) {
  console.error(`Input not found: ${shortsInput}`);
  process.exit(1);
}

if (!fs.existsSync(fullInput)) {
  console.error(`Input not found: ${fullInput}`);
  process.exit(1);
}

const shortsFilterComplex = [
  '[0:v]split=2[main][bg]',
  '[bg]scale=-2:1920:flags=lanczos,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.2:saturation=1.35[bgfinal]',
  '[main]scale=1080:-2:flags=lanczos[fg]',
  '[bgfinal][fg]overlay=(W-w)/2:(H-h)/2:format=auto[out]'
].join(';');

const fullFilterComplex = [
  '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos',
  'pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black[out]'
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
  console.log(`Sketch:        ${sketchId}`);
  console.log(`Shorts input:  ${shortsInput}`);
  console.log(`Full input:    ${fullInput} (encode full duration — matches one loop raw)`);
  console.log(`Shorts dur:    ${shortsDuration}s | fps: ${fps}`);
  console.log('');

  await runFFmpeg([
    '-y',
    '-i', shortsInput,
    '-t', String(shortsDuration),
    '-filter_complex', shortsFilterComplex,
    '-map', '[out]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '20',
    '-preset', 'medium',
    '-r', String(fps),
    '-an',
    shortsOutput
  ]);

  await runFFmpeg([
    '-y',
    '-i', fullInput,
    '-filter_complex', fullFilterComplex,
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
  console.log(`Shorts : ${shortsOutput} (${(shortsStat.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Full   : ${fullOutput} (${(fullStat.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Thumb  : ${thumbPath}`);
}

main().catch(err => {
  console.error('Processing failed:', err);
  process.exit(1);
});
