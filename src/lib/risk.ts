export function riskBand(score: number): { level: "low" | "medium" | "high"; label: string; cls: string } {
  if (score >= 70) return { level: "high", label: "High Risk", cls: "text-risk-high" };
  if (score >= 35) return { level: "medium", label: "Medium Risk", cls: "text-risk-medium" };
  return { level: "low", label: "Low Risk", cls: "text-risk-low" };
}

export function maskPhone(canonical: string): string {
  // canonical = last 9 digits
  if (!canonical) return "";
  const last2 = canonical.slice(-2);
  return `+237 *** ***${last2}`;
}

export function fullPhone(canonical: string): string {
  if (!canonical) return "";
  return `+237 ${canonical.slice(0, 1)} ${canonical.slice(1, 3)} ${canonical.slice(3, 5)} ${canonical.slice(5, 7)} ${canonical.slice(7, 9)}`;
}
