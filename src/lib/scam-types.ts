import { Banknote, Briefcase, Fish, TrendingUp, Landmark, AlertCircle } from "lucide-react";

export type ScamType = "mobile_money" | "job" | "phishing" | "investment" | "bank" | "other";
export type RiskLevel = "low" | "medium" | "high";

export const SCAM_TYPES: ScamType[] = ["mobile_money", "job", "phishing", "investment", "bank", "other"];

export const SCAM_META: Record<ScamType, {
  icon: typeof Banknote;
  bg: string;          // bg semantic class
  text: string;        // text color class
  border: string;      // border color class
  ring: string;        // soft tint
  hex: string;         // for charts/PDF
}> = {
  mobile_money: {
    icon: Banknote,
    bg: "bg-scam-mobile",
    text: "text-scam-mobile",
    border: "border-scam-mobile/50",
    ring: "bg-scam-mobile/10",
    hex: "#f5b800",
  },
  job: {
    icon: Briefcase,
    bg: "bg-scam-job",
    text: "text-scam-job",
    border: "border-scam-job/50",
    ring: "bg-scam-job/10",
    hex: "#2563eb",
  },
  phishing: {
    icon: Fish,
    bg: "bg-scam-phishing",
    text: "text-scam-phishing",
    border: "border-scam-phishing/50",
    ring: "bg-scam-phishing/10",
    hex: "#a855f7",
  },
  investment: {
    icon: TrendingUp,
    bg: "bg-scam-investment",
    text: "text-scam-investment",
    border: "border-scam-investment/50",
    ring: "bg-scam-investment/10",
    hex: "#22c55e",
  },
  bank: {
    icon: Landmark,
    bg: "bg-scam-bank",
    text: "text-scam-bank",
    border: "border-scam-bank/50",
    ring: "bg-scam-bank/10",
    hex: "#ef4444",
  },
  other: {
    icon: AlertCircle,
    bg: "bg-scam-other",
    text: "text-scam-other",
    border: "border-scam-other/50",
    ring: "bg-scam-other/10",
    hex: "#94a3b8",
  },
};

export const RISK_META: Record<RiskLevel, { color: string; hex: string }> = {
  low: { color: "text-risk-low", hex: "#22c55e" },
  medium: { color: "text-risk-medium", hex: "#f5b800" },
  high: { color: "text-risk-high", hex: "#ef4444" },
};

export function maskContact(contact?: string | null): string {
  if (!contact) return "";
  const trimmed = contact.trim();
  if (trimmed.includes("@")) {
    const [u, d] = trimmed.split("@");
    if (!u || !d) return trimmed;
    return `${u.slice(0, 2)}***@${d}`;
  }
  // phone-like
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `${digits.slice(0, 3)}****${digits.slice(-2)}`;
}

export const CAMEROON_REGIONS = [
  "Adamawa", "Centre", "East", "Far North", "Littoral",
  "North", "Northwest", "South", "Southwest", "West",
  "Yaoundé", "Douala", "Bamenda", "Bafoussam", "Garoua", "Maroua", "Other",
];
