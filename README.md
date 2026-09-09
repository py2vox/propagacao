# AGHIP — Analysis of Geospace and High-frequency Ionospheric Propagation

*An integrated computational framework for HF/VHF/EME radio propagation and space-weather analysis.*

AGHIP brings propagation models, space-weather observations, regional weather information, and radio-listening diagnostics into a single HTML application. It is designed for amateur radio operators, radio listeners, educators, and researchers who want to examine both a result and the assumptions behind it.

The selected **Maidenhead grid locator** anchors location-dependent calculations. Global solar and geomagnetic indices remain global observations; they are not presented as measurements taken at the operator's station.

**Scientific status:** research software submitted for independent evaluation. AGHIP is not a certified warning system, a guarantee of reception, or an independently validated predictor for every supported operating scenario.

## Getting started

1. Obtain `index.html` from the version you intend to use and save it locally.
2. Open the file in a modern web browser. No installation, compilation, or application server is required for the embedded numerical core.
3. Select **pt-BR** or **en-US**.
4. Enter your station's grid locator. A six-character locator provides a finer location reference than a four-character locator; its center is still an approximation to the actual antenna position.
5. Select the destination appropriate to the activity: an HF reference destination, a VHF contact grid, or the other EME station's grid.
6. Review source availability, timestamps, model limits, and station assumptions before interpreting the results.

The **QTH** is the operator's station location. Antenna installation, terrain, local interference, and the actual transmitting station can differ substantially from the application's reference assumptions.

## Application panels

| Tab | Main purpose | How to interpret it |
| --- | --- | --- |
| **Overview** | Orientation, shared indicators, and current HF band recommendations for the selected QTH | Recommendations compare declared reference scenarios; they are not contact probabilities |
| **Weather** | Regional official alerts, modeled weather, precipitation radar, and lightning context | Check the provider, location, age, and availability of each product; the panel does not replace official emergency services |
| **HF** | Band forecasts, operating windows, WSPR comparisons, radio-listening scenarios, and the 160 m laboratory | Distinguish model predictions, reported receptions, geometric diagnostics, and conditional experiments |
| **VHF** | Mechanism-specific screening for sporadic E, trans-equatorial propagation, meteor scatter, and tropospheric conditions | Screening indices are not calibrated probabilities or a complete received-signal calculation |
| **EME** | Moon position, mutual visibility, and polarization-related context | Geometric visibility alone does not establish a usable Earth–Moon–Earth link |
| **Science** | Methodology, assumptions, references, provenance, and review status | Consult this tab before citing a numerical result or treating it as independently validated |

## Scientific methods and boundaries

AGHIP combines established reference methods with explicitly labeled research implementations and operational diagnostics.

| Method or reference | Role in AGHIP | Important limitation |
| --- | --- | --- |
| **ITU-R P.1239 / CCIR** | Ionospheric characteristics used by the HF calculations | Monthly climatology is not a direct observation of the current ionosphere; documented text/reference-code choices remain relevant |
| **ITU-R P.533** | HF mode selection, field strength, received power, and signal-to-noise calculations within the implemented profile | The implementation does not claim complete normative equivalence, circuit reliability, or independently established predictive accuracy |
| **ITU-R P.372** | Atmospheric, man-made, and Galactic radio-noise estimates | Climatological noise is not a measurement of local interference at a particular antenna |
| **ITU-R P.453** | Refractivity and modified-refractivity diagnostics from a local atmospheric-model column | A local modeled gradient does not prove that a duct extends along the entire radio path |
| **ITU-R P.1147** | Experimental LF/MF sky-wave calculations within the declared domain, approximately 150–1,700 kHz | The external Figure 4 comparison remains unresolved; this method is not extended to the amateur 160 m band |
| **WMM2025** | Main geomagnetic-field quantities within the model's date limits | Main-field geometry is not a measured ionospheric absorption correction |
| **Solar and lunar geometry** | Illumination, solar elevation, Moon position, and mutual visibility | Approximate ephemerides and geometric horizons do not replace precision observing or propagation measurements |

References to ITU-R, NOAA, NASA, or other organizations identify methods and data sources. They do **not** imply institutional endorsement or certification of AGHIP.

### Scientific radio listening

The radio-listening panel explores reception under declared transmitter-power, receiver-bandwidth, antenna-pattern, and receiving-site noise assumptions.

- Signal-to-noise ratio is expressed in **dB**; it must not be confused with absolute received power in dBm or dBW.
- The controlled antenna comparison uses normalized reference patterns. It does not establish the realized gain, efficiency, or directional noise rejection of an actual installation.
- A measured noise floor is useful only when its frequency, bandwidth, calibration, and measurement point are appropriate to the comparison.
- Reception labels are operational interpretations under stated assumptions, not validated intelligibility scores or statistical probabilities.
- Results outside an implemented model's domain must not be promoted to validated reception predictions.

