import { useState, useEffect, useCallback } from "react";
import { getDemand, formatSettlementTime, type CachedDemand, type DemandStatus } from "../lib/elexon";
import { nationalModel, demandSharePercent, NESO_AVERAGE_MW, NESO_AVERAGE_KBS } from "../lib/dcModel";
import { ukpnMultiplier } from "../lib/ukpnShape";
import { buildNationalShareText } from "../lib/shareText";
import ShareButton from "./ShareButton";
import KettleTrain from "./KettleTrain";

const POLL_MS  = 5 * 60 * 1000;
const SITE_URL = (import.meta.env.SITE ?? "https://prismatic-labs.github.io")
               + (import.meta.env.BASE_URL ?? "/cloud-kettle-index").replace(/\/$/, "");

function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London",
  }).format(new Date(iso));
}

function shapedKbs(): number {
  return Math.round((NESO_AVERAGE_MW * ukpnMultiplier(Date.now())) / 0.36 / 10) * 10;
}

export default function DemandShare() {
  const [cached, setCached] = useState<CachedDemand | null>(null);
  const [status, setStatus] = useState<DemandStatus>("unavailable");

  const refresh = useCallback(async () => {
    const { cached: c, status: s } = await getDemand();
    setCached(c);
    setStatus(s);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const model = nationalModel();

  const generateSharePayload = useCallback(() => {
    const shapedMw  = NESO_AVERAGE_MW * ukpnMultiplier(Date.now());
    const nesoShare = cached ? demandSharePercent(shapedMw, cached.demandMw) : 0;
    const time = cached ? formatSettlementTime(cached.startTime) : "—";
    const date = cached ? formatLongDate(cached.startTime) : "—";
    const text = buildNationalShareText({
      nesoKbs:     NESO_AVERAGE_KBS,
      nesoShare,
      lowShare:    nesoShare * (model.facilityLoadMw.low  / NESO_AVERAGE_MW),
      highShare:   nesoShare * (model.facilityLoadMw.high / NESO_AVERAGE_MW),
      lowKettles:  model.kettleBoilsPerSec.low,
      highKettles: model.kettleBoilsPerSec.high,
      time, date,
      url: SITE_URL,
      isStale: status === "stale" || status === "unavailable",
    });
    return { title: "The Cloud Kettle Index", text, url: SITE_URL };
  }, [cached, status, model]);

  const kbs = shapedKbs();

  if (status === "unavailable" || !cached) {
    return (
      <div aria-live="polite" className="mt-1">
        <p className="text-sm text-gray-400">Fetching live GB demand&hellip;</p>
        <div className="mt-3">
          <ShareButton label="Share current snapshot" generatePayload={generateSharePayload} />
        </div>
      </div>
    );
  }

  const shapedMw  = NESO_AVERAGE_MW * ukpnMultiplier(Date.now());
  const nesoShare = demandSharePercent(shapedMw, cached.demandMw);
  const time      = formatSettlementTime(cached.startTime);

  return (
    <div aria-live="polite" aria-label="Live demand and kettle-boils estimates">

      {/* Primary: % share of GB demand */}
      <div className="flex items-baseline gap-3 flex-wrap mt-1">
        <span className="text-3xl font-bold font-tabular text-[var(--color-accent)]">
          ~{nesoShare.toFixed(1)}%
        </span>
        <span className="text-base text-gray-600">of current GB electricity demand</span>
      </div>

      {/* Secondary: live kbs */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className="text-lg font-semibold font-tabular text-gray-700">
          ~{kbs.toLocaleString("en-GB")}
        </span>
        <span className="text-sm text-gray-500">kettle-boils per second</span>
        <KettleTrain />
      </div>

      {/* Staleness / source line */}
      <p className="text-xs text-gray-400 mt-1">
        GB demand {cached.demandMw.toLocaleString("en-GB")}&nbsp;MW &middot;{" "}
        {status === "fresh"
          ? `data as of ${time}`
          : <span className="text-amber-600">data delayed, last reading {time}</span>}
      </p>

      <div className="mt-3">
        <ShareButton label="Share current snapshot" generatePayload={generateSharePayload} />
      </div>
    </div>
  );
}
