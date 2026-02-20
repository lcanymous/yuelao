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

    // 純 CSS class 切換，不動任何 inline style
    document.getElementById(`step-${prev}`).classList.remove('active');
    document.getElementById(`step-${next}`).classList.add('active');

    currentStep = next;

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
