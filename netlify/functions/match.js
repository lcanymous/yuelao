exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
        return { statusCode: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'API key not configured' }) };
    }

    const { messages, model, json = true } = JSON.parse(event.body);

    const body = {
        model: model || 'qwen/qwen-2.5-72b-instruct',
        messages,
    };
    if (json) body.response_format = { type: 'json_object' };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 24000); // bail before Netlify's 26s hard limit

    let res;
    try {
        res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://yuelao69.netlify.app',
                'X-Title': 'Yuelao AI App',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
    } catch (err) {
        clearTimeout(timer);
        const msg = err.name === 'AbortError' ? '月老掐算太久，請再試一次' : err.message;
        return {
            statusCode: 504,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: { message: msg } }),
        };
    }
    clearTimeout(timer);

    const data = await res.json();

    return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(data),
    };
};
