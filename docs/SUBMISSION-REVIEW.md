# AGHIP r11 — software and scientific submission review

Review date: 2026-09-09. Author of software: José Ricardo de Paula — PY2VOX.

## Executive disposition

**Candidate for independent scientific review, not a certification of accuracy or complete ITU-R conformity.** All six application tabs are included in the review matrix below. The review combines source inspection, inherited numerical regression, new fault-injection tests, DOM-emulated integration and public API sample probes. It does not claim that every equation was independently rederived, that every possible UI state was inspected, or that external domain specialists approved the software.

The supplied assessment of r10 was useful but too strong in concluding that conceptual challenge had been eliminated. Explicit model limits prevent some overinterpretations; they do not resolve external discrepancies or establish predictive skill.

The mentioned `index (81).html` was not present in Downloads. The inspected parent was the preserved r10 package, SHA-256 `61b45da4d50db4f1bc34130b271b52fb4e73f303d13436ce69c4764f5ac6845e`. No identity claim is made for the unavailable external copy.

## Findings and repairs

| ID | Severity for scientific use | Finding | r11 disposition |
| --- | --- | --- | --- |
| A01 | High | HF WSPR responses could overwrite evidence after a destination change | Request epoch and complete endpoint key checked before state/UI mutation |
| A02 | High | Absent WSPR power became zero; malformed, future or old times could enter the sample | Strict number/UTC/mode screening; real zero dBm remains valid; malformed rows rejected |
| A03 | High | Current-weather results or tropo failures from an old grid could replace/clear a new grid's panel | Separate request epochs and QTH identity guards; old values cleared on a new request or current failure |
| A04 | High | Some NOAA/profile filters used coercive `isFinite`, accepting null as zero | Strict finite checks for Kp, Dst, X-ray and profile values; missing smoothed sunspot values rejected |
| A05 | Medium | Null 160 m rows raised an exception; last-sample shadow start produced a zero-duration interval | Invalid collections/rows rejected; zero-duration windows suppressed |
| A06 | Medium | Removing missing tropo hours joined separated anomalies; unavailable intervals disappeared visually | Window grouping breaks at missing hours; strip retains marked gaps; no all-hours clearance statement |
| A07 | Medium | English tropo text and accessible table could label subrefraction differently from the Portuguese classifier | Same reference-threshold classification used in the reviewed text/table paths |
| A08 | Medium | Missing/failed WSPR acquisition could still leave a table saying no live spots | Explicit unavailable/loading state; bounded 800-row sample and discarded records disclosed |
| A09 | Reproducibility | Earlier HF test expected eight cards, but the approved Top Band addition makes nine | Updated exact order includes Top Band before radio listening; other assertions retained |
| A10 | Reproducibility | Packaged test command did not provide one complete run of all relevant suites | `run-audit.cjs` runs nine suites into a new folder, verifies report-to-HTML hashes and reports failures |

`evidence/r10-reproduced-defects.json` records six synthetic failure reproductions on the untouched parent. Fault injection does not represent real meteorological observations. The comparison is between fixed software fixtures, not different circuits or weather conditions.

No new physical propagation law, forecast accuracy improvement, novelty or successful external validation is claimed. The 2-hour weather-time policy, 8-hour regional WSPR sample and 0–60 dBm declared-power filter are explicit data-quality/sampling choices, not universal physical limits. WSPR boxes remain broad, bidirectional regional samples, not matched stations or independently controlled validation trials. Date-line boxes now wrap and latitude limits are clamped.

## Coverage by tab

