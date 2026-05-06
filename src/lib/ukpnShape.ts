import profiles from "../data/ukpn-derived-load-shapes.json";

type DayType = "weekday" | "saturday" | "sunday" | "bank_holiday";

// England & Wales bank holidays - extend as needed
const BANK_HOLIDAYS = new Set([
  "2023-01-02","2023-04-07","2023-04-10","2023-05-01","2023-05-08",
  "2023-05-29","2023-08-28","2023-12-25","2023-12-26",
  "2024-01-01","2024-03-29","2024-04-01","2024-05-06","2024-05-27",
  "2024-08-26","2024-12-25","2024-12-26",
  "2025-01-01","2025-04-18","2025-04-21","2025-05-05","2025-05-26",
  "2025-08-25","2025-12-25","2025-12-26",
  "2026-01-01","2026-04-03","2026-04-06","2026-05-04","2026-05-25",
  "2026-08-31","2026-12-25","2026-12-28",
]);

function isoDate(tsMs: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date(tsMs));
}

function londonDayType(tsMs: number): DayType {
  const date = isoDate(tsMs);
  if (BANK_HOLIDAYS.has(date)) return "bank_holiday";
  const dow = parseInt(
    new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Europe/London" })
      .format(new Date(tsMs))
      .replace("Sun", "0").replace("Sat", "6").replace(/[A-Za-z]+/, "1"),
    10,
  );
  if (dow === 0) return "sunday";
  if (dow === 6) return "saturday";
  return "weekday";
}

// Returns the UKPN relative utilisation multiplier for a given timestamp.
// Uses all_sites profile. Fallback = 1.0 (flat) if data missing.
export function ukpnMultiplier(tsMs: number): number {
  const dayType  = londonDayType(tsMs);
  const slot     = Math.floor(
    (parseInt(new Intl.DateTimeFormat("en-GB", { hour: "2-digit",   timeZone: "Europe/London" }).format(new Date(tsMs)), 10) * 60
   + parseInt(new Intl.DateTimeFormat("en-GB", { minute: "2-digit", timeZone: "Europe/London" }).format(new Date(tsMs)), 10)) / 30,
  );
  const median = (profiles.profiles.all_sites as Record<string, { median: (number | null)[] }>)[dayType]?.median;
  return median?.[slot] ?? 1.0;
}

export function isBankHoliday(tsMs: number): boolean {
  return BANK_HOLIDAYS.has(isoDate(tsMs));
}

// Flatness stats for display / methodology
export const flatnessStats = profiles.flatness;
