/**
 * Measure how far GB transmission-grid demand falls on bank holidays.
 *
 * The site used to assert a bank-holiday reduction with no published
 * derivation. This computes it from the same public Elexon series the live
 * figure uses, so a reader can reproduce the number.
 *
 * Method: daily INDO energy (sum of the 48 half-hourly MW readings, times 0.5 h)
 * for each England-and-Wales bank holiday, against the mean of the SAME weekday
 * in the three weeks either side, excluding other bank holidays. Comparing like
 * weekday to like weekday keeps the seasonal trend out of the result; a window
 * of three weeks either side gives up to six peers per holiday, which is enough
 * that one unusual week does not swing it.
 *
 * Run: npm run measure:bank-holidays -- [year]
 */
import fs from "node:fs";
import path from "node:path";

const YEAR = Number(process.argv[2] ?? new Date().getUTCFullYear());
const OUT = path.resolve("src/data/bank-holiday-effect.json");
const INDO = "https://data.elexon.co.uk/bmrs/api/v1/demand/outturn";
const BANK_HOLIDAYS = "https://www.gov.uk/bank-holidays.json";
const PERIODS_PER_DAY = 48;
const HOURS_PER_PERIOD = 0.5;
const PEER_OFFSETS_DAYS = [-21, -14, -7, 7, 14, 21];
const MAX_RANGE_DAYS = 28; // Elexon rejects a wider window

type IndoRow = { settlementDate: string; initialDemandOutturn: number | null };
type BankHolidayFeed = Record<string, { events: Array<{ date: string; title: string }> }>;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (date: string, n: number) =>
  iso(new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400_000));

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Daily INDO energy in MWh, keyed by settlement date. Partial days are dropped. */
async function dailyEnergy(from: string, to: string) {
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (let start = from; start <= to; start = addDays(start, MAX_RANGE_DAYS)) {
    const end = addDays(start, MAX_RANGE_DAYS - 1) > to ? to : addDays(start, MAX_RANGE_DAYS - 1);
    const { data } = await getJson<{ data?: IndoRow[] }>(
      `${INDO}?settlementDateFrom=${start}&settlementDateTo=${end}&format=json`,
    );
    for (const row of data ?? []) {
      if (row.initialDemandOutturn == null) continue;
      const d = row.settlementDate;
      totals.set(d, (totals.get(d) ?? 0) + row.initialDemandOutturn * HOURS_PER_PERIOD);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
  }
  for (const [d, n] of counts) if (n !== PERIODS_PER_DAY) totals.delete(d);
  return totals;
}

const feed = await getJson<BankHolidayFeed>(BANK_HOLIDAYS);
const events = feed["england-and-wales"]!.events;
const allDates = new Set(events.map((e) => e.date));
const today = iso(new Date());
const holidays = events.filter((e) => e.date.startsWith(`${YEAR}`) && e.date < today);
if (holidays.length === 0) {
  console.warn(`No England-and-Wales bank holidays have passed in ${YEAR}; nothing to measure.`);
  process.exit(0);
}

const energy = await dailyEnergy(
  addDays(holidays[0]!.date, -MAX_RANGE_DAYS),
  addDays(holidays[holidays.length - 1]!.date, MAX_RANGE_DAYS),
);

const measured = holidays.flatMap((h) => {
  const own = energy.get(h.date);
  if (own == null) return [];
  const peers = PEER_OFFSETS_DAYS.map((k) => addDays(h.date, k))
    .filter((d) => !allDates.has(d))
    .map((d) => energy.get(d))
    .filter((v): v is number => v != null);
  if (peers.length === 0) return [];
  const baseline = peers.reduce((a, b) => a + b, 0) / peers.length;
  return [{
    date: h.date,
    title: h.title,
    gwh: Number((own / 1000).toFixed(1)),
    baselineGwh: Number((baseline / 1000).toFixed(1)),
    peerDays: peers.length,
    percentBelowBaseline: Number((((baseline - own) / baseline) * 100).toFixed(1)),
  }];
});

const falls = measured.map((m) => m.percentBelowBaseline).sort((a, b) => a - b);
const median = falls.length % 2
  ? falls[(falls.length - 1) / 2]!
  : (falls[falls.length / 2 - 1]! + falls[falls.length / 2]!) / 2;

const payload = {
  generatedAt: new Date().toISOString(),
  year: YEAR,
  source: {
    title: "Elexon BMRS Initial National Demand Outturn (INDO)",
    url: "https://bmrs.elexon.co.uk/api-documentation",
    holidays: BANK_HOLIDAYS,
  },
  method:
    "Daily INDO energy against the mean of the same weekday in the three weeks either side, " +
    "excluding other bank holidays. Partial days are dropped.",
  summary: {
    holidaysMeasured: measured.length,
    minPercentBelow: Math.min(...falls),
    maxPercentBelow: Math.max(...falls),
    medianPercentBelow: Number(median.toFixed(1)),
  },
  holidays: measured,
};
fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(
  `${measured.length} bank holidays in ${YEAR}: ` +
  `${payload.summary.minPercentBelow}% to ${payload.summary.maxPercentBelow}% below the ` +
  `comparable weekday, median ${payload.summary.medianPercentBelow}%. Wrote ${OUT}`,
);