| Tab | Examined calculation/data path | Evidence in this package | Limits reviewers must retain |
| --- | --- | --- | --- |
| Overview | Grid coordinates, current-time best-band selection, model-domain eligibility, shared state | `overview-welcome.json`, `submission.json`, scientific core checks | Best-of-reference-destinations policy is not a contact probability or a prediction for every actual station. Performance recorded in a DOM emulator is not browser responsiveness certification |
| Weather | INMET/NWS/ECCC routing and collection checks, point/polygon logic, weather updates, radar/GLM declarations | Synthetic contracts in `scientific.json`; request-race tests; live source and alert probes | No universal live-alert coverage claim. INMET browser CORS remains open. Raster radar rendering, GLM HDF5/WASM decode, hazard polygons and keyboard interaction need real-browser acceptance |
| HF | CCIR/P.1239, P.533 screening/modes/path regimes, P.372 noise, WSPR diagnostics, Top Band experiment, LF/MF | `scientific.json`, `screening.json`, `p1147.json`, `hf-presentation.json`, Top Band report | Full ITURHFProp chain comparison and held-out predictive validation remain open. P.1147 Figure 4 discrepancy remains open. Ideal normalized receive patterns are not measured realized antenna gain |
| VHF | Mechanism distance gates, meteor/TEP/Es screening, P.453 local atmospheric-column processing | `listening-domains.json`, scientific core checks, accessibility and submission integration | Screening scores are uncalibrated. A local column cannot establish an end-to-end tropospheric duct; terrain/clutter/antenna-height field models remain incomplete |
| EME | Local/remote lunar geometry, mutual visibility and polarization context; presentation navigation | Scientific core vectors/invariants plus VHF/EME rendering in `accessibility.json` | Approximate ephemerides; no full independently calibrated EME link budget or path-TEC/Faraday nowcast. Moon phase is global, local visibility is grid-dependent |
| Science | Bilingual scope, identity, provenance, references, review status and citation metadata | `submission.json`, header inspection, citation and integrity manifests | Bibliographic references do not constitute endorsement. No DOI, ORCID, public repository or peer-review approval fabricated |

## Mathematical interpretation and dimensional checks

- P.533 modal power sums must be performed in linear power units. The screening suite varies only the screening foE under a frozen circuit, testing the non-increase invariant when additional modes are blocked. This is a software invariant, not an empirical accuracy test.
- P.533 received power and S/N are distinct quantities: the implemented power relation uses field strength, receive gain and frequency; S/N includes external noise factor and bandwidth. **S/N is in dB, not dBW.** The implementation's text/reference-code choices remain documented, not silently promoted to complete normative equivalence.
- P.372 noise is climatological unless a properly specified local measurement is supplied. Bandwidth/noise-reference and station assumptions must accompany any reception comparison. A fixed V2-to-V1 sunspot scale is only an approximation.
- P.453 uses pressure in hPa, temperature in kelvin inside the refractivity expression, height differences converted to km, and `M = N + 157h` with h in km. A gradient is not a measured continuous duct. Subrefraction thresholds shown here follow the declared reference-profile classification.
- The Top Band conditional experiment uses `SNR₂ = SNR₁ + 10 log10(P₂/P₁) − 10 log10(B₂/B₁) − ΔN₀`. It requires the same channel/installation and specified noise assumptions. This algebra cannot forecast ionospheric evolution or turn a nearby WSPR report into a measured local S/N.
- **P.1147 remains restricted to its LF/MF domain, about 150–1,700 kHz; it is not extrapolated to 160 m.** Its internal regression can pass while an external figure comparison disagrees. Both results are retained.
- WMM main-field vectors, solar/lunar geometry and global indices describe different physical quantities. None is an independently justified direct multiplier for 160 m absorption or reception probability.

## Tests and evidence provenance

Authoritative totals for this exact artifact are in `audit/audit-summary.json`. Individual reports include the tested HTML digest. The aggregate includes ordinary assertions, not independent observations. Nested WMM and embedded P.533 assertions are not double-counted. The runner includes the Top Band suite explicitly; running `audit-scientific.cjs` alone is **not** the full release audit.

The preserved r9 HTML under `fixtures/` exists solely for function/vendor preservation tests. It is not loaded by the r11 application. The nine-card expectation change is recorded above; it is not a deletion of a failing check. An initial packaging test also found a missing baseline JSON; that development fixture is included in this package. Working preflight reports remain associated with their own hashes and are not relabeled as final evidence.

Node.js 24.19.0 and linkedom 0.18.12 were used. DOM tests exercise function/state/markup behavior but do not draw Leaflet/Chart.js or certify assistive-technology behavior. Real-browser inspection of the local file was blocked by the browser-access URL policy. No security bypass was attempted. This limitation is not a provider or application error.

## Live sample results and operational limitations

