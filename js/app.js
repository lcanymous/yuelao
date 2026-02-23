/* ── 主應用邏輯 ── */

let _chatMessages = []; // 保存對話上下文

function toggleSettings() {
    document.getElementById('settings-modal').classList.toggle('hidden');
}

function toggleApiInputs() {
    const engine = document.getElementById('ai-engine').value;
    document.getElementById('openrouter-inputs').classList.toggle('hidden', engine !== 'openrouter');
    document.getElementById('gemini-inputs').classList.toggle('hidden', engine !== 'gemini');
}

async function startMatching() {
    const engine        = document.getElementById('ai-engine').value;
    const openRouterKey = document.getElementById('api-key').value;
    const geminiKey     = document.getElementById('gemini-key').value;
    const modelId       = document.getElementById('model-id').value || 'qwen/qwen3.5-plus-02-15';

    const habits = [...document.querySelectorAll('input[name="habit"]:checked')]
        .map(el => el.value);

    const d = {
        myGender:        document.getElementById('my-gender').value,
        targetGender:    document.getElementById('target-gender').value,
        dob:             document.getElementById('dob').value,
        zodiac:          document.getElementById('zodiac').value,
        mbti:            document.getElementById('mbti').value,
        job:             document.getElementById('job').value,
        height:          document.getElementById('height').value,
        stats:           document.getElementById('stats').value,
        location:        document.getElementById('location').value,
        income:          document.getElementById('income').value,
        education:       document.getElementById('education').value,
        familyBg:        document.getElementById('family-bg').value,
        habits:          habits.join('、'),
        criteria:        document.getElementById('criteria').value,
        targetHeight:    document.getElementById('target_height').value,
        targetLocation:  document.getElementById('target-location').value,
        targetIncome:    document.getElementById('target-income').value,
        targetEducation: document.getElementById('target-education').value,
        targetVibe:      document.getElementById('target_vibe').value,
    };

    if (!d.dob) { alert('請填寫出生日期。'); return; }

    // 計算使用者年齡，給出合理對象年齡範圍（避免 AI 生小孩）
    const myAge    = new Date().getFullYear() - new Date(d.dob).getFullYear();
    const ageMin   = Math.max(18, myAge - 8);
    const ageMax   = myAge + 8;

    startLoading();

    try {
        const system = `你是一位精通現代心理學與東方命理的 AI 月老。根據使用者資料生成 3 位符合性別要求（${d.targetGender}）的虛擬理想對象。
重要限制：對象年齡必須在 ${ageMin}–${ageMax} 歲之間，且必須是現實生活中可能存在的成年人。
所有回應必須使用繁體中文。
回應必須是 JSON，包含陣列 "matches"，每筆包含：name, age, gender, mbti, zodiac, job, location, income, education, height, match_score, reason, vibe, key_trait。`;

        const userMsg = `使用者資料：
性別：${d.myGender}，生日：${d.dob}（${myAge}歲），星座：${d.zodiac}，MBTI：${d.mbti}
職業：${d.job}，身高：${d.height}cm，體態：${d.stats}
居住地：${d.location}，月收入：${d.income}，學歷：${d.education}
家庭背景：${d.familyBg}，生活習慣：${d.habits}

理想對象條件：
性別：${d.targetGender}，身高：${d.targetHeight}，居住地：${d.targetLocation}
收入要求：${d.targetIncome}，學歷要求：${d.targetEducation}
氛圍偏好：${d.targetVibe}
其他條件：${d.criteria}`;

        let resultText = '';

        if (engine === 'proxy') {
            resultText = await callProxyAPI(userMsg, system);
        } else if (engine === 'gemini') {
            if (!geminiKey) throw new Error('請先在設定中輸入 Gemini API Key');
            resultText = await callGeminiAPI(userMsg, system, geminiKey);
        } else {
            if (!openRouterKey) throw new Error('請先在設定中輸入 OpenRouter API Key');
            resultText = await callOpenRouterAPI(openRouterKey, modelId, userMsg, system);
        }

        if (!resultText) throw new Error('AI 回傳內容為空');
        const clean   = resultText.replace(/```json|```/gi, '').trim();
        const content = JSON.parse(clean);

        // 保存對話上下文供追問使用
        _chatMessages = [
            { role: 'system',    content: system + '\n追問時請用自然語言（繁體中文）回覆，不必回傳 JSON。' },
            { role: 'user',      content: userMsg },
            { role: 'assistant', content: resultText },
        ];

        renderResults(content.matches);

    } catch (err) {
        console.error(err);
        alert(`月老連線中斷：${err.message}`);
    } finally {
        stopLoading();
    }
}

