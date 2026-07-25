// Lightweight scam heuristics for the AI Scam Analyzer.
// Returns a normalized risk score (0-100), label, signals, and recommendations.

export type AnalyzerKind = "url" | "whatsapp" | "sms" | "email" | "phone";

export type RiskLabel = "safe" | "suspicious" | "high_risk" | "phishing";

export interface Signal {
  key: string;
  label: string;
  severity: "low" | "medium" | "high";
  match?: string;
}

export interface HeuristicResult {
  kind: AnalyzerKind;
  score: number; // 0-100
  label: RiskLabel;
  signals: Signal[];
  highlights: string[]; // suspicious phrases to highlight in the original text
  recommendations: string[];
}

// --- shared pattern dictionaries -----------------------------------------

const URGENCY = /\b(urgent|immediately|now|right away|asap|maintenant|tout de suite|urgence)\b/i;
const MONEY_REQUEST = /\b(send|transfer|deposit|pay|wire|virement|envoyer|payer|deposer|verser)\b[\s\S]{0,40}\b(money|cash|fcfa|cfa|xaf|argent|fonds)\b/i;
const OTP = /\b(otp|code|pin|password|mot de passe|verification code|one[- ]time)\b/i;
const PRIZE = /\b(winner|won|congratulations|prize|gagnant|gagne|felicitations|lottery|loterie|jackpot|tirage)\b/i;
const JOB_BAIT = /\b(job|work from home|recruit|hiring|emploi|travail|recrutement|embauche)\b[\s\S]{0,60}\b(register|fee|frais|inscription|deposit|pay)\b/i;
const INVEST = /\b(invest|returns?|roi|forex|crypto|bitcoin|double your|triple your|rendement|placement)\b/i;
const IMPERSONATION = /\b(mtn|orange|momo|mobile money|afriland|ecobank|uba|sgbc|bicec|bank|police|gendarmerie|customs|douane|microsoft|google|whatsapp|amazon|dhl)\b/i;
const ACCOUNT_THREAT = /\b(suspend|block|deactivate|locked|verify|verifier|bloquer|suspendre|desactiver)\b[\s\S]{0,40}\b(account|compte|number|numero|sim)\b/i;
const ROMANCE = /\b(love|darling|honey|sweetheart|cheri|amour|mariage|marry)\b/i;
const SHORTENERS = /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|cutt\.ly|is\.gd|rebrand\.ly|shorturl\.at|s\.id|lnkd\.in)\b/i;
const SUSPICIOUS_TLD = /\.(zip|mov|xyz|top|click|country|gq|tk|ml|cf|ga)\b/i;
const IP_URL = /https?:\/\/(\d{1,3}\.){3}\d{1,3}/i;
const PUNYCODE = /xn--/i;
const HAS_AT_IN_URL = /https?:\/\/[^\s]*@/i;
const FAKE_DELIVERY = /\b(parcel|delivery|colis|livraison|customs|douane|package)\b[\s\S]{0,40}\b(fee|frais|pay|payer|tax|taxe)\b/i;
const FAKE_INVOICE = /\b(invoice|facture|payment due|overdue|past due|paiement)\b/i;
const ATTACHMENT_RISK = /\b(\.exe|\.scr|\.zip|\.rar|\.html?|\.docm|\.xlsm)\b/i;
const PHISH_LOGIN = /\b(sign[- ]?in|log[- ]?in|verify your|confirm your|reset your)\b[\s\S]{0,30}\b(account|password|identity|compte|mot de passe)\b/i;

function add(signals: Signal[], s: Signal) {
  signals.push(s);
}

function bandWeight(sev: Signal["severity"]) {
  return sev === "high" ? 28 : sev === "medium" ? 16 : 8;
}

function finalize(kind: AnalyzerKind, signals: Signal[], rawScore: number, highlights: string[]): HeuristicResult {
  const score = Math.max(0, Math.min(100, rawScore));
  let label: RiskLabel = "safe";
  if (score >= 75) label = kind === "url" || kind === "email" ? "phishing" : "high_risk";
  else if (score >= 45) label = "high_risk";
  else if (score >= 20) label = "suspicious";

  const recommendations = buildRecommendations(kind, label, signals);
  return { kind, score, label, signals, highlights, recommendations };
}

