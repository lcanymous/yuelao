Deep-dive analysis of netlify/functions/$ARGUMENTS — find bugs, risks, and fix them.

## Steps

1. **Read the function** — read `netlify/functions/$ARGUMENTS` in full before saying anything.

2. **Check these failure modes** (go through each one):
   - **CORS** — are all necessary headers present for both success and error responses? Error paths often miss CORS headers and cause silent failures on the client.
   - **Timeout** — Netlify Functions hard-limit is 10s (26s on paid plans). Does the function have a timeout guard? What happens if the upstream API (OpenRouter / Pollinations) hangs?
   - **Error handling** — are upstream API errors caught and returned as meaningful messages, or do they bubble up as 500s?
   - **Input validation** — is the request body/query validated before use? Could a malformed request crash the function?
   - **API key exposure** — confirm `OPENROUTER_API_KEY` is read from `process.env` and never logged or returned to the client.
   - **Cost runaway** — is there any rate limiting or request size cap to prevent abuse?

3. **Fix what you find** — apply fixes directly. Don't just report issues, resolve them.

4. **Summarize** — list what was found, what was fixed, and what (if anything) requires external action (e.g. Netlify env var changes, dashboard config).
