import { describe, it, expect } from "vitest";
import { riskBand, maskPhone, fullPhone } from "@/lib/risk";

describe("riskBand", () => {
  it("bands high risk at 70+", () => {
    expect(riskBand(70).level).toBe("high");
    expect(riskBand(100).level).toBe("high");
  });

  it("bands medium risk between 35 and 69", () => {
    expect(riskBand(35).level).toBe("medium");
    expect(riskBand(69).level).toBe("medium");
  });

  it("bands low risk under 35", () => {
    expect(riskBand(0).level).toBe("low");
    expect(riskBand(34).level).toBe("low");
  });
});

describe("maskPhone", () => {
  it("masks the middle digits of a canonical 9-digit number", () => {
    expect(maskPhone("670123456")).toBe("+237 *** ***56");
  });

  it("returns empty string for empty input", () => {
    expect(maskPhone("")).toBe("");
  });
});

describe("fullPhone", () => {
  it("formats a canonical 9-digit number with spacing", () => {
    expect(fullPhone("670123456")).toBe("+237 6 70 12 34 56");
  });

  it("returns empty string for empty input", () => {
    expect(fullPhone("")).toBe("");
  });
});
