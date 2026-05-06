export interface NationalShareInput {
  nesoKbs: number;       // NESO annual-average central estimate in kbs
  nesoShare: number;     // % of GB demand from NESO central estimate (primary)
  lowShare: number;      // % of GB demand, scenario low
  highShare: number;     // % of GB demand, scenario high
  lowKettles: number;    // kbs low, unrounded (DSIT scenario)
  highKettles: number;   // kbs high, unrounded (DSIT scenario)
  time: string;          // settlement period start, e.g. "09:30"
  date: string;          // e.g. "4 May 2026"
  url: string;
  isStale?: boolean;
}

export interface RegionalShareInput {
  regionName: string;
  lowKettles: number;
  highKettles: number;
  lowMw: number;
  highMw: number;
  carbonIntensity?: number | null;
  carbonRegion?: string | null;
  url: string;
}

function fmt(n: number): string {
  return (Math.round(n / 10) * 10).toLocaleString("en-GB");
}

function fmtMw(n: number): string {
  return Math.round(n).toLocaleString("en-GB");
}

export function buildNationalShareText(state: NationalShareInput): string {
  const dataLine = state.isStale
    ? `Latest available data (data delayed): ${state.time}, ${state.date}.`
    : `Data as of ${state.time}, ${state.date}.`;

  return [
    `The Cloud Kettle Index puts Britain's annual-average data-centre electricity demand at ~${fmt(state.nesoKbs)} kettle-boils per second - based on NESO's 2025 estimate of 7.6 TWh/year, equivalent to ~${state.nesoShare.toFixed(1)}% of current GB electricity demand.`,
    ``,
    `Scenario range (DSIT capacity model): ${fmt(state.lowKettles)}–${fmt(state.highKettles)} kbs, or ${state.lowShare.toFixed(1)}–${state.highShare.toFixed(1)}% of GB demand.`,
    ``,
    `Modelled estimate, not a live meter. The live grid is public; the data-centre load is not. This is the most transparent public estimate we could build.`,
    ``,
    dataLine,
    ``,
    state.url,
  ].join("\n");
}

export function buildRegionalShareText(state: RegionalShareInput): string {
  const carbonLine =
    state.carbonIntensity != null && state.carbonRegion
      ? `Current carbon intensity in this electricity region (${state.carbonRegion}): ${state.carbonIntensity} gCO₂/kWh.`
      : null;

  const lines = [
    `The Cloud Kettle Index estimates that data-centre load in ${state.regionName} is equivalent to ${fmt(state.lowKettles)}–${fmt(state.highKettles)} kettle-boils per second (modelled ${fmtMw(state.lowMw)}–${fmtMw(state.highMw)} MW facility load).`,
    ``,
    `That is a modelled regional estimate based on DSIT data-centre capacity, utilisation and PUE scenarios - not a live meter.`,
  ];

  if (carbonLine) {
    lines.push(``, carbonLine);
  }

  lines.push(``, state.url);

  return lines.join("\n");
}
