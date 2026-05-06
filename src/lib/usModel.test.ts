import { describe, it, expect } from "vitest";
import { usModel } from "./usModel";
import { KBS_DIVISOR } from "./dcModel";

describe("usModel", () => {
  const result = usModel("dc-mid-atlantic");

  it("converts 2026 Dominion billing demand directly to kbs without PUE or utilisation", () => {
    expect(result.primary.demandMw).toBe(4753);
    expect(result.primary.kbs).toBeCloseTo(4753 / KBS_DIVISOR, 6);
  });

  it("primary scenario is projection2026", () => {
    expect(result.primary.key).toBe("projection2026");
  });

  it("computes load-factor average separately", () => {
    expect(result.primary.averageContinuousMw).toBeCloseTo(4753 * 0.9, 6);
    expect(result.primary.averageContinuousKbs).toBeCloseTo((4753 * 0.9) / KBS_DIVISOR, 6);
  });

  it("includes all seven scenarios", () => {
    const keys = result.scenarios.map(s => s.key);
    expect(keys).toContain("actual2024");
    expect(keys).toContain("forecast2025");
    expect(keys).toContain("projection2026");
    expect(keys).toContain("projection2027");
    expect(keys).toContain("projection2028");
    expect(keys).toContain("projection2029");
    expect(keys).toContain("projection2030");
    expect(result.scenarios).toHaveLength(7);
  });

  it("scenarios are in chronological order", () => {
    const years = result.scenarios.map(s => s.year);
    for (let i = 1; i < years.length; i++) {
      expect(years[i]).toBeGreaterThan(years[i - 1]);
    }
  });

  it("2024 actual scenario has correct demand", () => {
    const s = result.scenarios.find(s => s.key === "actual2024")!;
    expect(s.demandMw).toBe(3584);
    expect(s.kbs).toBeCloseTo(3584 / KBS_DIVISOR, 6);
  });

  it("2026 projection has correct demand", () => {
    const s = result.scenarios.find(s => s.key === "projection2026")!;
    expect(s.demandMw).toBe(4753);
  });

  it("2027 projection has correct demand", () => {
    const s = result.scenarios.find(s => s.key === "projection2027")!;
    expect(s.demandMw).toBe(5322);
    expect(s.kbs).toBeCloseTo(5322 / KBS_DIVISOR, 6);
  });

  it("2028 projection has correct demand", () => {
    const s = result.scenarios.find(s => s.key === "projection2028")!;
    expect(s.demandMw).toBe(5863);
    expect(s.kbs).toBeCloseTo(5863 / KBS_DIVISOR, 6);
  });

  it("2029 projection has correct demand", () => {
    const s = result.scenarios.find(s => s.key === "projection2029")!;
    expect(s.demandMw).toBe(6419);
    expect(s.kbs).toBeCloseTo(6419 / KBS_DIVISOR, 6);
  });

  it("2030 projection has correct demand", () => {
    const s = result.scenarios.find(s => s.key === "projection2030")!;
    expect(s.demandMw).toBe(6992);
    expect(s.kbs).toBeCloseTo(6992 / KBS_DIVISOR, 6);
  });

  it("primary source has a valid https url", () => {
    expect(result.primarySource.url).toBeTruthy();
    expect(result.primarySource.url).toMatch(/^https:\/\//);
  });

  it("all sources have valid https urls", () => {
    for (const src of result.sources) {
      expect(src.url).toMatch(/^https:\/\//);
    }
  });

  it("has at least two sources", () => {
    expect(result.sources.length).toBeGreaterThanOrEqual(2);
  });

  it("throws for unknown region id", () => {
    expect(() => usModel("unknown-region")).toThrow('Unknown US region id: "unknown-region"');
  });
});
