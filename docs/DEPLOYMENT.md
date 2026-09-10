# Deployment boundaries and AWS preparation

The root HTML is the application artifact. This repository does not contain an automatic production deployment workflow or embedded AWS credentials.

For a future `www.py2vox.com` deployment, the owner should verify domain control, TLS, DNS and an appropriate AWS hosting design. An S3/CloudFront deployment can serve static assets, but any configured API relay is a separate server-side component requiring its own security, rate-limit, logging and operational review. Domain ownership and DNS configuration were not verified during packaging.

Before deployment:

- Run tests and record the exact application hash.
- Deploy from the explicitly approved artifact, not an unrelated older index file.
- Keep private NASA credentials server-side, or use the application's operator-session configuration. Do not insert a key into public HTML.
- Confirm each provider's access and data-use terms; do not assume the application's MIT license licenses external data.
- Test INMET browser access from the real origin. Configure the supported same-origin endpoint only after implementing and reviewing that endpoint; naming it does not create a working proxy.
- Verify BR/US/CA regional isolation, unavailable/empty/incomplete results, stale data, radar timestamps, GLM decoding, grid changes and both languages.
- Review HTTP headers and Content Security Policy against the actual inline-script/CDN requirements. Do not apply a policy that silently breaks the single-file application.
- Preserve rollback artifacts and verify the uploaded HTML hash after deployment.

Cloud costs, AWS resources, DNS records, HTTPS certificates and production configuration remain owner-approved work. No `CNAME`, credentials, fake endpoint or active deployment is included in this package.

## Author and publication links

Code and release: [https://github.com/py2vox/propagacao](https://github.com/py2vox/propagacao)  
Archived release: [https://doi.org/10.5281/zenodo.22682135](https://doi.org/10.5281/zenodo.22682135)

José Ricardo de Paula, PY2VOX  
Independent researcher — Campinas, SP, Brazil  
ORCID: [https://orcid.org/0009-0005-9657-7254](https://orcid.org/0009-0005-9657-7254)  
[py2vox@gmail.com](mailto:py2vox@gmail.com)

Current metadata supplied by the author on 2026-09-10. Earlier review statements describe historical artifacts, not the current author record. Archive registration and exact version correspondence were not independently confirmed in this update.
