import dsit from "../data/dsit-capacity.json";

export interface ScenarioBand {
  low: number;
  central: number;
  high: number;
}

export interface ModelResult {
  facilityLoadMw: ScenarioBand;
  kettleBoilsPerSec: ScenarioBand;
}

export interface RegionalResult extends ModelResult {
  regionName: string;
  itl1Code: string;
  itCapacityMw: number;
}

// 1 kettle-boil = 0.1 kWh.
// If that energy is used every second, continuous power = 0.1 kWh × 3,600 s/hr = 360 kW = 0.36 MW.
export const KBS_DIVISOR = 0.36;

// NESO FES 2025 (July 2025): GB data-centre electricity estimated at 7.6 TWh/year
// from 2.4 GW connected facilities. Confirmed in UK Parliament POSTnote 762 (March 2026).
// 7.6 TWh/year ÷ 8,760 h/year = average continuous power draw.
// This is total facility electricity (grid draw), not IT load alone.
export const NESO_ANNUAL_TWH  = 7.6;
// 1 TWh = 1,000,000 MWh; divide by hours in a year to get average MW
export const NESO_AVERAGE_MW  = (NESO_ANNUAL_TWH * 1_000_000) / 8_760; // ≈ 867.6 MW
export const NESO_AVERAGE_KBS = NESO_AVERAGE_MW / KBS_DIVISOR;           // ≈ 2,410 kbs

const UTILISATION = { low: 0.40, central: 0.55, high: 0.70 } as const;
const PUE         = { low: 1.2,  central: 1.4,  high: 1.6  } as const;

function facilityLoad(itCapacityMw: number, utilisation: number, pue: number): number {
  return itCapacityMw * utilisation * pue;
}

function toKbs(mw: number): number {
  return mw / KBS_DIVISOR;
}

// DSIT scenario range: uncertainty bounds around the NESO central estimate.
// Low/high derived from DSIT colocation IT capacity × utilisation × PUE scenarios.
export function nationalModel(): ModelResult {
  const cap = dsit.headline_total_mw;
  const low     = facilityLoad(cap, UTILISATION.low,     PUE.low);
  const central = facilityLoad(cap, UTILISATION.central, PUE.central);
  const high    = facilityLoad(cap, UTILISATION.high,    PUE.high);
  return {
    facilityLoadMw:    { low, central, high },
    kettleBoilsPerSec: { low: toKbs(low), central: toKbs(central), high: toKbs(high) },
  };
}

export function regionalModel(itl1Code: string): RegionalResult | null {
  const region = dsit.regions.find(r => r.itl1_code === itl1Code);
  if (!region) return null;
  const low     = facilityLoad(region.it_capacity_mw, UTILISATION.low,     PUE.low);
  const central = facilityLoad(region.it_capacity_mw, UTILISATION.central, PUE.central);
  const high    = facilityLoad(region.it_capacity_mw, UTILISATION.high,    PUE.high);
  return {
    regionName:        region.name,
    itl1Code:          region.itl1_code,
    itCapacityMw:      region.it_capacity_mw,
    facilityLoadMw:    { low, central, high },
    kettleBoilsPerSec: { low: toKbs(low), central: toKbs(central), high: toKbs(high) },
  };
}

export function demandSharePercent(facilityLoadMw: number, gbDemandMw: number): number {
  if (gbDemandMw <= 0) return 0;
  return (facilityLoadMw / gbDemandMw) * 100;
}

export function demandShareBand(band: ScenarioBand, gbDemandMw: number): ScenarioBand {
  return {
    low:     demandSharePercent(band.low,     gbDemandMw),
    central: demandSharePercent(band.central, gbDemandMw),
    high:    demandSharePercent(band.high,    gbDemandMw),
  };
}
