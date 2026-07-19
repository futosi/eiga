// こども映画カレンダー データ更新スクリプト（Node 18+ / 依存なし）
// 109シネマズ二子玉川で上映中・公開予定の作品を取得して data.json を生成する。
// 使い方: node scripts/update.mjs   （GitHub Actions から週1で実行）

import { writeFileSync, readFileSync } from "node:fs";

const THEATER = "futakotamagawa";
const BASE = "https://109cinemas.net";
const UA = { headers: { "User-Agent": "Mozilla/5.0 (compatible; kodomo-eiga-bot/1.0)" } };

// ---- 子ども向け判定用キーワード ----
const KID = [ // 幼児〜子ども向け
  "アンパンマン","パウ・パトロール","パウパトロール","プリキュア","仮面ライダー","スーパー戦隊",
  "ウルトラマン","きかんしゃトーマス","しまじろう","べべフィン","BebeFinn","おかあさんといっしょ",
  "ワンピース","ポケモン","ポケットモンスター","たまごっち","プリンセス","シナモロール","サンリオ",
  "妖怪ウォッチ","デジモン","ケロロ","おしり探偵","トミカ","プラレール","ヒーロー"
];
const FAM = [ // 家族みんな向け（全年齢）
  "ちいかわ","ドラえもん","クレヨンしんちゃん","名探偵コナン","トイ・ストーリー","トイストーリー",
  "ミニオン","ディズニー","ピクサー","モアナ","アナと雪の女王","インサイド・ヘッド","カーズ",
  "ズートピア","マリオ","スーパーマリオ","ジブリ","となりのトトロ","すみっコぐらし","スヌーピー",
  "パディントン","ソニック","シンカリオン","マインクラフト","ムーミン"
];

function classify(title) {
  if (KID.some(k => title.includes(k))) return "kid";
  if (FAM.some(k => title.includes(k))) return "fam";
  return "gen";
}
function ageOf(cat) {
  return cat === "kid" ? "幼児〜小学生" : cat === "fam" ? "全年齢（幼児〜大人）" : "中学生〜大人";
}
function kidScoreOf(cat) { return cat === "kid" ? 10 : cat === "fam" ? 8 : 2; }

async function fetchText(url) {
  const res = await fetch(url, UA);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return await res.text();
}

// 二子玉川で上映する作品のIDを一覧ページから抽出
async function futakoIds(listPath) {
  const html = await fetchText(BASE + listPath);
  const re = new RegExp(`movies/(\\d+)\\.html\\?t=${THEATER}`, "gi");
  const ids = new Set();
  let m;
  while ((m = re.exec(html))) ids.add(m[1]);
  return [...ids];
}

// 作品ページから構造化データ（microadTd.TKC.start({...})）を取得
async function movieInfo(id) {
  const html = await fetchText(`${BASE}/movies/${id}.html`);
  // microadTd.TKC.start({...}) 内の各フィールドを個別に拾う
  const block = (html.match(/microadTd\.TKC\.start\(\{[\s\S]*?\}\)/) || [""])[0];
  const grab = (name) => {
    const mm = block.match(new RegExp(`"${name}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    return mm ? mm[1].replace(/\\"/g, '"') : "";
  };
  const title = grab("title");
  if (!title) return null;
  const rd = grab("release_date"); // "2026.07.24"
  const date = rd ? rd.replace(/\./g, "-") : "";
  // 作品ページの /media/ サムネイル画像（640x360）を1枚取得
  const imgM = html.match(/\/media\/[A-Za-z0-9_=/-]+\.(?:jpg|jpeg|png|webp)/i);
  const img = imgM ? BASE + imgM[0] : "";
  return {
    id,
    t: title,
    date,                       // YYYY-MM-DD（不明なら空）
    img,                        // サムネイル画像URL（無ければ空）
    actor: grab("actor"),
    director: grab("director"),
    env: grab("facility_environment"),
    site: `${BASE}/movies/${id}.html?t=${THEATER}`,
  };
}

function applyOverrides(movie, overrides) {
  for (const o of overrides) {
    if (movie.t.includes(o.match)) {
      if (o.cat) movie.cat = o.cat;
      if (o.mubi) movie.mubi = o.mubi;
    }
  }
  return movie;
}

async function main() {
  const overrides = JSON.parse(readFileSync(new URL("../overrides.json", import.meta.url))).overrides || [];

  const nowIds = await futakoIds("/nowshowing/");
  const soonIds = await futakoIds("/comingsoon/");
  const status = new Map();
  nowIds.forEach(id => status.set(id, "now"));
  soonIds.forEach(id => { if (!status.has(id)) status.set(id, "soon"); });

  const movies = [];
  for (const id of status.keys()) {
    try {
      const info = await movieInfo(id);
      if (!info) continue;
      info.status = status.get(id);         // now | soon
      info.cat = classify(info.t);
      applyOverrides(info, overrides);
      info.age = info.age || ageOf(info.cat);
      info.kidScore = kidScoreOf(info.cat);
      movies.push(info);
    } catch (e) {
      console.error("skip", id, e.message);
    }
  }

  const out = {
    theater: "109シネマズ二子玉川",
    theaterUrl: `${BASE}/${THEATER}/`,
    updated: new Date().toISOString(),
    count: movies.length,
    movies,
  };
  const json = JSON.stringify(out, null, 2);
  // data.js: <script src> で読めるので file:// でもCORSなしで動く
  writeFileSync(new URL("../data.js", import.meta.url),
    "// 自動生成ファイル（scripts/update.mjs が週1で更新）。手動編集しないこと。\n" +
    "window.MOVIE_DATA = " + json + ";\n");
  // 参照用に data.json も出力
  writeFileSync(new URL("../data.json", import.meta.url), json + "\n");
  console.log(`data.js 更新: ${movies.length}作品 (上映中 ${nowIds.length} / 公開予定 ${soonIds.length})`);
}

main().catch(e => { console.error(e); process.exit(1); });
