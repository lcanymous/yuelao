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

    // 只用 opacity 過場，不碰 transform（iOS overflow 陷阱）
    prevEl.style.transition = 'opacity 0.22s ease';
    prevEl.style.opacity    = '0';
    prevEl.style.pointerEvents = 'none';

    setTimeout(() => {
        // 隱藏舊的
        prevEl.style.display       = 'none';
        prevEl.style.transition    = '';
        prevEl.style.opacity       = '';
        prevEl.style.pointerEvents = '';

        // 顯示新的（先透明，再淡入）
        nextEl.style.display    = 'block';
        nextEl.style.opacity    = '0';
        nextEl.style.transition = 'none';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                nextEl.style.transition = 'opacity 0.25s ease';
                nextEl.style.opacity    = '1';

                setTimeout(() => {
                    nextEl.style.transition = '';
                    nextEl.style.opacity    = '';
                }, 280);
            });
        });
    }, 230);

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
