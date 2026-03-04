/* ── 主應用邏輯 ── */

let _chatMessages  = []; // 保存對話上下文
let _savageMode    = false;
let _appMode       = 'match'; // 'match' | 'analysis'
let _lastFormData  = null; // 供現實指數使用

function setMode(mode) {
    _appMode = mode;
    const isAnalysis = mode === 'analysis';

    // tabs
    document.getElementById('tab-match').classList.toggle('active', !isAnalysis);
    document.getElementById('tab-analysis').classList.toggle('active', isAnalysis);

    // step-3 內容區切換
    document.getElementById('step3-match').classList.toggle('hidden', isAnalysis);
    document.getElementById('step3-analysis').classList.toggle('hidden', !isAnalysis);

    // 步驟標題
    const meta = document.getElementById('step-title');
    if (meta && currentStep === 3) {
        meta.textContent = isAnalysis ? '分析對象' : '命定條件';
    }

    // 啟動按鈕文字
    const btn = document.getElementById('start-matching-btn');
    if (btn) {
        btn.innerHTML = isAnalysis
            ? '月老開始分析 <i data-lucide="scan-search" class="w-4 h-4"></i>'
            : (_savageMode
                ? '啟動毒舌演算 <i data-lucide="flame" class="w-4 h-4 fill-current"></i>'
                : '啟動月老演算 <i data-lucide="zap" class="w-4 h-4 fill-current group-hover:animate-bounce"></i>');
        lucide.createIcons();
    }
}

function handleStart() {
    if (_appMode === 'analysis') startAnalysis();
    else startMatching();
}

function toggleSavage() {
    _savageMode = !_savageMode;
    const sw   = document.getElementById('savage-switch');
    const hint = document.getElementById('savage-hint');
    const btn  = document.getElementById('start-matching-btn');
    sw.classList.toggle('on', _savageMode);
    hint.classList.toggle('hidden', !_savageMode);
    if (btn) {
        btn.innerHTML = _savageMode
            ? '啟動毒舌演算 <i data-lucide="flame" class="w-4 h-4 fill-current"></i>'
            : '啟動月老演算 <i data-lucide="zap" class="w-4 h-4 fill-current group-hover:animate-bounce"></i>';
        lucide.createIcons();
    }
}

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
    _lastFormData = d;

    // 計算使用者年齡，給出合理對象年齡範圍（避免 AI 生小孩）
    const myAge    = new Date().getFullYear() - new Date(d.dob).getFullYear();
    const ageMin   = Math.max(18, myAge - 8);
    const ageMax   = myAge + 8;

    startLoading(_savageMode);

    try {
        const system = _savageMode
            ? `你是一位精通現代心理學與東方命理，但說話毒舌、犀利、不留情面的 AI 月老。
你有義務批評使用者不切實際的期待、自相矛盾的條件、戀愛腦思維。
語氣：見過太多傻瓜的老神仙，乾式幽默，不罵人但句句到肉，讓人想笑又想哭。
根據使用者資料生成 3 位符合性別要求（${d.targetGender}）的虛擬理想對象。
重要限制：對象年齡必須在 ${ageMin}–${ageMax} 歲之間，且必須是現實生活中可能存在的成年人。
所有回應必須使用繁體中文。
回應必須是 JSON，包含：
  overall_roast（對使用者整體一句毒評，40字內，要刺但公平，點出最大矛盾或戀愛腦症狀），
  matches 陣列，每筆包含：name, age, gender, mbti, zodiac, job, location, income, education, height, match_score, reason, vibe, key_trait, roast（月老對此配對的毒語，25字內，嘲諷使用者或點出現實落差）。`
            : `你是一位精通現代心理學與東方命理的 AI 月老。根據使用者資料生成 3 位符合性別要求（${d.targetGender}）的虛擬理想對象。
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

        renderResults(content.matches, content.overall_roast);

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
    const prompt = `${age} year old Asian ${gender} ${vibe} portrait soft light photo`;
    // 透過 Netlify function proxy，避免瀏覽器 CORS 問題
    return `/.netlify/functions/genimage?prompt=${encodeURIComponent(prompt)}&seed=${seed}`;
}

function dicebearUrl(name) {
    // Fallback：DiceBear 插畫頭像，快速穩定
    const style = Math.random() > 0.5 ? 'lorelei' : 'adventurer';
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(name)}&backgroundColor=7f1d1d,450a0a`;
}

