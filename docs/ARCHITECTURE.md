# Architecture

## Runtime boundary

`index.html` is both the canonical application source and the executable artifact. The scientific functions, UI, principal libraries and embedded coefficients are retained in that file. There is no JavaScript build step and no application server required for the embedded numerical core.

Overview, Weather, HF, VHF, EME and Science share station coordinates and application state. A language/operational-mode selection affects presentation and regional service applicability, not the underlying physical identity of global solar and geomagnetic measurements. Modeled, observed, climatological and experimental values must retain their distinct labels.

Public feeds and optional deployment endpoints are separate from the scientific core. Their requests may fail, become stale, or return data for a no-longer-selected grid. The reviewed code applies identity, time, schema and numeric guards in the documented paths. These guards are not a guarantee that all external edge cases have been covered.

## Development boundary

`scripts/audit.cjs` invokes `tests/run-audit.cjs` against the root HTML. It does not build or rewrite the application. The latter runner's HTML location is the only relocation change to that runner; the inherited test suites and fixtures are copied with recorded hashes in `provenance.json`.

Node.js, pnpm, linkedom and the YAML parser are development tools only. CI installs their pinned versions and executes local checks. Live probes remain explicit manual commands and are not part of pull-request CI.

Reference HTML under `tests/fixtures/` is a historical oracle for preservation tests, not another application entry point. Historical reports under `reports/r11/` retain their original artifact hashes and package-path conventions. Newly generated results are isolated under `.audit-runs/`.

## Packaging boundary

`scripts/package.cjs` requires successful current-HTML test evidence and stages a minimal local release directory. It does not change Git history, reserve a DOI, configure DNS, create cloud resources or publish a release. Future intentional runtime modifications require a new scientific artifact identity and fresh evidence.

## Author and publication links

Code and release: [https://github.com/py2vox/propagacao](https://github.com/py2vox/propagacao)  
Archived release: [https://doi.org/10.5281/zenodo.22682135](https://doi.org/10.5281/zenodo.22682135)

José Ricardo de Paula, PY2VOX  
Independent researcher — Campinas, SP, Brazil  
ORCID: [https://orcid.org/0009-0005-9657-7254](https://orcid.org/0009-0005-9657-7254)  
[py2vox@gmail.com](mailto:py2vox@gmail.com)

Current metadata supplied by the author on 2026-09-10. Earlier review statements describe historical artifacts, not the current author record. Archive registration and exact version correspondence were not independently confirmed in this update.
