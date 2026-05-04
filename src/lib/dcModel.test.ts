import { describe, it, expect } from "vitest";
import { nationalModel, regionalModel, demandSharePercent, NESO_AVERAGE_MW, NESO_AVERAGE_KBS } from "./dcModel";
import { itl1FromNuts } from "./postcodes";

describe("nationalModel", () => {
  const result = nationalModel();

  it("low scenario: 1600 × 0.40 × 1.2 = 768 MW", () => {
    expect(result.facilityLoadMw.low).toBeCloseTo(768, 6);
  });

  it("central scenario: 1600 × 0.55 × 1.4 = 1232 MW", () => {
    expect(result.facilityLoadMw.central).toBeCloseTo(1232, 6);
  });

  it("high scenario: 1600 × 0.70 × 1.6 = 1792 MW", () => {
    expect(result.facilityLoadMw.high).toBeCloseTo(1792, 6);
  });

  it("low kbs: 768 / 0.36 = 2133.33", () => {
    expect(result.kettleBoilsPerSec.low).toBeCloseTo(2133.33, 1);
  });

  it("central kbs: 1232 / 0.36 = 3422.22", () => {
    expect(result.kettleBoilsPerSec.central).toBeCloseTo(3422.22, 1);
  });

  it("high kbs: 1792 / 0.36 = 4977.78", () => {
    expect(result.kettleBoilsPerSec.high).toBeCloseTo(4977.78, 1);
  });
});

describe("regionalModel ITL1 prefix mapping", () => {
  it("TLI → London", () => {
    const r = regionalModel("TLI");
    expect(r).not.toBeNull();
    expect(r?.regionName).toBe("London");
    expect(r?.itCapacityMw).toBe(1048);
  });

  it("TLJ → South East", () => {
    const r = regionalModel("TLJ");
    expect(r?.regionName).toBe("South East");
  });

  it("TLL → Wales", () => {
    const r = regionalModel("TLL");
    expect(r?.regionName).toBe("Wales");
    expect(r?.itCapacityMw).toBe(154);
  });

  it("TLM → Scotland", () => {
    const r = regionalModel("TLM");
    expect(r?.regionName).toBe("Scotland");
    expect(r?.itCapacityMw).toBe(30);
  });

  it("unknown code returns null", () => {
    expect(regionalModel("XXX")).toBeNull();
  });
});

describe("itl1FromNuts (postcodes.ts)", () => {
  it("TLI32 → TLI (London)", () => expect(itl1FromNuts("TLI32")).toBe("TLI"));
  it("TLJ14 → TLJ (South East)", () => expect(itl1FromNuts("TLJ14")).toBe("TLJ"));
  it("TLL22 → TLL (Wales)", () => expect(itl1FromNuts("TLL22")).toBe("TLL"));
  it("TLM75 → TLM (Scotland)", () => expect(itl1FromNuts("TLM75")).toBe("TLM"));
  it("null → null", () => expect(itl1FromNuts(null)).toBeNull());
  it("undefined → null", () => expect(itl1FromNuts(undefined)).toBeNull());
  it("short string → null", () => expect(itl1FromNuts("TL")).toBeNull());
});

describe("NESO-derived central estimate", () => {
  it("NESO_AVERAGE_MW = 7,600 GWh / 8,760 h ≈ 867.6 MW", () => {
    expect(NESO_AVERAGE_MW).toBeCloseTo(867.6, 1);
  });

  it("NESO_AVERAGE_KBS ≈ 2,410 kbs", () => {
    expect(NESO_AVERAGE_KBS).toBeCloseTo(2410, 0);
  });

  it("NESO central sits within the DSIT scenario range", () => {
    const { facilityLoadMw } = nationalModel();
    expect(NESO_AVERAGE_MW).toBeGreaterThan(facilityLoadMw.low);
    expect(NESO_AVERAGE_MW).toBeLessThan(facilityLoadMw.high);
  });
});

describe("demandSharePercent", () => {
  it("central load vs typical GB bank-holiday demand", () => {
    const share = demandSharePercent(1232, 25000);
    expect(share).toBeCloseTo(4.928, 2);
  });

  it("returns 0 when gbDemandMw is 0", () => {
    expect(demandSharePercent(1232, 0)).toBe(0);
  });
});
