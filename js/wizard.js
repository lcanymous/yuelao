/* ── 三步驟精靈 ── */
let currentStep = 1;

const STEP_META = {
    1: { label: '靈魂檔案', progress: '33%'  },
    2: { label: '你的背景', progress: '66%'  },
    3: { label: '命定條件', progress: '100%' },
};

function goStep(next) {
    const prev = currentStep;
    if (next === prev) return;

    const prevEl = document.getElementById(`step-${prev}`);
    const nextEl = document.getElementById(`step-${next}`);
    const dir    = next > prev ? -1 : 1; // -1 = slide left out, 1 = slide right out

    // 1. 先把舊的滑出去（不改 display，保持空間）
    prevEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    prevEl.style.opacity    = '0';
    prevEl.style.transform  = `translateX(${dir * 40}px)`;

    // 2. 準備新的（先隱藏在反方向）
    nextEl.style.transition = 'none';
    nextEl.style.opacity    = '0';
    nextEl.style.transform  = `translateX(${dir * -40}px)`;
    nextEl.style.display    = 'block';

    // 3. 舊的動畫結束後，隱藏舊的，滑入新的
    setTimeout(() => {
        prevEl.style.display = 'none';
        prevEl.style.transition = '';
        prevEl.style.opacity    = '';
        prevEl.style.transform  = '';

        requestAnimationFrame(() => {
            nextEl.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
            nextEl.style.opacity    = '1';
            nextEl.style.transform  = 'translateX(0)';
        });

        setTimeout(() => {
            nextEl.style.transition = '';
            nextEl.style.opacity    = '';
            nextEl.style.transform  = '';
        }, 300);
    }, 260);

    currentStep = next;

    // 更新進度條 UI
    document.getElementById('step-label').textContent   = `步驟 ${next} / 3`;
    document.getElementById('step-title').textContent   = STEP_META[next].label;
    document.getElementById('progress-bar').style.width = STEP_META[next].progress;

    [1, 2, 3].forEach(n => {
        document.getElementById(`dot-${n}`).className =
            `w-2 h-2 rounded-full transition-all ${n <= next ? 'bg-yellow-500' : 'bg-white/20'}`;
    });

    lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
