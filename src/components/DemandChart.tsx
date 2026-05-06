import { useEffect, useRef, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { fetchLast24HoursDemand, type ElexonDemandRecord } from "../lib/elexon";
import { nationalModel, NESO_AVERAGE_MW } from "../lib/dcModel";
import { ukpnMultiplier } from "../lib/ukpnShape";

const REFRESH_MS = 30 * 60 * 1000;

const model      = nationalModel();
const DC_LOW_MW  = model.facilityLoadMw.low;
const DC_HIGH_MW = model.facilityLoadMw.high;

function timeLabel(v: number) {
  return new Date(v * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
  });
}

function buildSharePlot(
  container: HTMLDivElement,
  ts: number[],
  shareLow: number[],
  shareHigh: number[],
  nesoShare: number[],
): uPlot {
  const width = container.clientWidth || 700;
  return new uPlot(
    {
      width,
      height: 300,
      axes: [
        { label: "Time (London)", values: (_s, vals) => vals.map(timeLabel), gap: 8, size: 36 },
        {
          label: "% of GB demand",
          labelSize: 14,
          size: 64,
          values: (_s, vals) => vals.map(v => `${v.toFixed(1)}%`),
        },
      ],
      series: [
        {},
        {
          label: "Scenario low",
          stroke: "rgba(0,0,0,0)",
          fill: "rgba(245,158,11,0.15)",
          width: 0,
          band: true,
        },
        {
          label: "Scenario high",
          stroke: "rgba(217,119,6,0.35)",
          fill: "rgba(245,158,11,0.15)",
          width: 1,
          band: true,
        },
        {
          label: "NESO 2025 estimate",
          stroke: "#d97706",
          width: 2,
          dash: [6, 4],
        },
      ],
      cursor: { show: true },
      legend: { show: true, live: true },
    },
    [ts, shareLow, shareHigh, nesoShare],
    container,
  );
}

export default function DemandChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef      = useRef<uPlot | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [noData, setNoData]           = useState(false);
  const [latestNeso, setLatestNeso]   = useState<number | null>(null);

  const buildChart = (records: ElexonDemandRecord[]) => {
    const container = containerRef.current;
    if (!container) return;

    plotRef.current?.destroy();
    plotRef.current = null;

    const ts     = records.map(r => new Date(r.startTime).getTime() / 1000);
    const demand = records.map(r => r.initialDemandOutturn);

    // Apply UKPN measured shape to the NESO central line
    const shapedNeso = ts.map(t => NESO_AVERAGE_MW * ukpnMultiplier(t * 1000));

    const shareLow  = demand.map((d, i) => d > 0 ? (DC_LOW_MW         / d) * 100 : 0);
    const shareHigh = demand.map((d, i) => d > 0 ? (DC_HIGH_MW         / d) * 100 : 0);
    const nesoShare = demand.map((d, i) => d > 0 ? (shapedNeso[i]       / d) * 100 : 0);

    plotRef.current = buildSharePlot(container, ts, shareLow, shareHigh, nesoShare);

    const last = demand[demand.length - 1];
    const lastTs = ts[ts.length - 1];
    if (last && last > 0 && lastTs) setLatestNeso((shapedNeso[shapedNeso.length - 1] / last) * 100);

    setLastUpdated(
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
      }),
    );
  };

  const load = async () => {
    const records = await fetchLast24HoursDemand();
    if (records.length === 0) { setNoData(true); return; }
    setNoData(false);
    buildChart(records);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      clearInterval(id);
      plotRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      const w = containerRef.current?.clientWidth;
      if (w) plotRef.current?.setSize({ width: w, height: 300 });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // latestNeso already set above
  const ariaLabel = latestNeso
    ? `Modelled data-centre load as share of GB demand over the past 24 hours. NESO 2025 estimate currently ~${latestNeso.toFixed(1)}% of GB demand.`
    : "Chart loading - modelled data-centre share of GB electricity demand.";

  return (
    <figure className="my-6">
      <div className="border border-gray-200 rounded bg-white px-4 pt-4 pb-2">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Modelled data-centre share of GB demand - last 24 hours
            </p>
            {latestNeso && (
              <p className="text-xs text-amber-700 font-medium font-tabular mt-0.5">
                Right now: ~{latestNeso.toFixed(1)}% (NESO estimate)
              </p>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <span>
              <span className="inline-block w-5 h-0.5 border-t-2 border-dashed border-amber-600 mr-1 align-middle" />
              NESO 2025 estimate
            </span>
            <span>
              <span className="inline-block w-5 h-3 bg-amber-400/15 border border-amber-500/25 mr-1 align-middle" />
              DSIT scenario range
            </span>
          </div>
        </div>

        {/* Chart */}
        <div
          ref={containerRef}
          role="img"
          aria-label={ariaLabel}
          className="w-full min-h-[300px]"
        >
          {noData && (
            <p className="text-sm text-gray-400 py-20 text-center">
              No demand data yet - chart populates as Elexon settlement periods complete.
            </p>
          )}
        </div>

        {/* Annotation */}
        <p className="text-xs text-gray-400 mt-2 pb-2">
          When national demand falls overnight or on quiet days, always-on loads take a
          larger share of the grid - even if their own consumption is only modelled as
          roughly steady.
        </p>
      </div>

      <figcaption className="text-xs text-gray-400 pt-2">
        {lastUpdated
          ? `Updated ${lastUpdated}. GB demand: Elexon BMRS. NESO line shaped by UKPN measured profiles (96 anonymised sites, Jan 2023–Apr 2026). DSIT band: scenario range. Neither is a live data-centre meter.`
          : "Loading…"}
      </figcaption>
    </figure>
  );
}