/* ── 追問月老 ── */
const CHAT_FREE_LIMIT = 3;
let _chatCount = 0;

async function askYuelao() {
    const input = document.getElementById('chat-input');
    const q     = input.value.trim();
    if (!q) return;

    // 超過免費次數 → 顯示 Buy Me a Coffee
    if (_chatCount >= CHAT_FREE_LIMIT) {
        showChatPaywall();
        return;
    }

    input.value = '';
    input.disabled = true;
    document.getElementById('chat-send-btn').disabled = true;

    appendChatMsg('user', q);
    _chatCount++;

    // 剩一次時提示
    if (_chatCount === CHAT_FREE_LIMIT) {
        appendChatMsg('system', `⚠ 這是最後一次免費追問，月老的紅線不是無限的⋯`);
    }

    const thinkingId = appendChatMsg('yuelao', '月老正在細想⋯⋯');

    try {
        const engine        = document.getElementById('ai-engine').value;
        const openRouterKey = document.getElementById('api-key').value;
        const geminiKey     = document.getElementById('gemini-key').value;
        const modelId       = document.getElementById('model-id').value || 'qwen/qwen3.5-plus-02-15';

        _chatMessages.push({ role: 'user', content: q });

        let reply = '';
        if (engine === 'proxy') {
            reply = await callProxyAPI(null, null, { messages: _chatMessages, json: false });
        } else if (engine === 'gemini') {
            if (!geminiKey) throw new Error('請先設定 Gemini API Key');
            reply = await callGeminiAPI(q, _chatMessages[0].content, geminiKey);
        } else {
            if (!openRouterKey) throw new Error('請先設定 OpenRouter API Key');
            reply = await callOpenRouterAPI(openRouterKey, modelId, q, _chatMessages[0].content);
        }

        _chatMessages.push({ role: 'assistant', content: reply });
        updateChatMsg(thinkingId, reply);

        // 用完後鎖定輸入框
        if (_chatCount >= CHAT_FREE_LIMIT) {
            lockChatInput();
        }

    } catch (err) {
        updateChatMsg(thinkingId, `⚠ ${err.message}`);
        _chatCount--; // 失敗不扣次數
    } finally {
        if (_chatCount < CHAT_FREE_LIMIT) {
            input.disabled = false;
            document.getElementById('chat-send-btn').disabled = false;
            input.focus();
        }
    }
}

function lockChatInput() {
    const input = document.getElementById('chat-input');
    const btn   = document.getElementById('chat-send-btn');
    input.disabled = true;
    btn.disabled   = true;
    showChatPaywall();
}

