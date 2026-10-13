import { describe, expect, it } from "vitest";
import data from "../data/bank-holiday-effect.json";

/**
 * The bank-holiday reduction is quoted in page copy, so the committed file has to
 * stay internally consistent. These checks would fail if it were hand-edited to a
 * figure the underlying day totals do not support.
 */
describe("bank-holiday effect data", () => {
  it("summary matches the per-holiday rows", () => {
    const falls = data.holidays.map((h) => h.percentBelowBaseline);
    expect(data.summary.holidaysMeasured).toBe(data.holidays.length);
    expect(data.summary.minPercentBelow).toBeCloseTo(Math.min(...falls), 6);
    expect(data.summary.maxPercentBelow).toBeCloseTo(Math.max(...falls), 6);
    const sorted = [...falls].sort((a, b) => a - b);
    const median = sorted.length % 2
      ? sorted[(sorted.length - 1) / 2]!
      : (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2;
    expect(data.summary.medianPercentBelow).toBeCloseTo(median, 1);
  });

  it("each holiday's percentage follows from its own day and baseline totals", () => {
    for (const h of data.holidays) {
      const derived = ((h.baselineGwh - h.gwh) / h.baselineGwh) * 100;
      expect(derived, h.date).toBeCloseTo(h.percentBelowBaseline, 0);
      expect(h.gwh, h.date).toBeLessThan(h.baselineGwh);
      expect(h.peerDays, h.date).toBeGreaterThan(0);
    }
  });

  it("is a bank-holiday reduction, not an increase", () => {
    expect(data.summary.minPercentBelow).toBeGreaterThan(0);
    expect(data.summary.maxPercentBelow).toBeLessThan(100);
  });
});
