import { describe, it, expect } from "vitest";
import { buildNationalShareText, buildRegionalShareText } from "./shareText";

const BASE_URL = "https://prismatic-labs.github.io/cloud-kettle-index";

describe("buildNationalShareText", () => {
  const baseState = {
    nesoKbs:    2410,
    nesoShare:  3.6,
    lowShare:   3.2,
    highShare:  7.4,
    lowKettles: 2133.33,
    highKettles: 4977.78,
    time: "09:30",
    date: "4 May 2026",
    url: BASE_URL,
  };

  it("contains NESO central kbs", () => {
    const t = buildNationalShareText(baseState);
    expect(t).toContain("2,410");
  });

  it("contains NESO share percentage", () => {
    const t = buildNationalShareText(baseState);
    expect(t).toContain("3.6%");
  });

  it("contains scenario range percentages", () => {
    const t = buildNationalShareText(baseState);
    expect(t).toContain("3.2–7.4%");
  });

  it("contains kettle range with thousands separators (rounded to nearest 10)", () => {
    const t = buildNationalShareText(baseState);
    expect(t).toContain("2,130");
    expect(t).toContain("4,980");
  });

  it("always includes the modelled caveat", () => {
    const t = buildNationalShareText(baseState);
    expect(t).toContain("Modelled estimate, not a live meter");
  });

  it("includes 'Data as of' when fresh", () => {
    const t = buildNationalShareText(baseState);
    expect(t).toContain("Data as of 09:30, 4 May 2026");
  });

  it("includes 'data delayed' and 'Latest available' when stale", () => {
    const t = buildNationalShareText({ ...baseState, isStale: true });
    expect(t).toContain("data delayed");
    expect(t).toContain("Latest available data");
  });

  it("includes the URL", () => {
    const t = buildNationalShareText(baseState);
    expect(t).toContain(BASE_URL);
  });

  it("does not include live demand MW (that would imply precision we don't have)", () => {
    const t = buildNationalShareText(baseState);
    // The share text should express things in % and kbs, not raw MW
    expect(t).not.toContain("24,600");
  });
});

describe("buildRegionalShareText", () => {
  const baseState = {
    regionName: "London",
    lowKettles: 2800,
    highKettles: 5500,
    lowMw: 1008,
    highMw: 1975,
    url: BASE_URL,
  };

  it("contains region name", () => {
    const t = buildRegionalShareText(baseState);
    expect(t).toContain("London");
  });

  it("contains kettle range with thousands separators", () => {
    const t = buildRegionalShareText(baseState);
    expect(t).toContain("2,800");
    expect(t).toContain("5,500");
  });

  it("contains MW range", () => {
    const t = buildRegionalShareText(baseState);
    expect(t).toContain("1,008");
    expect(t).toContain("1,975");
  });

  it("always includes the modelled caveat", () => {
    const t = buildRegionalShareText(baseState);
    expect(t).toContain("not a live meter");
  });

  it("omits carbon line when not provided", () => {
    const t = buildRegionalShareText(baseState);
    expect(t).not.toContain("gCO₂/kWh");
  });

  it("includes carbon line when provided", () => {
    const t = buildRegionalShareText({
      ...baseState,
      carbonIntensity: 180,
      carbonRegion: "UKPN London",
    });
    expect(t).toContain("180 gCO₂/kWh");
    expect(t).toContain("UKPN London");
  });

  it("does not include a postcode", () => {
    const t = buildRegionalShareText(baseState);
    // Regression: no postcode should ever appear in share text
    expect(t).not.toMatch(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/);
  });

  it("includes the URL", () => {
    const t = buildRegionalShareText(baseState);
    expect(t).toContain(BASE_URL);
  });
});
