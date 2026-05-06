import { useMemo, useState } from "react";
import profilesData from "../data/dominion-large-customer-profiles.json";

type DayType = "weekday" | "saturday" | "sunday";
type ProfileChoice = {
  id: string;
  label: string;
  description: string;
  url?: string;
  profiles: Record<DayType, number[]>;
};

const DAY_LABELS: Record<DayType, string> = {
  weekday: "Weekday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DAY_TYPES: DayType[] = ["weekday", "saturday", "sunday"];
const WIDTH = 760;
const HEIGHT = 250;
const MARGIN = { top: 20, right: 26, bottom: 40, left: 78 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const Y_TICKS = [0.8, 0.9, 1.0, 1.1, 1.2];
const Y_MIN = 0.75;
const Y_MAX = 1.28;

const PROFILE_EXPLANATIONS = [
  ["GS3", "Large general-service customers connected at secondary voltage; a useful commercial/industrial comparator, but not data centres."],
  ["GS4", "Large general-service customers connected at primary voltage; flatter than GS3 in this dataset and closer to very large continuous loads."],
  ["LGEMLP", "Large miscellaneous light-and-power customers; included because it is a large-load class, though it is broad and not data-centre-specific."],
  ["MS", "Military service profile; included as another large institutional load shape in Dominion's published profiles."],
];

function xFor(hour: number) {
  return MARGIN.left + (hour / 23) * INNER_W;
}

function yFor(value: number) {
  return MARGIN.top + ((Y_MAX - value) / (Y_MAX - Y_MIN)) * INNER_H;
}

function pathFor(values: number[]) {
  return values.map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`).join(" ");
}

function variation(values: number[]) {
  const peak = Math.max(...values);
  const trough = Math.min(...values);
  return ((peak / trough - 1) * 100).toFixed(1);
}

export default function UsLoadShapeChart() {
  const choices = useMemo<ProfileChoice[]>(
    () => [profilesData.median as ProfileChoice, ...(profilesData.classes as ProfileChoice[])],
    [],
  );
  const [selectedId, setSelectedId] = useState(choices[0].id);
  const [dayType, setDayType] = useState<DayType>("weekday");
  const selected = choices.find(c => c.id === selectedId) ?? choices[0];
  const classValues = selected.profiles[dayType];

  return (
    <figure className="mt-4">
      <div className="border border-gray-200 rounded bg-white px-4 pt-4 pb-3">
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Generic Dominion large-customer load shapes
          </p>
          <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
            Dominion publishes generic customer-class hourly profiles for supplier settlement.
            They are not data-centre-specific, but they are the closest published Dominion-territory
            load shapes available. Each profile is normalised to its own average; the 1.0 line is
            the average baseline. Data centres are often assumed to be high-load-factor loads,
            but Dominion does not publish measured data-centre hourly profiles.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Select Dominion customer class">
          {choices.map(choice => (
            <button
              key={choice.id}
              type="button"
              onClick={() => setSelectedId(choice.id)}
              aria-pressed={selected.id === choice.id}
              title={choice.description}
              className={[
                "text-xs px-3 py-1 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400",
                selected.id === choice.id
                  ? "text-white border-transparent font-medium bg-slate-700"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400",
              ].join(" ")}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Select day type">
          {DAY_TYPES.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => setDayType(day)}
              aria-pressed={dayType === day}
              className={[
                "text-xs px-3 py-1 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400",
                dayType === day
                  ? "text-white border-transparent font-medium bg-amber-700"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400",
              ].join(" ")}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 mb-3">
          <strong className="text-gray-700">{selected.label}:</strong>{" "}
          {selected.description}. The selected profile varies by{" "}
          <strong className="text-gray-700">{variation(classValues)}%</strong> peak-to-trough on a{" "}
          {DAY_LABELS[dayType].toLowerCase()}.
        </p>

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Dominion generic ${selected.label} ${DAY_LABELS[dayType]} load profile, normalised to average`}
          className="w-full h-auto min-h-[210px]"
        >
          <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="white" />
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={xFor(6) - MARGIN.left}
            height={INNER_H}
            fill="#f3f4f6"
            opacity="0.8"
          />

          {Y_TICKS.map(tick => (
            <g key={tick}>
              <line x1={MARGIN.left} y1={yFor(tick)} x2={WIDTH - MARGIN.right} y2={yFor(tick)} stroke={tick === 1.0 ? "#94a3b8" : "#e5e7eb"} strokeWidth={tick === 1.0 ? 1.5 : 1} />
              <text x={MARGIN.left - 10} y={yFor(tick) + 5} textAnchor="end" className={tick === 1.0 ? "fill-slate-500 text-[12px] tabular-nums font-semibold" : "fill-gray-500 text-[12px] tabular-nums"}>
                {tick.toFixed(1)}
              </text>
            </g>
          ))}

          {[0, 3, 6, 9, 12, 15, 18, 21].map(hour => (
            <g key={hour}>
              <line x1={xFor(hour)} y1={MARGIN.top} x2={xFor(hour)} y2={HEIGHT - MARGIN.bottom} stroke="#f3f4f6" />
              <text x={xFor(hour)} y={HEIGHT - MARGIN.bottom + 24} textAnchor="middle" className="fill-gray-500 text-[12px] tabular-nums">
                {String(hour).padStart(2, "0")}:00
              </text>
            </g>
          ))}

          <text
            x="18"
            y={MARGIN.top + INNER_H / 2}
            transform={`rotate(-90 18 ${MARGIN.top + INNER_H / 2})`}
            textAnchor="middle"
            className="fill-gray-700 text-[13px] font-semibold"
          >
            Relative load (mean = 1.0)
          </text>

          <path d={pathFor(classValues)} fill="none" stroke="#d97706" strokeWidth="2.2" strokeDasharray="6 4" />
        </svg>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          <span><span className="inline-block w-5 h-0.5 border-t-2 border-dashed border-amber-600 mr-1 align-middle" />Selected Dominion class</span>
          <span><span className="inline-block w-5 h-0.5 border-t border-slate-400 mr-1 align-middle" />Average baseline (1.0)</span>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Dominion class profiles are generic settlement profiles, not measured data-centre profiles.
          Weather-sensitive formula profiles such as COMM6VA are omitted here because they are not
          simple hourly class shapes.{" "}
          <a href={profilesData.source.url} className="underline hover:text-gray-600" target="_blank" rel="noopener">
            Source
          </a>.
        </p>

        <details className="mt-3 text-xs text-gray-500">
          <summary className="cursor-pointer font-semibold text-gray-600">
            What do these Dominion profile classes mean?
          </summary>
          <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {PROFILE_EXPLANATIONS.map(([label, description]) => (
              <div key={label}>
                <dt className="font-semibold text-gray-700">{label}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-gray-400">
            The median option is the hour-by-hour median of GS3, GS4, LGEMLP, and MS after
            normalising each class to its own annual mean.
          </p>
        </details>
      </div>
    </figure>
  );
}
