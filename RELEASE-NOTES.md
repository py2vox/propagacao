# AGHIP-review-2026.09.10-r12

Scientific correction, prepared 2026-09-10. Local review candidate; no DOI has been assigned to these new bytes.

## Corrected behavior

- foE polar winter uses geometric absence of sunrise rather than a fixed civil-twilight latitude/month shortcut.
- Nighttime decay uses hours since geometric sunset (solar zenith 90 degrees), with no inherited extra hour.
- Legacy reference and sign-corrected profiles remain available only for historical comparison.
- Both language versions of Science distinguish current corrections, historical comparisons and observational validation.
- Equation references use P.1239-4 numbering: 17d/17e and minimum floor 18.
- P.533 screening remains at 4,000 km. P.1147 is not extrapolated to 160 m.

## Audit and reproducibility

Run `pnpm check` and `pnpm test` with the pinned development dependencies. The ten-suite runner includes the new polar-night/formula tests and the existing core, P.1147, screening, HF presentation, Overview, accessibility, listening-domain, submission/state and Topband tests. The metadata and AST-scope checks are separate. Reports bind outcomes to the current HTML SHA-256.

Initial r12 evidence in `.audit-runs/r12-final/` records six failed checks: five expected numerical differences against old Japan-circuit results and one stale no-code-change scope check. No old fixture was overwritten. The screening regression now proves exact restoration of old outputs when only foE is reverted; current default values and differences are recorded. Topband's explicit scope now includes the three modified foE/audit functions. See `docs/R12-REVIEW.md`.

The final rerun passed all 10 suites: 19,028 checks, zero failures. Evidence is preserved in `reports/r12/final/`; the initial failed run is in `reports/r12/initial/`. An additional 84 author-metadata checks and AST/identity checks passed. The full 373,248-point Science comparison is recorded in `reports/r12-science-grid.json`. Test agreement is not independent ionosonde, ITURHFProp, NEC, browser or live-provider validation.

## Identity and publication

HTML SHA-256: 5271a14989c2ea174451089b7d03a351e920d7a4c69bed52c4c13ab9f02a76f7
Application-script SHA-256: b2ea371e68b6f42bed34357b3e12c6c0711bf9703634800d961090a8afedb896

No GitHub push, Zenodo publication or email was performed. Previous edition metadata and source are preserved in `reports/pre-r12/`. The previous DOI must not be represented as an archive of r12. Obtain an appropriate new-version record before attaching its DOI to this revision.

José Ricardo de Paula, PY2VOX
Independent researcher — Campinas, SP, Brazil
ORCID: https://orcid.org/0009-0005-9657-7254
Contact: py2vox@gmail.com
Code: https://github.com/py2vox/propagacao
Previous author-supplied archive: https://doi.org/10.5281/zenodo.22682135
