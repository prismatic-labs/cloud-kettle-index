import data from "../data/us-data-center-load.json";
import { KBS_DIVISOR } from "./dcModel";

export type UsDemandKey =
  | "actual2024"
  | "forecast2025"
  | "projection2026"
  | "projection2027"
  | "projection2028"
  | "projection2029"
  | "projection2030";

// Explicit ordered set - controls iteration order and validates keys.
// Filter to keys present in the region's demandMw; absent keys are skipped.
const DEMAND_KEYS: UsDemandKey[] = [
  "actual2024",
  "forecast2025",
  "projection2026",
  "projection2027",
  "projection2028",
  "projection2029",
  "projection2030",
];

const SCENARIO_META: Record<UsDemandKey, { year: number; kind: UsDemandScenario["kind"]; label: string }> = {
  actual2024:     { year: 2024, kind: "actual",     label: "2024 actual" },
  forecast2025:   { year: 2025, kind: "forecast",   label: "2025 forecast" },
  projection2026: { year: 2026, kind: "projection", label: "2026 projection" },
  projection2027: { year: 2027, kind: "projection", label: "2027 projection" },
  projection2028: { year: 2028, kind: "projection", label: "2028 projection" },
  projection2029: { year: 2029, kind: "projection", label: "2029 projection" },
  projection2030: { year: 2030, kind: "projection", label: "2030 projection" },
};

export interface UsDemandScenario {
  key: UsDemandKey;
  year: number;
  kind: "actual" | "forecast" | "projection";
  demandMw: number;
  kbs: number;
  averageContinuousMw: number;
  averageContinuousKbs: number;
  label: string;
}

export interface UsSource {
  title: string;
  publisher: string;
  note: string;
  url: string;
}

export interface UsModelResult {
  regionId: string;
  displayName: string;
  modelScope: string;
  scenarios: UsDemandScenario[];
  primary: UsDemandScenario;
  sources: UsSource[];
  primarySource: UsSource;
  caveat: string;
  loadFactor: number;
}

export function getUsRegion(id: string) {
  const region = data.regions.find(r => r.id === id);
  if (!region) throw new Error(`Unknown US region id: "${id}"`);
  return region;
}

export function usModel(id: string): UsModelResult {
  const region = getUsRegion(id);

  // Validate loadFactor
  if (typeof region.loadFactor !== "number" || region.loadFactor <= 0 || region.loadFactor > 1) {
    throw new Error(`Invalid loadFactor in region "${id}": must be a number 0 < loadFactor ≤ 1`);
  }
  const loadFactor = region.loadFactor;

  // Validate sources
  if (!region.sources?.length) {
    throw new Error(`Region "${id}" has no sources defined`);
  }
  for (const s of region.sources) {
    if (!s.url) throw new Error(`Source "${s.title}" in region "${id}" is missing a url`);
  }
  const sources = region.sources as UsSource[];

  // Build scenarios in DEMAND_KEYS order; skip keys absent from this region's data
  const scenarios: UsDemandScenario[] = DEMAND_KEYS
    .filter(key => region.demandMw[key] != null)
    .map(key => {
      const demandMw = region.demandMw[key]!;
      const meta = SCENARIO_META[key];
      const averageContinuousMw = demandMw * loadFactor;
      return {
        key,
        year: meta.year,
        kind: meta.kind,
        demandMw,
        kbs: demandMw / KBS_DIVISOR,
        averageContinuousMw,
        averageContinuousKbs: averageContinuousMw / KBS_DIVISOR,
        label: meta.label,
      };
    });

  // Validate and resolve primary scenario
  const primaryKey = region.primaryScenario;
  if (!DEMAND_KEYS.includes(primaryKey as UsDemandKey)) {
    throw new Error(
      `Invalid primaryScenario "${primaryKey}" in region "${id}". Valid keys: ${DEMAND_KEYS.join(", ")}`
    );
  }
  const primary = scenarios.find(s => s.key === primaryKey);
  if (!primary) {
    throw new Error(`Primary scenario "${primaryKey}" not found in built scenarios for region "${id}"`);
  }

  return {
    regionId: region.id,
    displayName: region.displayName,
    modelScope: region.modelScope,
    scenarios,
    primary,
    sources,
    primarySource: sources[0],
    caveat: region.caveat,
    loadFactor,
  };
}
