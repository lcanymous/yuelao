/* ── API 呼叫模組 ── */

async function callProxyAPI(prompt, system) {
    const res = await fetch('/.netlify/functions/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'qwen/qwen3.5-plus-02-15',
            messages: [
                { role: 'system', content: system },
                { role: 'user',   content: prompt  },
            ],
        }),
    });
    if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error?.message || '月老雲端暫時不在，請稍後再試');
    }
    const r = await res.json();
    return r.choices?.[0]?.message?.content;
}

async function callGeminiAPI(prompt, systemInstruction, apiKey) {
    let retries = 0;
    while (retries < 3) {
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                        generationConfig: { responseMimeType: 'application/json' },
                    }),
                }
            );
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.error?.message || 'Gemini API 錯誤');
            }
            const r = await res.json();
            return r.candidates[0].content.parts[0].text;
        } catch (e) {
            retries++;
            if (retries === 3) throw e;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
        }
    }
}

async function callOpenRouterAPI(key, model, prompt, system) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type':  'application/json',
            'HTTP-Referer':  window.location.origin,
            'X-Title':       'Yuelao AI App',
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: system },
                { role: 'user',   content: prompt  },
            ],
            response_format: { type: 'json_object' },
        }),
    });
    if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error?.message || 'OpenRouter 連線失敗');
    }
    const r = await res.json();
    return r.choices?.[0]?.message?.content;
}
