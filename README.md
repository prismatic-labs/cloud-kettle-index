# The Cloud Kettle Index

Britain's data-centre electricity load, translated into kettle-boils per second.

Live at **[prismatic-labs.github.io/cloud-kettle-index](https://prismatic-labs.github.io/cloud-kettle-index)**

A public-interest website by [Prismatic Labs](https://github.com/prismatic-labs), the team behind [vetch](https://github.com/prismatic-labs/vetch) — planet-aware LLM observability with circuit breakers for runaway cost, energy, and carbon.

---

## What it does

The site estimates Great Britain's data-centre electricity load at any given moment and expresses it in **kettle-boils per second** (defined as 0.1 kWh per kettle-boil; 1 kettle-boil/sec = 0.36 MW continuous).

The core observation: on bank holidays, Sundays, and overnight, GB electricity demand falls by roughly 15–20%. Data-centre demand is generally far flatter than residential and commercial electricity use, so on quiet days data centres can represent a larger share of the grid. The site makes this contrast visible.

## What it does not claim

- It does not claim to measure live data-centre electricity demand from meters
- It does not claim to measure AI-specific load (data centres power AI, streaming, banking, SaaS, and all internet infrastructure)
- It does not include Northern Ireland (on a separate grid operated by SONI)
- Regional DSIT estimates cover colocation capacity only. The national central estimate comes from NESO's data-centre electricity estimate (7.6 TWh/yr). UKPN profiles include anonymised colocation and enterprise sites in UKPN licence areas and are used only for relative load shape.
- It does not claim DSIT's autumn 2024 capacity figure represents current capacity

## Data sources

| Source | Use | Notes |
|---|---|---|
| [NESO Future Energy Scenarios 2025](https://www.neso.energy/publications/future-energy-scenarios-fes) | National DC electricity estimate (central figure) | 7.6 TWh/yr, all GB data-centre types |
| [DSIT Estimate of Data Centre Capacity GB 2024](https://www.gov.uk/government/publications/estimate-of-data-centre-capacity-great-britain-2024) | National and regional IT capacity (scenario range) | Colocation DCs, autumn 2024, aggregated regional |
| [UKPN Data Centre Demand Profiles](https://ukpowernetworks.opendatasoft.com) | Relative load shape (intraday + day-type shaping) | 96 anonymised sites, UKPN licence areas only; apparent-power ratios, not MW |
| [Elexon BMRS Initial National Demand Outturn](https://developer.elexon.co.uk/api-details#api=prod-insol-insights-api) | Live GB electricity demand (half-hourly) | Public, no auth required |
| [Carbon Intensity API](https://api.carbonintensity.org.uk) | National and regional carbon intensity | Public, CORS enabled |
| [postcodes.io](https://postcodes.io) | Postcode → ITL1 region mapping | Public, CORS enabled |

The site also includes a copyable Environmental Information Request template, so people can ask public bodies what evidence they hold about data-centre electricity demand, grid impacts, planning assumptions, and connection capacity.

## Methodology

The formula is documented fully at `/methodology` on the live site and in [METHODOLOGY.md](METHODOLOGY.md).

In brief:
```
Central estimate (NESO FES 2025):
  7.6 TWh/yr ÷ 8,760 h = ~868 MW → ~2,410 kettle-boils/sec

Scenario range (DSIT × utilisation × PUE):
  Low:  1,600 MW × 40% × 1.2 =   768 MW →  2,130 kbs
  High: 1,600 MW × 70% × 1.6 = 1,792 MW →  4,980 kbs

Intraday shape: NESO central estimate scaled by UKPN relative
utilisation profiles (96 anonymised sites, apparent-power ratios).
```

Utilisation and PUE figures are scenario assumptions, not measurements.

## Development

```bash
npm install
npm run dev          # local dev server
npm run build        # static build to dist/
npm run verify:data  # manually verify DSIT figures against GOV.UK
```

## Licence

Apache 2.0 — see [LICENSE](LICENSE).
