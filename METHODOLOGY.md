# Methodology: a modelled estimate, not a meter

## What this site does

The Cloud Kettle Index estimates Great Britain's data-centre electricity load and expresses it in kettle-boils per second. The figures are **modelled estimates**, not live meter readings.

## The kettle-boil unit

- 1 kettle-boil = 0.1 kWh (energy a 3 kW kettle uses to boil ~1 litre from 15°C)
- 1 kettle-boil per second = continuous power of 0.1 kWh × 3,600 s/hr = 360 kW = 0.36 MW
- Therefore: **kettle-boils/sec = facility load (MW) ÷ 0.36**

Note: this is an energy-rate metric, not a count of simultaneously boiling kettles.

## The dual-baseline model

### Central estimate — NESO FES 2025

```
NESO estimate: 7.6 TWh/year from 2.4 GW connected GB data-centre facilities
Average continuous power: 7.6 TWh ÷ 8,760 h/year = ~868 MW
Kettle-boils/sec: 868 MW ÷ 0.36 = ~2,410 kbs

Estimated share of GB demand
  = ~868 MW ÷ live Elexon BMRS demand (MW)
```

Source: NESO Future Energy Scenarios 2025 (July 2025); confirmed in Parliament POSTnote 762 (March 2026). Total facility electricity, not IT load alone. Covers all connected GB data-centre types.

### Scenario range — DSIT capacity model

```
Facility load (MW) = DSIT IT capacity × capacity-utilisation × PUE

  DSIT GB colocation IT capacity: 1,600 MW (maximum rated, autumn 2024)
  Capacity-utilisation: 40% (low) · 55% (central) · 70% (high)   — assumptions
  PUE:                  1.2 (low) · 1.4 (central) · 1.6 (high)   — assumptions

  Low:  1,600 × 0.40 × 1.2 =   768 MW  →  2,130 kbs
  High: 1,600 × 0.70 × 1.6 = 1,792 MW  →  4,980 kbs

The NESO central estimate (~868 MW) sits within this range.
```

**PUE** (Power Usage Effectiveness) = total facility grid draw ÷ IT load.

### Intraday shaping — UKPN measured profiles

The NESO 7.6 TWh figure is an annual average. To reflect how data-centre load varies through the
day, the NESO central estimate is scaled by a relative utilisation multiplier derived from
**UKPN's Data Centre Demand Profiles** dataset — half-hourly apparent-power readings from 96
anonymised data-centre sites (78 colocation, 18 enterprise) in the UKPN licence area (London, South
East, East of England), January 2023–April 2026.

The multiplier is looked up by day type (weekday, Saturday, Sunday, bank holiday) and half-hour
slot. Timestamps are parsed as UTC and converted to Europe/London before slot assignment, ensuring
correct handling of British Summer Time. Each site's shape index is normalised to its own overall
mean across all data, preserving genuine day-type differences rather than forcing each day type to
the same average.

