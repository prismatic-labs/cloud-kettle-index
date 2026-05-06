# Cloud Kettle Index

Two regions, one framing: data-centre electricity demand translated into kettle-boils per second.

Live at **[prismatic-labs.github.io/cloud-kettle-index](https://prismatic-labs.github.io/cloud-kettle-index)**

Data-centre electricity demand is hard to picture. Some national and regional estimates exist, but measured demand is rarely published in a usable form. This project makes the best available public estimates visible and helps people ask public bodies for the evidence behind them.

Built by [Prismatic Labs](https://github.com/prismatic-labs).

---

## Regions

**Great Britain** — modelled from NESO and DSIT national and regional figures, compared against live Elexon grid demand. Includes a load-shape breakdown from UKPN anonymised data-centre profiles and a postcode lookup for regional context.

**DC + Mid-Atlantic** — Dominion Energy Virginia published billing demand for Northern Virginia, the world-scale data-centre cluster just across the Potomac from DC. Compared against EIA hourly PJM grid demand for wider grid context. Framed for DC and Mid-Atlantic readers; the data covers the Dominion service territory, not the city of DC.

---

## Why kettles?

Megawatts and load profiles are useful, but they are not intuitive for most people. Kettle-boils per second are a deliberately familiar way to show the scale of always-on infrastructure.

One kettle-boil is 0.1 kWh — the energy a 3 kW kettle uses to boil about a litre of water. One kettle-boil per second is a continuous power draw of 0.36 MW.

---

## Modelled, not metered

Neither page measures live data-centre electricity demand from meters. Both reconstruct modelled estimates from public sources.

### Great Britain

| Source | Use |
|---|---|
| [NESO Future Energy Scenarios 2025](https://www.neso.energy/publications/future-energy-scenarios-fes) | National data-centre electricity estimate — central figure (7.6 TWh/yr) |
| [DSIT Estimate of Data Centre Capacity GB 2024](https://www.gov.uk/government/publications/estimate-of-data-centre-capacity-great-britain-2024) | National and regional IT capacity — scenario range |
| [UKPN Data Centre Demand Profiles](https://ukpowernetworks.opendatasoft.com) | Relative load shape — intraday and day-type variation (96 anonymised sites) |
| [Elexon BMRS Initial National Demand Outturn](https://developer.elexon.co.uk/api-details#api=prod-insol-insights-api) | Live GB electricity demand, half-hourly |
| [Carbon Intensity API](https://api.carbonintensity.org.uk) | National and regional carbon intensity |
| [postcodes.io](https://postcodes.io) | Postcode to ITL1 region mapping |

### DC + Mid-Atlantic

| Source | Use |
|---|---|
| [Dominion Energy Virginia 2025 data-centre forecasting presentation](https://www.dominionenergy.com) | Published billing demand 2024–2030 — the model input |
| [PJM Load Area Study, September 2025](https://www.pjm.com) | Supporting load projections and planning context |
| [EIA Hourly Electric Grid Monitor](https://www.eia.gov/electricity/gridmonitor/) | Latest-reported PJM hourly demand — grid-share denominator |

Billing demand figures are converted directly to kettle-boils per second (÷ 0.36 MW/kbs). The GB model's utilisation and PUE adjustments are not applied — Dominion's figures are already facility-level power demand.

The full formula and data-source details are in [METHODOLOGY.md](METHODOLOGY.md) and at `/methodology` on the live site.

---

## Ask for the underlying evidence

**Great Britain** — the site includes a copyable Environmental Information Request template for asking public bodies what evidence they hold about data-centre electricity demand, grid impacts, planning assumptions, and connection capacity. EIRs can be submitted directly or via [WhatDoTheyKnow](https://www.whatdotheyknow.com).

**DC + Mid-Atlantic** — the site includes public-records request templates for Virginia FOIA, federal FOIA, and DC FOIA. Ready-to-send templates ask Dominion, Virginia SCC, PJM, federal agencies, and DC-area planning bodies for demand forecasts, grid-impact evidence, and connection data that remains hard to inspect publicly.

---

## What it does not claim

- Does not measure live data-centre electricity demand from meters in either region
- Does not measure AI-specific load — data centres power AI, streaming, banking, SaaS, and all internet infrastructure
- **GB:** does not cover Northern Ireland, which operates a separate electricity system managed by SONI; UKPN profiles used for relative load shape only, not absolute MW; DSIT autumn 2024 capacity figure does not represent current capacity
- **DC + Mid-Atlantic:** Dominion billing demand is not a measurement of data centres physically inside DC; does not cover total PJM data-centre load (13 states + DC); not a full Northeast model (PJM + NYISO + ISO-NE); EIA PJM values are latest-reported and can lag by 1–2 days

---

## Development

```bash
npm install
npm run dev          # local dev server
npm run build        # static build to dist/
npm run verify:data  # manually verify DSIT figures against GOV.UK
```

The EIA PJM cache (`src/data/us-grid-demand-pjm.json`) is refreshed every 6 hours by a GitHub Actions workflow. Set `EIA_API_KEY` as a repository secret to enable the scheduled fetch.

---

## Licence

Apache 2.0 — see [LICENSE](LICENSE).
