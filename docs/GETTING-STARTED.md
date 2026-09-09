# Getting started

## Use the application

Open the root `index.html` in a modern browser. It is the only application runtime file. Select a language, enter a Maidenhead grid locator and review the source status before interpreting a panel. The embedded numerical core works offline; current observations, warnings, street tiles, radar and the external GLM decoder require Internet.

## Run development checks

Install Node.js 24 and the pinned package manager:

```sh
npm install --global pnpm@11.19.0 --ignore-scripts
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
pnpm test
```

Run these commands from the repository root. On Windows, use `Set-Location 'C:\path\to\propagacao'` first. Do not copy the shell prompt or add Markdown escape characters to commands.

`pnpm test` creates a new `.audit-runs/<timestamp>-<process>/` directory. The nine suites use the actual root HTML and recorded fixtures, without live service calls. The output is DOM emulation and deterministic regression, not browser or predictive certification.

`pnpm package` requires a successful audit of the current HTML. It creates a new `dist/<timestamp>/` directory containing the single runtime file, license, citation, scientific-status documentation, current test summary and checksums. It does not upload or deploy anything.

## Directory guide

- `index.html`: canonical application source and runtime; no build required.
- `scripts/`: portable repository checks, audit entry point and release staging.
- `tests/`: numerical, presentation and state-integration suites; fixtures are not runtime assets.
- `reports/r11/`: preserved evidence from the reviewed r11 package. Paths inside these historical reports describe that original package, not necessarily this checkout.
- `docs/`: scientific scope, reproducibility and owner-operated publication/deployment instructions.
- `.github/`: CI configuration and review templates; these have no effect until committed to GitHub.

No local machine paths, installed `node_modules`, `.git` history, credentials or deployment secrets are required in a release upload.
