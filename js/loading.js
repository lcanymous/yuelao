/* ── 月老動畫 ── */
const SPEECHES = [
    '老夫正在翻閱三生石⋯⋯',
    '細觀你的命盤，緣分已見端倪⋯⋯',
    '紅線千里牽，老夫為你尋覓⋯⋯',
    '此緣非同小可，需謹慎推算⋯⋯',
    '老夫不敢輕率，你的姻緣值得用心⋯⋯',
    '天象已現，命定之人呼之欲出⋯⋯',
    '老夫觀你氣場，紅線已動⋯⋯',
    '三生有幸，緣分即將揭曉⋯⋯',
];

const SPEECHES_SAVAGE = [
    '老夫看過你的條件⋯⋯ 嘆了口氣。',
    '等老夫先平復一下情緒⋯⋯',
    '你的要求，老夫活了三千年第一次見。',
    '正在查你前世作了什麼業⋯⋯',
    '紅線還在，但老夫需要時間接受現實。',
    '老夫不是在評判你，老夫是在幫你照鏡子。',
    '算了，老夫心腸軟，還是幫你找吧⋯⋯',
    '戀愛腦的命盤⋯⋯老夫見怪不怪了。',
];

let _speechTimer = null;
let _speechIdx   = 0;

function typewrite(el, text, speed = 75) {
    el.textContent = '';
    let i = 0;
    const t = setInterval(() => {
        if (i < text.length) { el.textContent += text[i++]; }
        else clearInterval(t);
    }, speed);
}

function spawnParticles(savage = false) {
    const bg = document.getElementById('particle-bg');
    if (!bg) return;
    for (let i = 0; i < 18; i++) {
        setTimeout(() => {
            const d    = document.createElement('div');
            const sz   = Math.random() * 5 + 2;
            const dur  = Math.random() * 6 + 5;
            const del  = Math.random() * 4;
            // 毒舌模式：橘火色粒子；普通模式：金紅粒子
            const warm = Math.random() > 0.45;
            const col  = savage
                ? (warm ? 'rgba(251,146,60,.8)' : 'rgba(239,68,68,.7)')
                : (warm ? 'rgba(234,179,8,.7)'  : 'rgba(239,68,68,.7)');
            const glow = savage
                ? (warm ? 'rgba(251,146,60,.5)' : 'rgba(239,68,68,.5)')
                : (warm ? 'rgba(234,179,8,.5)'  : 'rgba(239,68,68,.5)');
            d.className = 'particle-dot';
            d.style.cssText = `
                width: ${sz}px; height: ${sz}px;
                left: ${Math.random() * 100}%;
                bottom: ${Math.random() * 20}%;
                background: ${col};
                animation-duration: ${dur}s;
                animation-delay: ${del}s;
                box-shadow: 0 0 ${sz * 2}px ${glow};
            `;
            bg.appendChild(d);
        }, i * 180);
    }
}

function startLoading(savage = false) {
    const el      = document.getElementById('yuelao-speech');
    const pool    = savage ? SPEECHES_SAVAGE : SPEECHES;
    const loading = document.getElementById('loading-view');
    _speechIdx = 0;
    typewrite(el, pool[0]);
    _speechTimer = setInterval(() => {
        _speechIdx = (_speechIdx + 1) % pool.length;
        typewrite(el, pool[_speechIdx]);
    }, 3200);
    // 毒舌模式：光暈換橘紅色調
    loading.style.setProperty('--loading-tint', savage ? 'rgba(194,65,12,.97)' : 'rgba(2,6,23,.97)');
    spawnParticles(savage);
    loading.classList.remove('hidden');
}

function stopLoading() {
    clearInterval(_speechTimer);
    const bg = document.getElementById('particle-bg');
    if (bg) bg.innerHTML = '';
    document.getElementById('loading-view').classList.add('hidden');
}
