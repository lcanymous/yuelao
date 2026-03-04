Run a full npm security audit and verify nothing broke afterward.

## Steps

1. **Find package.json** — locate all `package.json` files in the repo (root and any subdirectories like `netlify/functions/`).

2. **Run `npm audit`** in each directory that has a `package.json`. Report any vulnerabilities found (severity, package name, fix availability).

3. **Run `npm audit fix`** in each of those directories to apply safe, non-breaking updates. If any require `--force` (semver-major bumps), flag them and ask before proceeding.

4. **Run tests** — if a test script exists in `package.json`, run `npm test`. If no test script exists, report that clearly rather than erroring.

5. **Summarize** what was fixed, what remains unfixed (and why), and whether tests passed.
