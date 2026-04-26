// GenDrop - Generate YouTube Shorts metadata using Gemini API
// Usage: node generate-metadata.js <sketch_id>
//
// Required env vars:
//   GEMINI_API_KEY
//
// Optional env vars:
//   GEMINI_MODEL      Default: gemini-2.5-flash  (free tier compatible)
//                     Other options:
//                       gemini-2.5-flash-lite       (free tier, lighter)
//                       gemini-3-flash-preview      (paid - requires prepayment credits)
//                       gemini-3.1-flash-lite-preview (paid)
//
// Inputs:
//   ../sketches/<sketch_id>/meta.json   (title, concept, techniques, mood)
//
// Outputs:
//   ./output/<sketch_id>-meta.json      (structured JSON)
//   ./output/<sketch_id>-post.txt       (ready-to-paste YouTube Shorts text)

const fs = require('fs');
const path = require('path');

const sketchId = process.argv[2] || '001-ma-26039';

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!apiKey) {
  console.error('GEMINI_API_KEY env var is missing.');
  process.exit(1);
}

const SKETCHES_DIR = path.resolve(__dirname, '..', 'sketches');
const OUTPUT_DIR = path.resolve(__dirname, 'output');
const sketchMetaPath = path.join(SKETCHES_DIR, sketchId, 'meta.json');

if (!fs.existsSync(sketchMetaPath)) {
  console.error(`meta.json not found at ${sketchMetaPath}`);
  console.error('Please add meta.json to the sketch folder with: title, concept, techniques, mood');
  process.exit(1);
}

const meta = JSON.parse(fs.readFileSync(sketchMetaPath, 'utf8'));

const prompt = `あなたは ジェネラティブアート と YouTube Shorts に詳しいコピーライターです。
以下の作品について、YouTube Shorts 投稿用テキストを日本語で生成してください。

【作品情報】
タイトル: ${meta.title || sketchId}
コンセプト: ${meta.concept || '(未設定)'}
技法: ${(meta.techniques || []).join(', ') || '(未設定)'}
雰囲気: ${meta.mood || '(未設定)'}
作品ID: ${sketchId}

【出力要件】
- title: 日本語タイトル（最大40文字、興味を引く、絵文字1個まで使用可）
- description: 日本語の動画説明文（150〜300文字、作品の魅力が伝わる文章。改行可）
- hashtags: ハッシュタグ12〜15個（# は付けない、配列で返す）。半分は日本語、半分は英語。ジェネラティブアート界隈の定番タグ（generativeart, p5js, processing, codeart, creativecoding など）を必ず含む

【トーン】
- 神秘的・知的・少しポエティック
- 押しつけがましくない、内省的
- 「素晴らしい」「美しい」など主観形容詞は控えめに、作品が自ら語る感じ`;

async function callGemini() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          description: { type: 'STRING' },
          hashtags: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          }
        },
        required: ['title', 'description', 'hashtags']
      }
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates && data.candidates[0]
    && data.candidates[0].content
    && data.candidates[0].content.parts
    && data.candidates[0].content.parts[0]
    && data.candidates[0].content.parts[0].text;
  if (!text) {
    throw new Error('Gemini returned no text content. Raw response: ' + JSON.stringify(data));
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error('Failed to parse Gemini response as JSON. Raw text: ' + text);
  }
  return parsed;
}

function buildPostText(result) {
  const tags = (result.hashtags || []).map(h => (h.startsWith('#') ? h : '#' + h));
  if (!tags.includes('#shorts')) tags.push('#shorts');
  const tagLine = tags.join(' ');

  return [
    result.title,
    '',
    result.description,
    '',
    tagLine,
    ''
  ].join('\n');
}

async function main() {
  console.log('=== GenDrop Metadata Generator (Gemini) ===');
  console.log(`Sketch ID:  ${sketchId}`);
  console.log(`Source:     ${sketchMetaPath}`);
  console.log(`Model:      ${modelName}`);
  console.log('');
  console.log('Calling Gemini API...');

  const result = await callGemini();

  console.log('');
  console.log('=== Generated ===');
  console.log('Title      :', result.title);
  console.log('Description:', result.description.slice(0, 80) + (result.description.length > 80 ? '...' : ''));
  console.log('Hashtags   :', (result.hashtags || []).join(' '));
  console.log('');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const metaJsonPath = path.join(OUTPUT_DIR, `${sketchId}-meta.json`);
  const metaJson = {
    sketchId,
    generatedAt: new Date().toISOString(),
    sourceMeta: meta,
    title: result.title,
    description: result.description,
    hashtags: result.hashtags
  };
  fs.writeFileSync(metaJsonPath, JSON.stringify(metaJson, null, 2));

  const postTxtPath = path.join(OUTPUT_DIR, `${sketchId}-post.txt`);
  fs.writeFileSync(postTxtPath, buildPostText(result));

  console.log(`Saved: ${metaJsonPath}`);
  console.log(`Saved: ${postTxtPath}`);
}

main().catch(err => {
  console.error('Metadata generation failed:', err && err.message ? err.message : err);
  process.exit(1);
});
