/* ── 主應用邏輯 ── */

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

    startLoading();

    try {
        const system = `你是一位精通現代心理學與東方命理的 AI 月老。根據使用者資料生成 3 位符合性別要求（${d.targetGender}）的虛擬理想對象。
所有回應必須使用繁體中文。
回應必須是 JSON，包含陣列 "matches"，每筆包含：name, age, gender, mbti, zodiac, job, location, income, education, height, match_score, reason, vibe, key_trait。`;

        const user = `使用者資料：
性別：${d.myGender}，生日：${d.dob}，星座：${d.zodiac}，MBTI：${d.mbti}
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
            resultText = await callProxyAPI(user, system);
        } else if (engine === 'gemini') {
            if (!geminiKey) throw new Error('請先在設定中輸入 Gemini API Key');
            resultText = await callGeminiAPI(user, system, geminiKey);
        } else {
            if (!openRouterKey) throw new Error('請先在設定中輸入 OpenRouter API Key');
            resultText = await callOpenRouterAPI(openRouterKey, modelId, user, system);
        }

        if (!resultText) throw new Error('AI 回傳內容為空');
        const clean   = resultText.replace(/```json|```/gi, '').trim();
        const content = JSON.parse(clean);
        renderResults(content.matches);

    } catch (err) {
        console.error(err);
        alert(`月老連線中斷：${err.message}`);
    } finally {
        stopLoading();
    }
}

function infoPill(label, value) {
    if (!value) return '';
    return `<span class="inline-flex flex-col bg-white/5 rounded-xl px-3 py-1.5 text-center">
        <span class="text-[9px] text-slate-500 leading-tight">${label}</span>
        <span class="text-xs text-white font-medium leading-tight mt-0.5">${value}</span>
    </span>`;
}

function renderResults(matches) {
    const list = document.getElementById('match-list');
    list.innerHTML = '';

    if (!matches?.length) {
        alert('AI 月老未能生成對象，請重試或調整條件。');
        resetApp();
        return;
    }

    matches.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = `match-card glass-card p-6 rounded-3xl space-y-4 relative ${
            i === 0 ? 'border border-yellow-500/40 shadow-lg shadow-yellow-500/10' : 'border border-white/5'
        }`;

        // 只取中文名字（第一個中文詞，去掉括號內的英文）
        const chName = (m.name || '').replace(/\(.*?\)/g, '').trim();
        const initial = chName ? chName.charAt(0) : '？';

        const pills = [
            infoPill('職業',  m.job),
            infoPill('所在地', m.location),
            infoPill('月收入', m.income),
            infoPill('學歷',  m.education),
            infoPill('身高',  m.height),
        ].filter(Boolean).join('');

        div.innerHTML = `
            ${i === 0 ? `<div class="absolute -top-3 left-5 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full tracking-widest">命定首選 ✦</div>` : ''}

            <!-- 頭像 + 名字 + 契合度 -->
            <div class="flex items-center gap-4 pt-1">
                <div class="w-14 h-14 rounded-full yuelao-gradient flex items-center justify-center font-black text-yellow-500 border-2 border-yellow-500/40 text-xl flex-shrink-0">
                    ${initial}
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-xl font-bold truncate">${chName}
                        <span class="text-xs text-slate-500 font-normal ml-1">${m.gender || ''}</span>
                    </h4>
                    <p class="text-xs text-slate-400 mt-0.5">${m.age} 歲 &nbsp;·&nbsp; ${m.mbti || ''} &nbsp;·&nbsp; ${m.zodiac || ''}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <div class="text-2xl font-black text-yellow-400">${m.match_score || 0}%</div>
                    <div class="text-[9px] text-slate-500 uppercase tracking-wide">契合度</div>
                </div>
            </div>

            <!-- 契合度條 -->
            <div class="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-red-500 to-yellow-500 h-full rounded-full" style="width:${m.match_score || 0}%"></div>
            </div>

            <!-- Info pills -->
            <div class="flex flex-wrap gap-2">${pills}</div>

            <!-- 氛圍 -->
            <div class="bg-white/5 rounded-2xl px-4 py-3">
                <p class="text-sm italic text-slate-300">"${m.vibe || '神秘氛圍'}"</p>
            </div>

            <!-- 命定理由 -->
            <p class="text-xs text-slate-400 leading-relaxed">${m.reason || ''}</p>

            <!-- 魅力點 -->
            <div class="text-[10px] text-yellow-500/60 bg-yellow-500/5 px-3 py-2 rounded-xl flex items-center gap-2">
                <i data-lucide="star" class="w-3 h-3 flex-shrink-0"></i>
                <span>魅力點：${m.key_trait || '魅力十足'}</span>
            </div>
        `;
        list.appendChild(div);
    });

    lucide.createIcons();
    document.getElementById('form-container').classList.add('hidden');
    document.getElementById('results-container').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetApp() {
    document.getElementById('form-container').classList.remove('hidden');
    document.getElementById('results-container').classList.add('hidden');
    goStep(1);
}
