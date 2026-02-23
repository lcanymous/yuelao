#!/usr/bin/env node
/**
 * 月老 CLI — 終端機版
 * 用法：node cli/yuelao.mjs
 * 需要環境變數：OPENROUTER_API_KEY
 */

import readline from 'readline';

const KEY   = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.YUELAO_MODEL || 'qwen/qwen3.5-plus-02-15';

const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

function header() {
    console.clear();
    console.log(`${RED}${BOLD}`);
    console.log('  ╔══════════════════════════════╗');
    console.log('  ║   🧧  月老 YUELAO  AI  CLI   ║');
    console.log('  ╚══════════════════════════════╝');
    console.log(`${RESET}${DIM}  Powered by Lawrence Chen${RESET}\n`);
}

async function callAPI(messages) {
    if (!KEY) throw new Error('請設定 OPENROUTER_API_KEY 環境變數');
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${KEY}`,
            'Content-Type':  'application/json',
            'HTTP-Referer':  'https://yuelao69.netlify.app',
            'X-Title':       'Yuelao CLI',
        },
        body: JSON.stringify({
            model: MODEL,
            messages,
            response_format: { type: 'json_object' },
        }),
    });
    if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error?.message || '月老連線失敗');
    }
    const r = await res.json();
    return r.choices?.[0]?.message?.content;
}

function renderMatches(matches) {
    console.log(`\n${YELLOW}${BOLD}  ✦ 命定之選 TOP ${matches.length} ✦${RESET}\n`);
    matches.forEach((m, i) => {
        const label = i === 0 ? `${YELLOW}【命定首選】${RESET}` : `${DIM}【第 ${i+1} 位】${RESET}`;
        console.log(`  ${label}`);
        console.log(`  ${BOLD}${m.name}${RESET}  ${DIM}${m.gender || ''}｜${m.age}歲｜${m.mbti}｜${m.zodiac}${RESET}`);
        if (m.job)       console.log(`  ${DIM}職業：${RESET}${m.job}`);
        if (m.location)  console.log(`  ${DIM}所在地：${RESET}${m.location}`);
        if (m.income)    console.log(`  ${DIM}月收入：${RESET}${m.income}`);
        if (m.education) console.log(`  ${DIM}學歷：${RESET}${m.education}`);
        if (m.height)    console.log(`  ${DIM}身高：${RESET}${m.height}`);
        console.log(`  ${CYAN}"${m.vibe}"${RESET}`);
        console.log(`  ${YELLOW}契合度：${BOLD}${m.match_score}%${RESET}`);
        console.log(`  ${DIM}${m.reason}${RESET}`);
        console.log(`  ⭐ ${DIM}魅力點：${RESET}${m.key_trait}`);
        console.log();
    });
}

async function main() {
    header();

    if (!KEY) {
        console.log(`${RED}⚠  找不到 OPENROUTER_API_KEY${RESET}`);
        console.log(`${DIM}請先執行：export OPENROUTER_API_KEY=sk-or-xxxx${RESET}\n`);
        rl.close();
        return;
    }

    console.log(`${DIM}月老將根據你的資料，配對命定 TOP 3 對象。${RESET}\n`);

    // ── 收集使用者資料 ──
    const gender   = await ask(`${YELLOW}你的性別${RESET}（男/女/其他）：`);
    const dob      = await ask(`${YELLOW}出生日期${RESET}（例 1995-06-15）：`);
    const zodiac   = await ask(`${YELLOW}星座${RESET}（例 雙子座）：`);
    const mbti     = await ask(`${YELLOW}MBTI${RESET}（例 ENFP）：`);
    const job      = await ask(`${YELLOW}職業${RESET}（可留空）：`);
    const location = await ask(`${YELLOW}居住地${RESET}（例 台北）：`);
    const income   = await ask(`${YELLOW}月收入範圍${RESET}（例 10–20萬，可留空）：`);
    const edu      = await ask(`${YELLOW}學歷${RESET}（例 碩士，可留空）：`);
    const height   = await ask(`${YELLOW}身高 cm${RESET}（可留空）：`);
    const habits   = await ask(`${YELLOW}生活習慣${RESET}（逗號分隔，例 規律健身,愛旅遊）：`);

    console.log(`\n${DIM}── 理想對象 ──${RESET}`);
    const tGender  = await ask(`${YELLOW}想找的對象性別${RESET}（男/女/不限）：`);
    const tVibe    = await ask(`${YELLOW}對象氛圍偏好${RESET}（例 文藝、成熟穩重）：`);
    const criteria = await ask(`${YELLOW}其他條件${RESET}（自由描述，可留空）：`);

    console.log(`\n${RED}🧓🏻 月老正在翻閱三生石⋯⋯${RESET}\n`);

    const system = `你是精通心理學與東方命理的 AI 月老。根據資料生成 3 位符合性別（${tGender}）的理想對象。
所有回應必須使用繁體中文。
回傳 JSON，包含 "matches" 陣列，每筆包含：name, age, gender, mbti, zodiac, job, location, income, education, height, match_score, reason, vibe, key_trait。`;

    const userMsg = `使用者：${gender}｜${dob}｜${zodiac}｜${mbti}｜職業：${job}｜居住：${location}｜月收入：${income}｜學歷：${edu}｜身高：${height}cm｜習慣：${habits}
理想對象：${tGender}｜氛圍：${tVibe}｜其他：${criteria}`;

    try {
        const raw     = await callAPI([
            { role: 'system', content: system },
            { role: 'user',   content: userMsg },
        ]);
        const clean   = raw.replace(/```json|```/gi, '').trim();
        const content = JSON.parse(clean);
        renderMatches(content.matches);
    } catch (err) {
        console.error(`${RED}錯誤：${err.message}${RESET}`);
    }

    const again = await ask(`${DIM}按 Enter 離開，或輸入 r 重新測算：${RESET}`);
    if (again.trim().toLowerCase() === 'r') {
        await main();
        return;
    }

    console.log(`\n${DIM}「紅線一繫，月老不負責後續。」${RESET}\n`);
    rl.close();
}

main().catch(console.error);
