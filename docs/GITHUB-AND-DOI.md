# Repository import and publication checklist

## Import without overwriting existing work

The remote repository contents could not be inspected during preparation. Treat this folder as a proposed structure, not an authoritative replacement for everything already on GitHub.

1. Clone or download your current `py2vox/propagacao` repository and preserve a backup.
2. Create a working branch, such as `prepare-scientific-review`.
3. Compare this package with existing files. Copy the intended additions, including `.github/` and other dotfiles. Review conflicts rather than deleting unrelated content.
4. Run the local checks. Inspect `git diff`, especially `index.html`, metadata and workflows.
5. Commit the reviewed changes and open a pull request. Wait for CI results and inspect the artifacts before merging.

The prepared CI file cannot enable repository settings. The owner must review Actions permissions, available runner settings, branch protection/rulesets, required checks, and secret scanning. CI checks both Windows and Linux when run on GitHub; local preparation does not claim those hosted runs already passed.

## DOI and release identity

1. Confirm the version, public repository URL, authorship, license, references and any actual ORCID.
2. Choose a deposit workflow. Zenodo permits reserving a DOI in a draft before uploading final files. Include that reserved DOI in the intended artifact, citation and metadata before freezing it.
3. Do not create a second automatic deposit for the same content unintentionally. Review how any enabled GitHub–Zenodo integration will act before publishing a GitHub release.
4. If `index.html` changes, create an intentional new candidate, recompute its embedded script digest under the documented convention, run tests, then compute the whole-file digest. Do not relabel r11 reports.
5. Prepare the final commit/tag, review manifests and archive the exact intended files. Verify the archive contents against hashes before publishing.
6. Publish only after approval. Confirm the DOI resolves to the intended version and update documentation without silently replacing the cited artifact.

`CITATION.cff` and `.zenodo.json` now contain the reserved DOI 10.5281/zenodo.22682135 supplied by the maintainer. No ORCID was supplied. Use the existing draft; see DOI-PREPARATION.md. A commit cannot conveniently contain its own final commit hash; record that hash in an external release manifest or deposit metadata after the commit exists.

Official guidance: [Zenodo DOI reservation](https://help.zenodo.org/docs/deposit/describe-records/reserve-doi/) and [GitHub integration](https://help.zenodo.org/docs/github/).

No branch, pull request, GitHub setting, release, DOI reservation or deposit was created by generating this structure.