function buildRecommendations(kind: AnalyzerKind, label: RiskLabel, signals: Signal[]): string[] {
  const r: string[] = [];
  if (label === "safe") {
    r.push("No strong scam signals detected — remain cautious and verify the sender independently.");
  } else {
    r.push("Do not share OTPs, PINs, or passwords with anyone — no legitimate service will ever ask.");
    r.push("Verify by calling the official number from the company's own website, not the one in the message.");
  }
  if (signals.some((s) => s.key.startsWith("money") || s.key === "urgency")) {
    r.push("Pause before any money transfer. Scammers manufacture urgency to bypass your judgement.");
  }
  if (kind === "url" || signals.some((s) => s.key.includes("link"))) {
    r.push("Avoid clicking the link. Type the official domain manually in your browser.");
  }
  if (kind === "phone") {
    r.push("Search the number on CamAlert to see if it has been reported before.");
  }
  r.push("Report the case on CamAlert to help protect your community.");
  return r;
}

// --- URL analysis --------------------------------------------------------

export function analyzeUrl(input: string): HeuristicResult {
  const signals: Signal[] = [];
  const highlights: string[] = [];
  let score = 0;
  const url = input.trim();

  if (!url) return finalize("url", signals, 0, []);

  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.toLowerCase();

    if (u.protocol !== "https:") {
      add(signals, { key: "no_https", label: "Connection is not HTTPS", severity: "medium" });
      score += bandWeight("medium");
    }
    if (IP_URL.test(url)) {
      add(signals, { key: "ip_url", label: "URL uses a raw IP address", severity: "high" });
      score += bandWeight("high");
      highlights.push(host);
    }
    if (HAS_AT_IN_URL.test(url)) {
      add(signals, { key: "at_in_url", label: "URL contains '@' (redirect trick)", severity: "high" });
      score += bandWeight("high");
    }
    if (PUNYCODE.test(host)) {
      add(signals, { key: "punycode", label: "Punycode domain (possible look-alike)", severity: "high" });
      score += bandWeight("high");
      highlights.push(host);
    }
    if (SHORTENERS.test(host)) {
      add(signals, { key: "shortener", label: "Shortened link hides the real destination", severity: "medium" });
      score += bandWeight("medium");
      highlights.push(host);
    }
    if (SUSPICIOUS_TLD.test(host)) {
      add(signals, { key: "tld", label: "Suspicious top-level domain", severity: "medium" });
      score += bandWeight("medium");
      highlights.push(host);
    }
    if (host.split(".").length > 4) {
      add(signals, { key: "deep_subdomain", label: "Excessive sub-domains (impersonation pattern)", severity: "medium" });
      score += bandWeight("medium");
    }
    if (/-(secure|login|verify|update|account)/i.test(host)) {
      add(signals, { key: "phish_keyword", label: "Phishing keyword in domain", severity: "high" });
      score += bandWeight("high");
      highlights.push(host);
    }
    const OFFICIAL_BRAND_DOMAINS =
      /\.(mtn(\.cm|onlineshop\.cm)?|orange\.cm|momo\.mtn\.cm|afrilandfirstbank\.com|ecobank\.com|ubagroup\.com|sgbc\.cm|bicec\.cm|google\.com|microsoft\.com|whatsapp\.com|amazon\.(com|fr|co\.uk|de)|dhl\.com)$/i;
    if (IMPERSONATION.test(host) && !OFFICIAL_BRAND_DOMAINS.test(host)) {
      // brand name inside a non-brand domain
      add(signals, { key: "brand_lookalike", label: "Brand name in unofficial domain", severity: "high" });
      score += bandWeight("high");
      highlights.push(host);
    }
    if (url.length > 90) {
      add(signals, { key: "long_url", label: "Unusually long URL", severity: "low" });
      score += bandWeight("low");
    }
  } catch {
    add(signals, { key: "invalid_url", label: "Not a valid URL", severity: "medium" });
    score += bandWeight("medium");
  }

  return finalize("url", signals, score, highlights);
}