Measured day-type mean factors (relative to each site's overall mean):

| Day type | Mean factor |
|---|---|
| Weekday | 1.016 (above baseline) |
| Saturday | 0.966 |
| Sunday | 0.964 |
| Bank holiday | 0.964 |

Intraday peak-to-trough variation: ~5.8% on weekdays, ~4.0% on bank holidays. UKPN profiles cover
UKPN licence areas only and may not be nationally representative. The DSIT scenario band is
intentionally left flat — it represents structural uncertainty in capacity and utilisation, not
intraday variation. The raw parquet is not committed; only the derived aggregate profiles are.

## Data sources

| Source | URL | Use |
|---|---|---|
| NESO FES 2025 | https://www.neso.energy/publications/future-energy-scenarios-fes | National DC electricity estimate — central figure (7.6 TWh/yr) |
| Parliament POSTnote 762 | https://post.parliament.uk/research-briefings/post-pn-0762/ | Cross-check for NESO figure |
| DSIT 2024 | https://www.gov.uk/government/publications/estimate-of-data-centre-capacity-great-britain-2024 | National and ITL1 regional IT capacity — scenario range |
| UKPN Data Centre Demand Profiles | https://ukpowernetworks.opendatasoft.com | Relative load shape only (apparent power utilisation ratios, not absolute MW) — used to shape NESO central estimate |
| Elexon BMRS | https://developer.elexon.co.uk | Live GB electricity demand (half-hourly) |
| Carbon Intensity API | https://api.carbonintensity.org.uk | Carbon intensity (context only) |
| postcodes.io | https://postcodes.io | Postcode → ITL1 region |

## Geographic scope

Great Britain only (England, Scotland, Wales). Northern Ireland uses a separate electricity system (SONI) and is excluded.

## What this site does not claim

- Live metered data-centre electricity demand
- AI-specific electricity use
- Nearest data-centre identification from postcode
- Use of UKPN profiles to estimate absolute GB data-centre MW or live data-centre demand (UKPN profiles are used only for relative load shape)
- Perfect alignment between Carbon Intensity API (DNO) and DSIT (ITL1) regional geographies
- DSIT's 1.6 GW as a current 2026 figure
- Northern Ireland coverage

## DC + Mid-Atlantic page methodology

The DC + Mid-Atlantic page uses a different model from the GB page. The core data-centre load
estimate comes directly from Dominion Energy Virginia's own published billing-demand forecasts,
not from IT capacity assumptions.

### Source

**[Dominion Energy Virginia 2025 data-centre forecasting presentation](https://www.in.gov/iurc/files/1.-Data-Center-Forecasting.pdf)** (Indiana IURC filing, 2025) and **[PJM Dominion data-centre large load request](https://www.pjm.com/-/media/DotCom/committees-groups/subcommittees/las/2025/20250916/20250916-item-04ai---dominion-data-center-large-load-request.pdf)** (PJM Load Analysis Subcommittee, September 2025).
Both sources provide year-by-year data-centre billing demand for Dominion's Virginia service territory:

- 2024 actual: ~3,584 MW
- 2025 forecast: ~4,149 MW
- 2026 projection: ~4,753 MW (primary figure used on the DC + Mid-Atlantic page)
- 2027 projection: ~5,322 MW
- 2028 projection: ~5,863 MW
- 2029 projection: ~6,419 MW
- 2030 projection: ~6,992 MW
- Industry load factor: ~90%

### Why UTILISATION × PUE is not applied

The GB model applies capacity-utilisation and PUE assumptions to DSIT's *IT capacity* to estimate
facility electricity demand. Dominion's billing-demand figures are already power demand — the
grid draw in MW. Applying utilisation and PUE again would double-count. The conversion is simply:

```
kbs = billing_demand_mw / 0.36
```

### Billing demand vs average continuous load

Dominion's billing demand is the demand value used for utility tariff calculations, not coincident
grid peak. Dominion separately derives *coincident demand* — the actual grid draw at the time of
system peak — from billing-demand forecasts; coincident demand is generally somewhat lower.
Dominion reports a ~90% industry load factor. The headline kbs figure translates billing demand
directly as a power-rate comparison, not an annual-average energy estimate. Average continuous
draw can be estimated as billing demand × 0.90, giving ~4,280 MW (~11,900 kbs) for the 2026 projection.

### Why Northern Virginia / Dominion zone for a DC-area estimate

I could not identify a public data-centre load figure for DC proper. Northern Virginia (Loudoun,
Fairfax, Prince William counties) is reported by JLARC (2024) as representing roughly 13% of
global data-centre operational capacity and 25% of Americas capacity. It sits within Dominion
Energy Virginia's service territory and powers much of the cloud infrastructure used in and
around Washington, DC. The Dominion service-territory billing demand is the most concrete and
well-sourced proxy used here.

Note: the scientific scope of this page is the Dominion Virginia service territory, not Northern
Virginia counties alone; "DC + Mid-Atlantic" is reader framing reflecting where this load is most
relevant.

### What the DC + Mid-Atlantic estimate is not

- A measurement of data centres physically inside Washington, DC.
- Total PJM data-centre load (PJM covers 13 states + DC).
- A full Northeast model — PJM, NYISO, and ISO-NE would each need separate treatment.
- A live grid demand share — modelled billing-demand estimates only.

### Intraday load shaping

The DC + Mid-Atlantic page includes a shape-only intraday comparison. I could not identify a
public data-centre-specific half-hourly profile analogous to UKPN's dataset for Northern
Virginia. The chart therefore keeps two things separate: a conservative synthetic data-centre
daily shape anchored to Dominion's approximately 90% industry load-factor context, and generic
Dominion Energy Virginia customer-class hourly profiles for selected large-customer classes
(GS3, GS4, LGEMLP, and MS). Those Dominion profiles are real utility settlement/load-research
profiles, but they are not data-centre-specific and are used only as context. COMM6VA is omitted
because Dominion publishes it as a weather-sensitive formula table rather than a simple hourly
profile.

### Latest-reported PJM grid demand comparison

The GB page shows live "share of GB demand" via Elexon's public API. The DC + Mid-Atlantic page
now includes the closest static-site equivalent: a latest-reported PJM demand comparison using
EIA Balancing Authority Areas hourly operating data. The numerator is still modelled Dominion
data-centre billing demand; the denominator is PJM balancing-authority demand. This is not live
data-centre load, not Dominion-zone load, and not county-level demand. EIA data can lag, so the
page labels this as latest-reported grid context rather than live demand.

## National US context

For broader national context on US data-centre electricity use (not used as model inputs):

- **[LBNL 2024 US Data Center Energy Usage Report](https://buildings.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report)** — closest US analogue to a national baseline; DOE has noted load could double or triple by 2028.
- **[EPRI 2026 data-centre electricity analysis](https://www.globenewswire.com/news-release/2026/02/26/3245491/0/en/epri-data-centers-could-consume-up-to-17-of-u-s-electricity-by-2030.html)** — projects 9–17% of US electricity by 2030; a scenario range, not measured load. Cite as context only.

## What would make this estimate better

1. **Site-level disclosure from operators** — half-hourly grid utilisation published by operators
2. **National-scale open measured data-centre load profiles** — UKPN's data exists but requires registration
3. **Annual DSIT capacity updates** at sub-regional level