Real antenna comparisons require documented geometry, installation height, orientation, ground properties, losses, and suitable electromagnetic modeling or measurements. An antenna name alone is insufficient.

### 160 meters: reception and geometry laboratory

The 160 m module is deliberately separate from P.1147 and HF-domain extrapolation. It combines:

1. **Qualified WSPR reports**, retaining source metadata, timestamps, and transmission direction.
2. **Calculated solar geometry**, including nighttime and Earth-shadow conditions along the reference path.
3. **A conditional S/N experiment** anchored to a reception measurement supplied by the operator.

Under the same channel and installation assumptions, the experiment applies:

```text
SNR₂ = SNR₁ + 10 log₁₀(P₂ / P₁) − 10 log₁₀(B₂ / B₁) − ΔN₀
```

Here, `P` is transmit power, `B` is equivalent noise bandwidth, and `ΔN₀` is the change in noise spectral density in dB. The signal must remain within the selected filter, and the power quantities must be comparable.

This relationship is a controlled sensitivity calculation, **not a forecast of ionospheric evolution**. A nearby WSPR reception is not a calibrated measurement at your QTH. Likewise, an absence of reports does not prove that a band is closed, and nighttime geometry does not guarantee a DX opening.

## Regional weather and data provenance

Official alert services are separated by country and operational mode:

- **Brazil:** INMET.
- **United States:** National Weather Service, or NWS.
- **Canada:** Environment and Climate Change Canada, or ECCC.

A foreign provider is not used as a substitute for an unavailable national service. Alert applicability depends on the selected grid, the operational layer, and the official product's geographic coverage.

Other data sources include NOAA SWPC, NASA DONKI, USGS, GIRO/KC2G through the configured relay, WSPRnet/wspr.live, Open-Meteo, RainViewer, and GOES GLM products. Each has its own update schedule, coverage, access requirements, and limitations.

**Precipitation radar is not a lightning detector.** GLM reports satellite-observed total-lightning flashes; these are not a verified catalog of individual cloud-to-ground strikes.

An unavailable, incomplete, or stale response must not be interpreted as an absence of hazardous weather. Follow official warnings and local emergency-management instructions. During emergencies, avoid interference with frequencies carrying emergency or priority traffic.

## Single-file architecture and offline operation

`index.html` is the application runtime. Supporting test scripts, reference fixtures, and reports are research and development materials, not additional files required by the embedded numerical core.

The HTML embeds the core equations, coefficients, principal visualization libraries, and a low-resolution world outline. Offline operation preserves those resources, but **does not provide new observations**.

Internet access remains necessary for current API data, street-map tiles, precipitation radar, and the external GLM HDF5/WASM decoder. NASA DONKI requests require a session key or a configured deployment endpoint. Personal API keys must not be committed to the repository or embedded in a public HTML release.

Browser access also depends on each provider's CORS policy. In the reviewed r11 server-side sample, the INMET RSS response did not include an `Access-Control-Allow-Origin` header. A successful server request therefore did not establish direct browser access. A hosted deployment may require the supported same-origin endpoint configuration; a standalone HTML file cannot override the provider's access policy.

Location-based requests may transmit the selected coordinates to external services. Review exported grids, callsigns, and operator-entered measurements before sharing research records.

## Review and validation status

The following snapshot applies specifically to **AGHIP-review-2026.09.09-r11**, reviewed on **September 9, 2026**. It must not be assumed to describe a later commit or a differently modified HTML file.

- **Nine automated suites:** 1,717 internal checks passed.
- Coverage includes numerical regression, model-domain gates, screening invariants, malformed-input rejection, simulated asynchronous races, and DOM-emulated interface behavior.
- Public read-only API samples were examined separately from the deterministic tests.
- Full browser, screen-reader, and GLM end-to-end acceptance was not completed.
- Predictive performance against independent, held-out field observations remains unvalidated.

Passing internal tests is not evidence of zero defects, complete standards compliance, or guaranteed reception.

The reviewed r11 HTML has this SHA-256:

```text
a8362ce0819fee6b8192116c6f2a1218cc5d84e75f6d106a27e9f3698bc832c0
```

The provenance manifest and preserved reports identify the exact tested artifact. The embedded application-script digest is a separate quantity with a documented calculation convention. Hashes establish identity, not scientific correctness.

### Reproducing the reviewed tests

This repository includes the nine suites in `tests/`, supporting fixtures, and preserved r11 reports in `reports/r11/`. The runtime HTML is unchanged.

With Node.js 24 installed, run these commands from the repository root:

```sh
npm install --global pnpm@11.19.0 --ignore-scripts
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
pnpm test
```

