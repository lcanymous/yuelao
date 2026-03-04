Extract and organize all hardcoded Chinese UI text in the $ARGUMENTS section into maintainable constants.

## Steps

1. **Read the relevant files** — read index.html and js/app.js fully. Identify all hardcoded Traditional Chinese strings in the $ARGUMENTS area (button labels, placeholders, error messages, modal copy, etc.).

2. **Audit what exists** — check if there's already a i18n/constants pattern in the codebase. If yes, extend it. If no, create a minimal `UI_TEXT` object at the top of the relevant JS file — no external libraries, no over-engineering.

3. **Extract and replace** — move the strings into the constants object, replace inline occurrences with references. Keep keys descriptive in English (e.g. `UI_TEXT.chatPaywallTitle`).

4. **Don't break the vibe** — this app has a specific Traditional Chinese aesthetic. Don't accidentally anglicize the copy or change the meaning. The strings move, not the language.

5. **Summarize** — list all strings extracted and where they now live.
