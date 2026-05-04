export interface ElexonDemandRecord {
  settlementDate: string;
  settlementPeriod: number;
  startTime: string;
  initialDemandOutturn: number;
}

export interface CachedDemand {
  source: "Elexon BMRS Initial National Demand Outturn";
  fetchedAt: string;
  startTime: string;
  settlementDate: string;
  settlementPeriod: number;
  demandMw: number;
}

const STORAGE_KEY = "cki_demand";
const FRESH_MS    = 75 * 60 * 1000;
const STALE_MS    = 6  * 60 * 60 * 1000;

export type DemandStatus = "fresh" | "stale" | "unavailable";

function londonDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

export async function fetchLatestDemand(): Promise<CachedDemand | null> {
  const date = londonDateString();
  const url =
    `https://data.elexon.co.uk/bmrs/api/v1/demand/outturn` +
    `?settlementDateFrom=${date}&settlementDateTo=${date}&format=json`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json() as { data?: ElexonDemandRecord[] };
    const records = json.data;
    if (!records || records.length === 0) return null;

    // Use the most recent completed settlement period (sort ascending, take last)
    const sorted = [...records]
      .filter(r => r.initialDemandOutturn != null)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const latest = sorted[sorted.length - 1];
    if (!latest) return null;

    const cached: CachedDemand = {
      source: "Elexon BMRS Initial National Demand Outturn",
      fetchedAt: new Date().toISOString(),
      startTime: latest.startTime,
      settlementDate: latest.settlementDate,
      settlementPeriod: latest.settlementPeriod,
      demandMw: latest.initialDemandOutturn,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch {
      // localStorage unavailable (SSR or private browsing)
    }

    return cached;
  } catch {
    return null;
  }
}

export function getCachedDemand(): CachedDemand | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedDemand;
  } catch {
    return null;
  }
}

export function getDemandStatus(cached: CachedDemand | null): DemandStatus {
  if (!cached) return "unavailable";
  const age = Date.now() - new Date(cached.startTime).getTime();
  if (age < FRESH_MS)  return "fresh";
  if (age < STALE_MS)  return "stale";
  return "unavailable";
}

export function formatSettlementTime(startTime: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
  }).format(new Date(startTime));
}

export async function getDemand(): Promise<{ cached: CachedDemand | null; status: DemandStatus }> {
  const existing = getCachedDemand();
  const existingStatus = getDemandStatus(existing);

  if (existingStatus === "fresh") {
    return { cached: existing, status: "fresh" };
  }

  const fresh = await fetchLatestDemand();
  if (fresh) return { cached: fresh, status: getDemandStatus(fresh) };

  return { cached: existing, status: existingStatus };
}

// Returns the last 24 hours of demand (yesterday + today, trimmed to 24h window)
export async function fetchLast24HoursDemand(): Promise<ElexonDemandRecord[]> {
  const today = londonDateString();
  // Compute yesterday in London time
  const yesterday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const url =
    `https://data.elexon.co.uk/bmrs/api/v1/demand/outturn` +
    `?settlementDateFrom=${yesterday}&settlementDateTo=${today}&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json() as { data?: ElexonDemandRecord[] };
    const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    return (json.data ?? [])
      .filter(r => r.initialDemandOutturn != null && r.startTime >= cutoff)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  } catch {
    return [];
  }
}