Each run creates a new `.audit-runs/` directory. No live API probes run in CI. See [Getting started](docs/GETTING-STARTED.md), [the submission review](docs/SUBMISSION-REVIEW.md), [publication checklist](docs/GITHUB-AND-DOI.md), and [deployment boundaries](docs/DEPLOYMENT.md).

The workflow is configured for Windows and Linux. A generated workflow is not evidence that GitHub-hosted jobs have already passed.

### Open scientific and operational work

- Resolve the P.1147 Figure 4 discrepancy without tuning the implementation to desired outputs.
- Compare the complete HF calculation chain with an independently built ITURHFProp reference under fixed inputs and conventions.
- Evaluate predictions using held-out observations and documented non-detections from known-active transmitters and receivers.
- Incorporate independently validated antenna patterns and receiver-noise characterization for installation-specific claims.
- Complete real-browser, assistive-technology, radar, lightning-decoder, and regional-alert acceptance testing.
- Verify deployment access policies and third-party data-use permissions.

## Scientific collaboration

Contributions are welcome from researchers and practitioners in ionospheric physics, radio propagation, atmospheric science, antenna engineering, radio astronomy, numerical methods, accessibility, and scientific software engineering.

Useful contributions include reproducible reference cases, independently derived equations, calibrated observations, documented NEC models, uncertainty analyses, and clear reports of failed predictions.

When reporting an issue, include the software version or HTML hash, UTC timestamp, relevant grids, frequency, station assumptions, data-source status, and steps needed to reproduce the result. Do not include API secrets or private station information without permission.

## Citation and publication

Repository: [github.com/py2vox/propagacao](https://github.com/py2vox/propagacao).

Cite the exact version used in your analysis. The reviewed r11 package includes `CITATION.cff`; no DOI or ORCID was assigned in that package. Do not substitute an invented identifier or present repository availability as peer-review approval.

Suggested citation for the reviewed baseline:

> de Paula, José Ricardo (PY2VOX). (2026). *AGHIP — Analysis of Geospace and High-frequency Ionospheric Propagation* (AGHIP-review-2026.09.09-r11) [Computer software]. https://github.com/py2vox/propagacao

When a version-specific DOI is assigned, update the citation and publication metadata consistently. Recalculate hashes and rerun the relevant checks whenever the distributed artifact changes.

## Selected references

- [ITU-R P.533 — HF propagation prediction](https://www.itu.int/rec/R-REC-P.533/en).
- [ITU-R P.1239 — ionospheric characteristics](https://www.itu.int/rec/R-REC-P.1239/en).
- [ITU-R P.372 — radio noise](https://www.itu.int/rec/R-REC-P.372/en).
- [ITU-R P.453 — atmospheric refractivity](https://www.itu.int/rec/R-REC-P.453/en).
- [ITU-R P.1147 — LF/MF sky-wave field strength](https://www.itu.int/rec/R-REC-P.1147/en).
- [ITU-R Study Group 3 — HF reference software](https://github.com/ITU-R-Study-Group-3/ITU-R-HF).
- [NOAA/NCEI — World Magnetic Model](https://www.ncei.noaa.gov/products/world-magnetic-model).
- [WSJT-X User Guide](https://wsjt.sourceforge.io/wsjtx-main_en.html) and [wspr.live data documentation](https://wspr.live/).
- [NWS alerts API documentation](https://www.weather.gov/documentation/services-web-alerts).
- [ECCC MSC GeoMet documentation](https://eccc-msc.github.io/open-data/msc-geomet/readme_en/).

Consult the application's Science tab and the versioned review documentation for implementation-specific assumptions and reference discrepancies.

## License and acknowledgments

The AGHIP application code is distributed under the **MIT License**, with the license text included in the reviewed release package and HTML. Embedded libraries retain their own copyright and license notices.

Third-party datasets, imagery, services, and recommendation documents retain their respective terms. The AGHIP license does not override those terms. In particular, wspr.live publishes restrictions on commercial use and provides no guarantee of service availability or data correctness.

Acknowledgments include the ITU-R Study Group 3, NOAA/NCEI/BGS, NASA, USGS, GIRO operators and data aggregators, WSPR contributors, INMET, NWS, ECCC, Open-Meteo, RainViewer, GOES open-data providers, and the open-source library and geographic-data maintainers identified in the software.

## Author and contact

**José Ricardo de Paula — PY2VOX**  
Campinas, São Paulo, Brazil

- Email: [py2vox@gmail.com](mailto:py2vox@gmail.com)
- WhatsApp: +55 19 98323-5341

AGHIP is intended to support transparent analysis, experimentation, and collaboration—not to replace measurements, professional judgment, or official safety guidance.
