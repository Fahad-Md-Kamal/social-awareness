"use strict";
/* Nihongo Roadmap: single-page app. All data lives in data.js (plain static data, nothing to build). */

const D = window.DATA || { kana: [], vocab: [], kanji: [] };
const LD = window.LEVEL_DATA || {};
D.kinfo = D.kinfo || {};
D.vocab.forEach(v => { v.lv = "N5"; });
D.kanji.forEach(k => { k.lv = "N5"; });
Object.values(D.kinfo).forEach(i => { if (i.deck) i.lv = "N5"; });
for (const [lv, c] of Object.entries(LD)) {
  (c.vocab || []).forEach(([j, r, e, b, t, kf]) => D.vocab.push({ j, r, e, b, t, kf: kf || "", se: "", sb: "", lv }));
  (c.kanji || []).forEach(([k, on, kun, e, b]) => { D.kanji.push({ k, on, kun, e, b, lv }); D.kinfo[k] = { e, b, deck: true, lv }; });
  (c.kinfo || []).forEach(([k, e, b]) => { if (!D.kinfo[k]) D.kinfo[k] = { e, b, deck: false }; });
}
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- storage (every access guarded; the page works without it) ---------- */
const KEY = "nihongo-roadmap-v2";
let S = { start: null, days: {}, tasks: {}, known: { vocab: {}, kanji: {} } };
try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* ignore */ }
S.known = S.known || { vocab: {}, kanji: {} };
S.known.vocab = S.known.vocab || {};
S.known.kanji = S.known.kanji || {};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };

/* ---------- audio ---------- */
function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP"; u.rate = 0.8;
    const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith("ja"));
    if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
    return !!v;
  } catch (e) { return false; }
}
if (window.speechSynthesis) speechSynthesis.getVoices();
const NO_VOICE = `<span class="muted small">No Japanese voice found in this browser, so no audio. Try Chrome or Edge, or install a Japanese text-to-speech voice.</span>`;

/* ---------- dates ---------- */
const pad = n => String(n).padStart(2, "0");
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const todayKey = () => keyOf(new Date());
const dayNumber = () => S.start ? Math.round((fromKey(todayKey()) - fromKey(S.start)) / 86400000) + 1 : 0;

/* ---------- plan content: 2-month N5 plan (kana days, then weekly topics) ---------- */
const KANA_DAYS = [
  ["あいうえお + かきくけこ", "Say the 5 vowels (আ ই উ এ ও). Write each kana 10 times with its hook.", "kana"],
  ["さしすせそ + たちつてと", "Recite the row chant. Learn greetings: おはよう, こんにちは, ありがとう.", "kana"],
  ["なにぬねの + はひふへほ", "Learn numbers 0-10. Remember the irregular sounds: শি চি ৎসু ফু.", "kana"],
  ["まみむめも + やゆよ + らりるれろ", "Self-introduction: わたしは ○○ です.", "kana"],
  ["わをん + all 46 hiragana review", "Quiz yourself on all hiragana from memory; aim for 90%.", "kana"],
  ["Voiced sounds (゛ ゜)", "が ざ だ ば ぱ rows. Read がっこう, ともだち.", "kana"],
  ["Combos, small っ, long vowels", "Light day: きゃ しゅ ちょ. Review weak kana.", "kana"],
  ["Katakana ア-ト rows", "Compare look-alikes: シ/ツ, ソ/ン.", "kana"],
  ["Katakana ハ-ン rows", "Read IT words: コンピューター, ネットワーク.", "kana"],
  ["Katakana voiced + combos", "Long vowel ー and small ッ.", "kana"],
  ["Mixed reading", "Read words, signs and menus in both scripts.", "kana"],
  ["Full kana test", "Write all kana from memory. Target: 95% reading, 90% writing.", "kana"],
  ["Review weak kana", "Light day: only the kana you miss.", "kana"],
  ["Buffer + vocabulary preview", "Open Vocabulary and learn the first greetings and numbers.", "vocab"]
];
const WEEKS = [
  ["Week 3: Genki L1-2 topics", "X は Y です, numbers, time, これ/それ/あれ, ここ/そこ/あそこ. Kanji: 日 月 火 水 木 金 土, 本 人 山 川 田.", "grammar"],
  ["Week 4: Genki L2-3 topics", "Review L1-2. Start ます-form basics. Quiz yourself on weeks 3-4.", "grammar"],
  ["Week 5: verbs", "ます / ません / ました, particles を に へ で と, ~ませんか, ~ましょう. Kanji: 食 飲 見 行 来.", "grammar"],
  ["Week 6: existence", "あります / います, position words (うえ, した, なか), と / や. Kanji: 大 小 高 安 新 古. Mixed quiz.", "grammar"],
  ["Week 7: adjectives", "い-/な-adjectives, たい, past tense. Kanji: 白 黒 先 生 学. Start official sample questions.", "grammar"],
  ["Week 8: て-form and review", "て-form, ~てください, ~ています, ~から. Kanji: 休 話 読 書 聞. Take two timed sectional tests.", "grammar"]
];
const BLOCKS = [
  ["a", "Anki / flashcard reviews", "30 min"],
  ["b", "New lesson (kana, vocab or grammar)", "70 min"],
  ["c", "Listening and shadowing aloud", "25 min"],
  ["d", "Output: write and say 5 sentences", "25 min"]
];

function planFor(d) {
  if (d < 1) return ["Not started yet", "Your plan starts on the date you picked.", "kana"];
  if (d <= 14) return [`Day ${d}: ${KANA_DAYS[d - 1][0]}`, KANA_DAYS[d - 1][1], KANA_DAYS[d - 1][2]];
  const w = Math.ceil(d / 7);
  if (w <= 8) return [WEEKS[w - 3][0], WEEKS[w - 3][1], WEEKS[w - 3][2]];
  return ["Month 3: finish N5", "Genki L8-12 topics, remaining kanji (~100 total), weekly full mock tests (target 75% in each section).", "roadmap"];
}

