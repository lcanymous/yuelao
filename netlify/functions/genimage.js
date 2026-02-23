exports.handler = async (event) => {
    const { prompt = 'portrait', seed = '42' } = event.queryStringParameters || {};

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
                `?model=turbo&width=400&height=400&seed=${seed}&nologo=true`;

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 18000); // 18s timeout

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) throw new Error(`upstream ${res.status}`);

        const buf         = await res.arrayBuffer();
        const base64      = Buffer.from(buf).toString('base64');
        const contentType = res.headers.get('content-type') || 'image/jpeg';

        return {
            statusCode: 200,
            headers: {
                'Content-Type':  contentType,
                'Cache-Control': 'public, max-age=86400',
            },
            body: base64,
            isBase64Encoded: true,
        };
    } catch (err) {
        return { statusCode: 502, body: JSON.stringify({ error: err.message }) };
    }
};
