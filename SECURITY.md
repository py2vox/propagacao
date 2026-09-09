# Security and data safety

Report suspected vulnerabilities privately to **py2vox@gmail.com**, including the affected release, impact and a minimal sanitized reproduction. Do not post working secrets, sensitive coordinates or exploit details in a public issue before coordination. No response-time or supported-version guarantee is currently established.

Never commit NASA keys, GitHub tokens, AWS credentials, private certificates or `.env` files. A key previously shared publicly should be revoked and replaced; removing it from a new commit does not remove it from history.

The single-file application still accesses external services. Their data may be unavailable or malformed. Offline operation cannot provide current official warnings. Report display or filtering errors affecting safety-related information promptly and use the relevant official authority directly.

CI uses pinned action revisions, read-only repository permissions and unprivileged pull-request events. It does not deploy, publish releases, access AWS, or require service credentials. Repository protections and secret scanning must be enabled by the repository owner in GitHub settings.