/* ---------- level data (roadmap view) ---------- */
const LEVELS = [
  { id: "N5", color: "var(--n5)", hours: 200, vocab: "~800", kanji: "~100", pass: "80 / 180", months: "~3",
    goal: "Read kana and simple kanji; handle greetings, self-introduction, numbers, time, shopping basics.",
    focus: "Kana, core particles, ます-form, adjectives, simple て-form. Listening to slow, clear speech.",
    grammar: ["です / ではありません", "は が を に へ で の と も か", "ます-form (present, past, negative)", "あります / います", "い- and な-adjectives", "たい, ましょう, ませんか", "て-form basics: てください, ています"],
    tasks: ["Read and write all hiragana", "Read and write all katakana", "Learn ~100 kanji (numbers, days, people, basic verbs)", "Learn ~800 words (use the Vocabulary page)", "Finish N5 grammar (see the Grammar page)", "Introduce yourself aloud in Japanese (1 minute)", "Take 3 timed mock tests, each 75% or better", "Pass the official JLPT N5 sample questions"],
    resources: [["Minato (Japan Foundation) A1 courses", "https://minato-jf.jp/", "free"], ["Irodori A1 Starter PDFs", "https://www.irodori.jpf.go.jp/", "free"], ["JLPT official N5 sample questions", "https://www.jlpt.jp/e/samples/forlearners.html", "free"], ["Tae Kim's Guide to Japanese", "https://guidetojapanese.org/learn/", "free"], ["Jisho dictionary", "https://jisho.org", "free"], ["Genki I textbook", "", "paid"]],
    tip: "Bangla word order matches Japanese (verb last), and particles act like Bangla suffixes: を ~ কে, に ~ এ/তে, の ~ এর." },
  { id: "N4", color: "var(--n4)", hours: 400, vocab: "~1,500", kanji: "~300", pass: "90 / 180", months: "~6",
    goal: "Follow slow everyday conversation; read short, simple texts about daily life.",
    focus: "Plain form, conjunctions, giving/receiving, potential and conditional forms. Build kanji reading speed.",
    grammar: ["Plain forms (present/past)", "てもいい, てはいけない, なければならない", "Potential: ~られる / ~ことができる", "Conditionals: ~たら, ~と, ~ば (intro)", "Volitional: ~よう, ~つもり", "あげる / くれる / もらう", "~ながら, ~てから, ~前に / ~後で", "Passive and causative (intro)", "Reason: ~から, ~ので"],
    tasks: ["Learn ~300 kanji total", "Learn ~1,500 words total", "Finish N4 grammar list", "Read one short NHK Easy article per day", "Write a 5-sentence daily diary", "Hold a 10-minute conversation with a tutor", "Take 4 full mocks, each 70% or better in every section"],
    resources: [["Minato A2 courses", "https://minato-jf.jp/", "free"], ["Tae Kim's Guide (intermediate sections)", "https://guidetojapanese.org/learn/", "free"], ["NHK News Web Easy", "https://www3.nhk.or.jp/news/easy/", "free"], ["JLPT official N4 sample questions", "https://www.jlpt.jp/e/samples/forlearners.html", "free"], ["Genki II textbook", "", "paid"]],
    tip: "From N4 on, kanji is the main bottleneck. Learn kanji inside words (食べる, 食事), not in isolation." },
  { id: "N3", color: "var(--n3)", hours: 700, vocab: "~3,700", kanji: "~650", pass: "95 / 180", months: "~11",
    goal: "Understand everyday topics at natural speed; read newspaper headlines and short articles with effort.",
    focus: "Intermediate grammar, reading comprehension, listening at natural speed. Start reading real material.",
    grammar: ["Passive, causative, causative-passive", "Keigo basics: 尊敬語 / 謙譲語", "Conditionals in depth: ~ば, ~たら, ~なら, ~と", "~ようにする / ~ようになる / ~ことにする / ~ことになる", "~わけ, ~はず, ~らしい, ~みたい", "~ために / ~ように", "~たところ, ~ばかり, ~だけでなく"],
    tasks: ["Learn ~650 kanji total", "Learn ~3,700 words total", "Finish N3 grammar list", "Read one NHK Easy / short article daily", "Watch one drama episode weekly with Japanese subtitles", "Do long reading passages twice a week", "Take 5 timed mocks, each 70% or better"],
    resources: [["Shin Kanzen Master N3", "", "paid"], ["Tobira / Quartet textbooks", "", "paid"], ["Imabi (free grammar site)", "https://www.imabi.net/", "free"], ["NHK News Web Easy", "https://www3.nhk.or.jp/news/easy/", "free"], ["Aozora Bunko (free classic texts)", "https://www.aozora.gr.jp/", "free"]],
    tip: "Switch your phone, GitHub notifications and documentation to Japanese where possible. Technical reading is a free daily N3 drill." },
  { id: "N2", color: "var(--n2)", hours: 1200, vocab: "~6,000", kanji: "~1,000", pass: "90 / 180", months: "~18-20",
    goal: "Read news, essays and technical specs; understand natural-speed conversation and news in many settings.",
    focus: "Business keigo, abstract vocabulary, long reading passages, fast listening, formal writing.",
    grammar: ["~に対して, ~に関して, ~について", "~ものの, ~にもかかわらず, ~一方で", "~かねない, ~わけにはいかない, ~ざるを得ない", "Business keigo set phrases", "Formal connectors (しかし, ところが, したがって)", "~に違いない, ~かもしれない, ~に決まっている"],
    tasks: ["Learn ~1,000 kanji total", "Learn ~6,000 words total", "Finish N2 grammar list", "Read a regular NHK news article daily", "Practise 15-minute reading passages in 20 minutes", "Write 200-character summaries weekly", "Take 6 timed mocks, each 70% or better in every section", "Do one mock interview in Japanese"],
    resources: [["Shin Kanzen Master N2 series", "", "paid"], ["Imabi (advanced sections)", "https://www.imabi.net/", "free"], ["NHK News", "https://www3.nhk.or.jp/news/", "free"], ["Aozora Bunko", "https://www.aozora.gr.jp/", "free"], ["Qiita (Japanese developer blog)", "https://qiita.com/", "free"]],
    tip: "Qiita and Zenn are free Japanese developer blogs. Posts on your stack (Django, AWS) build N2 reading and job vocabulary at once." },
  { id: "N1", color: "var(--n1)", hours: 1800, vocab: "~10,000", kanji: "~2,000", pass: "100 / 180", months: "~28-30",
    goal: "Understand complex written texts and fast spoken Japanese across many contexts.",
    focus: "Abstract and literary vocabulary, rare grammar, long argumentative texts, fast news and lectures.",
    grammar: ["~ずにはいられない, ~をもって, ~を余儀なくされる", "~といえども, ~ならでは, ~をよそに", "Nuanced modality and hedging", "Newspaper-style compressed sentences", "Honorific and humble forms in depth"],
    tasks: ["Learn ~2,000 kanji total", "Learn ~10,000 words total", "Finish N1 grammar list", "Read long-form articles weekly", "Take weekly N1 mocks; 70% or better in every section", "Listen to news or lectures at full speed without a transcript", "Write a 400+ character opinion essay weekly"],
    resources: [["Shin Kanzen Master N1 series", "", "paid"], ["NHK News", "https://www3.nhk.or.jp/news/", "free"], ["Aozora Bunko", "https://www.aozora.gr.jp/", "free"]],
    tip: "N1 is long-term. Many people reach N2 first and then N1 through daily immersion at work in Japan." }
];
const lvlPct = L => Math.round(100 * L.tasks.filter((_, i) => S.tasks[L.id + i]).length / L.tasks.length);


/* ---------- Word parts: sounds (consonant + vowel per kana) and kanji ---------- */
const KMAP = {};
D.kana.forEach(d => { KMAP[d.h] = d; KMAP[d.k] = d; });
const SMALL_V = { "ぁ": "あ", "ぃ": "い", "ぅ": "う", "ぇ": "え", "ぉ": "お", "ァ": "ア", "ィ": "イ", "ゥ": "ウ", "ェ": "エ", "ォ": "オ" };
const isKata = ch => ch >= "ァ" && ch <= "ヺ";
const CJK = /[一-鿿々]/;

function splitCV(r) {
  if (r.length === 1 && "aiueo".includes(r)) return { c: "", v: r };
  return { c: r.slice(0, -1), v: r[r.length - 1] };
}

function moraSplit(reading) {
  const chars = [...reading.split(" / ")[0]];
  const units = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i], nx = chars[i + 1];
    if (ch === "ー") { units.push({ t: ch, kind: "long" }); continue; }
    if (ch === "っ" || ch === "ッ") { units.push({ t: ch, kind: "stop" }); continue; }
    if (nx && KMAP[ch + nx]) { const d = KMAP[ch + nx]; units.push(Object.assign({ t: ch + nx, kata: isKata(ch), bn: d.b.split(" ")[0] }, splitCV(d.r))); i++; continue; }
    if (nx && SMALL_V[nx] && KMAP[ch]) {
      const base = splitCV(KMAP[ch].r), vow = splitCV(KMAP[SMALL_V[nx]].r).v;
      units.push({ t: ch + nx, kata: isKata(ch), c: base.c || (base.v === "u" ? "w" : ""), v: vow, bn: "" }); i++; continue;
    }
    const d = KMAP[ch];
    if (!d) { units.push({ t: ch, kind: "other" }); continue; }
    if (d.r === "n") { units.push({ t: ch, kind: "n", kata: isKata(ch), bn: d.b.split(" ")[0] }); continue; }
    units.push(Object.assign({ t: ch, kata: isKata(ch), bn: d.b.split(" ")[0] }, splitCV(d.r)));
  }
  return units;
}

function partsHtml(w) {
  const units = moraSplit(w.r), text = w.r.split(" / ")[0];
  const hasH = [...text].some(c => c >= "ぁ" && c <= "ゟ"), hasK = [...text].some(isKata);
  const script = hasH && hasK ? "hiragana + katakana" : hasK ? "katakana" : "hiragana";
  const chip = u => {
    if (u.kind === "long") return `<div class="part"><div class="pk jp">ー</div><div class="pf">long vowel</div><div class="pb">আগের স্বর টানো</div></div>`;
    if (u.kind === "stop") return `<div class="part"><div class="pk jp">${esc(u.t)}</div><div class="pf">pause</div><div class="pb">পরের ব্যঞ্জন দ্বিত্ব</div></div>`;
    if (u.kind === "n") return `<div class="part"><div class="pk jp">${esc(u.t)}</div><div class="pf"><span class="pc">n</span> only</div><div class="pb">${esc(u.bn)}</div></div>`;
    if (u.kind === "other") return `<div class="part"><div class="pk jp">${esc(u.t)}</div></div>`;
    return `<div class="part ${u.kata ? "kata" : ""}"><div class="pk jp">${esc(u.t)}</div><div class="pf">${u.c ? `<span class="pc">${esc(u.c)}</span> + ` : ""}<span class="pv">${esc(u.v)}</span></div><div class="pb">${esc(u.bn)}</div></div>`;
  };
  const formula = units.map(u => u.kind === "long" ? "ー" : u.kind === "stop" ? "っ" : u.kind === "n" ? "n" : u.kind === "other" ? u.t : (u.c ? `${u.c}+${u.v}` : u.v)).join(" · ");
  let html = `<section class="dsec"><h3>How it sounds</h3>
    <p class="small muted">${units.length} beat${units.length === 1 ? "" : "s"} · ${script}. Each kana = <span class="pc">consonant</span> + <span class="pv">vowel</span>.</p>
    <div class="pchips">${units.map(chip).join("")}</div><div class="formula">${esc(formula)}</div></section>`;
  if (w.kf) {
    const kchips = [...w.kf].map(ch => {
      if (CJK.test(ch)) {
        const k = (D.kinfo || {})[ch];
        return `<div class="part kj"><div class="pk jp">${esc(ch)}</div><div class="pf">${k ? esc(k.e.split(";")[0]) : ""}</div><div class="pb">${k ? esc(k.b.split(";")[0]) : ""}</div>${k && k.deck ? `<div class="pdeck">in ${esc(k.lv || "N5")} kanji</div>` : ""}</div>`;
      }
      return `<div class="part"><div class="pk jp">${esc(ch)}</div><div class="pf">kana ending</div></div>`;
    }).join("");
    html += `<section class="dsec"><h3>How it's written</h3><p class="small muted">Kanji spelling: <b class="jp">${esc(w.kf)}</b></p><div class="pchips">${kchips}</div>`
      + (w.se ? `<div class="tip" style="--c:var(--n2)">💡 ${esc(w.se)}<br><span class="muted">${esc(w.sb)}</span></div>` : "") + `</section>`;
  } else {
    html += `<section class="dsec"><h3>How it's written</h3><p class="small muted">This word is normally written in kana only.</p></section>`;
  }
  return html;
}

