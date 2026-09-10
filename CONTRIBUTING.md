# Contributing

AGHIP welcomes reproducible scientific findings, software repairs, accessibility improvements and bilingual technical review.

1. Work in a branch; do not overwrite the reviewed baseline or rewrite shared history.
2. Read `docs/SCIENTIFIC-STATUS.md` and `docs/SUBMISSION-REVIEW.md`.
3. Preserve single-HTML runtime behavior. Development tools must not become runtime dependencies.
4. Install the pinned dependencies and run `pnpm check` and `pnpm test`.
5. For numerical changes, provide independent reference cases, dimensions, boundary cases and primary citations. Do not tune away discrepancies without an explanation.
6. Exercise pt-BR/en-US, unavailable data and delayed responses after grid changes.
7. Submit a pull request with results and remaining limitations.

An intentional HTML change requires a new release identity and freshly computed script/file hashes. Historical reports remain immutable. `provenance.json` deliberately prevents a modified HTML from silently inheriting r11's validation claims; do not change its baseline hash merely to make a test pass. See the release checklist.

Respectful, evidence-based discussion is expected. Corrections to a scientific claim are not personal criticism. Disclose conflicts of interest and avoid publishing credentials or private station details.

## Author and publication links

Code and release: [https://github.com/py2vox/propagacao](https://github.com/py2vox/propagacao)  
Archived release: [https://doi.org/10.5281/zenodo.22682135](https://doi.org/10.5281/zenodo.22682135)

José Ricardo de Paula, PY2VOX  
Independent researcher — Campinas, SP, Brazil  
ORCID: [https://orcid.org/0009-0005-9657-7254](https://orcid.org/0009-0005-9657-7254)  
[py2vox@gmail.com](mailto:py2vox@gmail.com)

Current metadata supplied by the author on 2026-09-10. Earlier review statements describe historical artifacts, not the current author record. Archive registration and exact version correspondence were not independently confirmed in this update.
