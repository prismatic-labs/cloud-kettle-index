import { useState, useRef } from "react";

type Tab = "virginia" | "federal" | "dc";

const VIRGINIA_FULL = `Subject: FOIA Request: data-centre electricity demand, grid impacts, and planning documents - [County / locality name]

Dear [public body / FOIA officer],

This is a request under the Virginia Freedom of Information Act (Va. Code § 2.2-3700 et seq.) for access to public records.

Please provide public records you hold concerning data-centre electricity demand, grid capacity, planning decisions, or infrastructure assessments in relation to [locality / county / project name] for the period [date range, e.g. January 2020 to present].

[If relevant: this request includes information relating to [specific data-centre site or project, if known].]

With reasonable specificity, I am requesting records that may include:

1. Electricity demand
   - estimates or measurements of electricity demand from existing or proposed data centres
   - peak demand, annual demand, load factor, or capacity assumptions
   - demand forecasts that include data-centre growth
   - assumptions used to model future electricity demand from data centres

2. Grid and utility impacts
   - applications, offers, or agreements for grid connection, and any supporting capacity assessments
   - documents discussing local or regional transmission or distribution reinforcement required for data-centre load
   - assessments of substation or feeder capacity linked to data-centre demand
   - correspondence with Dominion Energy, NOVEC, other utilities, PJM Interconnection, FERC, the Virginia State Corporation Commission, county planning departments, or developers about data-centre electricity demand

3. Planning and land-use records
   - planning applications, special-use permits, by-right data-centre approvals, or site plans for data-centre facilities
   - staff reports, environmental review documents, transportation studies, or condition letters discussing energy use or grid impact
   - comprehensive plan elements, proffer statements, overlay provisions, or economic-development documents that address data-centre electricity demand or grid infrastructure

4. Environmental and carbon assumptions
   - estimates of greenhouse gas emissions associated with data-centre electricity use
   - assumptions about carbon intensity, renewable energy supply, backup generation, or power purchase agreements
   - any environmental impact assessments, air permit documents, or sustainability reports covering data-centre electricity demand

Please provide records electronically. Where records are in tables or spreadsheets, CSV or Excel format is preferred. For reports, correspondence, or other documents, PDF is acceptable.

If any part of this request is too broad or unclear, please advise how it can be narrowed. Specifically, please describe what categories of records you hold that are responsive and suggest revised wording that would allow you to process the request.

If you do not hold some records requested, please say so. If you believe another public body is more likely to hold them, please identify that body.

If you withhold any record under a VFOIA exemption, please cite the specific statutory exemption (Va. Code §), identify the withheld records in a log, and release any portions that can be disclosed.

Respectfully,

[Your name]
[Contact information - an address or email is required]`;

const FEDERAL_FULL = `Subject: FOIA Request: data-centre electricity demand and grid-capacity data - [Agency name]

Dear FOIA Officer,

This is a request under the Freedom of Information Act (5 U.S.C. § 552).

I request all non-exempt records concerning data-centre electricity demand, grid capacity, or energy infrastructure planning for [region / state, e.g. Northern Virginia / the PJM footprint] for the period [date range, e.g. 2018 to present].

Relevant categories of records may include:

1. Electricity demand and load data
   - surveys, estimates, reports, or analyses of data-centre electricity consumption at regional or national level
   - grid-impact assessments, interconnection studies, or transmission-planning documents that address data-centre load
   - agency correspondence, briefings, or memoranda discussing data-centre electricity demand

2. Energy planning and forecasting
   - assumptions used in energy forecasting that include data-centre growth
   - reports or analyses examining the relationship between AI infrastructure, cloud computing, and electricity demand
   - correspondence with electric utilities, ISOs/RTOs, or industry groups about data-centre grid impacts

Relevant agencies and offices may include:
   - U.S. Department of Energy (DOE) / Energy Information Administration (EIA)
   - Federal Energy Regulatory Commission (FERC)
   - U.S. Environmental Protection Agency (EPA)
   - Office of Science and Technology Policy (OSTP)

Please provide records electronically. If any records are withheld, please cite the exemption claimed and provide a Vaughn index.

If this request can be processed more efficiently as separate requests to individual offices, please advise.

Yours faithfully,

[Your name]
[Contact information]`;

const DC_FULL = `Subject: FOIA Request: data-centre electricity demand and grid-capacity records - DC

Dear FOIA Officer,

This is a request under the DC Freedom of Information Act (D.C. Code § 2-531 et seq.) for public records.

I request all public records held by [agency / office name] concerning data-centre electricity demand, grid capacity, planning decisions, or energy infrastructure affecting the District of Columbia.

Records requested may include:
   - documents discussing the electricity demand or grid impact of existing or proposed data centres
   - correspondence with Pepco (Potomac Electric), PJM Interconnection, or FERC about DC-area grid capacity or data-centre load
   - planning documents, permits, or environmental reviews that reference data-centre energy use
   - any studies, reports, or analyses of data-centre electricity demand or growth in the DC area

Note: under DC FOIA, agencies are not required to create records or provide analysis that does not already exist. I am requesting records that are already held.

Please provide records electronically. If any record is withheld, please cite the specific FOIA exemption relied upon.

If you do not hold relevant records but believe another DC agency or federal agency may, please advise.

Yours faithfully,

[Your name]
[Contact information]`;

const TEMPLATES: Record<Tab, { full: string; label: string }> = {
  virginia: { full: VIRGINIA_FULL, label: "Virginia FOIA" },
  federal:  { full: FEDERAL_FULL,  label: "Federal FOIA" },
  dc:       { full: DC_FULL,       label: "DC FOIA" },
};

export default function UsPublicRecordsTemplate() {
  const [tab, setTab]       = useState<Tab>("virginia");
  const [status, setStatus] = useState<"idle" | "copied">("idle");
  const textareaRef         = useRef<HTMLTextAreaElement>(null);

  const template = TEMPLATES[tab];
  const text = template.full;

  async function handleCopy() {
    const val = textareaRef.current?.value ?? text;
    try {
      await navigator.clipboard.writeText(val);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      textareaRef.current?.select();
    }
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2 mb-3" role="tablist" aria-label="Choose request type">
        {(["virginia", "federal", "dc"] as Tab[]).map(t => (
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
            {TEMPLATES[t].label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-2">
        Fill in the square brackets, then copy and send.
      </p>
      <textarea
        ref={textareaRef}
        defaultValue={text}
        key={tab}
        rows={tab === "virginia" ? 70 : 35}
        spellCheck={false}
        aria-label={`${template.label} template`}
        className="w-full font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded p-4 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400 leading-relaxed"
      />

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
          Then paste into an email to the relevant agency.
        </span>
      </div>
    </div>
  );
}
