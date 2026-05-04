import { useState, useRef } from "react";

type Tab = "full" | "short";

const FULL = `Subject: Environmental Information Request: data-centre electricity demand and grid impacts in [area]

Dear [public body],

I am making this request under the Environmental Information Regulations 2004.

Please provide recorded information you hold about data-centre electricity demand, grid impacts, planning assumptions, or connection capacity in relation to [area / postcode / local authority area] for the period [date range].

If relevant, this request includes information relating to [data-centre site or project, if known].

Please include any recorded information you hold on:

1. Electricity demand
- estimated or measured electricity demand from existing or proposed data centres
- peak demand, annual demand, load factor, or capacity assumptions
- demand forecasts that include data-centre growth
- assumptions used to model future electricity demand from data centres

2. Grid impacts and connection capacity
- grid connection applications, offers, agreements, or capacity assessments, where held
- documents discussing whether local or regional grid reinforcement is needed
- assessments of substation, transmission, or distribution capacity linked to data-centre demand
- correspondence with network operators, regulators, government departments, developers, or consultants about data-centre electricity demand

3. Planning and infrastructure evidence
- planning documents, officer reports, environmental statements, energy statements, or sustainability statements that refer to data-centre energy use
- internal briefings, reports, meeting notes, or presentations discussing the electricity demand or grid impact of data centres
- policy documents, local plans, infrastructure delivery plans, or economic-development documents that consider data-centre energy demand

4. Environmental and carbon assumptions
- estimates of emissions associated with data-centre electricity use
- assumptions about carbon intensity, renewable supply, backup generation, or power purchase agreements
- assessments of how data-centre demand affects local, regional, or national energy planning

Please provide the information electronically. Where the information is held in tables or spreadsheets, I would prefer CSV or Excel format. For reports, correspondence, or briefings, PDF format is fine.

If any part of this request is too broad, please provide advice and assistance on how it can be refined. In particular, please tell me what categories of information you hold and suggest a narrower wording that would allow you to process the request.

If you do not hold some of the information requested, please say so. If you believe another public authority or public body is more likely to hold it, please identify that body if you can.

If you withhold any information, please identify which exception you are relying on and explain how the public interest test has been applied, where relevant. Please also disclose any parts of the requested material that can be released.

If any part of this request falls outside the Environmental Information Regulations but may be handled under the Freedom of Information Act, please treat that part as a Freedom of Information request.

Yours faithfully,

[Your name]`;

const SHORT = `Subject: Environmental Information Request: data-centre electricity demand in [area]

Dear [public body],

I am making this request under the Environmental Information Regulations 2004.

Please provide recorded information you hold about data-centre electricity demand, grid impacts, planning assumptions, or connection capacity in [area] from [date range].

This may include forecasts, estimates, grid-capacity assessments, planning documents, correspondence, reports, briefings, or modelling assumptions relating to existing or proposed data centres.

If this request is too broad, please provide advice and assistance on how it can be refined.

I would prefer to receive the information electronically.

Yours faithfully,

[Your name]`;

export default function EirTemplate() {
  const [tab, setTab]       = useState<Tab>("full");
  const [status, setStatus] = useState<"idle" | "copied">("idle");
  const textareaRef         = useRef<HTMLTextAreaElement>(null);

  const text = tab === "full" ? FULL : SHORT;

  async function handleCopy() {
    const val = textareaRef.current?.value ?? text;
    try {
      await navigator.clipboard.writeText(val);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      // Fallback: select all so user can Ctrl+C
      textareaRef.current?.select();
    }
  }

  return (
    <div className="mt-2">
      {/* Tab selector */}
      <div className="flex gap-2 mb-3" role="tablist" aria-label="Choose request length">
        {(["full", "short"] as Tab[]).map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            type="button"
            onClick={() => { setTab(t); setStatus("idle"); }}
            className={[
              "text-xs px-3 py-1 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400",
              tab === t
                ? "bg-gray-800 text-white border-gray-800 font-medium"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400",
            ].join(" ")}
          >
            {t === "full" ? "Full request" : "Short request"}
          </button>
        ))}
      </div>

      {/* Editable template */}
      <p className="text-xs text-gray-400 mb-2">
        Fill in the square brackets, then copy and send.
      </p>
      <textarea
        ref={textareaRef}
        defaultValue={text}
        key={tab}
        rows={tab === "full" ? 60 : 20}
        spellCheck={false}
        aria-label={tab === "full" ? "Full EIR template" : "Short EIR template"}
        className="w-full font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded p-4 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400 leading-relaxed"
      />

      {/* Copy button */}
      <div className="mt-2">
        <button
          type="button"
          onClick={handleCopy}
          className={[
            "text-sm px-4 py-2 rounded border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400",
            status === "copied"
              ? "bg-green-600 text-white border-green-600"
              : "bg-gray-800 text-white border-gray-800 hover:bg-gray-700",
          ].join(" ")}
        >
          {status === "copied" ? "Copied ✓" : "Copy to clipboard"}
        </button>
        <span className="ml-3 text-xs text-gray-400">
          Then paste into an email to the relevant public body.
        </span>
      </div>
    </div>
  );
}
