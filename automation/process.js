// GenDrop - FFmpeg post-processing
// Usage: node process.js <sketch_id> [duration_seconds]
// Converts 960x540 webm into 1080x1920 (9:16) MP4 with title overlay

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const sketchId = process.argv[2] || '001-ma-26039';
const duration = parseInt(process.argv[3] || '30', 10);

const OUTPUT_DIR = path.resolve(__dirname, 'output');
const inputPath = path.join(OUTPUT_DIR, `${sketchId}-raw.webm`);
const outputPath = path.join(OUTPUT_DIR, `${sketchId}-shorts.mp4`);
const thumbPath = path.join(OUTPUT_DIR, `${sketchId}-thumb.jpg`);

if (!fs.existsSync(inputPath)) {
  console.error(`Input not found: ${inputPath}`);
  process.exit(1);
}

// Filter complex: blurred copy of the artwork as ambient background
//   1. Split source into two streams
//   2. Background: fill 1080x1920, heavy Gaussian blur, darken + saturate
//   3. Foreground: scale to 1080 wide preserving aspect (artwork is sharp)
//   4. Overlay foreground centered on blurred background
const filterComplex = [
  '[0:v]split=2[main][bg]',
  '[bg]scale=-2:1920:flags=lanczos,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.2:saturation=1.35[bgfinal]',
  '[main]scale=1080:-2:flags=lanczos[fg]',
  '[bgfinal][fg]overlay=(W-w)/2:(H-h)/2:format=auto[out]'
].join(';');

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
  console.log(`Input:  ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log('');

  await runFFmpeg([
    '-y',
    '-i', inputPath,
    '-t', String(duration),
    '-filter_complex', filterComplex,
    '-map', '[out]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '20',
    '-preset', 'medium',
    '-r', '30',
    '-an',
    outputPath
  ]);

  await runFFmpeg([
    '-y',
    '-ss', String(Math.min(3, Math.floor(duration / 2))),
    '-i', outputPath,
    '-frames:v', '1',
    '-q:v', '2',
    thumbPath
  ]);

  const stat = fs.statSync(outputPath);
  console.log('');
  console.log(`Output : ${outputPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Thumb  : ${thumbPath}`);
}

main().catch(err => {
  console.error('Processing failed:', err);
  process.exit(1);
});
