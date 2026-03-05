# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**月老 AI** — a Traditional Chinese AI matchmaking web app. Users describe themselves and their ideal partner; three AI-generated virtual matches appear with compatibility scores, roasts (optional), and AI-generated portrait photos. There's also a "real person analysis" mode for compatibility with someone the user already knows.

Live: https://yuelao69.netlify.app

## Dev Commands

No build step. It's pure static HTML/JS/CSS.

```bash
netlify dev          # local dev with serverless functions (recommended)
npx serve .          # static-only (no serverless functions)
```

Netlify CLI is required for any feature that hits the serverless functions (AI matching, image generation).

**Required env var for serverless functions:**
- `OPENROUTER_API_KEY` — set in Netlify Dashboard for prod, or locally via `.env` / shell export

**CLI version (terminal only):**
```bash
export OPENROUTER_API_KEY=sk-or-xxxx
node cli/yuelao.mjs
```

## Architecture

**No framework.** Vanilla JS + Tailwind CSS (CDN) + Netlify Functions.

```
index.html                    # Single-page app shell
css/style.css                 # Glass-morphism design, animations
js/
  app.js                      # Main logic (~900 lines): form handling, AI calls, result rendering
  api.js                      # Abstraction over 3 AI engines (proxy / Gemini / OpenRouter direct)
  wizard.js                   # 3-step form navigation (currentStep, goStep())
  loading.js                  # "月老 casting spells" animation
netlify/functions/
  match.js                    # Reverse proxy → OpenRouter (hides API key)
  genimage.js                 # Reverse proxy → Pollinations.ai with DiceBear fallback
cli/yuelao.mjs                # Standalone terminal version
```

### AI Engine Architecture

Three pluggable engines, selected via a settings UI dropdown:

| Engine | Routing | Auth |
|--------|---------|------|
| `proxy` (default) | Client → Netlify Function → OpenRouter | Server-side env var |
| `gemini` | Client → Google Gemini 2.5 Flash directly | User-supplied key in UI |
| `openrouter` | Client → OpenRouter directly | User-supplied key in UI |

Switching logic lives in `js/api.js`. The proxy engine is the zero-config path for end users.

### Modes & State

`js/app.js` manages all app state via module-level globals:

```javascript
let _appMode        // 'match' | 'analysis'
let _savageMode     // boolean — enables brutal AI roast tone
let _chatMessages   // conversation history for follow-up chat
let _chatCount      // free question counter (paywall at 3)
let _lastFormData   // cached for reality check
```

**Profile persistence (靈魂記憶):** User's own profile fields auto-save to `localStorage` under key `yuelao_profile` via `saveProfile()` / `loadProfile()`. Loaded on page init so the wizard is pre-filled on return visits.

**Match mode:** generates 3 virtual ideal partners with photos, scores, and optional roasts.
**Analysis mode:** analyzes compatibility with a real described person — returns score, strengths, risks, advice.
**Reality Check:** pure client-side, zero API — `calcRealityCheck()` flags contradictions (income gap, education gap, etc.) and gives a "戀愛腦 severity" score 0–100.

### Serverless Functions

- `match.js` — takes `{ messages, model, json }` POST, proxies to OpenRouter, returns response. CORS headers included.
- `genimage.js` — takes `?prompt=...&seed=...`, proxies to Pollinations.ai with 18s timeout, falls back to DiceBear SVG on timeout. Returns base64 with 24hr cache headers.

### Image Generation Flow

1. Build an English prompt from Chinese vibe descriptors via `VIBE_MAP` in `app.js`
2. Call `/.netlify/functions/genimage?prompt=...`
3. 20s client-side timeout → if hit, render DiceBear SVG fallback (deterministic by name seed)
4. Images lazy-load in staggered 300ms intervals across match cards

### Chat Follow-ups

- 3 free follow-up questions per session (enforced client-side via `_chatCount`)
- Conversation history maintained in `_chatMessages` array
- After 3 questions, paywall modal appears with Buy Me a Coffee link

## Key Files to Know

- [js/app.js](js/app.js) — start here for any feature work; contains `startMatching()`, `startAnalysis()`, `renderResults()`, `askYuelao()`, `calcRealityCheck()`
- [js/api.js](js/api.js) — add/modify AI engine integrations here
- [netlify/functions/match.js](netlify/functions/match.js) — API key lives server-side here
- [netlify.toml](netlify.toml) — Netlify build/function config and security headers