function loadMatchImage(wrapId, url, name) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;

    const img    = new Image();
    let   loaded = false;

    img.onload = () => {
        loaded = true;
        wrap.innerHTML = '';
        const el = document.createElement('img');
        el.src       = url;
        el.alt       = name;
        el.className = 'w-full h-full object-cover';
        wrap.appendChild(el);
    };

    // 如果 proxy 超時（20s），改用 DiceBear 插畫頭像
    img.onerror = () => {
        if (!loaded) loadDicebear(wrapId, name);
    };

    setTimeout(() => {
        if (!loaded) {
            img.src = '';
            loadDicebear(wrapId, name);
        }
    }, 20000);

    img.src = url;
}

function loadDicebear(wrapId, name) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    wrap.innerHTML = '';
    const el = document.createElement('img');
    el.src       = dicebearUrl(name);
    el.alt       = name;
    el.className = 'w-full h-full object-cover p-1';
    wrap.appendChild(el);
}

/* ── 真人分析 ── */
async function startAnalysis() {
    const desc    = document.getElementById('real-person-desc').value.trim();
    const concern = document.getElementById('main-concern').value.trim();
    const stage   = document.getElementById('rel-stage').value;

    if (!desc) { alert('請描述你心儀的對象，月老才能分析。'); return; }

    const dob    = document.getElementById('dob').value;
    if (!dob) { alert('請回到步驟一填寫出生日期。'); return; }

    const habits = [...document.querySelectorAll('input[name="habit"]:checked')].map(el => el.value);
    const myAge  = new Date().getFullYear() - new Date(dob).getFullYear();

    const me = {
        gender:    document.getElementById('my-gender').value,
        age:       myAge,
        zodiac:    document.getElementById('zodiac').value,
        mbti:      document.getElementById('mbti').value,
        job:       document.getElementById('job').value,
        height:    document.getElementById('height').value,
        location:  document.getElementById('location').value,
        income:    document.getElementById('income').value,
        education: document.getElementById('education').value,
        habits:    habits.join('、'),
    };

    const engine        = document.getElementById('ai-engine').value;
    const openRouterKey = document.getElementById('api-key').value;
    const geminiKey     = document.getElementById('gemini-key').value;
    const modelId       = document.getElementById('model-id').value || 'qwen/qwen3.5-plus-02-15';

    startLoading(_savageMode);

    try {
        const savageExtra = _savageMode
            ? '\n語氣要毒舌犀利，不留情面，像個見過太多感情失敗案例的老神仙，但仍給出有用的建議。'
            : '\n語氣溫暖有洞察力，像個見過太多感情的智慧老前輩。';

        const system = `你是一位精通現代心理學與東方命理的 AI 月老，擅長分析真實的感情情況。${savageExtra}
所有回應必須使用繁體中文。
回傳 JSON，格式如下：
{
  "compatibility_score": 0到100的數字,
  "reading": "月老整體觀察（80字內，有洞察力，點出核心動態）",
  "strengths": ["你們的優勢1", "優勢2"],
  "risks": [{"level": "red 或 yellow", "text": "風險描述（25字內）"}],
  "advice": "月老最想對你說的一句話（40字內）",
  "next_steps": ["具體可執行的行動1", "行動2", "行動3"]
}`;

        const userMsg = `我的資料：
性別：${me.gender}，年齡：${me.age}歲，星座：${me.zodiac}，MBTI：${me.mbti}
職業：${me.job}，身高：${me.height}cm，居住地：${me.location}
月收入：${me.income}，學歷：${me.education}，生活習慣：${me.habits}

關係現況：${stage}

對方描述：
${desc}
${concern ? `\n我最擔心的：${concern}` : ''}

請分析我們的相容性，點出機會與風險，給我具體建議。`;

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

        renderAnalysis(content);

    } catch (err) {
        console.error(err);
        alert(`月老連線中斷：${err.message}`);
    } finally {
        stopLoading();
    }
}

