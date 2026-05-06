import { useMemo, useState } from "react";
import type { UsDemandScenario, UsSource } from "../lib/usModel";

interface Props {
  scenarios: UsDemandScenario[];
  primary: UsDemandScenario;
  sources: UsSource[];
}

const WIDTH = 760;
const HEIGHT = 300;
const MARGIN = { top: 36, right: 28, bottom: 42, left: 78 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const Y_TICKS = [8000, 12000, 16000, 20000];
const Y_MIN = 8000;
const Y_MAX = 20000;

function formatKbs(kbs: number) {
  return `~${(Math.round(kbs / 100) * 100).toLocaleString("en-US")}`;
}

function formatMw(mw: number) {
  return `${mw.toLocaleString("en-US")} MW`;
}

export default function UsDemandTrajectory({ scenarios, primary, sources }: Props) {
  const [selectedKey, setSelectedKey] = useState(primary.key);
  const selected = scenarios.find(s => s.key === selectedKey) ?? primary;

  const xFor = (index: number) =>
    MARGIN.left + (scenarios.length === 1 ? INNER_W / 2 : (index / (scenarios.length - 1)) * INNER_W);
  const yFor = (kbs: number) =>
    MARGIN.top + ((Y_MAX - kbs) / (Y_MAX - Y_MIN)) * INNER_H;

  const points = useMemo(
    () => scenarios.map((s, i) => ({
      ...s,
      x: xFor(i),
      y: yFor(s.kbs),
      avgY: yFor(s.averageContinuousKbs),
    })),
    [scenarios],
  );

  const billingPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const averagePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.avgY.toFixed(1)}`)
    .join(" ");
  const bandPath = [
    ...points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    ...points.slice().reverse().map(p => `L ${p.x.toFixed(1)} ${p.avgY.toFixed(1)}`),
    "Z",
  ].join(" ");
  const selectedPoint = points.find(p => p.key === selected.key);

  return (
    <figure className="my-6">
      <div className="border border-gray-200 rounded bg-white px-4 pt-4 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Published Dominion data-centre billing demand - 2024-2030
            </p>
            <p className="text-xs text-amber-700 font-medium tabular-nums mt-0.5">
              {selected.label}: {formatKbs(selected.kbs)} kettle-boils/sec
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <span>
              <span className="inline-block w-5 h-0.5 border-t-2 border-dashed border-amber-600 mr-1 align-middle" />
              Billing-demand equivalent
            </span>
            <span>
              <span className="inline-block w-5 h-3 bg-amber-400/15 border border-amber-500/25 mr-1 align-middle" />
              90% load-factor context
            </span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Published Dominion data-centre billing-demand equivalent kettle-boils per second from 2024 to 2030"
          className="w-full h-auto min-h-[260px]"
          onMouseLeave={() => setSelectedKey(primary.key)}
        >
          <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="white" />

          {Y_TICKS.map(tick => (
            <g key={tick}>
              <line x1={MARGIN.left} y1={yFor(tick)} x2={WIDTH - MARGIN.right} y2={yFor(tick)} stroke="#e5e7eb" />
              <text x={MARGIN.left - 10} y={yFor(tick) + 5} textAnchor="end" className="fill-gray-500 text-[12px] tabular-nums">
                {(tick / 1000).toFixed(0)}k
              </text>
            </g>
          ))}

          {points.map(p => (
            <line key={`grid-${p.key}`} x1={p.x} y1={MARGIN.top} x2={p.x} y2={HEIGHT - MARGIN.bottom} stroke="#f3f4f6" />
          ))}

          <text
            x="18"
            y={MARGIN.top + INNER_H / 2}
            transform={`rotate(-90 18 ${MARGIN.top + INNER_H / 2})`}
            textAnchor="middle"
            className="fill-gray-700 text-[13px] font-semibold"
          >
            kettle-boils/sec
          </text>

          <path d={bandPath} fill="rgba(245,158,11,0.15)" stroke="rgba(217,119,6,0.28)" strokeWidth="1" />
          <path d={averagePath} fill="none" stroke="rgba(245,158,11,0.28)" strokeWidth="1.5" />
          <path d={billingPath} fill="none" stroke="#d97706" strokeWidth="2.5" strokeDasharray="7 5" />

          {points.map(p => (
            <g
              key={p.key}
              onMouseEnter={() => setSelectedKey(p.key)}
              onClick={() => setSelectedKey(p.key)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={p.x} cy={p.y} r={20} fill="transparent" />
              <circle
                cx={p.x}
                cy={p.y}
                r={p.key === selected.key ? 7 : p.key === primary.key ? 5 : 4}
                fill="white"
                stroke={p.key === selected.key ? "#92400e" : p.key === primary.key ? "#d97706" : "#fbbf24"}
                strokeWidth={p.key === selected.key ? 3 : p.key === primary.key ? 3 : 2}
              />
              <text x={p.x} y={HEIGHT - MARGIN.bottom + 24} textAnchor="middle" className="fill-gray-500 text-[12px] tabular-nums">
                {p.year}
              </text>
            </g>
          ))}

          {selectedPoint && (
            <>
              <line
                x1={selectedPoint.x}
                y1={selectedPoint.y + 9}
                x2={selectedPoint.x}
                y2={HEIGHT - MARGIN.bottom}
                stroke="#d97706"
                strokeWidth="1"
                strokeDasharray="3 4"
                opacity="0.65"
              />
              <text
                x={Math.min(selectedPoint.x + 12, WIDTH - MARGIN.right - 80)}
                y={Math.max(MARGIN.top + 14, selectedPoint.y - 28)}
                className="fill-amber-700 text-[12px] font-semibold tabular-nums"
              >
                {formatKbs(selected.kbs)}
              </text>
            </>
          )}
        </svg>

        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-gray-400">Selected year</p>
            <p className="font-semibold text-gray-700">{selected.year} {selected.kind}</p>
          </div>
          <div>
            <p className="text-gray-400">Billing demand</p>
            <p className="font-semibold text-gray-700 tabular-nums">{formatMw(selected.demandMw)}</p>
          </div>
          <div>
            <p className="text-gray-400">Average-load context</p>
            <p className="font-semibold text-gray-700 tabular-nums">{formatMw(Math.round(selected.averageContinuousMw))}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Select published Dominion demand year">
          {scenarios.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSelectedKey(s.key)}
              aria-pressed={selected.key === s.key}
              className={[
                "text-xs px-3 py-1 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400",
                selected.key === s.key
                  ? "text-white border-transparent font-medium bg-amber-700"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400",
              ].join(" ")}
            >
              {s.year}
              {s.key === primary.key && <span className="ml-1 opacity-80">used above</span>}
            </button>
          ))}
        </div>

        <details className="mt-4 border-t border-gray-100 pt-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-700">
            View source table
          </summary>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-6 font-semibold text-gray-700 whitespace-nowrap">Year</th>
                  <th className="text-left py-2 pr-6 font-semibold text-gray-700 whitespace-nowrap">Kind</th>
                  <th className="text-right py-2 pr-6 font-semibold text-gray-700 whitespace-nowrap">Billing demand (MW)</th>
                  <th className="text-right py-2 font-semibold text-gray-700 whitespace-nowrap">Kettle-boils/sec</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map(s => (
                  <tr key={s.key} className={[
                    "border-b",
                    s.key === primary.key ? "border-gray-300 bg-gray-50" : "border-gray-100",
                  ].join(" ")}>
                    <td className={[
                      "py-2 pr-6 tabular-nums font-medium whitespace-nowrap",
                      s.key === primary.key ? "text-gray-900" : "text-gray-500",
                    ].join(" ")}>
                      {s.year}
                      {s.key === primary.key && <span className="ml-2 text-xs font-normal text-gray-400">used above</span>}
                    </td>
                    <td className={[
                      "py-2 pr-6 capitalize whitespace-nowrap",
                      s.key === primary.key ? "text-gray-600" : "text-gray-400",
                    ].join(" ")}>
                      {s.kind}
                    </td>
                    <td className={[
                      "py-2 pr-6 text-right tabular-nums whitespace-nowrap",
                      s.key === primary.key ? "text-gray-900 font-medium" : "text-gray-500",
                    ].join(" ")}>
                      {s.demandMw.toLocaleString("en-US")}
                    </td>
                    <td className={[
                      "py-2 text-right tabular-nums whitespace-nowrap",
                      s.key === primary.key ? "text-gray-900 font-medium" : "text-gray-500",
                    ].join(" ")}>
                      {formatKbs(s.kbs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <p className="text-xs text-gray-400 mt-3 pb-2">
          Select a year to inspect the conversion. The GB page can show a live 24-hour share
          because GB grid demand is public through Elexon. Here, the public Dominion series is a
          forecast trajectory, not a live data-centre meter.
        </p>
      </div>

      <figcaption className="text-xs text-gray-400 pt-2">
        Sources: {sources.map((src, i) => (
          <span key={src.url}>
            {i > 0 && " and "}
            <a href={src.url} target="_blank" rel="noopener" className="underline hover:text-gray-600">
              {src.publisher}
            </a>
          </span>
        ))}. Billing-demand figures converted using 0.36 MW/kbs; load-factor context uses Dominion&apos;s
        approximately 90% industry load factor.
      </figcaption>
    </figure>
  );
}
