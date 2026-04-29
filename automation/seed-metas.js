// GenDrop - One-time helper to seed meta.json files for all sketches
// Usage:
//   node automation/seed-metas.js [--force]
//
// Looks at sketches/ and creates meta.json in any folder that doesn't yet
// have one, using the appropriate series template inferred from the folder
// name (e.g. 005-zn-26036 -> "zn" series).
//
// With --force, overwrites existing meta.json files (USE WITH CAUTION).

const fs = require('fs');
const path = require('path');

const force = process.argv.includes('--force');

const SKETCHES_DIR = path.resolve(__dirname, '..', 'sketches');

const TEMPLATES = {
  ma: {
    series: "MA",
    project: "Genmapping",
    concept:
      "闇の中に生まれる小さな光の鼓動から、幾何学が出現し、曼荼羅へと形成され、" +
      "再び中心へ還っていく循環を描いた作品。日本的な「間（MA）」の感覚を起点に、" +
      "空間・呼吸・秩序の生成と回帰を可視化している。神聖幾何学を再現するのではなく、" +
      "アルゴリズムによって\"生きた構造\"として再構築する試み。",
    techniques: [
      "p5.js",
      "generative animation",
      "particle system",
      "noise field",
      "radial geometry",
      "procedural mandala",
      "pulse-based animation",
      "layered transparency",
      "slow rotation system"
    ],
    mood: "静謐"
  },
  zn: {
    series: "ZN",
    project: "Genmapping",
    concept:
      "今この瞬間にしか存在しない一回性のかたちを、アルゴリズムによって描き出す" +
      "ジェネラティブアート。禅の精神 ─ 一期一会・無常・簡素 ─ を起点に、" +
      "複雑さを削ぎ落とした構造の生成と消滅を可視化する。同じ瞬間は二度と来ない。" +
      "一筆ごとが完結であり、次の一筆との連続性に意味は要らない。" +
      "そのような「禅」の時間感覚を、生成的アルゴリズムで再構築する試み。",
    techniques: [
      "p5.js",
      "generative animation",
      "minimal composition",
      "single-stroke aesthetic",
      "enso (circular form)",
      "temporal singularity",
      "void / negative space",
      "subtle gradient",
      "non-repeating motion"
    ],
    mood: "静寂・瞑想・余白"
  },
  ha: {
    series: "HA",
    project: "Genmapping",
    concept:
      "波として立ち現れ、波として消えていく — 形のない揺らぎを幾何学に翻訳する" +
      "ジェネラティブアート。流体や粒子の境界を曖昧にしながら、絶え間ない動き" +
      "そのものが構造となるプロセスを描く。「波（HA）」という最も根源的なリズムを、" +
      "アルゴリズムによって可視化する試み。",
    techniques: [
      "p5.js",
      "generative animation",
      "wave function",
      "fluid dynamics",
      "particle interaction",
      "noise-driven flow",
      "layered transparency",
      "soft motion blur"
    ],
    mood: "流動・有機・呼吸的"
  },
  to: {
    series: "TO",
    project: "Genmapping",
    concept:
      "垂直に立ち上がる構造の純粋幾何学。地から天へ、点から無限へ — " +
      "一方向の運動が積層して塔となるプロセスをアルゴリズムで描くジェネラティブアート。" +
      "「塔（TO）」が象徴する到達への意志、その上昇の連続性を、" +
      "生成的な構造として再構築する試み。",
    techniques: [
      "p5.js",
      "generative animation",
      "vertical composition",
      "stacking geometry",
      "perspective layering",
      "ascending motion",
      "structural repetition",
      "minimal palette"
    ],
    mood: "静謐・上昇感・幾何学的"
  },
  og: {
    series: "OG",
    project: "Genmapping",
    concept:
      "始原のかたち。複雑さが生まれる以前にすでにあった構造を、アルゴリズムによって" +
      "辿り直すジェネラティブアート。原子・細胞・記憶の最小単位が呼応するように立ち現れる。" +
      "「起源（OG = Origin）」というテーマを、削ぎ落とされた幾何学で表現する試み。",
    techniques: [
      "p5.js",
      "generative animation",
      "primordial geometry",
      "cellular pattern",
      "minimal seed",
      "iterative growth",
      "low-noise rendering",
      "gradient shadow"
    ],
    mood: "原初的・静謐・低ノイズ"
  },
  wa: {
    series: "WA",
    project: "Genmapping",
    concept:
      "閉じることで生まれる完結性。輪・和・環 — 「WA」が示す円の概念を、" +
      "生成的な構造として再構築するジェネラティブアート。すべてが調和し、" +
      "戻ってくる場所としての円。日本的な美意識である「和」を、" +
      "アルゴリズムの反復と対称性で可視化する試み。",
    techniques: [
      "p5.js",
      "generative animation",
      "circular geometry",
      "symmetric pattern",
      "harmonic motion",
      "looping cycle",
      "radial composition",
      "warm tone"
    ],
    mood: "調和・温和・循環的"
  },
  ra: {
    series: "RA",
    project: "Genmapping",
    concept:
      "螺旋として進む時間。直線でも円でもない、戻りながら前に進む構造を描く" +
      "ジェネラティブアート。「螺（RA）」が示す立体的な反復は、変化と継続の" +
      "両義性を帯びる。同じパターンが少しずつズレながら積層していくことで、" +
      "新しい風景が立ち現れる。",
    techniques: [
      "p5.js",
      "generative animation",
      "spiral structure",
      "phase-shifted repetition",
      "layered rotation",
      "progressive variance",
      "depth illusion",
      "rhythmic movement"
    ],
    mood: "動的・幾何学的・進行的"
  }
};

