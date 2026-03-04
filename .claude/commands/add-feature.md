Analyze the existing architecture in js/app.js and implement the following feature: $ARGUMENTS

## Steps

1. **Read the relevant files first** — always read js/app.js, js/api.js, and index.html before touching anything. Understand the existing patterns (module globals, event flow, render functions) before writing a single line.

2. **Design before coding** — explain where the feature fits:
   - Does it need a new module global? (follow the `let _camelCase` convention)
   - Does it touch `startMatching()`, `startAnalysis()`, `renderResults()`, or `askYuelao()`?
   - Does it need a new Netlify function, or is it pure client-side?

3. **Implement minimally** — no over-engineering. If it takes 3 lines, don't make it 30. Fit the existing code style (vanilla JS, no frameworks, dry humor comments welcome).

4. **Wire up the UI** — add the trigger in index.html using the existing Tailwind + glass-morphism design language. Match the vibe: Traditional Chinese aesthetic, moon/fate motifs.

5. **Test the happy path** — describe how to manually verify the feature works via `netlify dev`.

6. **Flag any API cost implications** — if the feature adds OpenRouter calls, estimate the token cost and ask before shipping.
