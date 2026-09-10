# Changelog

## Scientific correction r12 — 2026-09-10

- Replaced fixed polar latitude/month gating with geometric no-sunrise detection for foE.
- Matched nighttime elapsed hours to geometric sunset without the inherited extra hour.
- Preserved historical comparison branches and clarified the bilingual Science panel.
- Added geometric/formula tests and explicit AST change boundaries; retained initial failed regression evidence.
- Kept P.533 screening at 4,000 km and did not extrapolate P.1147 to 160 m.
- This revision changes calculations and has no DOI assigned. The entries below describe earlier editions only.

See [r12 review](docs/R12-REVIEW.md) for evidence, test interpretation and open external-validation gates.

## Repository preparation — 2026-09-09

- Added an English project README, contribution/security guidance and review templates.
- Organized deterministic suites and reference fixtures under `tests/`.
- Added a pinned development environment and Windows/Linux CI configuration.
- Preserved historical r11 evidence under `reports/r11/` and documented provenance.
- Added local audit, integrity verification and single-file release-staging commands.
- Added GitHub/DOI and AWS deployment checklists; no remote settings or deployments changed.

**The runtime HTML is byte-for-byte identical to AGHIP-review-2026.09.09-r11.** This is repository packaging, not a new scientific model release.

## AGHIP-review-2026.09.09-r11

See `docs/SUBMISSION-REVIEW.md` for corrections, the 1,717-check internal regression snapshot and unresolved independent-validation gates. That snapshot is not a certification or a claim of zero possible failures.

## AGHIP-review-2026.09.09-r11-doi.1

Reserved DOI 10.5281/zenodo.22682135 integrated into publication metadata and Science text. Numerical implementation preserved. Added DOI consistency and metadata-only comparison checks; retained historical r11 evidence.

## AGHIP-review-2026.09.10-r12

English technical source comments and developer map; no numerical, API or bilingual UI changes. Release and script identity updated. Added executable-AST, vendor-byte and non-comment markup/style regression verification. See docs/SOURCE-LANGUAGE.md.

## Author and publication links

Code and release: [https://github.com/py2vox/propagacao](https://github.com/py2vox/propagacao)  
Previous archive (not the r12 artifact): [https://doi.org/10.5281/zenodo.22682135](https://doi.org/10.5281/zenodo.22682135)

José Ricardo de Paula, PY2VOX  
Independent researcher — Campinas, SP, Brazil  
ORCID: [https://orcid.org/0009-0005-9657-7254](https://orcid.org/0009-0005-9657-7254)  
[py2vox@gmail.com](mailto:py2vox@gmail.com)

Current metadata supplied by the author on 2026-09-10. Earlier review statements describe historical artifacts, not the current author record. Archive registration and exact version correspondence were not independently confirmed in this update.

## AGHIP-review-2026.09.10-r12

Integrated author-supplied ORCID, independent-researcher affiliation and code/archive links throughout the current delivery. Updated bilingual Science attribution and structured citation metadata. Added author consistency/checksum checks; retained historical artifacts and calculation behavior.