// --- Generic text analysis (whatsapp / sms / email) ----------------------

function analyzeText(kind: "whatsapp" | "sms" | "email", input: string): HeuristicResult {
  const signals: Signal[] = [];
  const highlights: string[] = [];
  let score = 0;
  const text = input.trim();
  if (!text) return finalize(kind, signals, 0, []);

  const push = (re: RegExp, key: string, label: string, sev: Signal["severity"]) => {
    const m = text.match(re);
    if (m) {
      add(signals, { key, label, severity: sev, match: m[0] });
      score += bandWeight(sev);
      highlights.push(m[0]);
    }
  };

  push(URGENCY, "urgency", "Urgent / time-pressure language", "medium");
  push(MONEY_REQUEST, "money_request", "Asks you to send or transfer money", "high");
  push(OTP, "otp", "Mentions OTP / PIN / password", "high");
  push(PRIZE, "prize", "Prize or lottery bait", "high");
  push(JOB_BAIT, "job_bait", "Job offer asking for a fee", "high");
  push(INVEST, "invest", "Unrealistic investment / crypto returns", "medium");
  push(IMPERSONATION, "impersonation", "Impersonates a known brand or authority", "medium");
  push(ACCOUNT_THREAT, "account_threat", "Threatens to suspend / block your account", "high");
  push(ROMANCE, "romance", "Romance / affection bait", "medium");

  // Embedded URLs inside the text
  const urls = text.match(/https?:\/\/\S+/gi) || [];
  for (const u of urls) {
    const sub = analyzeUrl(u);
    if (sub.score >= 30) {
      add(signals, { key: "embedded_link", label: `Suspicious link: ${u}`, severity: sub.score >= 60 ? "high" : "medium" });
      score += bandWeight(sub.score >= 60 ? "high" : "medium");
      highlights.push(u);
    }
  }

  if (kind === "sms") {
    push(FAKE_DELIVERY, "delivery", "Fake parcel / delivery fee", "high");
    push(/\b(mtn|orange)\b[\s\S]{0,30}\b(momo|cash|credit)\b/i, "sms_telecom", "Fake telecom MoMo alert", "high");
  }
  if (kind === "email") {
    push(FAKE_INVOICE, "invoice", "Suspicious invoice / payment due", "medium");
    push(ATTACHMENT_RISK, "attachment", "Mentions risky attachment", "high");
    push(PHISH_LOGIN, "phish_login", "Asks you to re-confirm credentials", "high");
  }
  if (kind === "whatsapp") {
    push(/\b(forward|share)\b[\s\S]{0,30}\b(5|10|all)\b/i, "forward_bait", "Asks you to forward the message", "low");
  }

  return finalize(kind, signals, score, highlights);
}

// --- Phone reputation (local rules; remote check happens elsewhere) ------

export function analyzePhone(input: string): HeuristicResult {
  const signals: Signal[] = [];
  let score = 0;
  const digits = input.replace(/\D/g, "");
  if (digits.length < 8) {
    add(signals, { key: "too_short", label: "Number is too short to be valid", severity: "medium" });
    score += bandWeight("medium");
  }
  // Cameroon mobile prefixes (MTN 67/65, Orange 69/65/66, Nexttel 66/67)
  const last9 = digits.slice(-9);
  if (last9.length === 9 && !/^[6][0-9]/.test(last9)) {
    add(signals, { key: "unusual_prefix", label: "Unusual prefix for a Cameroon mobile line", severity: "low" });
    score += bandWeight("low");
  }
  if (/(\d)\1{4,}/.test(digits)) {
    add(signals, { key: "repeated_digits", label: "Repeated digits (often spoofed)", severity: "low" });
    score += bandWeight("low");
  }
  return finalize("phone", signals, score, []);
}

export function analyze(kind: AnalyzerKind, input: string): HeuristicResult {
  if (kind === "url") return analyzeUrl(input);
  if (kind === "phone") return analyzePhone(input);
  return analyzeText(kind, input);
}
