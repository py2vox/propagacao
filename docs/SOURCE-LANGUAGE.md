# English source-documentation edition

Release: AGHIP-review-2026.09.09-r11-source-en.2

457 source-comment groups were reviewed and translated into technical English. The source header includes an English reader's map. Historical test claims were qualified as historical evidence, and model assumptions and limitations were documented without changing calculations.

## Compatibility boundary

Portuguese remains intentionally in pt-BR localization assets, original INMET bulletins, proper names, and legacy symbols/selectors/storage keys. Renaming these is an API refactor, not a comment translation. No UI text is changed in either mode. Bundled third-party code and license notices are unchanged. The numerical model, constants, coefficients, API calls and event handlers are unchanged; only the declared release identity and self-referential script digest change among executable literals.

## Reproduction

Run Node 24 with the development dependencies in package.json: node scripts/verify-repository.cjs, then node scripts/audit.cjs. The repository verifier invokes tests/verify-source-language.cjs. It compares complete JavaScript abstract syntax trees (including names and literal values) after normalizing exactly the release/digest fields, compares vendor scripts byte-for-byte, and compares HTML/CSS outside source comments and script bodies. Original sources and a before/after comment ledger are retained in reports/. This catches automatic-semicolon-insertion or accidentally translated template-string changes as well as numerical changes.

Tests are internal regressions and DOM-emulated checks, not independent scientific validation or a new live API/browser acceptance campaign. Source-code stringification, stack-trace line numbers, model-digest history grouping and displayed release identity necessarily differ when documentation and identity change.

## Publication

The DOI was supplied for the earlier draft. No archive or GitHub publication is performed here. If that deposit is still a draft, synchronize all files and its version before publication. If already published, do not present this changed file as the identical archived version: use the archive's new-version workflow and the DOI assigned to that version before release. Original editions remain untouched.

HTML SHA-256: 87e96d3cb4547d3f964768d98c3b9c947503c407cfd0236f18590ce7e0b6340f
Application-script SHA-256: 9085dc8aed2b94e7dbf87a4e102a0c8125d493ac1d1b25d6cc974f4c3509d556

## Verification results

All nine suites passed: 1,717 checks, zero failures. Full results: ../reports/source-language-edition/. The two initial Function.toString-based failures were corrected by comparing executable ASTs; see release notes and retained initial-run evidence. Additional AST negative controls reject changed operators, values, strings and identifiers.

## Author and publication links

Code and release: [https://github.com/py2vox/propagacao](https://github.com/py2vox/propagacao)  
Archived release: [https://doi.org/10.5281/zenodo.22682135](https://doi.org/10.5281/zenodo.22682135)

José Ricardo de Paula, PY2VOX  
Independent researcher — Campinas, SP, Brazil  
ORCID: [https://orcid.org/0009-0005-9657-7254](https://orcid.org/0009-0005-9657-7254)  
[py2vox@gmail.com](mailto:py2vox@gmail.com)

Current metadata supplied by the author on 2026-09-10. Earlier review statements describe historical artifacts, not the current author record. Archive registration and exact version correspondence were not independently confirmed in this update.

## Subsequent author-metadata update

The source-language comparison now reverses the exact author/publication HTML substitutions recorded in provenance.json before checking the source baseline. Both Science author cards intentionally changed; propagation controls and scientific calculations did not. The current report is in reports/author-metadata-edition/.
