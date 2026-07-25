import { describe, it, expect } from "vitest";
import { maskContact } from "@/lib/scam-types";

describe("maskContact", () => {
  it("masks an email address, keeping the first 2 chars of the local part", () => {
    expect(maskContact("clauvet@example.com")).toBe("cl***@example.com");
  });

  it("masks a phone number, keeping the first 3 and last 2 digits", () => {
    expect(maskContact("+237670123456")).toBe("237****56");
  });

  it("returns *** for a phone number too short to partially mask", () => {
    expect(maskContact("12")).toBe("***");
  });

  it("returns an empty string for null/undefined/empty input", () => {
    expect(maskContact(null)).toBe("");
    expect(maskContact(undefined)).toBe("");
    expect(maskContact("")).toBe("");
  });
});
