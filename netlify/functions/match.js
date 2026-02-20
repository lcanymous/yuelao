exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
    }

    const { messages, model } = JSON.parse(event.body);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://yuelao69.netlify.app',
            'X-Title': 'Yuelao AI App'
        },
        body: JSON.stringify({
            model: model || 'qwen/qwen3.5-plus-02-15',
            messages,
            response_format: { type: 'json_object' }
        })
    });

    const data = await res.json();

    return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(data)
    };
};