function showChatPaywall() {
    if (document.getElementById('chat-paywall')) return;
    const wall = document.createElement('div');
    wall.id          = 'chat-paywall';
    wall.className   = 'glass-card rounded-3xl p-6 text-center space-y-4 border border-yellow-500/30';
    wall.innerHTML   = `
        <div class="text-3xl">🧓🏻</div>
        <div>
            <p class="font-bold text-white">月老已傾盡三次紅線⋯⋯</p>
            <p class="text-xs text-slate-400 mt-1">想繼續追問命定之事？請奉上香火，月老方能再算。</p>
        </div>
        <a href="https://buymeacoffee.com/techwithlc" target="_blank" rel="noopener"
           class="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 py-3 rounded-2xl transition-all text-sm">
            ☕ 奉上香火 $5 USD
        </a>
        <p class="text-[10px] text-slate-600">Buy Me a Coffee · buymeacoffee.com/techwithlc</p>
    `;
    document.getElementById('chat-section').appendChild(wall);
    wall.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

let _chatMsgId = 0;
function appendChatMsg(role, text) {
    const id   = `cm-${++_chatMsgId}`;
    const wrap = document.getElementById('chat-messages');
    const div  = document.createElement('div');
    div.id = id;

    if (role === 'user') {
        div.className = 'flex justify-end';
        div.innerHTML = `<div class="bg-white/10 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-sm">${text}</div>`;
    } else if (role === 'system') {
        div.className = 'text-center';
        div.innerHTML = `<span class="text-[10px] text-yellow-500/60 bg-yellow-500/5 px-3 py-1 rounded-full">${text}</span>`;
    } else {
        div.className = 'flex justify-start items-start gap-2';
        div.innerHTML = `<span class="text-xl flex-shrink-0 mt-0.5">🧓🏻</span>
           <div class="bg-red-950/40 border border-red-500/20 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm text-slate-300 leading-relaxed">${text}</div>`;
    }
    wrap.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return id;
}

function updateChatMsg(id, text) {
    const el = document.querySelector(`#${id} div:last-child`);
    if (el) el.textContent = text;
}


/* ── AI 生圖（背景非同步載入）── */
const VIBE_MAP = {
    '陽光': 'cheerful', '溫柔': 'gentle', '成熟': 'elegant', '文藝': 'artistic',
    '神秘': 'mysterious', '活潑': 'lively', '知性': 'intelligent', '甜美': 'sweet',
    '氣質': 'graceful', '理智': 'calm', '浪漫': 'romantic', '獨立': 'confident',
};

function buildImgUrl(m) {
    const gender = m.gender === '女' ? 'woman' : 'man';
    const age    = m.age || 25;
    let   vibe   = 'natural';
    for (const [zh, en] of Object.entries(VIBE_MAP)) {
        if ((m.vibe || '').includes(zh)) { vibe = en; break; }
    }
    const seed   = Math.floor(Math.random() * 99999);
    const prompt = encodeURIComponent(`${age} year old Asian ${gender} ${vibe} portrait, soft light, photo`);
    return `https://image.pollinations.ai/prompt/${prompt}?model=flux&width=400&height=400&seed=${seed}&nologo=true`;
}

function loadMatchImage(wrapId, url, initial) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const img = new Image();
    img.onload = () => {
        wrap.innerHTML = '';
        const el = document.createElement('img');
        el.src       = url;
        el.alt       = initial;
        el.className = 'w-full h-full object-cover';
        wrap.appendChild(el);
    };
    img.onerror = () => { /* 保持 fallback 頭像，不動作 */ };
    img.src = url;
}

/* ── 結果渲染 ── */
function infoPill(label, value) {
    if (!value) return '';
    return `<span class="inline-flex items-center gap-1 bg-white/5 rounded-lg px-2.5 py-1">
        <span class="text-[9px] text-slate-500">${label}：</span>
        <span class="text-[11px] text-white font-medium">${value}</span>
    </span>`;
}

