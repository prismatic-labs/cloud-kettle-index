import gridData from "../data/us-grid-demand-pjm.json";
import type { UsDemandScenario } from "../lib/usModel";

interface Props {
  primary: UsDemandScenario;
}

const WIDTH = 760;
const HEIGHT = 260;
const MARGIN = { top: 30, right: 28, bottom: 50, left: 72 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;

function formatAxisPeriod(period: string) {
  const match = period.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})/);
  if (!match) return [period.slice(5).replace("T", " "), "ET"];

  const [, year, month, day, hour] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
  const hourNumber = Number(hour);
  const hourLabel =
    hourNumber === 0
      ? "midnight"
      : hourNumber === 12
        ? "noon"
        : `${hourNumber % 12}${hourNumber < 12 ? "am" : "pm"}`;

  return [dateLabel, `${hourLabel} ET`];
}

function formatGeneratedAt(value: string | null) {
  if (!value) return "not yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(value));
}

function pct(value: number) {
  return `${value.toFixed(1)}%`;
}

export default function UsGridShareChart({ primary }: Props) {
  const records = gridData.records ?? [];
  const billingMw = primary.demandMw;
  const averageMw = primary.averageContinuousMw;

  if (records.length === 0) {
    return (
      <figure className="my-6">
        <div className="border border-gray-200 rounded bg-white px-4 pt-4 pb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Modelled Dominion data-centre load as share of PJM demand
          </p>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            This chart is wired for EIA hourly PJM demand, but the static cache has not been
            populated yet. Once the <code className="text-gray-600">EIA_API_KEY</code> secret is
            available to the build, the scheduled refresh will render the latest-reported PJM context.
          </p>
        </div>
      </figure>
    );
  }

  const series = records.map((r, i) => ({
    ...r,
    x: MARGIN.left + (records.length === 1 ? INNER_W / 2 : (i / (records.length - 1)) * INNER_W),
    billingShare: (billingMw / r.demandMw) * 100,
    averageShare: (averageMw / r.demandMw) * 100,
  }));
  const values = series.flatMap(d => [d.billingShare, d.averageShare]);
  const yMin = Math.max(0, Math.floor(Math.min(...values) * 2) / 2 - 0.5);
  const yMax = Math.ceil(Math.max(...values) * 2) / 2 + 0.5;
  const yTicks = Array.from({ length: Math.max(2, Math.round((yMax - yMin) / 0.5) + 1) }, (_, i) => yMin + i * 0.5);
  const yFor = (value: number) => MARGIN.top + ((yMax - value) / (yMax - yMin)) * INNER_H;
  const pathFor = (key: "billingShare" | "averageShare") =>
    series.map((d, i) => `${i === 0 ? "M" : "L"} ${d.x.toFixed(1)} ${yFor(d[key]).toFixed(1)}`).join(" ");
  const latest = series[series.length - 1];

  return (
    <figure className="my-5">
      <div className="border border-gray-200 rounded bg-white px-4 pt-4 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Grid context: Dominion proxy as share of PJM demand
            </p>
            <p className="text-xs text-amber-700 font-medium tabular-nums mt-0.5">
              {pct(latest.billingShare)} of PJM hourly demand ({primary.demandMw.toLocaleString("en-US")} MW ÷ ~{Math.round(primary.demandMw / (latest.billingShare / 100) / 1000) * 1000} MW PJM)
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Numerator: Dominion {primary.label} data-centre billing demand (fixed). Denominator: EIA hourly PJM total (13 states + DC, varies).
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <span><span className="inline-block w-5 h-0.5 border-t-2 border-dashed border-amber-600 mr-1 align-middle" />Billing demand</span>
            <span><span className="inline-block w-5 h-0.5 border-t-2 border-slate-500 mr-1 align-middle" />90% average context</span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Modelled Dominion data-centre load as a share of latest-reported PJM hourly demand"
          className="w-full h-auto"
        >
          <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="white" />
          {yTicks.map(tick => (
            <g key={tick}>
              <line x1={MARGIN.left} y1={yFor(tick)} x2={WIDTH - MARGIN.right} y2={yFor(tick)} stroke="#e5e7eb" />
              <text x={MARGIN.left - 10} y={yFor(tick) + 5} textAnchor="end" className="fill-gray-500 text-[12px] tabular-nums">
                {pct(tick)}
              </text>
            </g>
          ))}
          {[0, Math.floor((series.length - 1) / 2), series.length - 1].map(i => {
            const [dateLabel, timeLabel] = formatAxisPeriod(series[i].period);
            return (
              <g key={i}>
                <line x1={series[i].x} y1={MARGIN.top} x2={series[i].x} y2={HEIGHT - MARGIN.bottom} stroke="#f3f4f6" />
                <text x={series[i].x} y={HEIGHT - MARGIN.bottom + 22} textAnchor="middle" className="fill-gray-500 text-[11px] tabular-nums">
                  <tspan x={series[i].x}>{dateLabel}</tspan>
                  <tspan x={series[i].x} dy="15">{timeLabel}</tspan>
                </text>
              </g>
            );
          })}
          <text
            x="18"
            y={MARGIN.top + INNER_H / 2}
            transform={`rotate(-90 18 ${MARGIN.top + INNER_H / 2})`}
            textAnchor="middle"
            className="fill-gray-700 text-[13px] font-semibold"
          >
            % of PJM demand
          </text>
          <path d={pathFor("averageShare")} fill="none" stroke="#64748b" strokeWidth="2" />
          <path d={pathFor("billingShare")} fill="none" stroke="#d97706" strokeWidth="2.5" strokeDasharray="7 5" />
          <circle cx={latest.x} cy={yFor(latest.billingShare)} r="5" fill="white" stroke="#d97706" strokeWidth="2.5" />
        </svg>

        <p className="text-xs text-gray-400 mt-2 pb-2">
          The line varies because PJM total demand changes through the day and week — higher on weekday afternoons,
          lower overnight and on weekends. The Dominion data-centre numerator is a fixed projection, not a live meter.
          Cache generated {formatGeneratedAt(gridData.generatedAt)}.
        </p>
      </div>
      <figcaption className="text-xs text-gray-400 pt-2">
        Source: <a href={gridData.source.url} target="_blank" rel="noopener" className="underline hover:text-gray-600">{gridData.source.title}</a>.
        EIA API values are latest reported and can lag; this is not a Dominion-zone or county-level meter.
      </figcaption>
    </figure>
  );
}