/* ---------- Word info popup (modal dialog) ---------- */
const INFO_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".6" fill="currentColor"/></svg>`;
let dlgCtx = { list: [], i: 0 };

function openWord(list, i) {
  dlgCtx = { list, i };
  const dlg = $("#wordDialog");
  drawWord();
  if (!dlg.open) { dlg.showModal(); document.documentElement.classList.add("noscroll"); }
}

function drawWord() {
  const { list, i } = dlgCtx, w = list[i], dlg = $("#wordDialog");
  const first = w.r.split(" / ")[0];
  dlg.innerHTML = `<div class="dlg-head">
      <div><div class="jp dlg-word" id="dlgTitle">${esc(w.j)}</div><div class="jp muted">${esc(w.r)}${w.kf ? ` · 漢字 ${esc(w.kf)}` : ""}</div></div>
      <button class="icon-btn" id="dlgClose" aria-label="Close">✕</button></div>
    <div class="dlg-body">
      <section class="dsec"><h3>Meaning</h3><div>${esc(w.e)}</div><div class="muted">${esc(w.b)}</div>
        <div class="row" style="margin-top:8px"><button class="btn" id="dlgSay">🔊 Listen</button><span class="pill">${esc(w.t)}</span><span class="pill">${esc(w.lv || "N5")}</span></div></section>
      ${partsHtml(w)}
    </div>
    <div class="dlg-foot">
      <button class="btn" id="dlgPrev" ${i === 0 ? "disabled" : ""}>‹ Previous</button>
      <label class="chk"><input type="checkbox" id="dlgKnown" ${S.known.vocab[w.j] ? "checked" : ""}><span>I know this word</span></label>
      <button class="btn" id="dlgNext" ${i >= list.length - 1 ? "disabled" : ""}>Next ›</button></div>`;
  $("#dlgClose").onclick = () => dlg.close();
  $("#dlgSay").onclick = () => { if (!speak(first)) alert("No Japanese voice found in this browser."); };
  $("#dlgKnown").onchange = e => { S.known.vocab[w.j] = e.target.checked; save(); if (location.hash === "#/vocab") { const y = window.scrollY; render(); window.scrollTo(0, y); } };
  $("#dlgPrev").onclick = () => { dlgCtx.i--; drawWord(); };
  $("#dlgNext").onclick = () => { dlgCtx.i++; drawWord(); };
}

(() => {
  const dlg = $("#wordDialog");
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => document.documentElement.classList.remove("noscroll"));
  dlg.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft" && dlgCtx.i > 0) { dlgCtx.i--; drawWord(); }
    if (e.key === "ArrowRight" && dlgCtx.i < dlgCtx.list.length - 1) { dlgCtx.i++; drawWord(); }
  });
})();

/* =====================================================================
   VIEWS
   ===================================================================== */
const views = {};

/* ---------- Today ---------- */
views.today = root => {
  const d = dayNumber(), tk = todayKey();
  const done = S.days[tk] || {};
  const doneCount = BLOCKS.filter(b => done[b[0]]).length;
  const streak = (() => {
    let n = 0; const c = new Date();
    if (BLOCKS.some(b => !(S.days[keyOf(c)] || {})[b[0]])) c.setDate(c.getDate() - 1);
    while (BLOCKS.every(b => (S.days[keyOf(c)] || {})[b[0]])) { n++; c.setDate(c.getDate() - 1); }
    return n;
  })();
  const vk = D.vocab.filter(v => S.known.vocab[v.j]).length;
  const kk = D.kanji.filter(k => S.known.kanji[k.k]).length;
  const totalTasks = LEVELS.reduce((s, L) => s + L.tasks.length, 0);
  const doneTasks = LEVELS.reduce((s, L) => s + L.tasks.filter((_, i) => S.tasks[L.id + i]).length, 0);

  let planHtml;
  if (!S.start) {
    planHtml = `<div class="card"><h3 style="margin-top:0">Start your 2-month N5 plan</h3>
      <p class="muted">Pick the day you begin. The page then shows what to study each day. You can change the date later.</p>
      <div class="row"><input type="date" id="startDate" value="${tk}"><button class="btn primary" id="startBtn">Start Day 1</button></div></div>`;
  } else {
    const [title, text, link] = planFor(d);
    planHtml = `<div class="card"><div class="small muted">${d >= 1 ? `Day ${d} of your plan` : ""} (started ${esc(S.start)})</div>
      <h2 style="margin:6px 0">${esc(title)}</h2><p>${esc(text)}</p>
      <a class="btn primary" href="${{ kana: "#/kana", vocab: "#/n5/vocab", grammar: "#/n5/grammar", roadmap: "#/n5" }[link] || "#/n5"}" style="text-decoration:none;display:inline-block">Open ${{ kana: "Kana", vocab: "N5 Vocabulary", grammar: "N5 Grammar", roadmap: "N5 Overview" }[link] || "N5"}</a>
      <button class="btn" id="changeStart" style="margin-left:6px">Change start date</button></div>`;
  }

  root.innerHTML = `
    <h1>Today</h1>
    <p class="lead">Study 2.5 hours: four short blocks. Do reviews first.</p>
    ${planHtml}
    <h2>Today's blocks (${doneCount}/4 done)</h2>
    <div class="card">
      <ul class="clean">${BLOCKS.map(([id, text, mins]) => `<li><label class="chk ${done[id] ? "done" : ""}"><input type="checkbox" data-block="${id}" ${done[id] ? "checked" : ""}><span>${esc(text)} <span class="muted">(${mins})</span></span></label></li>`).join("")}</ul>
      <div class="bar"><i style="width:${doneCount * 25}%"></i></div>
      <p class="small muted" style="margin-bottom:0">Streak: <b>${streak}</b> day${streak === 1 ? "" : "s"} with all four blocks done.</p>
    </div>
    <h2>Progress</h2>
    <div class="grid g3">
      <div class="card"><b>Vocabulary</b><div class="muted small">${vk} of ${D.vocab.length} marked known</div><div class="bar"><i style="width:${Math.round(100 * vk / Math.max(1, D.vocab.length))}%"></i></div></div>
      <div class="card"><b>Kanji</b><div class="muted small">${kk} of ${D.kanji.length} marked known</div><div class="bar"><i style="width:${Math.round(100 * kk / Math.max(1, D.kanji.length))}%"></i></div></div>
      <div class="card"><b>Roadmap milestones</b><div class="muted small">${doneTasks} of ${totalTasks} done</div><div class="bar"><i style="width:${Math.round(100 * doneTasks / totalTasks)}%"></i></div></div>
    </div>
    <h2>How to read (quick rules)</h2>
    <div class="card"><ul class="clean">
      <li>Never write romaji above kana; cover it and read aloud.</li>
      <li>Split sentences at the particles, then find the verb at the end first.</li>
      <li>Learn kanji inside words (食べる, 食事), not on their own.</li>
      <li>Say what you read out loud; it trains listening and speaking too.</li>
    </ul></div>`;

  $("#startBtn") && ($("#startBtn").onclick = () => { S.start = $("#startDate").value || tk; save(); render(); });
  $("#changeStart") && ($("#changeStart").onclick = () => { S.start = null; save(); render(); });
  $$("[data-block]").forEach(c => c.onchange = () => {
    S.days[tk] = Object.assign({}, S.days[tk], { [c.dataset.block]: c.checked }); save(); render();
  });
};

/* ---------- Kana ---------- */
const GROUPS = {
  basic: [[0, 5], [5, 10], [10, 15], [15, 20], [20, 25], [25, 30], [30, 35], [35, 38], [38, 43], [43, 46]],
  voiced: [[46, 51], [51, 56], [56, 61], [61, 66], [66, 71]],
  combo: Array.from({ length: 11 }, (_, i) => [71 + i * 3, 74 + i * 3])
};
let kanaScript = "h", kanaMode = "why";

function kanaGroup(groups) {
  return groups.map(([a, b]) => {
    const cells = D.kana.slice(a, b).map((d, j) =>
      `<button class="kcell" data-i="${a + j}"><div class="big jp">${esc(d[kanaScript])}</div><div class="ro">${esc(d.r)}</div><div class="bn">${esc(d.b.split(" ")[0])}</div></button>`);
    const gap = `<div class="kcell empty"></div>`;
    if (a === 35) { cells.splice(1, 0, gap); cells.splice(3, 0, gap); }
    if (a === 43) { cells.splice(1, 0, gap); cells.splice(3, 0, gap); }
    return `<div class="kana-row ${a >= 71 ? "r3" : ""}">${cells.join("")}</div>`;
  }).join("");
}

views.kana = root => {
  const tabs = `<div class="tabs">
      <button class="tab" aria-selected="${kanaMode === "why"}" data-mode="why">What &amp; why</button>
      <button class="tab" aria-selected="${kanaMode === "chart"}" data-mode="chart">Chart</button>
      <button class="tab" aria-selected="${kanaMode === "tips"}" data-mode="tips">Memory tips</button>
      <button class="tab" aria-selected="${kanaMode === "quiz"}" data-mode="quiz">Quiz</button>
      <span style="flex:1"></span>
      ${kanaMode === "why" ? "" : `<button class="tab" aria-selected="${kanaScript === "h"}" data-script="h" style="--c:var(--n5)">Hiragana</button>
      <button class="tab" aria-selected="${kanaScript === "k"}" data-script="k" style="--c:var(--n4)">Katakana</button>`}
    </div>`;
  root.innerHTML = `<h1>Kana <span class="jp muted" style="font-size:18px">ひらがな・カタカナ</span></h1>
    <p class="lead">Learn in row order: <b>আ-কা-সা-তা-না  হা-মা-ইয়া-রা-ওয়া  ন</b>. Irregular sounds: <b>শি-চি-ৎসু-ফু</b>.</p>
    ${tabs}<div id="kanaBody"></div>`;
  $$("[data-mode]").forEach(b => b.onclick = () => { kanaMode = b.dataset.mode; render(); });
  $$("[data-script]").forEach(b => b.onclick = () => { kanaScript = b.dataset.script; render(); });
  ({ why: kanaWhy, chart: kanaChart, tips: kanaTips, quiz: kanaQuiz }[kanaMode] || kanaChart)($("#kanaBody"));
};

function kanaChart(el) {
  el.innerHTML = `<p class="muted">Click a character to hear it, see its Bangla sound and its memory hook (only where a picture honestly fits). Add your own hook for any kana.</p>
    <div class="card" id="kdetail" aria-live="polite" style="min-height:64px">Select a character.</div>
    <div class="subhead">Basic sounds (gojūon)</div>${kanaGroup(GROUPS.basic)}
    <div class="subhead">Voiced sounds: দুই ফোঁটা ゛ (ga, za, da, ba) and circle ゜ (pa)</div>${kanaGroup(GROUPS.voiced)}
    <div class="subhead">Combinations (small ゃ ゅ ょ)</div>${kanaGroup(GROUPS.combo)}
    <div class="subhead">Also remember</div>
    <ul class="clean">
      <li><b>Small っ/ッ</b> doubles the next consonant: きって (kitte).</li>
      <li><b>Long vowels:</b> hiragana adds あ/い/う (おかあさん); katakana uses ー (コーヒー).</li>
      <li><b>Particles:</b> は reads "wa", へ reads "e", を reads "o".</li>
      <li>Voiced pairs: <b>ক→গ, স→জ, ত→দ, হ→ব</b>; the circle ゜ on the ha row gives প.</li>
    </ul>
    <p class="muted small">Want stroke order and recorded audio? See the Japan Foundation's own page: <a href="https://a1.marugotoweb.jp/en/hiragana.php" target="_blank" rel="noopener">Marugoto Plus hiragana</a> (copyrighted, so linked, not copied).</p>`;
  $$("#kanaBody [data-i]").forEach(b => b.onclick = () => {
    const d = D.kana[+b.dataset.i], ch = d[kanaScript], ok = speak(ch);
    const hk = hookOf(d);
    $("#kdetail").innerHTML = `<span class="jp" style="font-size:34px">${esc(ch)}</span> &nbsp; <b>${esc(d.r)}</b> &nbsp; ${esc(d.b)}
      <br>${hk ? `<span class="muted">🧠 ${esc(hk)}</span>` : `<span class="muted small">No honest picture for this one. Use the row chant, write it 10 times, or invent your own hook below.</span>`}
      <div class="row" style="margin-top:8px"><label class="small muted" for="myhook">Your hook:</label>
      <input type="text" id="myhook" value="${esc(myHook(ch))}" placeholder="e.g. what it looks like to you" style="flex:1;min-width:200px"></div>${ok ? "" : `<br>${NO_VOICE}`}`;
    $("#myhook").onchange = e => { S.myHooks = S.myHooks || {}; S.myHooks[ch] = e.target.value.trim(); save(); };
  });
}