function renderResults(matches) {
    const list = document.getElementById('match-list');
    list.innerHTML = '';
    _chatMsgId = 0;
    _chatCount = 0;
    document.getElementById('chat-messages').innerHTML = '';
    const oldPaywall = document.getElementById('chat-paywall');
    if (oldPaywall) oldPaywall.remove();
    const chatInput = document.getElementById('chat-input');
    const chatBtn   = document.getElementById('chat-send-btn');
    if (chatInput) { chatInput.disabled = false; chatInput.value = ''; }
    if (chatBtn)   chatBtn.disabled = false;

    if (!matches?.length) {
        alert('AI 月老未能生成對象，請重試或調整條件。');
        resetApp();
        return;
    }

    matches.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = `match-card glass-card p-5 rounded-3xl relative ${
            i === 0 ? 'border border-yellow-500/40 shadow-lg shadow-yellow-500/10' : 'border border-white/5'
        }`;

        const chName = (m.name || '').replace(/\(.*?\)/g, '').trim();
        const initial = chName ? chName.charAt(0) : '？';
        const score   = m.match_score || 0;

        const pills = [
            infoPill('職業',  m.job),
            infoPill('所在地', m.location),
            infoPill('月收入', m.income),
            infoPill('學歷',  m.education),
            infoPill('身高',  m.height),
        ].filter(Boolean).join('');

        const imgUrl  = buildImgUrl(m);
        const wrapId  = `img-wrap-${i}`;

        div.innerHTML = `
            ${i === 0 ? `<div class="absolute -top-3 left-5 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full tracking-widest">命定首選 ✦</div>` : ''}
            <div class="flex gap-4 pt-1">
                <div class="flex flex-col items-center gap-2 flex-shrink-0 w-20">
                    <!-- 照片容器：先顯示字母頭像，背景載入 AI 圖 -->
                    <div id="${wrapId}" class="w-20 h-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 yuelao-gradient flex items-center justify-center font-black text-yellow-500 text-2xl">
                        ${initial}
                    </div>
                    <div class="text-center">
                        <div class="text-lg font-black text-yellow-400 leading-none">${score}%</div>
                        <div class="text-[8px] text-slate-500 leading-tight mt-0.5">契合度</div>
                    </div>
                </div>
                <div class="flex-1 min-w-0 space-y-3">
                    <div>
                        <h4 class="font-bold text-base leading-snug">
                            ${chName} <span class="text-xs text-slate-500 font-normal">${m.gender || ''}</span>
                        </h4>
                        <p class="text-xs text-slate-400 mt-0.5">${m.age} 歲 · ${m.mbti || ''} · ${m.zodiac || ''}</p>
                    </div>
                    <div class="w-full bg-white/5 h-0.5 rounded-full overflow-hidden">
                        <div class="bg-gradient-to-r from-red-500 to-yellow-500 h-full rounded-full" style="width:${score}%"></div>
                    </div>
                    <div class="flex flex-wrap gap-1.5">${pills}</div>
                    <p class="text-xs italic text-slate-300 bg-white/5 rounded-xl px-3 py-2">"${m.vibe || '神秘氛圍'}"</p>
                    <p class="text-[11px] text-slate-400 leading-relaxed">${m.reason || ''}</p>
                    <div class="text-[10px] text-yellow-500/60 bg-yellow-500/5 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                        <i data-lucide="star" class="w-3 h-3 flex-shrink-0"></i>
                        <span>魅力點：${m.key_trait || '魅力十足'}</span>
                    </div>
                </div>
            </div>
        `;
        list.appendChild(div);

        // 背景非同步載入 AI 圖（不阻塞卡片渲染）
        setTimeout(() => loadMatchImage(wrapId, imgUrl, initial), i * 300);
    });

    lucide.createIcons();
    document.getElementById('form-container').classList.add('hidden');
    document.getElementById('results-container').classList.remove('hidden');
    document.getElementById('chat-section').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetApp() {
    document.getElementById('form-container').classList.remove('hidden');
    document.getElementById('results-container').classList.add('hidden');
    document.getElementById('chat-section').classList.add('hidden');
    _chatMessages = [];
    [1, 2, 3].forEach(n => document.getElementById(`step-${n}`).classList.remove('active'));
    currentStep = 1;
    document.getElementById('step-1').classList.add('active');
    document.getElementById('step-label').textContent   = '步驟 1 / 3';
    document.getElementById('step-title').textContent   = '靈魂檔案';
    document.getElementById('progress-bar').style.width = '33%';
    [1, 2, 3].forEach(n => {
        document.getElementById(`dot-${n}`).className =
            `w-2 h-2 rounded-full transition-all ${n === 1 ? 'bg-yellow-500' : 'bg-white/20'}`;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
