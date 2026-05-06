# Cloud Kettle Index

The Cloud Kettle Index estimates Great Britain's data-centre electricity demand and translates it into kettle-boils per second.

Live at **[prismatic-labs.github.io/cloud-kettle-index](https://prismatic-labs.github.io/cloud-kettle-index)**

Data-centre electricity demand is hard to picture. The live grid is public, and some national and regional estimates exist, but measured data-centre demand is not publicly available in a form that can be used directly. This project makes the best public estimate visible, and helps people ask public bodies for the evidence behind it.

Built by [Prismatic Labs](https://github.com/prismatic-labs).

---

## What it does

- Estimates GB data-centre electricity demand using published national and regional figures
- Converts that estimate into kettle-boils per second and compares it with live GB electricity demand
- Shows how that share varies through the day, across the week, and on bank holidays
- Provides regional context from a postcode lookup
- Includes a copyable Environmental Information Request template so people can ask public bodies for the underlying evidence

## Why kettles?

Megawatts and load profiles are useful, but they are not intuitive for most people. Kettle-boils per second are a deliberately familiar way to show the scale of always-on infrastructure.

One kettle-boil is 0.1 kWh — the energy a 3 kW kettle uses to boil about a litre of water. One kettle-boil per second is a continuous power draw of 0.36 MW. The model estimates GB data centres consume somewhere between 2,130 and 4,980 kettle-boils per second, with ~2,410 as the central estimate.

## Modelled, not metered

This site does not measure live data-centre electricity demand from meters. It reconstructs a modelled profile from public sources:

| Source | Use |
|---|---|
| [NESO Future Energy Scenarios 2025](https://www.neso.energy/publications/future-energy-scenarios-fes) | National data-centre electricity estimate — central figure (7.6 TWh/yr, all GB data-centre types) |
| [DSIT Estimate of Data Centre Capacity GB 2024](https://www.gov.uk/government/publications/estimate-of-data-centre-capacity-great-britain-2024) | National and regional IT capacity — scenario range (colocation, autumn 2024, aggregated regional) |
| [UKPN Data Centre Demand Profiles](https://ukpowernetworks.opendatasoft.com) | Relative load shape — intraday and day-type variation (96 anonymised sites, UKPN licence areas only; apparent-power ratios, not MW) |
| [Elexon BMRS Initial National Demand Outturn](https://developer.elexon.co.uk/api-details#api=prod-insol-insights-api) | Live GB electricity demand, half-hourly |
| [Carbon Intensity API](https://api.carbonintensity.org.uk) | National and regional carbon intensity |
| [postcodes.io](https://postcodes.io) | Postcode to ITL1 region mapping |

The full formula and data-source details are in [METHODOLOGY.md](METHODOLOGY.md) and at `/methodology` on the live site.

## Ask for the underlying evidence

The site includes a copyable Environmental Information Request template. People can use it directly, or adapt it for [WhatDoTheyKnow](https://www.whatdotheyknow.com), to ask public bodies what evidence they hold about data-centre electricity demand, grid impacts, planning assumptions, and connection capacity.

Environmental Information Requests are addressed to public authorities and public bodies — councils, planning authorities, government departments, regulators, and infrastructure bodies. Private data-centre operators are not directly subject to EIR, though public bodies may hold information about them through their planning, grid, regulatory, or policy work. Not every request will succeed in full, but partial disclosure is common and still useful.

## What it does not claim

- Does not measure live data-centre electricity demand from meters
- Does not measure AI-specific load — data centres power AI, streaming, banking, SaaS, and all internet infrastructure
- Does not cover Northern Ireland, which operates a separate electricity system managed by SONI
- Regional DSIT estimates cover colocation capacity only; the national central estimate comes from NESO's data-centre electricity estimate
- UKPN profiles are used for relative load shape only, not to estimate absolute MW
- DSIT's autumn 2024 capacity figure does not represent current capacity

## Development

```bash
npm install
npm run dev          # local dev server
npm run build        # static build to dist/
npm run verify:data  # manually verify DSIT figures against GOV.UK
```

## Licence

Apache 2.0 — see [LICENSE](LICENSE).
