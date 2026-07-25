import { describe, it, expect } from "vitest";
import { analyzeUrl, analyzePhone, analyze } from "@/lib/analyzer";

describe("analyzeUrl", () => {
  it("flags a clean, well-known HTTPS domain as safe", () => {
    const result = analyzeUrl("https://www.google.com");
    expect(result.label).toBe("safe");
    expect(result.score).toBeLessThan(20);
  });

  it("flags a raw-IP URL as high risk", () => {
    const result = analyzeUrl("http://192.168.1.5/login");
    expect(result.signals.some((s) => s.key === "ip_url")).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(20);
  });

  it("flags a shortened link", () => {
    const result = analyzeUrl("https://bit.ly/abc123");
    expect(result.signals.some((s) => s.key === "shortener")).toBe(true);
  });

  it("flags a brand-lookalike domain as at least high risk", () => {
    const result = analyzeUrl("https://mtn-momo-secure-verify.xyz/login");
    expect(result.signals.some((s) => s.key === "brand_lookalike")).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(45);
  });

  it("does not flag well-known global brand domains as look-alikes", () => {
    const google = analyzeUrl("https://www.google.com");
    const whatsapp = analyzeUrl("https://web.whatsapp.com");
    expect(google.signals.some((s) => s.key === "brand_lookalike")).toBe(false);
    expect(whatsapp.signals.some((s) => s.key === "brand_lookalike")).toBe(false);
  });

  it("handles a garbage / invalid URL without throwing", () => {
    const result = analyzeUrl("not a url at all!!");
    expect(result.kind).toBe("url");
    expect(result.signals.some((s) => s.key === "invalid_url")).toBe(true);
  });

  it("returns a safe empty result for empty input", () => {
    const result = analyzeUrl("");
    expect(result.score).toBe(0);
    expect(result.label).toBe("safe");
  });
});

describe("analyze (text kinds)", () => {
  it("flags an urgent mobile-money transfer request as high risk", () => {
    const result = analyze(
      "sms",
      "URGENT! Your MTN MoMo account will be suspended. Send 5000 FCFA now to verify your account.",
    );
    expect(result.signals.some((s) => s.key === "urgency")).toBe(true);
    expect(result.signals.some((s) => s.key === "account_threat")).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(45);
  });

  it("flags an OTP request as high risk regardless of channel", () => {
    const result = analyze("whatsapp", "Please send me the OTP code we just sent you to confirm.");
    expect(result.signals.some((s) => s.key === "otp")).toBe(true);
  });

  it("flags a job offer that asks for an upfront fee", () => {
    const result = analyze(
      "email",
      "We are hiring for a work from home job. Please pay a small registration fee to proceed.",
    );
    expect(result.signals.some((s) => s.key === "job_bait")).toBe(true);
  });

  it("treats ordinary, benign text as safe", () => {
    const result = analyze("sms", "Hey, are we still meeting for lunch tomorrow?");
    expect(result.label).toBe("safe");
  });

  it("returns an empty safe result for empty text", () => {
    const result = analyze("sms", "   ");
    expect(result.score).toBe(0);
    expect(result.label).toBe("safe");
  });
});

describe("analyzePhone", () => {
  it("flags a too-short number", () => {
    const result = analyzePhone("12345");
    expect(result.signals.some((s) => s.key === "too_short")).toBe(true);
  });

  it("does not flag a valid Cameroon mobile prefix", () => {
    const result = analyzePhone("+237670123456");
    expect(result.signals.some((s) => s.key === "unusual_prefix")).toBe(false);
  });

  it("flags an unusual (non-6xx) prefix", () => {
    const result = analyzePhone("+237912345678");
    expect(result.signals.some((s) => s.key === "unusual_prefix")).toBe(true);
  });

  it("flags heavily repeated digits as a possible spoof", () => {
    const result = analyzePhone("+237666666666");
    expect(result.signals.some((s) => s.key === "repeated_digits")).toBe(true);
  });
});