On 2026-09-09, server-side GET samples received HTTP 200 from NWS, ECCC, INMET, SFI, Kp, Dst, R12, Bz, X-ray, GIRO relay, USGS, RainViewer, Open-Meteo and WSPR. See `evidence/live-contracts.json` and `evidence/live-data.json` for exact endpoints, UTC and schema fields. `sampleTime` is a sampled record/header time, **not a claim that it is the newest record or a freshness assessment**.

The NWS Washington-area point and ECCC Ottawa-area point samples contained zero features; separate broader schema probes found active products. A valid empty local response is not an inactive API. ECCC pagination was visible in the broad one-feature sample, emphasizing the need for completeness checks.

INMET returned RSS and a CAP bulletin with a polygon and municipal list, but the RSS response had no `Access-Control-Allow-Origin` header. Server access does not prove browser access. Current NASA authenticated requests were not tested; the software requires an operator session key or a configured endpoint. No private key is distributed. GLM object download/decoding, current radar tile display and nationwide municipality matching were not verified end to end.

## Required independent gates before stronger claims

1. Reconcile the open P.1147 Figure 4 comparison without tuning outputs to desired values; publish fixtures and an external explanation.
2. Compare the entire HF chain against an independently built ITURHFProp reference, with version, coefficients, units and input timestamps fixed.
3. Validate against held-out observations and non-detections with demonstrably active TX/RX, documented antenna patterns, ground, losses, bandwidth and calibrated instruments. Separate stations and periods between fitting and evaluation; report error, bias, dispersion and coverage.
4. Use actual NEC/measurement patterns and receiver-noise characterization for claims about antenna superiority or absolute realized gain.
5. Perform browser acceptance across BR/US/CA, both languages, mobile/desktop and assistive technology; exercise delayed, empty, malformed, stale and incomplete responses, plus region changes during fetch/decode.
6. Resolve deployment CORS and data-use permissions. A single offline file cannot create current weather observations or bypass a provider's access policy.

## Hashes and publication identifiers

The r10 header's `SCIENTIFIC_BUNDLE_SHA256` reference was not itself an unresolved placeholder: the application contained a real digest. The convention zeroes that one declaration, concatenates non-vendor script bodies in document order with newline separators, and hashes UTF-8 with SHA-256. The new digest was recalculated. `release-manifest.json` supplies the separate whole-HTML digest; `package-integrity.json` lists supporting files and excludes itself. None is a digital signature or correctness proof.

Tagline text **and** `lang` are exercised under the actual BR/US mode switch in DOM emulation. The English application name intentionally stays `lang="en-US"` in both modes. `citation_doi` is intentionally absent until a real identifier has been assigned. Repository/DOI/ORCID placeholders are unresolved publication metadata, not permission to invent identifiers. Use a specific version DOI for a frozen release, preserve the cited bytes and distinguish later revisions.

## Primary references and documentation

- [ITU-R P.533-14 — HF prediction](https://www.itu.int/rec/R-REC-P.533-14-201908-I/en) and [ITU-R Study Group 3 reference source](https://github.com/ITU-R-Study-Group-3/ITU-R-HF).
- [ITU-R P.1239 — ionospheric characteristics](https://www.itu.int/rec/R-REC-P.1239/en), [P.372 — radio noise](https://www.itu.int/rec/R-REC-P.372/en), [P.453 — atmospheric refractivity](https://www.itu.int/rec/R-REC-P.453/en), [P.1147 — LF/MF sky wave](https://www.itu.int/rec/R-REC-P.1147/en).
- [NOAA/NCEI World Magnetic Model](https://www.ncei.noaa.gov/products/world-magnetic-model) and [NOAA solar calculation details](https://gml.noaa.gov/grad/solcalc/calcdetails.html).
- [WSJT-X User Guide](https://wsjt.sourceforge.io/wsjtx-main_en.html) and [wspr.live schema, caveats and terms](https://wspr.live/). These distinguish reported observations from controlled measurements.
- [NWS alerts API documentation](https://www.weather.gov/documentation/services-web-alerts) and [ECCC MSC GeoMet documentation](https://eccc-msc.github.io/open-data/msc-geomet/readme_en/).
- [Zenodo GitHub release integration](https://help.zenodo.org/docs/github/) and [version DOI guidance](https://zenodo.org/help/versioning). No deposit or publication was made during this review.

Contact for collaboration and independent results: py2vox@gmail.com · José Ricardo de Paula — PY2VOX.