const KT = () => window.KANA_TIPS || { rowSentences: [], hooksK: {}, lookalikes: { h: [], k: [] } };
const hookOf = d => kanaScript === "h" ? d.hook : (KT().hooksK || {})[d.k];
const myHook = ch => (S.myHooks || {})[ch] || "";

/* ---------- Kana: what they are and why they exist ---------- */
function kanaWhy(el) {
  const ETY = [["あ", "安", "ア", "阿"], ["い", "以", "イ", "伊"], ["う", "宇", "ウ", "宇"], ["え", "衣", "エ", "江"], ["お", "於", "オ", "於"],
               ["か", "加", "カ", "加"], ["き", "幾", "キ", "幾"], ["く", "久", "ク", "久"], ["け", "計", "ケ", "介"], ["こ", "己", "コ", "己"]];
  el.innerHTML = `
    <h2 style="margin-top:0">Japanese uses three scripts at the same time</h2>
    <div class="card">
      <div class="jp sample"><span class="s-kanji">私</span><span class="s-hira">は</span><span class="s-kata">コーヒー</span><span class="s-hira">を</span><span class="s-kanji">飲</span><span class="s-hira">みます</span>。</div>
      <div class="jp muted">わたしは コーヒーを のみます。</div>
      <div>I drink coffee. <span class="muted">আমি কফি খাই (পান করি)।</span></div>
      <p class="small" style="margin-bottom:0"><span class="s-kanji">■ kanji</span> (meaning) &nbsp; <span class="s-hira">■ hiragana</span> (grammar and endings) &nbsp; <span class="s-kata">■ katakana</span> (foreign word)</p>
    </div>
    <div class="tablewrap" style="margin-top:12px"><table><thead><tr><th>Script</th><th>What it is</th><th>Used for</th><th>Examples</th></tr></thead><tbody>
      <tr><td><b class="s-hira">Hiragana</b><br><span class="jp">ひらがな</span></td><td>46 basic sounds. Round, flowing shapes.</td><td>Grammar words (は, を, に), verb and adjective endings (食<b>べる</b>), native words with no kanji, reading aids for children and learners.</td><td class="jp">ありがとう, ください, ねこ</td></tr>
      <tr><td><b class="s-kata">Katakana</b><br><span class="jp">カタカナ</span></td><td>The same 46 sounds. Sharp, angular shapes.</td><td>Foreign loanwords, foreign names and places, sound effects, emphasis, many company and product names.</td><td class="jp">コンピューター, バングラデシュ, コーヒー</td></tr>
      <tr><td><b class="s-kanji">Kanji</b><br><span class="jp">漢字</span></td><td>Characters from China, each carrying a meaning.</td><td>The core of most words: nouns and the stem of verbs and adjectives.</td><td class="jp">日本, 学生, 食べる</td></tr>
      <tr><td><b>Rōmaji</b></td><td>Japanese written in Latin letters.</td><td>Tourist signs, typing on a keyboard, learner materials. Not used for reading in the JLPT.</td><td>konnichiwa</td></tr>
    </tbody></table></div>

    <h2>What is a kana?</h2>
    <div class="card"><p style="margin-top:0">Hiragana and katakana are <b>syllabaries</b>: each symbol is one whole sound (one beat), usually a consonant plus a vowel. か is "ka", not "k" + "a" written separately.</p>
      <p style="margin-bottom:0">Bangla speakers already think this way: কা, কি, কু, কে, কো are sounds with a consonant and a vowel. The difference is that Japanese gives <b>every</b> sound its own symbol (か き く け こ) instead of adding a vowel mark to a base letter (ক + ি = কি, ক + ু = কু).</p></div>

    <h2>Why do they exist? A short history</h2>
    <div class="timeline">
      <div class="tl"><b>Before writing</b><p>Japanese was spoken but had no writing system of its own.</p></div>
      <div class="tl"><b>Roughly the 4th to 5th century</b><p>Chinese writing arrived, mostly through Korea. Japanese borrowed the characters: kanji.</p></div>
      <div class="tl"><b>The problem</b><p>Japanese and Chinese are very different languages. Japanese has particles (は, を) and long verb endings (食べます, 食べました), which Chinese characters alone cannot spell.</p></div>
      <div class="tl"><b>Around the 8th century (Nara period)</b><p>Writers began using kanji only for their <i>sounds</i> to spell Japanese (for example 安 for "a"). This worked but was slow and heavy to write.</p></div>
      <div class="tl"><b>Heian period (794 to 1185): hiragana</b><p>People smoothed whole kanji into quick, flowing shapes: 安 → あ. It was used for poetry and letters, often by women at court. <i>The Tale of Genji</i> (about the year 1000) was written largely in kana.</p></div>
      <div class="tl"><b>About the 9th century: katakana</b><p>Buddhist monks needed quick notes while reading Chinese texts. They took a small <i>piece</i> of a kanji: 伊 → イ, 加 → カ. The name カタカナ means "fragment kana".</p></div>
      <div class="tl"><b>1900: standardised</b><p>Japan fixed one symbol per sound and dropped the old variants. That is the kana you learn today.</p></div>
      <div class="tl"><b>Today</b><p>A single sentence mixes all three scripts, as in the example above.</p></div>
    </div>
    <p class="muted small">Dates are approximate and the story is simplified.</p>

    <h2>Same sound, two shapes: where they came from</h2>
    <p class="muted">Hiragana is a whole kanji, smoothed out. Katakana is a piece of a kanji.</p>
    <div class="tablewrap"><table><thead><tr><th>Sound</th><th>Hiragana</th><th>from</th><th>Katakana</th><th>from</th></tr></thead><tbody>
      ${ETY.map(([h, hk, k, kk]) => `<tr><td>${esc(D.kana.find(d => d.h === h).r)}</td><td class="jp" style="font-size:22px">${h}</td><td class="jp">${hk}</td><td class="jp" style="font-size:22px">${k}</td><td class="jp">${kk}</td></tr>`).join("")}
    </tbody></table></div>

    <h2>Why you need both for N5</h2>
    <div class="card"><ul class="clean">
      <li><b>Beginner texts are written in kana.</b> The JLPT N5 uses few kanji, and many words appear in hiragana.</li>
      <li><b>Katakana is everywhere in tech.</b> サーバー, データ, ネットワーク, アプリ: you can read these by sounding them out as English.</li>
      <li><b>Menus, signs and forms</b> use katakana for foreign dishes, brands and names, including <span class="jp">バングラデシュ</span>.</li>
      <li><b>Don't rely on rōmaji.</b> Real Japanese material never uses it, so read the kana from day one.</li>
    </ul></div>
    <div class="tip" style="--c:var(--n5)"><b>Rule of thumb:</b> hiragana for Japanese grammar and native words, katakana for foreign words and emphasis, kanji for the meaning-heavy core of a word. Start with hiragana, then katakana, then add kanji little by little.</div>`;
}

