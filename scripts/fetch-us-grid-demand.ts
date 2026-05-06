import fs from "node:fs";
import path from "node:path";

const apiKey = process.env.EIA_API_KEY;
const outPath = path.resolve("src/data/us-grid-demand-pjm.json");
const sourceUrl = "https://www.eia.gov/opendata/browser/electricity/rto/region-data";
const apiUrl = "https://api.eia.gov/v2/electricity/rto/region-data/data/";

type EiaRow = {
  period: string;
  respondent?: string;
  "respondent-name"?: string;
  type?: string;
  "type-name"?: string;
  value?: string;
  "value-units"?: string;
};

function writeCache(status: string, records: Array<{ period: string; demandMw: number }>) {
  const payload = {
    generatedAt: new Date().toISOString(),
    status,
    respondent: "PJM",
    source: {
      title: "EIA Balancing Authority Areas hourly operating data",
      url: sourceUrl,
      note: "Hourly balancing-authority demand. Used as latest-reported PJM grid context, not live data-centre load.",
    },
    records,
  };
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
}

if (!apiKey) {
  console.warn("EIA_API_KEY is not set; leaving existing US grid-demand cache unchanged.");
  process.exit(0);
}

const params = new URLSearchParams();
params.set("frequency", "hourly");
params.append("data[0]", "value");
params.append("facets[respondent][]", "PJM");
params.append("facets[type][]", "D");
params.append("sort[0][column]", "period");
params.append("sort[0][direction]", "desc");
params.set("offset", "0");
params.set("length", "72");
params.set("api_key", apiKey);

const res = await fetch(`${apiUrl}?${params.toString()}`);
if (!res.ok) {
  throw new Error(`EIA request failed: ${res.status} ${res.statusText}`);
}

const body = await res.json();
if (body.error) {
  throw new Error(`EIA error: ${body.error.code ?? "unknown"} ${body.error.message ?? ""}`);
}

const rows = (body.response?.data ?? []) as EiaRow[];
const records = rows
  .filter(row => row.period && row.value != null)
  .map(row => ({ period: row.period, demandMw: Number(row.value) }))
  .filter(row => Number.isFinite(row.demandMw) && row.demandMw > 0)
  .sort((a, b) => a.period.localeCompare(b.period))
  .slice(-48);

if (records.length < 24) {
  throw new Error(`EIA returned only ${records.length} usable PJM demand records`);
}

writeCache("ok", records);
console.log(`Wrote ${records.length} PJM hourly demand records to ${outPath}`);
