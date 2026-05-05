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

const prompt = `あなたは ジェネラティブアート と YouTube Shorts に詳しいバイリンガルのコピーライターです。
以下の作品について、YouTube Shorts 投稿用テキストを **日本語版と英語版の両方** で生成してください。

【作品情報】
タイトル: ${meta.title || sketchId}
コンセプト: ${meta.concept || '(未設定)'}
技法: ${(meta.techniques || []).join(', ') || '(未設定)'}
雰囲気: ${meta.mood || '(未設定)'}
作品ID: ${sketchId}

【出力要件】
- title_ja: 日本語タイトル（最大40文字程度、興味を引く、絵文字1個まで可）
- title_en: 英語タイトル（英語ネイティブ向け、意味は title_ja と対応。最大約60文字）
- description_ja: 日本語の動画説明文（150〜300文字、改行可）
- description_en: 英語の動画説明文（英訳ではなく英語で自然なコピー。120〜220語程度、改行可。内容は description_ja と対応）
- hashtags: ハッシュタグ12〜15個（# は付けない、配列で返す）。日本語タグと英語タグを混在。generativeart, p5js, processing, codeart, creativecoding などを必ず含む

【トーン】
- 神秘的・知的・少しポエティック（日英とも同じトーン）
- 押しつけがましくない、内省的
- 「素晴らしい」「美しい」など主観形容詞は控えめに`;

async function callGemini() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          title_ja: { type: 'STRING' },
          title_en: { type: 'STRING' },
          description_ja: { type: 'STRING' },
          description_en: { type: 'STRING' },
          hashtags: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          }
        },
        required: ['title_ja', 'title_en', 'description_ja', 'description_en', 'hashtags']
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

  const tJa = result.title_ja || result.title || '';
  const tEn = result.title_en || '';
  const dJa = result.description_ja || result.description || '';
  const dEn = result.description_en || '';

  return [
    '【日本語 / Japanese】',
    tJa,
    '',
    dJa,
    '',
    '【English】',
    tEn,
    '',
    dEn,
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
  console.log('Title (JA) :', result.title_ja);
  console.log('Title (EN) :', result.title_en);
  const dj = result.description_ja || '';
  const de = result.description_en || '';
  console.log('Desc (JA)  :', dj.slice(0, 80) + (dj.length > 80 ? '...' : ''));
  console.log('Desc (EN)  :', de.slice(0, 80) + (de.length > 80 ? '...' : ''));
  console.log('Hashtags   :', (result.hashtags || []).join(' '));
  console.log('');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const metaJsonPath = path.join(OUTPUT_DIR, `${sketchId}-meta.json`);
  const titleJa = result.title_ja || result.title || '';
  const titleEn = result.title_en || '';
  const descriptionJa = result.description_ja || result.description || '';
  const descriptionEn = result.description_en || '';
  const metaJson = {
    sketchId,
    generatedAt: new Date().toISOString(),
    sourceMeta: meta,
    title_ja: titleJa,
    title_en: titleEn,
    description_ja: descriptionJa,
    description_en: descriptionEn,
    title: titleJa,
    description: descriptionJa,
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