/* ---------- Kana: memory tips ---------- */
let hq = { right: 0, total: 0, q: null };
function kanaTips(el) {
  const kt = KT(), isH = kanaScript === "h", name = isH ? "hiragana" : "katakana";
  const basic = D.kana.slice(0, 46);
  const withHook = basic.filter(d => hookOf(d));
  const cards = basic.map((d, i) => {
    const ch = d[kanaScript], hk = hookOf(d), mine = myHook(ch);
    return `<div class="card hookcard ${hk || mine ? "" : "nohook"}"><div class="row" style="flex-wrap:nowrap;gap:10px"><span class="jp" style="font-size:30px">${esc(ch)}</span>
      <div><b>${esc(d.r)}</b> <span class="muted">${esc(d.b.split(" ")[0])}</span></div></div>
      <div class="small">${hk ? `🧠 ${esc(hk)}` : `<span class="muted">No honest picture. Use the chant and write it 10 times.</span>`}</div>
      <input type="text" data-my="${esc(ch)}" value="${esc(mine)}" placeholder="Your own hook" aria-label="Your own hook for ${esc(ch)}" class="small" style="width:100%;margin-top:6px"></div>`;
  }).join("");
  el.innerHTML = `
    <div class="tip" style="--c:var(--accent)"><b>Honest note:</b> a picture hook only helps when the picture really matches the shape. ${withHook.length} of the 46 basic ${name} have one below; for the rest, a made-up picture would be a stretch, so use the chant, the row sentences, writing practice and the quiz. A hook you invent yourself works best, so type your own under any kana.</div>
    <h2>1. Vowels you already know</h2>
    <div class="card">あ い う え お = <b>আ ই উ এ ও</b>: the Bangla স্বরবর্ণ without ঈ ঊ ঋ ঐ ঔ. Every row repeats the same five vowels, like বারোখড়ি (কা কি কু কে কো).</div>
    <h2>2. Row chant</h2>
    <div class="card"><b style="font-size:18px">আ-কা-সা-তা-না  হা-মা-ইয়া-রা-ওয়া  ন</b><div class="muted small">a, ka, sa, ta, na, ha, ma, ya, ra, wa, n: say it as one rhythm, five times a day.</div></div>
    <h2>3. Row sentences (Bangla acrostics)</h2>
    <p class="muted small">Each key word starts with the row's sound, like your "শাবানা লোবো" trick for trigonometry. Silly is good.</p>
    <div class="tablewrap"><table><thead><tr><th>Row</th><th>Bangla sentence</th><th>Key words</th></tr></thead><tbody>
      ${kt.rowSentences.map(([row, sen, keys]) => `<tr><td class="jp">${esc(row)}</td><td>${esc(sen)}</td><td class="muted small">${esc(keys)}</td></tr>`).join("")}</tbody></table></div>
    <h2>4. Four irregular sounds: শি-চি-ৎসু-ফু</h2>
    <div class="card jp">し = shi (not si) · ち = chi (not ti) · つ = tsu (not tu) · ふ = fu (not hu)</div>
    <h2>5. Voiced sounds</h2>
    <div class="card">Two dots <b>゛</b> add voicing: <b>ক→গ, স→জ, ত→দ, হ→ব</b> (か→が, さ→ざ, た→だ, は→ば). The circle <b>゜</b> on the ha row gives প (は→ぱ).</div>
    <h2>6. Picture hooks, ${name}</h2>
    <div class="vgrid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">${cards}</div>
    <h2>7. Look-alike traps</h2>
    <div class="card"><ul class="clean">${(kt.lookalikes[kanaScript] || []).map(([pair, tip]) => `<li><b class="jp">${esc(pair)}</b>: ${esc(tip)}</li>`).join("")}</ul></div>
    <h2>8. Hook quiz</h2>
    <p class="muted small">Read the hook and pick the kana. Only kana with a hook appear here.</p>
    <div id="hookquiz"></div>`;
  $$("[data-my]", el).forEach(i => i.onchange = () => { S.myHooks = S.myHooks || {}; S.myHooks[i.dataset.my] = i.value.trim(); save(); });

  const draw = () => {
    const box = $("#hookquiz");
    const pool = basic.map((d, i) => i).filter(i => hookOf(basic[i]) || myHook(basic[i][kanaScript]));
    if (pool.length < 4) { box.innerHTML = `<div class="card muted">Add a few of your own hooks to start the quiz.</div>`; return; }
    if (!hq.q || !pool.includes(hq.q.i)) {
      const i = pool[Math.floor(Math.random() * pool.length)], opts = new Set([i]);
      while (opts.size < 4) opts.add(pool[Math.floor(Math.random() * pool.length)]);
      hq.q = { i, opts: [...opts].sort(() => Math.random() - .5), done: false };
    }
    const q = hq.q, d = basic[q.i], text = hookOf(d) || myHook(d[kanaScript]);
    box.innerHTML = `<div class="row"><span class="muted">Score: <b>${hq.right}</b>/${hq.total}</span><button class="btn" id="hqreset">Reset</button></div>
      <div class="card" style="margin-top:8px"><b>${esc(text)}</b><div class="muted small">Which kana is this?</div></div>
      <div class="opts">${q.opts.map(o => `<button class="opt jp" data-o="${o}" style="font-size:26px">${esc(basic[o][kanaScript])}</button>`).join("")}</div>`;
    $("#hqreset").onclick = () => { hq = { right: 0, total: 0, q: null }; draw(); };
    $$("#hookquiz .opt").forEach(b => b.onclick = () => {
      if (q.done) return; q.done = true;
      const ok = +b.dataset.o === q.i; hq.total++; if (ok) hq.right++;
      b.classList.add(ok ? "right" : "wrong");
      if (!ok) $$("#hookquiz .opt").find(x => +x.dataset.o === q.i).classList.add("right");
      setTimeout(() => { hq.q = null; if (kanaMode === "tips" && location.hash === "#/kana") draw(); }, ok ? 600 : 1400);
    });
  };
  draw();
}

