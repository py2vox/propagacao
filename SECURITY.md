# Security and data safety

Report suspected vulnerabilities privately to **py2vox@gmail.com**, including the affected release, impact and a minimal sanitized reproduction. Do not post working secrets, sensitive coordinates or exploit details in a public issue before coordination. No response-time or supported-version guarantee is currently established.

Never commit NASA keys, GitHub tokens, AWS credentials, private certificates or `.env` files. A key previously shared publicly should be revoked and replaced; removing it from a new commit does not remove it from history.

The single-file application still accesses external services. Their data may be unavailable or malformed. Offline operation cannot provide current official warnings. Report display or filtering errors affecting safety-related information promptly and use the relevant official authority directly.

CI uses pinned action revisions, read-only repository permissions and unprivileged pull-request events. It does not deploy, publish releases, access AWS, or require service credentials. Repository protections and secret scanning must be enabled by the repository owner in GitHub settings.

## Author and publication links

Code and release: [https://github.com/py2vox/propagacao](https://github.com/py2vox/propagacao)  
Previous archive (not the r12 artifact): [https://doi.org/10.5281/zenodo.22682135](https://doi.org/10.5281/zenodo.22682135)

José Ricardo de Paula, PY2VOX  
Independent researcher — Campinas, SP, Brazil  
ORCID: [https://orcid.org/0009-0005-9657-7254](https://orcid.org/0009-0005-9657-7254)  
[py2vox@gmail.com](mailto:py2vox@gmail.com)

Current metadata supplied by the author on 2026-09-10. Earlier review statements describe historical artifacts, not the current author record. Archive registration and exact version correspondence were not independently confirmed in this update.