function parseFolderName(name) {
  // Expected format: NNN-<series>-<id>   e.g. 012-ha-260312
  const m = name.match(/^(\d+)-([a-z]+)-(.+)$/);
  if (!m) return null;
  return {
    seq: m[1],
    seriesKey: m[2],
    workId: m[3],
    fullCode: `${m[2].toUpperCase()}-${m[3]}`
  };
}

function buildMeta(parsed) {
  const tpl = TEMPLATES[parsed.seriesKey];
  if (!tpl) {
    return {
      title: parsed.fullCode,
      concept: "TODO: コンセプトを記述",
      techniques: ["TODO"],
      mood: "TODO"
    };
  }
  return {
    title: parsed.fullCode,
    series: tpl.series,
    project: tpl.project,
    concept: tpl.concept,
    techniques: tpl.techniques,
    mood: tpl.mood
  };
}

function main() {
  const folders = fs
    .readdirSync(SKETCHES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  let created = 0;
  let skipped = 0;
  let failed = 0;
  const summary = { byFolder: [], bySeries: {} };

  for (const name of folders) {
    const parsed = parseFolderName(name);
    if (!parsed) {
      console.warn(`(skip) ${name} - cannot parse folder name`);
      failed++;
      continue;
    }

    const metaPath = path.join(SKETCHES_DIR, name, 'meta.json');
    const exists = fs.existsSync(metaPath);

    if (exists && !force) {
      console.log(`(exists)  ${name}`);
      skipped++;
      summary.byFolder.push({ name, action: 'exists', series: parsed.seriesKey });
      continue;
    }

    const meta = buildMeta(parsed);
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
    console.log(`(created) ${name}   series=${parsed.seriesKey}`);
    created++;

    summary.bySeries[parsed.seriesKey] = (summary.bySeries[parsed.seriesKey] || 0) + 1;
    summary.byFolder.push({ name, action: 'created', series: parsed.seriesKey });
  }

  console.log('');
  console.log('=== Summary ===');
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed : ${failed}`);
  if (Object.keys(summary.bySeries).length > 0) {
    console.log('Created by series:');
    for (const [k, v] of Object.entries(summary.bySeries)) {
      console.log(`  ${k.toUpperCase().padEnd(4)} : ${v}`);
    }
  }
}

main();