let quiz = { scope: "hb", right: 0, total: 0, missed: [], q: null };
function kanaQuiz(el) {
  const scopes = { hb: "Hiragana basic (46)", ha: "All hiragana", kb: "Katakana basic (46)", ka: "All katakana", all: "Everything" };
  const pool = () => {
    const s = quiz.scope;
    const idx = D.kana.map((_, i) => i).filter(i => (s.endsWith("b") ? i < 46 : true));
    return { idx, script: s.startsWith("h") ? "h" : s.startsWith("k") ? "k" : null };
  };
  const next = () => {
    const { idx, script } = pool();
    const i = idx[Math.floor(Math.random() * idx.length)];
    const sc = script || (Math.random() < .5 ? "h" : "k");
    const answer = D.kana[i].r;
    const opts = new Set([answer]);
    while (opts.size < 4) opts.add(D.kana[idx[Math.floor(Math.random() * idx.length)]].r);
    quiz.q = { i, sc, answer, opts: [...opts].sort(() => Math.random() - .5), done: false };
  };
  const draw = () => {
    if (!quiz.q) next();
    const q = quiz.q;
    el.innerHTML = `<div class="row"><label>Scope <select id="qscope">${Object.entries(scopes).map(([k, v]) => `<option value="${k}" ${quiz.scope === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <span class="muted">Score: <b>${quiz.right}</b>/${quiz.total}${quiz.total ? ` (${Math.round(100 * quiz.right / quiz.total)}%)` : ""}</span>
      <button class="btn" id="qreset">Reset score</button></div>
      <div class="card fcard" style="margin-top:12px;cursor:default"><div class="front jp">${esc(D.kana[q.i][q.sc])}</div><div class="muted">What is the sound?</div></div>
      <div class="opts">${q.opts.map(o => `<button class="opt" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>
      ${quiz.missed.length ? `<h3>Missed so far</h3><p class="jp">${[...new Set(quiz.missed)].map(esc).join("  ")}</p>` : ""}`;
    $("#qscope").onchange = e => { quiz.scope = e.target.value; quiz.q = null; draw(); };
    $("#qreset").onclick = () => { quiz = { scope: quiz.scope, right: 0, total: 0, missed: [], q: null }; draw(); };
    $$(".opt", el).forEach(b => b.onclick = () => {
      if (q.done) return; q.done = true;
      const ok = b.dataset.o === q.answer;
      quiz.total++; if (ok) quiz.right++; else quiz.missed.push(D.kana[q.i][q.sc]);
      b.classList.add(ok ? "right" : "wrong");
      if (!ok) $$(".opt", el).find(x => x.dataset.o === q.answer).classList.add("right");
      setTimeout(() => { quiz.q = null; if (location.hash === "#/kana" && kanaMode === "quiz") draw(); }, ok ? 500 : 1200);
    });
  };
  draw();
}

/* ---------- Vocabulary and Kanji (shared deck view) ---------- */
const deckState = {};
const DECKS = {
  vocab: { title: "Vocabulary", sub: "220 core N5 words with Bangla and English meanings", items: lv => D.vocab.filter(v => v.lv === lv), id: v => v.j,
    front: v => v.j, say: v => v.r.split(" / ")[0], cat: v => v.t,
    back: v => `<div class="jp">${esc(v.r)}</div><div>${esc(v.e)}</div><div>${esc(v.b)}</div>`,
    search: v => `${v.j} ${v.r} ${v.e} ${v.b}`.toLowerCase() },
  kanji: { title: "Kanji", sub: "77 N5 kanji with readings and Bangla meanings", items: lv => D.kanji.filter(k => k.lv === lv), id: k => k.k,
    front: k => k.k, say: k => k.k, cat: () => "all",
    back: k => `<div class="jp">音 ${esc(k.on)} &nbsp; 訓 ${esc(k.kun)}</div><div>${esc(k.e)}</div><div>${esc(k.b)}</div>`,
    search: k => `${k.k} ${k.on} ${k.kun} ${k.e} ${k.b}`.toLowerCase() }
};

function deckView(kind, root, lv) {
  const cfg = DECKS[kind], key = kind + "-" + lv;
  const st = deckState[key] || (deckState[key] = { mode: "list", cat: "all", q: "", queue: [], card: null, flipped: false });
  const L = LEVELS.find(x => x.id === lv), all = cfg.items(lv);
  const known = S.known[kind];
  const cats = ["all", ...new Set(all.map(cfg.cat))];
  const filtered = () => all.filter(x => (st.cat === "all" || cfg.cat(x) === st.cat) && (!st.q || cfg.search(x).includes(st.q.toLowerCase())));
  const kcount = filtered().filter(x => known[cfg.id(x)]).length;

  root.innerHTML = `<h1><span class="jp" style="color:${L.color}">${lv}</span> ${cfg.title}</h1><p class="lead">${all.length} ${kind === "vocab" ? "words" : "kanji"} with Bangla and English meanings${lv === "N5" ? "" : ` (a starter set: a sample, not the full ${lv} list of ${kind === "vocab" ? L.vocab + " words" : L.kanji + " kanji"})`}. Mark the ones you know; flashcards only show the rest.</p>
    <div class="tabs">
      <button class="tab" aria-selected="${st.mode === "list"}" data-m="list">Browse</button>
      <button class="tab" aria-selected="${st.mode === "cards"}" data-m="cards">Flashcards</button>
    </div>
    <div class="row" style="margin-bottom:12px">
      ${kind === "vocab" ? `<select id="dcat">${cats.map(c => `<option value="${c}" ${st.cat === c ? "selected" : ""}>${c === "all" ? "All categories" : c}</option>`).join("")}</select>` : ""}
      <input type="search" id="dq" placeholder="Search (Japanese, English or Bangla)" value="${esc(st.q)}" style="flex:1;min-width:180px">
      <span class="muted small">${kcount} / ${filtered().length} known</span>
    </div><div id="dbody"></div>`;
  $$("[data-m]", root).forEach(b => b.onclick = () => { st.mode = b.dataset.m; st.queue = []; st.card = null; render(); });
  $("#dcat") && ($("#dcat").onchange = e => { st.cat = e.target.value; st.queue = []; st.card = null; render(); });
  $("#dq").onchange = e => { st.q = e.target.value; st.queue = []; st.card = null; render(); };

  const body = $("#dbody");
  if (st.mode === "list") {
    const items = filtered();
    if (!items.length) { body.innerHTML = `<p class="muted">No matches.</p>`; return; }
    if (kind === "kanji") {
      body.innerHTML = `<div class="card" id="kjdetail" style="min-height:64px;margin-bottom:12px">Select a kanji.</div>
        <div class="kgrid">${items.map(k => `<button class="kcell ${known[k.k] ? "known" : ""}" data-id="${esc(k.k)}"><div class="big jp">${esc(k.k)}</div><div class="ro">${esc(k.e.split(" / ")[0])}</div></button>`).join("")}</div>`;
      $$("#dbody [data-id]").forEach(b => b.onclick = () => {
        const k = D.kanji.find(x => x.k === b.dataset.id), ok = speak(k.k);
        $("#kjdetail").innerHTML = `<span class="jp" style="font-size:40px">${esc(k.k)}</span> &nbsp; ${cfg.back(k)}
          ${(() => { const w = D.vocab.filter(v => v.kf && v.kf.includes(k.k)); return w.length ? `<div class="small" style="margin-top:8px"><b>Used in (click for details):</b> ${w.map(v => `<button class="pill jp" data-wi="${D.vocab.indexOf(v)}" style="cursor:pointer">${esc(v.kf)} (${esc(v.j.split(" / ")[0])}) ${esc(v.e.split(" / ")[0])}</button>`).join("")}</div>` : ""; })()}
          <label class="chk" style="margin-top:6px"><input type="checkbox" id="kjknown" ${known[k.k] ? "checked" : ""}><span>I know this kanji</span></label>${ok ? "" : `<br>${NO_VOICE}`}`;
        $$("#kjdetail [data-wi]").forEach(b => b.onclick = () => openWord(D.vocab, +b.dataset.wi));
        $("#kjknown").onchange = e => { known[k.k] = e.target.checked; save(); render(); };
      });
    } else {
      body.innerHTML = `<div class="vgrid">${items.map(v => `<div class="card vitem ${known[v.j] ? "known" : ""}">
        <div class="row" style="justify-content:space-between;flex-wrap:nowrap">
          <span class="jpw jp">${esc(v.j)}</span>
          <span class="row" style="gap:4px;flex-wrap:nowrap"><button class="btn" data-say="${esc(v.r.split(" / ")[0])}" aria-label="Play audio" style="padding:1px 8px">🔊</button>
          <button class="btn info-btn" data-info="${items.indexOf(v)}" aria-label="Show word info" title="Word info">${INFO_ICON}</button></span></div>
        <div class="jp muted small">${esc(v.r)}</div>
        <div>${esc(v.e)}</div><div class="bn-text">${esc(v.b)}</div>
        ${v.kf ? `<div class="jp small">漢字 <b>${esc(v.kf)}</b></div>` : ""}
        <label class="chk small" style="margin-top:6px"><input type="checkbox" data-known="${esc(v.j)}" ${known[v.j] ? "checked" : ""}><span>known</span></label></div>`).join("")}</div>`;
      $$("#dbody [data-say]").forEach(b => b.onclick = () => speak(b.dataset.say));
      $$("#dbody [data-info]").forEach(b => b.onclick = () => openWord(items, +b.dataset.info));
      $$("#dbody [data-known]").forEach(c => c.onchange = () => { known[c.dataset.known] = c.checked; save(); render(); });
    }
  } else {
    if (!st.queue.length) st.queue = filtered().filter(x => !known[cfg.id(x)]).sort(() => Math.random() - .5);
    if (!st.queue.length) { body.innerHTML = `<div class="card"><b>All cards in this filter are marked known.</b><p class="muted">Pick another category, or uncheck items in Browse to review them.</p></div>`; return; }
    const cur = st.queue[0];
    body.innerHTML = `<p class="muted small">${st.queue.length} left in this round. Tap the card to flip.</p>
      <div class="card fcard" id="fc"><div class="front jp">${esc(cfg.front(cur))}</div>${st.flipped ? `<div class="back">${cfg.back(cur)}</div>` : `<div class="muted small" style="margin-top:8px">Tap to show the answer</div>`}</div>
      <div class="row" style="margin-top:12px;justify-content:center">
        <button class="btn" id="fsay">🔊 Listen</button>
        ${kind === "vocab" ? `<button class="btn info-btn" id="finfo" aria-label="Show word info">${INFO_ICON} Info</button>` : ""}
        <button class="btn" id="fagain">Again</button>
        <button class="btn ok" id="fknow">I know it</button></div>`;
    $("#fc").onclick = () => { st.flipped = !st.flipped; if (st.flipped) speak(cfg.say(cur)); render(); };
    $("#fsay").onclick = () => speak(cfg.say(cur));
    $("#finfo") && ($("#finfo").onclick = () => openWord([cur], 0));
    $("#fagain").onclick = () => { st.queue.push(st.queue.shift()); st.flipped = false; render(); };
    $("#fknow").onclick = () => { known[cfg.id(cur)] = true; st.queue.shift(); st.flipped = false; save(); render(); };
  }
}

/* ---------- Grammar ---------- */
function grammarN5(root) {
  const quizItems = [
    ["わたし__ バングラデシュじんです。", ["は", "を"], 0], ["7じ__ おきます。", ["に", "で"], 0],
    ["コーヒー__ のみます。", ["を", "が"], 0], ["バス__ いきます。", ["で", "に"], 0], ["つくえの うえ__ ペンが あります。", ["に", "で"], 0]
  ];
  root.innerHTML = `<h1><span class="jp" style="color:var(--n5)">N5</span> Grammar <span class="jp muted" style="font-size:18px">文法</span></h1>
    <p class="lead">Japanese is <b>Subject/Topic + extras + Verb last</b>, like Bangla. Particles come after the word, like Bangla suffixes.</p>
    <h2>Particles and their Bangla parallels</h2>
    <div class="card tablewrap"><table><thead><tr><th>Particle</th><th>Job</th><th>Bangla idea</th><th>Example</th></tr></thead><tbody>
    ${[["は (wa)", "topic", "...তো / বিষয় চিহ্ন", "わたしは エンジニアです。"], ["が", "subject; with すき/あります", "কর্তা", "ほんが あります。"], ["を (o)", "object", "কে (কর্ম)", "ごはんを たべます。"], ["に", "time, destination, target, existence", "এ / তে", "7じに おきます。"], ["へ (e)", "direction", "এর দিকে", "がっこうへ いきます。"], ["で", "place of action; means", "এ / দিয়ে", "バスで いきます。"], ["の", "possession", "এর / র", "わたしの ほん"], ["と", "and (nouns); with", "এবং / সাথে", "ともだちと いきます。"], ["も", "also", "ও", "わたしも エンジニアです。"], ["か", "question", "কি?", "エンジニアですか。"], ["から / まで", "from / until", "থেকে / পর্যন্ত", "9じから 5じまで"], ["や", "A and B etc.", "ইত্যাদি", "ほんや ノート"]].map(r => `<tr><td class="jp"><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td class="jp">${r[3]}</td></tr>`).join("")}
    </tbody></table></div>
    <h2>Patterns by week</h2>
    <div class="grid g2">
      <div class="card"><b>Weeks 3-4: です</b><ul class="clean jp"><li>A は B です。 (A is B)</li><li>A は B ですか。 / じゃありません。</li><li>これ / それ / あれ / どれ</li><li>この / その / あの + noun</li><li>A の B (noun linking)</li></ul></div>
      <div class="card"><b>Week 5: ます-form</b><ul class="clean jp"><li>たべます / たべません / たべました / たべませんでした</li><li>Time に: 6じに (not for きょう, あした, まいにち)</li><li>~ませんか / ~ましょう</li></ul></div>
      <div class="card"><b>Week 6: あります / います</b><ul class="clean jp"><li>Place に Noun が あります/います。</li><li>Noun は Place に あります/います。</li><li>うえ, した, なか, まえ, うしろ, となり</li></ul><p class="muted small">Bangla uses one verb আছে for both; Japanese splits things (ある) and people/animals (いる).</p></div>
      <div class="card"><b>Week 7: adjectives</b><ul class="clean jp"><li>おおきい → おおきくない → おおきかった → おおきくなかった</li><li>きれいです / きれいじゃありません / きれいでした</li><li>~たい (want to)</li><li>いい → よくない / よかった</li></ul></div>
    </div>
    <h2>て-form (week 8)</h2>
    <div class="card tablewrap"><table><thead><tr><th>Verb type</th><th>Rule</th><th>Example</th></tr></thead><tbody>
    ${[["る-verb", "drop る + て", "たべる → たべて"], ["う / つ / る", "→ って", "かう → かって"], ["む / ぶ / ぬ", "→ んで", "のむ → のんで"], ["く", "→ いて (いく → いって)", "かく → かいて"], ["ぐ", "→ いで", "およぐ → およいで"], ["す", "→ して", "はなす → はなして"], ["する / くる", "して / きて", ""]].map(r => `<tr><td>${r[0]}</td><td class="jp">${r[1]}</td><td class="jp">${r[2]}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="muted small">Bangla parallel: て-form works like the participle "-ে / -িয়ে" (করে, খেয়ে): たべて いきます = খেয়ে যাই।</p>
    <h2>Sentence builder</h2>
    <div class="card jp"><b>Time に Place へ/で (Person と) Object を Verb ます。</b><br>まいあさ 7じに うちで ごはんを たべます。<br><span class="muted">প্রতিদিন সকাল ৭টায় বাসায় ভাত খাই।</span></div>
    <h2>Self-test: choose the particle</h2>
    <div class="card" id="gq">${quizItems.map((q, i) => `<div style="margin:8px 0"><span class="jp">${i + 1}. ${q[0]}</span><div class="row" style="margin-top:4px">${q[1].map((o, j) => `<button class="btn jp" data-q="${i}" data-o="${j}">${o}</button>`).join("")}<span class="small" id="gr${i}"></span></div></div>`).join("")}</div>`;
  $$("#gq [data-q]").forEach(b => b.onclick = () => {
    const i = +b.dataset.q, ok = +b.dataset.o === quizItems[i][2];
    $("#gr" + i).innerHTML = ok ? `<span class="free">Correct</span>` : `<span class="paid">Try again</span>`;
  });
}

/* ---------- Level pages ---------- */
const SECTIONS = [["overview", "Overview"], ["vocab", "Vocabulary"], ["kanji", "Kanji"], ["grammar", "Grammar"]];
const lvHref = (lv, sec) => "#/" + lv.toLowerCase() + (!sec || sec === "overview" ? "" : "/" + sec);
const resLinks = L => L.resources.map(([n, u, t]) => `<li>${u ? `<a href="${u}" target="_blank" rel="noopener">${esc(n)}</a>` : esc(n)} <span class="${t === "free" ? "free" : "paid"}">${t === "free" ? "FREE" : "PAID"}</span></li>`).join("");

function levelOverview(L, root) {
  const nv = D.vocab.filter(v => v.lv === L.id).length, nk = D.kanji.filter(k => k.lv === L.id).length;
  const ng = L.id === "N5" ? "full lesson" : `${((LD[L.id] || {}).grammar || []).length} patterns`;
  const kv = D.vocab.filter(v => v.lv === L.id && S.known.vocab[v.j]).length, kk = D.kanji.filter(k => k.lv === L.id && S.known.kanji[k.k]).length;
  root.innerHTML = `<h1><span class="jp" style="color:${L.color}">${L.id}</span> Overview</h1>
    <p class="lead">${esc(L.goal)}</p>
    <div class="card" style="--c:${L.color}">
      <div class="stat"><div><b>${L.hours} h</b><span>cumulative study</span></div><div><b>${L.vocab}</b><span>words (full level)</span></div><div><b>${L.kanji}</b><span>kanji (full level)</span></div><div><b>${L.pass}</b><span>passing total*</span></div></div>
      <p style="margin:0"><b>Focus:</b> ${esc(L.focus)}</p></div>
    <h2>Study pages</h2>
    <div class="grid g3">
      <a class="card pagecard" href="${lvHref(L.id, "vocab")}" style="--c:${L.color}"><b>Vocabulary</b><div class="muted small">${nv} words · ${kv} known</div></a>
      <a class="card pagecard" href="${lvHref(L.id, "kanji")}" style="--c:${L.color}"><b>Kanji</b><div class="muted small">${nk} kanji · ${kk} known</div></a>
      <a class="card pagecard" href="${lvHref(L.id, "grammar")}" style="--c:${L.color}"><b>Grammar</b><div class="muted small">${ng}</div></a>
    </div>
    ${L.id === "N5" ? `<p class="muted small">New to Japanese? Start with <a href="#/kana">Kana</a>, then follow the plan on <a href="#/today">Today</a>.</p>`
      : `<div class="tip" style="--c:${L.color}">The ${L.id} vocabulary, kanji and grammar pages hold a <b>starter set</b> to show the structure; the full level is about ${L.vocab} words and ${L.kanji} kanji. Add more rows in <code>data-levels.js</code>.</div>`}
    <h2>Grammar to master</h2>
    <div>${L.grammar.map(g => `<span class="pill jp">${esc(g)}</span>`).join("")}</div>
    <div class="grid g2" style="margin-top:14px">
      <div class="card"><b>Milestones (${lvlPct(L)}%)</b><div class="bar" style="--c:${L.color}"><i style="width:${lvlPct(L)}%"></i></div>
        <ul class="clean" style="margin-top:8px">${L.tasks.map((t, i) => `<li><label class="chk ${S.tasks[L.id + i] ? "done" : ""}"><input type="checkbox" data-task="${L.id}${i}" ${S.tasks[L.id + i] ? "checked" : ""}><span>${esc(t)}</span></label></li>`).join("")}</ul></div>
      <div class="card"><b>Resources</b><ul class="clean">${resLinks(L)}</ul></div></div>
    <div class="tip" style="--c:${L.color}"><b>Tip:</b> ${esc(L.tip)}</div>
    <p class="muted small">*Each exam section also has a minimum score. Confirm scoring and dates on <a href="https://www.jlpt.jp/e/" target="_blank" rel="noopener">jlpt.jp</a>. Hours and counts are community estimates.</p>`;
  $$("[data-task]").forEach(c => c.onchange = () => { S.tasks[c.dataset.task] = c.checked; save(); render(); });
}

function grammarGeneric(L, root) {
  const rows = (LD[L.id] || {}).grammar || [];
  root.innerHTML = `<h1><span class="jp" style="color:${L.color}">${L.id}</span> Grammar</h1>
    <p class="lead">Key patterns with an example in Japanese, English and Bangla (a starter set, not every ${L.id} pattern). Click 🔊 to hear the example.</p>
    <div class="grid g2">${rows.map(([p, m, ex, en, bn]) => `<div class="card"><div class="jp" style="font-size:20px;font-weight:700;color:${L.color}">${esc(p)}</div>
      <div class="muted">${esc(m)}</div><div class="jp" style="margin-top:8px">${esc(ex)}</div><div>${esc(en)}</div><div class="muted">${esc(bn)}</div>
      <button class="btn" data-say="${esc(ex)}" style="margin-top:8px;padding:2px 10px" aria-label="Play example">🔊</button></div>`).join("")}</div>
    <h2>All ${L.id} topics to cover</h2><div>${L.grammar.map(g => `<span class="pill jp">${esc(g)}</span>`).join("")}</div>`;
  $$("[data-say]", root).forEach(b => b.onclick = () => speak(b.dataset.say));
}

function levelPage(lv, section, root) {
  const L = LEVELS.find(x => x.id === lv);
  if (section === "vocab") return deckView("vocab", root, lv);
  if (section === "kanji") return deckView("kanji", root, lv);
  if (section === "grammar") return lv === "N5" ? grammarN5(root) : grammarGeneric(L, root);
  return levelOverview(L, root);
}

/* ---------- Compare levels (table, planner, jobs) ---------- */
views.levels = root => {
  const total = LEVELS.reduce((s, x) => s + x.tasks.length, 0);
  const done = LEVELS.reduce((s, x) => s + x.tasks.filter((_, i) => S.tasks[x.id + i]).length, 0);
  root.innerHTML = `<h1>Compare levels <span class="jp muted" style="font-size:18px">N5 → N1</span></h1>
    <p class="lead">Estimates are common community figures, not official JLPT numbers. Overall: ${done} of ${total} milestones done.</p>
    <div class="grid g5">${LEVELS.map(x => `<a class="card pagecard" href="${lvHref(x.id)}" style="--c:${x.color};border-top:4px solid ${x.color}">
      <b class="jp" style="font-size:24px;color:${x.color}">${x.id}</b><div class="muted small">~${x.hours} h · ${x.vocab} words · ${x.kanji} kanji</div>
      <div class="bar" style="--c:${x.color}"><i style="width:${lvlPct(x)}%"></i></div><div class="muted small">${lvlPct(x)}% done</div></a>`).join("")}</div>
    <div class="tablewrap" style="margin-top:14px"><table><thead><tr><th>Level</th><th>Study hours (from zero)</th><th>Vocabulary</th><th>Kanji</th><th>Passing total*</th><th>At 2.5 h/day</th></tr></thead><tbody>
      ${LEVELS.map(x => `<tr><td><b style="color:${x.color}">${x.id}</b></td><td>~${x.hours} h</td><td>${x.vocab}</td><td>${x.kanji}</td><td>${x.pass}</td><td>${x.months} months</td></tr>`).join("")}</tbody></table></div>
    <p class="muted small">*Each section also has a minimum score. Confirm scoring and dates on <a href="https://www.jlpt.jp/e/" target="_blank" rel="noopener">jlpt.jp</a> and with the Embassy of Japan in Dhaka.</p>
    <h2>Time planner</h2>
    <div class="card"><div class="row" style="margin-bottom:10px">
      <label>Hours/day <input type="number" id="hpd" min="0.5" max="8" step="0.5" value="${S.hpd || 2.5}" style="width:80px"></label>
      <label>Days/week <input type="number" id="dpw" min="1" max="7" value="${S.dpw || 6}" style="width:70px"></label>
      <label>Pace <select id="pace"><option value="1">Average</option><option value="0.85">Fast</option><option value="1.2" selected>Slow (no kanji background)</option></select></label></div>
      <table><thead><tr><th>Target</th><th>Hours from zero</th><th>Months from zero</th></tr></thead><tbody id="calcBody"></tbody></table></div>
    <h2>What each level means for jobs and visas</h2>
    <div class="grid g2">
      <div class="card"><b>N5 / N4</b><p>Daily survival Japanese. You can apply to English-friendly tech companies while you study.</p></div>
      <div class="card"><b>N3</b><p>Comfortable daily life and basic work chats; a common minimum for Japanese-language roles.</p></div>
      <div class="card"><b>N2</b><p>The practical target for working in Japanese: meetings, email, specs. It adds points under Highly Skilled Professional status (check the current table).</p></div>
      <div class="card"><b>N1</b><p>Near-native reading and listening; opens senior and client-facing roles.</p></div></div>
    <p class="muted small">Verify visa and points rules with the Immigration Services Agency of Japan and MOFA; they change.</p>`;
  const calc = () => {
    const hpd = +$("#hpd").value || 2.5, dpw = +$("#dpw").value || 6, pace = +$("#pace").value;
    S.hpd = hpd; S.dpw = dpw; save();
    $("#calcBody").innerHTML = LEVELS.map(x => `<tr><td><b style="color:${x.color}">${x.id}</b></td><td>${Math.round(x.hours * pace)} h</td><td>${(x.hours * pace / (hpd * dpw * 4.33)).toFixed(1)} months</td></tr>`).join("");
  };
  ["hpd", "dpw", "pace"].forEach(id => $("#" + id).oninput = calc);
  calc();
};

/* ---------- Resources ---------- */
views.resources = root => {
  root.innerHTML = `<h1>Resources</h1><p class="lead">Free first. Marked: <span class="free">checked</span> = opened or searched while building this; others are from memory.</p>
    <h2>Free online</h2>
    <div class="card tablewrap"><table><thead><tr><th>Resource</th><th>Note</th></tr></thead><tbody>
    ${[["https://minato-jf.jp/", "Minato (Japan Foundation)", "Free A1 (N5-level) courses. No Bengali interface. Checked."], ["https://www.irodori.jpf.go.jp/", "Irodori A1 textbook PDFs", "Free, many languages; Bengali not confirmed. Checked."], ["https://www.jlpt.jp/e/samples/forlearners.html", "JLPT official sample questions", "Free, official. Checked."], ["https://guidetojapanese.org/learn/", "Tae Kim's Guide", "Free grammar. From memory; site was unreachable in my test."], ["https://www.tofugu.com/japanese/learn-hiragana/", "Tofugu kana guides", "From memory."], ["https://jisho.org", "Jisho dictionary", "From memory."], ["https://apps.ankiweb.net", "Anki flashcards", "Free on desktop and Android; the iPhone app is paid."], ["https://www.aozora.gr.jp/", "Aozora Bunko", "Free classic Japanese texts (N3+)."], ["https://www3.nhk.or.jp/news/easy/", "NHK News Web Easy", "Free easy news (N4+)."]].map(r => `<tr><td><a href="${r[0]}" target="_blank" rel="noopener">${r[1]}</a></td><td class="muted">${r[2]}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="muted small">For stroke order and recorded audio: <a href="https://a1.marugotoweb.jp/en/hiragana.php" target="_blank" rel="noopener">Marugoto Plus hiragana</a> (Japan Foundation, copyrighted; linked, not copied).</p>
    <h2>Downloads</h2>
    <div class="card"><b>Anki decks</b> <span class="muted small">(Anki: File &gt; Import, tab separator, allow HTML)</span><ul class="clean">
        <li><a href="decks/kana_hiragana.tsv" download>kana_hiragana.tsv</a></li><li><a href="decks/kana_katakana.tsv" download>kana_katakana.tsv</a></li>
        <li><a href="decks/n5_vocab.tsv" download>n5_vocab.tsv</a></li><li><a href="decks/n5_kanji.tsv" download>n5_kanji.tsv</a></li></ul></div>
    <h2>Set up Japanese typing</h2>
    <div class="grid g2">
      <div class="card"><b>Linux</b><p>Install an input method such as <code>fcitx5-mozc</code> (or <code>ibus-mozc</code>), add Mozc in settings, then log out and in. Switch with the shortcut you set (often Ctrl+Space).</p></div>
      <div class="card"><b>Windows 11</b><p>Settings &gt; Time &amp; language &gt; Language &amp; region &gt; Add a language &gt; Japanese. Switch with Win+Space.</p></div>
      <div class="card"><b>macOS</b><p>System Settings &gt; Keyboard &gt; Text Input &gt; Input Sources &gt; Edit &gt; + &gt; Japanese &gt; Romaji. Switch with the Globe key.</p></div>
      <div class="card"><b>Phone</b><p>Add the Japanese keyboard in keyboard settings; type "konnichiwa" in Romaji layout and pick こんにちは.</p></div></div>
    <p class="muted small">Menu names change between versions; search your OS name plus "add Japanese keyboard" if a step differs.</p>`;
};

/* =====================================================================
   ROUTER
   ===================================================================== */
let lastLevel = "N5";
function buildNav(route, lv, sec) {
  const A = (href, label, cur) => `<a href="${href}" ${cur ? 'aria-current="page"' : ""}>${label}</a>`;
  const cur = LEVELS.find(x => x.id === (lv || lastLevel));
  $("#nav").innerHTML = A("#/today", "Today", route === "today") + A("#/kana", "Kana", route === "kana")
    + `<div class="navlabel">Levels</div>
       <div class="lvlpills">${LEVELS.map(L => `<a class="lvlpill ${L.id === cur.id ? "on" : ""}" style="--c:${L.color}" href="${lvHref(L.id)}">${L.id}</a>`).join("")}</div>
       <div class="subnav" style="--c:${cur.color}">${SECTIONS.map(([k, label]) => A(lvHref(cur.id, k), label, lv && sec === k)).join("")}</div>`
    + A("#/levels", "Compare levels", route === "levels") + A("#/resources", "Resources", route === "resources");
}

function render() {
  const parts = (location.hash.replace(/^#\/?/, "") || "today").split("/");
  const isLevel = /^n[1-5]$/.test(parts[0]);
  const lv = isLevel ? parts[0].toUpperCase() : null;
  const sec = isLevel ? (["vocab", "kanji", "grammar"].includes(parts[1]) ? parts[1] : "overview") : null;
  const view = isLevel ? sec : (views[parts[0]] ? parts[0] : "today");
  if (isLevel) lastLevel = lv;
  buildNav(isLevel ? "level" : view, lv, sec);
  if (!D.kana.length) { $("#view").innerHTML = `<h1>Missing data</h1><p>data.js was not found. Keep it in the same folder as index.html.</p>`; return; }
  const y = window.scrollY, id = (lv || "") + view;
  $("#view").dataset.view = view;
  if (isLevel) levelPage(lv, sec, $("#view")); else views[view]($("#view"));
  window.scrollTo(0, id === window._lastView ? y : 0);
  window._lastView = id;
  $("#side").classList.remove("open");
}
window.addEventListener("hashchange", render);
$("#menu").onclick = () => $("#side").classList.toggle("open");
$("#theme").onclick = () => {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  r.dataset.theme = dark ? "light" : "dark";
};
$("#reset").onclick = () => {
  if (confirm("Reset ALL saved progress (plan start, checklists, known words)?")) {
    S = { start: null, days: {}, tasks: {}, known: { vocab: {}, kanji: {} } }; save(); render();
  }
};
render();
