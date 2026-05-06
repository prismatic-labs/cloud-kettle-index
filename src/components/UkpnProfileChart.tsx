import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import shapes from "../data/ukpn-derived-load-shapes.json";
import { isBankHoliday } from "../lib/ukpnShape";

type DayType = "weekday" | "saturday" | "sunday" | "bank_holiday";

const DAY_LABELS: Record<DayType, string> = {
  weekday:      "Weekday",
  saturday:     "Saturday",
  sunday:       "Sunday",
  bank_holiday: "Bank holiday",
};

const DAY_COLORS: Record<DayType, string> = {
  weekday:      "#334155",
  saturday:     "#64748b",
  sunday:       "#f59e0b",
  bank_holiday: "#dc2626",
};

const ALL_PROFILES = shapes.profiles.all_sites as Record<DayType, { median: (number | null)[] }>;
const FLATNESS     = (shapes.flatness as Record<string, Record<DayType, { peak_to_trough_ratio: number; overnight_vs_daytime_ratio: number }>>).all_sites;
const ORDER: DayType[] = ["weekday", "saturday", "sunday", "bank_holiday"];

function getTodayDayType(): DayType {
  const now = Date.now();
  if (isBankHoliday(now)) return "bank_holiday";
  const dow = new Date().toLocaleDateString("en-GB", { weekday: "short", timeZone: "Europe/London" });
  if (dow === "Sat") return "saturday";
  if (dow === "Sun") return "sunday";
  return "weekday";
}

function currentSlot(): number {
  const d = new Date();
  const h = parseInt(new Intl.DateTimeFormat("en-GB", { hour: "2-digit",   timeZone: "Europe/London" }).format(d), 10);
  const m = parseInt(new Intl.DateTimeFormat("en-GB", { minute: "2-digit", timeZone: "Europe/London" }).format(d), 10);
  return Math.min(47, Math.floor(h * 2 + m / 30));
}

export default function UkpnProfileChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef      = useRef<uPlot | null>(null);
  const today        = useMemo(getTodayDayType, []);
  const nowSlot      = useMemo(currentSlot, []);
  const [selected, setSelected] = useState<DayType>(today);

  const buildChart = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    plotRef.current?.destroy();
    plotRef.current = null;

    const x          = Array.from({ length: 48 }, (_, i) => i * 0.5);
    const dataSeries = ORDER.map(d => ALL_PROFILES[d].median.map(v => v ?? null));
    const nowSeries: (number | null)[] = x.map((_, i) =>
      i === nowSlot ? (ALL_PROFILES[selected].median[nowSlot] ?? null) : null,
    );

    const width = container.clientWidth || 700;

    plotRef.current = new uPlot(
      {
        width,
        height: 210,
        axes: [
          {
            label: "Time (London)",
            values: (_s, vals) => vals.map(v => `${String(Math.floor(v)).padStart(2,"0")}:00`),
            gap: 6,
            size: 32,
            incrs: [3],
          },
          {
            label: "Relative utilisation (mean = 1.0)",
            labelSize: 12,
            size: 64,
            values: (_s, vals) => vals.map(v => v.toFixed(3)),
            gap: 4,
          },
        ],
        series: [
          {},
          ...ORDER.map(d => ({
            label:  DAY_LABELS[d],
            stroke: DAY_COLORS[d],
            width:  d === selected ? 2.5 : 1,
            alpha:  d === selected ? 1   : 0.25,
            dash:   d === selected ? undefined : ([4, 3] as number[]),
          })),
          {
            label:  "Now",
            stroke: "#1d4ed8",
            width:  0,
            points: { show: true, size: 10, fill: "#1d4ed8", stroke: "#ffffff", width: 2 },
          },
        ],
        cursor: { show: true },
        legend: { show: false },
      },
      [x, ...dataSeries, nowSeries] as uPlot.AlignedData,
      container,
    );
  }, [selected, nowSlot]);

  useEffect(() => {
    buildChart();
    const ro = new ResizeObserver(() => {
      const w = containerRef.current?.clientWidth;
      if (w) plotRef.current?.setSize({ width: w, height: 210 });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [buildChart]);

  const fl = FLATNESS[selected];
  const overnightDrop = ((1 - fl.overnight_vs_daytime_ratio) * 100).toFixed(1);
  const peakVariation = ((fl.peak_to_trough_ratio - 1) * 100).toFixed(1);

  return (
    <figure className="mt-4">
      <div className="border border-gray-200 rounded bg-white px-4 pt-4 pb-3">

        {/* Title + explanation */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            How data-centre load varies through the day
          </p>
          <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
            Measured utilisation profiles from{" "}
            <strong className="text-gray-700">96 anonymised data-centre sites</strong>{" "}
            in the UK Power Networks (UKPN) licence area - the distribution network covering
            London, the South East, and the East of England. Profiles are derived from
            3.4 years of half-hourly readings (January 2023–April 2026). The y-axis shows
            relative load: 1.0 is each site&rsquo;s own average. Values above 1.0 mean
            busier-than-average; below 1.0 means quieter.
          </p>
        </div>

        {/* Day-type selector */}
        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Select day type to highlight">
          {ORDER.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setSelected(d)}
              aria-pressed={selected === d}
              className={[
                "text-xs px-3 py-1 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400",
                selected === d
                  ? "text-white border-transparent font-medium"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400",
              ].join(" ")}
              style={selected === d ? { backgroundColor: DAY_COLORS[d], borderColor: DAY_COLORS[d] } : {}}
            >
              {DAY_LABELS[d]}
              {d === today && <span className="ml-1 opacity-75">← today</span>}
            </button>
          ))}
        </div>

        {/* Key stat for selected day */}
        <p className="text-xs text-gray-500 mb-3">
          <strong className="text-gray-700">{DAY_LABELS[selected]}:</strong>{" "}
          load varies by at most{" "}
          <strong className="text-gray-700">{peakVariation}%</strong>{" "}
          across the day; overnight is{" "}
          <strong className="text-gray-700">{overnightDrop}%</strong>{" "}
          lower than the midday peak on average.
        </p>

        {/* Chart */}
        <div
          ref={containerRef}
          role="img"
          aria-label={`UKPN measured data-centre relative utilisation profile for ${DAY_LABELS[selected]}. Peak-to-trough variation ${peakVariation}%, overnight ${overnightDrop}% below daytime.`}
          className="w-full min-h-[210px]"
        />

        {/* Footnote */}
        <p className="text-xs text-gray-400 mt-2">
          Sites are anonymised; raw data is not exposed.
          UKPN licence areas are not national GB coverage - profiles may differ elsewhere.
          National scale from NESO 2025; this chart shows shape only.
        </p>
      </div>
    </figure>
  );
}
