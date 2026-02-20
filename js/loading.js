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

function spawnParticles() {
    const bg = document.getElementById('particle-bg');
    if (!bg) return;
    for (let i = 0; i < 18; i++) {
        setTimeout(() => {
            const d    = document.createElement('div');
            const sz   = Math.random() * 5 + 2;
            const dur  = Math.random() * 6 + 5;
            const del  = Math.random() * 4;
            const gold = Math.random() > 0.45;
            d.className = 'particle-dot';
            d.style.cssText = `
                width: ${sz}px; height: ${sz}px;
                left: ${Math.random() * 100}%;
                bottom: ${Math.random() * 20}%;
                background: ${gold ? 'rgba(234,179,8,.7)' : 'rgba(239,68,68,.7)'};
                animation-duration: ${dur}s;
                animation-delay: ${del}s;
                box-shadow: 0 0 ${sz * 2}px ${gold ? 'rgba(234,179,8,.5)' : 'rgba(239,68,68,.5)'};
            `;
            bg.appendChild(d);
        }, i * 180);
    }
}

function startLoading() {
    const el = document.getElementById('yuelao-speech');
    _speechIdx = 0;
    typewrite(el, SPEECHES[0]);
    _speechTimer = setInterval(() => {
        _speechIdx = (_speechIdx + 1) % SPEECHES.length;
        typewrite(el, SPEECHES[_speechIdx]);
    }, 3200);
    spawnParticles();
    document.getElementById('loading-view').classList.remove('hidden');
}

function stopLoading() {
    clearInterval(_speechTimer);
    const bg = document.getElementById('particle-bg');
    if (bg) bg.innerHTML = '';
    document.getElementById('loading-view').classList.add('hidden');
}
