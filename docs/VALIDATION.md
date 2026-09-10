# Validation and repository checks

## What was run locally

The repository was prepared and checked on Windows with Node.js 24.19.0, pnpm 11.19.0, linkedom 0.18.12 and yaml 2.9.0. Dependency installation with `--frozen-lockfile --ignore-scripts` succeeded. Repository identity checks, YAML parsing and basic CI/citation structure checks succeeded. YAML parsing is not formal validation of every remote platform setting.

The relocated nine-suite runner completed **1,717 passing internal checks, zero failed checks** against the unchanged r11 HTML. `reports/repository-setup/audit-summary.json` records the new run; the individual reports retain their tested HTML hash. The local release-staging command also completed successfully.

## What was not run

No GitHub-hosted Windows or Linux CI job was executed during local generation. The workflow is a prepared configuration, not proof of hosted-run success. No GitHub settings, branch protection, remote file conflicts, pull requests, releases, DOI deposits, AWS services or DNS records were changed or verified.

These checks do not add real-browser, screen-reader, nationwide alert coverage, GLM decoding or independent predictive validation. Historical public API samples in `reports/r11/evidence/` remain observations of their recorded instants only.

## Review discipline

- Keep a fixed circuit, UTC, input data and station configuration when comparing equations.
- Distinguish model/reference disagreements from malformed fixtures or incompatible conventions.
- Preserve reports even when an external comparison is unresolved; passing internal assertions does not close an external discrepancy.
- Reproduce results from the exact HTML digest. Never carry an old pass count forward after changing that artifact.
- Inspect GitHub CI logs after import and before merging. A green result covers only the checks actually run.

## Author and publication links

Code and release: [https://github.com/py2vox/propagacao](https://github.com/py2vox/propagacao)  
Archived release: [https://doi.org/10.5281/zenodo.22682135](https://doi.org/10.5281/zenodo.22682135)

José Ricardo de Paula, PY2VOX  
Independent researcher — Campinas, SP, Brazil  
ORCID: [https://orcid.org/0009-0005-9657-7254](https://orcid.org/0009-0005-9657-7254)  
[py2vox@gmail.com](mailto:py2vox@gmail.com)

Current metadata supplied by the author on 2026-09-10. Earlier review statements describe historical artifacts, not the current author record. Archive registration and exact version correspondence were not independently confirmed in this update.
