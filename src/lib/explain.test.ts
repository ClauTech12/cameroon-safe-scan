import { describe, it, expect } from "vitest";
import { highlightSuspicious, suspiciousPhrases, detectTactics } from "@/lib/explain";

describe("highlightSuspicious", () => {
  it("returns the plain text untouched when nothing suspicious is found", () => {
    const segs = highlightSuspicious("Hello, how are you today?");
    expect(segs).toEqual([{ text: "Hello, how are you today?" }]);
  });

  it("returns an empty array for empty input", () => {
    expect(highlightSuspicious("")).toEqual([]);
  });

  it("highlights a mobile money keyword", () => {
    const segs = highlightSuspicious("Please send it via MTN MoMo now.");
    expect(segs.some((s) => s.match === "mobile money")).toBe(true);
  });

  it("merges overlapping matches instead of duplicating them", () => {
    const segs = highlightSuspicious("send 5000 fcfa now");
    // should not throw and should produce a coherent, ordered set of segments
    const rebuilt = segs.map((s) => s.text).join("");
    expect(rebuilt).toBe("send 5000 fcfa now");
  });
});

describe("suspiciousPhrases", () => {
  it("extracts unique suspicious phrases, capped at 6", () => {
    const phrases = suspiciousPhrases(
      "URGENT! Send your OTP code now. MTN MoMo account verify urgent urgent urgent.",
    );
    expect(phrases.length).toBeGreaterThan(0);
    expect(phrases.length).toBeLessThanOrEqual(6);
  });

  it("returns an empty list for benign text", () => {
    expect(suspiciousPhrases("Let's catch up this weekend.")).toEqual([]);
  });
});

describe("detectTactics", () => {
  it("detects an urgent-money-request tactic", () => {
    const tactics = detectTactics("URGENT, please send the payment immediately.");
    expect(tactics).toContain("urgentMoney");
  });

  it("detects a credential-request tactic", () => {
    expect(detectTactics("Please share your OTP code with me.")).toContain("credential");
  });

  it("detects a job-fee lure", () => {
    expect(detectTactics("We have a job opening, please pay a registration fee.")).toContain("jobFee");
  });

  it("returns an empty list for benign text", () => {
    expect(detectTactics("See you at the market tomorrow.")).toEqual([]);
  });

  it("returns an empty list for empty input", () => {
    expect(detectTactics("")).toEqual([]);
  });
});
