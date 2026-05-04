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

## What would make this estimate better

1. **Site-level disclosure from operators** — half-hourly grid utilisation published by operators
2. **National-scale open measured data-centre load profiles** — UKPN's data exists but requires registration
3. **Annual DSIT capacity updates** at sub-regional level