function renderAnalysis(data) {
    const score    = data.compatibility_score ?? 0;
    const strengths = data.strengths || [];
    const risks     = data.risks     || [];
    const steps     = data.next_steps || [];

    const scoreColor = score >= 75 ? '#34d399' : score >= 55 ? '#facc15' : score >= 35 ? '#fb923c' : '#f87171';
    const scoreLabel = score >= 75 ? '緣分深厚' : score >= 55 ? '有緣有份' : score >= 35 ? '緣分尚淺' : '緣分堪憂';

    const risksHtml = risks.map(r => `
        <li class="flex items-start gap-2 text-xs leading-relaxed">
            <span class="flex-shrink-0 mt-0.5">${r.level === 'red' ? '🔴' : '🟡'}</span>
            <span class="text-slate-300">${r.text}</span>
        </li>`).join('');

    const strengthsHtml = strengths.map(s => `
        <li class="flex items-start gap-2 text-xs leading-relaxed">
            <span class="flex-shrink-0 mt-0.5">✦</span>
            <span class="text-slate-300">${s}</span>
        </li>`).join('');

    const stepsHtml = steps.map((s, i) => `
        <div class="flex items-start gap-3">
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-[10px] font-black flex items-center justify-center text-yellow-400">${i + 1}</span>
            <span class="text-sm text-slate-300 leading-relaxed">${s}</span>
        </div>`).join('');

    document.getElementById('analysis-body').innerHTML = `
        <!-- 相容指數 -->
        <div class="glass-card rounded-3xl p-6 flex items-center gap-5">
            <div class="flex-shrink-0 text-center">
                <div class="text-5xl font-black leading-none" style="color:${scoreColor}">${score}</div>
                <div class="text-[9px] text-slate-500 mt-1 uppercase tracking-widest">相容指數</div>
            </div>
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm font-bold" style="color:${scoreColor}">${scoreLabel}</span>
                    <span class="text-[10px] text-slate-500">/100</span>
                </div>
                <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700" style="width:${score}%; background:${scoreColor}"></div>
                </div>
                <p class="text-xs text-slate-400 mt-3 leading-relaxed italic">"${data.reading || ''}"</p>
            </div>
        </div>

        <!-- 優勢 + 風險 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="glass-card rounded-2xl p-4 space-y-2">
                <p class="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-3">你們的優勢</p>
                <ul class="space-y-2">${strengthsHtml || '<li class="text-xs text-slate-500">月老暫無特別觀察</li>'}</ul>
            </div>
            <div class="glass-card rounded-2xl p-4 space-y-2">
                <p class="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-3">潛在風險</p>
                <ul class="space-y-2">${risksHtml || '<li class="text-xs text-slate-500">月老暫時沒看到明顯風險</li>'}</ul>
            </div>
        </div>

        <!-- 月老最想說的話 -->
        <div class="glass-card rounded-2xl p-5 border border-yellow-500/20 relative">
            <div class="absolute -top-3 left-5 text-yellow-500/40 text-3xl leading-none select-none">"</div>
            <p class="text-[10px] text-yellow-500/60 uppercase tracking-widest mb-2">月老的話</p>
            <p class="text-sm text-yellow-100 leading-relaxed font-medium">${data.advice || ''}</p>
        </div>

        <!-- 下一步行動 -->
        <div class="glass-card rounded-2xl p-5 space-y-3">
            <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">月老建議你做</p>
            <div class="space-y-3">${stepsHtml}</div>
        </div>
    `;

    // 重設 chat 狀態
    _chatMsgId = 0;
    _chatCount = 0;
    document.getElementById('chat-messages').innerHTML = '';
    const oldPaywall = document.getElementById('chat-paywall');
    if (oldPaywall) oldPaywall.remove();
    const chatInput = document.getElementById('chat-input');
    const chatBtn   = document.getElementById('chat-send-btn');
    if (chatInput) { chatInput.disabled = false; chatInput.value = ''; }
    if (chatBtn)   chatBtn.disabled = false;

    // 追問提示文字改一下
    const chatHint = document.querySelector('#chat-section p.text-\\[11px\\]');
    if (chatHint) chatHint.textContent = '可以繼續問，例如：「他這個行為代表什麼？」「我該怎麼開口？」';

    lucide.createIcons();
    document.getElementById('form-container').classList.add('hidden');
    document.getElementById('analysis-container').classList.remove('hidden');
    document.getElementById('chat-section').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── 現實指數 ── */
function calcRealityCheck(d) {
    const incomeRank = { '': 0, '3萬以下': 1, '3–5萬': 2, '5–10萬': 3, '10–20萬': 4, '20萬以上': 5 };
    const tgIncRank  = { '不限': 0, '有穩定工作即可': 1, '月收5萬以上': 3, '月收10萬以上': 4, '財務自由': 6 };
    const eduRank    = { '': 0, '其他': 0, '高中／職': 1, '大學': 2, '碩士': 3, '博士': 4 };
    const tgEduRank  = { '不限': 0, '大學以上': 2, '碩士以上': 3, '博士': 4 };

    const flags = [];
    let penalty = 0;

    // 收入落差
    const myInc = incomeRank[d.income]        ?? 0;
    const tgInc = tgIncRank[d.targetIncome]   ?? 0;
    const incGap = tgInc - myInc;
    if (incGap >= 4) {
        penalty += 40;
        flags.push({ icon: '💸', text: `月收 ${d.income || '未填'} 想找「${d.targetIncome}」的對象——老夫掐指算過，這叫仙人跳。` });
    } else if (incGap >= 2) {
        penalty += 20;
        flags.push({ icon: '💰', text: `要求對象收入比自己高出一截，有志氣，但你的籌碼是什麼？` });
    }

    // 學歷落差
    const myEdu = eduRank[d.education]           ?? 0;
    const tgEdu = tgEduRank[d.targetEducation]   ?? 0;
    if (tgEdu > myEdu && tgEdu - myEdu >= 2) {
        penalty += 20;
        flags.push({ icon: '🎓', text: `自己 ${d.education || '未填'}，要找 ${d.targetEducation} 的人——學歷不是不行，但老夫建議你先想好話術。` });
    }

    // 條件清單太長
    const criteriaLen = (d.criteria || '').length;
    if (criteriaLen > 100) {
        penalty += 15;
        flags.push({ icon: '📋', text: `「其他條件」寫了 ${criteriaLen} 字——你在徵才還是找對象？` });
    } else if (criteriaLen > 60) {
        penalty += 8;
        flags.push({ icon: '📝', text: `條件寫得很詳細，老夫只是提醒你：越長越難找而已。` });
    }

    // 自己資料幾乎空白卻要求很多
    const selfBlank = !d.job && !d.income && !d.education;
    if (selfBlank && (tgInc > 1 || tgEdu > 1)) {
        penalty += 15;
        flags.push({ icon: '🪞', text: `自己資料留白，對象條件不少——老夫建議先認識一下自己。` });
    }

    const score = Math.max(0, 100 - penalty);
    return { score, flags };
}

function renderRealityCheck(d) {
    const el = document.getElementById('reality-check');
    if (!el) return;
    const { score, flags } = calcRealityCheck(d);
    if (!flags.length) { el.classList.add('hidden'); return; }

    const grade = score >= 80 ? { label: '還算清醒', color: 'text-emerald-400' }
                : score >= 60 ? { label: '有點飄',   color: 'text-yellow-400' }
                : score >= 40 ? { label: '戀愛腦初期', color: 'text-orange-400' }
                :               { label: '重症戀愛腦', color: 'text-red-400' };

    el.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
                <span class="text-base">🪬</span>
                <span class="text-[11px] text-slate-400 uppercase tracking-widest font-medium">月老現實指數</span>
            </div>
            <div class="flex items-baseline gap-1">
                <span class="text-2xl font-black ${grade.color}">${score}</span>
                <span class="text-[10px] text-slate-500">/100</span>
                <span class="text-[10px] ${grade.color} ml-1 font-bold">${grade.label}</span>
            </div>
        </div>
        <div class="w-full bg-white/5 h-1 rounded-full overflow-hidden mb-3">
            <div class="h-full rounded-full transition-all duration-700"
                 style="width:${score}%; background: ${score >= 80 ? '#34d399' : score >= 60 ? '#facc15' : score >= 40 ? '#fb923c' : '#f87171'}"></div>
        </div>
        <ul class="space-y-2">
            ${flags.map(f => `
                <li class="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
                    <span class="flex-shrink-0 mt-0.5">${f.icon}</span>
                    <span>${f.text}</span>
                </li>`).join('')}
        </ul>
    `;
    el.classList.remove('hidden');
}

/* ── 結果渲染 ── */
function infoPill(label, value) {
    if (!value) return '';
    return `<span class="inline-flex items-center gap-1 bg-white/5 rounded-lg px-2.5 py-1">
        <span class="text-[9px] text-slate-500">${label}：</span>
        <span class="text-[11px] text-white font-medium">${value}</span>
    </span>`;
}

function renderResults(matches, overallRoast) {
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

    // 毒舌模式：在結果頂部插入月老總批語 banner
    const roastBanner = document.getElementById('overall-roast-banner');
    if (overallRoast && _savageMode) {
        roastBanner.innerHTML = `
            <span class="text-2xl flex-shrink-0">🧓🏻</span>
            <div>
                <p class="text-[10px] text-orange-400/70 uppercase tracking-widest mb-1">月老批語</p>
                <p class="text-sm text-orange-100 leading-relaxed italic">"${overallRoast}"</p>
            </div>
        `;
        roastBanner.classList.remove('hidden');
    } else {
        roastBanner.classList.add('hidden');
        roastBanner.innerHTML = '';
    }

    matches.forEach((m, i) => {
        const div = document.createElement('div');
        const isTop = i === 0;
        div.className = `match-card glass-card p-5 rounded-3xl relative ${
            isTop
                ? (_savageMode ? 'savage-card shadow-lg shadow-orange-900/20' : 'border border-yellow-500/40 shadow-lg shadow-yellow-500/10')
                : (_savageMode ? 'savage-card' : 'border border-white/5')
        }`;

        const chName  = (m.name || '').replace(/\(.*?\)/g, '').trim();
        const initial = chName ? chName.charAt(0) : '？';
        const score   = m.match_score || 0;

        const pills = [
            infoPill('職業',  m.job),
            infoPill('所在地', m.location),
            infoPill('月收入', m.income),
            infoPill('學歷',  m.education),
            infoPill('身高',  m.height),
        ].filter(Boolean).join('');

        const imgUrl = buildImgUrl(m);
        const wrapId = `img-wrap-${i}`;

        // 毒舌模式的首選標籤
        const topBadge = isTop
            ? (_savageMode
                ? `<div class="absolute -top-3 left-5 bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest">最不慘選擇 🔥</div>`
                : `<div class="absolute -top-3 left-5 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full tracking-widest">命定首選 ✦</div>`)
            : '';

        // 毒舌月老對此配對的批語
        const roastBlock = (m.roast && _savageMode)
            ? `<div class="roast-pill flex items-start gap-1.5">
                   <span class="flex-shrink-0 mt-0.5">🧓🏻</span>
                   <span>${m.roast}</span>
               </div>`
            : '';

        div.innerHTML = `
            ${topBadge}
            <div class="flex gap-4 pt-1">
                <div class="flex flex-col items-center gap-2 flex-shrink-0 w-20">
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
                    ${roastBlock}
                </div>
            </div>
        `;
        list.appendChild(div);

        setTimeout(() => loadMatchImage(wrapId, imgUrl, initial), i * 300);
    });

    if (_lastFormData) renderRealityCheck(_lastFormData);

    lucide.createIcons();
    document.getElementById('form-container').classList.add('hidden');
    document.getElementById('results-container').classList.remove('hidden');
    document.getElementById('chat-section').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetApp() {
    document.getElementById('form-container').classList.remove('hidden');
    document.getElementById('results-container').classList.add('hidden');
    document.getElementById('analysis-container').classList.add('hidden');
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

/* ── 靈魂記憶（localStorage）── */
const PROFILE_KEY = 'yuelao_profile';

function saveProfile() {
    const habits = [...document.querySelectorAll('input[name="habit"]:checked')].map(el => el.value);
    const profile = {
        myGender: document.getElementById('my-gender')?.value,
        dob:      document.getElementById('dob')?.value,
        zodiac:   document.getElementById('zodiac')?.value,
        mbti:     document.getElementById('mbti')?.value,
        height:   document.getElementById('height')?.value,
        stats:    document.getElementById('stats')?.value,
        job:      document.getElementById('job')?.value,
        location: document.getElementById('location')?.value,
        income:   document.getElementById('income')?.value,
        education:document.getElementById('education')?.value,
        familyBg: document.getElementById('family-bg')?.value,
        habits,
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function loadProfile() {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return;
    try {
        const p = JSON.parse(raw);
        const set = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
        set('my-gender', p.myGender);
        set('dob',       p.dob);
        set('zodiac',    p.zodiac);
        set('mbti',      p.mbti);
        set('height',    p.height);
        set('stats',     p.stats);
        set('job',       p.job);
        set('location',  p.location);
        set('income',    p.income);
        set('education', p.education);
        set('family-bg', p.familyBg);
        document.querySelectorAll('input[name="habit"]').forEach(el => {
            el.checked = p.habits?.includes(el.value) ?? false;
        });
    } catch { /* corrupt data — silently ignore */ }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    ['step-1', 'step-2'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', saveProfile);
    });
});
