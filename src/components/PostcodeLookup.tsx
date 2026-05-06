import { useState, useRef, useCallback, type FormEvent } from "react";
import { lookupPostcode, postcodeErrorMessage } from "../lib/postcodes";
import { regionalModel, demandShareBand, type RegionalResult } from "../lib/dcModel";
import { fetchRegionalIntensityByPostcode, type RegionalIntensity } from "../lib/carbonIntensity";
import { getDemand } from "../lib/elexon";
import { buildRegionalShareText } from "../lib/shareText";
import ShareButton from "./ShareButton";

const SITE_URL = (import.meta.env.SITE ?? "https://prismatic-labs.github.io")
               + (import.meta.env.BASE_URL ?? "/cloud-kettle-index").replace(/\/$/, "");

interface LookupState {
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  regional?: RegionalResult;
  intensity?: RegionalIntensity | null;
  demandShareLow?: number;
  demandShareHigh?: number;
  demandMw?: number;
}

export default function PostcodeLookup() {
  const [value, setValue] = useState("");
  const [state, setState] = useState<LookupState>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  const generateRegionalSharePayload = useCallback(() => {
    if (state.status !== "success" || !state.regional) return null;
    const text = buildRegionalShareText({
      regionName: state.regional.regionName,
      lowKettles: state.regional.kettleBoilsPerSec.low,
      highKettles: state.regional.kettleBoilsPerSec.high,
      lowMw: state.regional.facilityLoadMw.low,
      highMw: state.regional.facilityLoadMw.high,
      carbonIntensity: state.intensity?.forecast ?? null,
      carbonRegion: state.intensity?.shortname ?? null,
      url: SITE_URL,
    });
    return { title: `The Cloud Kettle Index - ${state.regional.regionName}`, text, url: SITE_URL };
  }, [state]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const postcode = value.trim();
    if (!postcode) return;

    setState({ status: "loading" });

    const [lookupRes, demandRes, intensityPrep] = await Promise.all([
      lookupPostcode(postcode),
      getDemand(),
      Promise.resolve(null), // intensity fetched after we have outward code
    ]);
    void intensityPrep;

    if ("error" in lookupRes) {
      setState({ status: "error", error: postcodeErrorMessage(lookupRes.error) });
      return;
    }

    const { result: loc } = lookupRes;
    const regional = regionalModel(loc.itl1Code);

    if (!regional) {
      setState({
        status: "error",
        error: `No regional capacity data found for this area (ITL1: ${loc.itl1Code}). This is unexpected - please report it.`,
      });
      return;
    }

    const [intensityResult] = await Promise.all([
      fetchRegionalIntensityByPostcode(loc.outwardCode),
    ]);

    const gbDemandMw = demandRes.cached?.demandMw ?? 0;
    const shareCalc = gbDemandMw > 0
      ? demandShareBand(regional.facilityLoadMw, gbDemandMw)
      : null;

    setState({
      status: "success",
      regional,
      intensity: intensityResult,
      demandShareLow:  shareCalc?.low,
      demandShareHigh: shareCalc?.high,
      demandMw: gbDemandMw,
    });
  };

  return (
    <section aria-labelledby="postcode-heading" className="border border-gray-200 rounded-lg p-6 bg-white">
      <h2 id="postcode-heading" className="text-lg font-semibold mb-1">
        Your area
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Enter a Great Britain postcode to see the modelled data-centre capacity in your ITL1 region.
      </p>

      <form onSubmit={handleSubmit} role="search" aria-label="Postcode lookup">
        <div className="flex gap-2">
          <label htmlFor="postcode-input" className="sr-only">Postcode</label>
          <input
            id="postcode-input"
            ref={inputRef}
            type="text"
            name="postcode"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. EC1A 1BB"
            autoComplete="postal-code"
            aria-label="Enter a UK postcode"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            spellCheck={false}
            disabled={state.status === "loading"}
          />
          <button
            type="submit"
            disabled={state.status === "loading" || !value.trim()}
            className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={state.status === "loading"}
          >
            {state.status === "loading" ? "Looking up…" : "Look up"}
          </button>
        </div>
      </form>

      {state.status === "error" && state.error && (
        <div role="alert" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {state.error}
        </div>
      )}

      {state.status === "success" && state.regional && (
        <div role="region" aria-label="Regional results" className="mt-5 space-y-4">
          <div>
            <h3 className="font-semibold text-base">{state.regional.regionName}</h3>
            <p className="text-sm text-gray-500">
              DSIT IT capacity: {state.regional.itCapacityMw.toLocaleString("en-GB")} MW
              (colocation data centres, autumn 2024)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Modelled facility load
              </p>
              <p className="text-xl font-tabular font-semibold text-gray-900">
                {Math.round(state.regional.facilityLoadMw.low).toLocaleString("en-GB")}
                &ndash;
                {Math.round(state.regional.facilityLoadMw.high).toLocaleString("en-GB")} MW
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {Math.round(state.regional.kettleBoilsPerSec.low).toLocaleString("en-GB")}
                &ndash;
                {Math.round(state.regional.kettleBoilsPerSec.high).toLocaleString("en-GB")} kettle-boils/sec
              </p>
            </div>

            {state.intensity && (
              <div className="bg-gray-50 rounded p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Carbon intensity (your electricity region)
                </p>
                <p className="text-xl font-tabular font-semibold text-gray-900">
                  {state.intensity.forecast} gCO₂/kWh
                </p>
                <p className="text-sm text-gray-500 mt-1 capitalize">
                  {state.intensity.index} &middot; {state.intensity.shortname}
                </p>
              </div>
            )}
          </div>

          {state.demandShareLow != null && state.demandShareHigh != null && state.demandMw > 0 && (
            <p className="text-sm text-gray-600">
              This region&rsquo;s modelled data-centre load is equivalent to{" "}
              <strong>
                {state.demandShareLow.toFixed(2)}–{state.demandShareHigh.toFixed(2)}%
              </strong>{" "}
              of current GB electricity demand.
            </p>
          )}

          <div className="border-t border-gray-100 pt-3 flex flex-col sm:flex-row sm:items-start gap-4">
            <p className="text-xs text-gray-400 flex-1">
              Capacity from DSIT ITL1 regional data. Carbon intensity from Carbon Intensity API DNO
              regions. These geographies do not perfectly align.{" "}
              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/methodology`}
                className="underline"
              >
                Full methodology
              </a>
            </p>
            <ShareButton
              label="Share my region"
              generatePayload={generateRegionalSharePayload}
            />
          </div>
        </div>
      )}
    </section>
  );
}
