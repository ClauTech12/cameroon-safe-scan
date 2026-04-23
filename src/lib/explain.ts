// Heuristic suspicious-phrase highlighter for scam reports.
// Catches common Cameroon MoMo/job/phishing red flags in EN + FR.

const PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\b(otp|code|pin|password|mot de passe)\b/gi, label: "credential request" },
  { re: /\b(mtn|orange|momo|mobile money)\b/gi, label: "mobile money" },
  { re: /\b(send|transfer|envoyer|virement|deposit)\b.*\b(\d{3,7})\s*(fcfa|xaf|f|frs)?/gi, label: "money request" },
  { re: /\b(\d{4,7})\s*(fcfa|xaf|frs)\b/gi, label: "amount" },
  { re: /\b(winner|gagnant|prize|prix|congratulations|félicitations)\b/gi, label: "prize bait" },
  { re: /\b(urgent|maintenant|now|immediately|tout de suite)\b/gi, label: "urgency" },
  { re: /\b(job|emploi|recruit|recrutement|hire|hiring)\b/gi, label: "job lure" },
  { re: /\b(verify|verification|verifier|confirmer|account|compte)\b/gi, label: "fake verification" },
  { re: /\b(invest|investir|profit|return|bénéfice|forex|crypto|bitcoin)\b/gi, label: "investment lure" },
  { re: /\b(bank|banque|atm|carte|card)\b/gi, label: "banking" },
  { re: /\b(\+?237\s?6\d{2}\s?\d{2}\s?\d{2}\s?\d{2})\b/g, label: "phone number" },
  { re: /https?:\/\/\S+/gi, label: "external link" },
];

export interface HighlightSegment {
  text: string;
  match?: string; // label if it's a suspicious phrase
}

export function highlightSuspicious(text: string): HighlightSegment[] {
  if (!text) return [];
  type Hit = { start: number; end: number; label: string };
  const hits: Hit[] = [];
  for (const { re, label } of PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      hits.push({ start: m.index, end: m.index + m[0].length, label });
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  if (!hits.length) return [{ text }];

  // sort + merge overlapping
  hits.sort((a, b) => a.start - b.start);
  const merged: Hit[] = [];
  for (const h of hits) {
    const last = merged[merged.length - 1];
    if (last && h.start <= last.end) {
      last.end = Math.max(last.end, h.end);
    } else {
      merged.push({ ...h });
    }
  }

  const segs: HighlightSegment[] = [];
  let cursor = 0;
  for (const h of merged) {
    if (h.start > cursor) segs.push({ text: text.slice(cursor, h.start) });
    segs.push({ text: text.slice(h.start, h.end), match: h.label });
    cursor = h.end;
  }
  if (cursor < text.length) segs.push({ text: text.slice(cursor) });
  return segs;
}

export function suspiciousPhrases(text: string): string[] {
  return Array.from(new Set(
    highlightSuspicious(text)
      .filter((s) => s.match)
      .map((s) => s.text.trim())
      .filter(Boolean),
  )).slice(0, 6);
}
