import { useEffect, useState } from "react";
import { ScamType, SCAM_META, RiskLevel, maskContact } from "@/lib/scam-types";
import { ScamBadge } from "./ScamBadge";
import { RiskIndicator } from "./RiskIndicator";
import { ReportAbuseDialog } from "./ReportAbuseDialog";
import { WhyThisResult } from "./WhyThisResult";
import { suspiciousPhrases, detectTactics } from "@/lib/explain";
import { HighlightedText } from "./HighlightedText";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar, User, Lightbulb, ShieldAlert, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr as frLocale, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export interface Report {
  id: string;
  reporter_name: string | null;
  location: string;
  description: string;
  contact_info: string | null;
  scam_type: ScamType;
  ai_confidence: number | null;
  ai_advice: string[] | null;
  risk_level: RiskLevel;
  status?: "pending" | "approved" | "rejected" | null;
  created_at: string;
  phone_number?: string | null;
}

type BadgeKind = "verified" | "suspicious" | "unverified";

function getVerificationBadge(report: Report): { kind: BadgeKind; label: string; className: string; Icon: typeof ShieldAlert } {
  // Priority: status drives the label, never the source.
  if (report.status === "approved" && report.risk_level === "high") {
    return {
      kind: "suspicious",
      label: "suspiciousBadge",
      className: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
      Icon: AlertTriangle,
    };
  }
  if (report.status === "approved") {
    return {
      kind: "verified",
      label: "verifiedBadge",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      Icon: ShieldCheck,
    };
  }
  return {
    kind: "unverified",
    label: "unverifiedBadge",
    className: "bg-muted text-muted-foreground border-border",
    Icon: ShieldAlert,
  };
}

interface PhoneStats { total: number; recent24h: number }

function buildReasons(report: Report, stats: PhoneStats | null): string[] {
  const reasons: string[] = [];
  try {
    // Most specific signals first
    if (stats && stats.total >= 2) reasons.push("reports.reasons.reportedMultiple");
    if (stats && stats.recent24h >= 3) reasons.push("reports.reasons.recentSpike");

    // Tactic-specific reasons from message content
    const tactics = detectTactics(report.description ?? "");
    for (const tac of tactics) reasons.push(`reports.reasons.tactic.${tac}`);

    // Verification & risk
    if (report.status === "approved") reasons.push("reports.reasons.adminVerified");
    if (report.risk_level === "high") reasons.push("reports.reasons.highRisk");
    else if (report.risk_level === "medium") reasons.push("reports.reasons.mediumRisk");

    // Generic pattern fallback only if no tactic was identified
    if (tactics.length === 0) {
      const phrases = suspiciousPhrases(report.description ?? "");
      if (phrases.length >= 2) reasons.push("reports.reasons.patternMatch");
    }

    if ((report.ai_confidence ?? 0) >= 80) reasons.push("reports.reasons.highConfidence");

    if (report.status !== "approved" && reasons.length === 0) reasons.push("reports.reasons.pending");
  } catch {
    // never crash the card on explainability
  }
  // de-dupe while keeping order, cap at 5
  return Array.from(new Set(reasons)).slice(0, 5);
}

export function ReportCard({ report }: { report: Report }) {
  const { t, i18n } = useTranslation();
  const [showWhy, setShowWhy] = useState(false);
  const [stats, setStats] = useState<PhoneStats | null>(null);
  const meta = SCAM_META[report.scam_type];
  const locale = i18n.language?.startsWith("fr") ? frLocale : enUS;
  const badge = getVerificationBadge(report);
  const BadgeIcon = badge.Icon;

  // Lazy-fetch same-number stats (best-effort, never blocks render)
  useEffect(() => {
    const phone = report.phone_number?.trim();
    if (!phone) return;
    let cancelled = false;
    (async () => {
      try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const [{ count: total }, { count: recent24h }] = await Promise.all([
          supabase.from("scam_reports").select("id", { count: "exact", head: true })
            .eq("status", "approved").eq("phone_number", phone),
          supabase.from("scam_reports").select("id", { count: "exact", head: true })
            .eq("status", "approved").eq("phone_number", phone).gte("created_at", since),
        ]);
        if (!cancelled) setStats({ total: total ?? 0, recent24h: recent24h ?? 0 });
      } catch {
        // ignore — explainability degrades gracefully
      }
    })();
    return () => { cancelled = true; };
  }, [report.phone_number]);

  const reasons = buildReasons(report, stats);

  return (
    <article className="surface-card overflow-hidden lift-on-hover flex flex-col">
      <div className="h-1 w-full" style={{ background: meta.hex }} />
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <ScamBadge type={report.scam_type} confidence={report.ai_confidence} />
          <RiskIndicator level={report.risk_level} />
        </div>

        <HighlightedText
          text={report.description}
          className="text-sm leading-relaxed text-foreground/85 line-clamp-4 flex-1"
        />

        {report.ai_advice && report.ai_advice.length > 0 && (
          <div className="rounded-xl bg-secondary/60 border border-border/60 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent">
              <Lightbulb className="h-3.5 w-3.5" />
              {t("reports.advice")}
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {report.ai_advice.slice(0, 2).map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ background: meta.hex }} />
                  <span className="line-clamp-2">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.contact_info && (
          <div className="text-xs">
            <span className="font-mono px-2 py-1 rounded-md bg-muted text-muted-foreground">
              {maskContact(report.contact_info)}
            </span>
          </div>
        )}

        <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium w-fit ${badge.className}`}>
          <BadgeIcon className="h-3 w-3" /> {t(`reports.${badge.label}`)}
        </div>

        {reasons.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
              <Lightbulb className="h-3 w-3 text-accent" />
              {t("reports.whyFlagged")}
            </div>
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              {reasons.map((key) => (
                <li key={key} className="flex gap-1.5">
                  <span className="mt-1.5 h-1 w-1 rounded-full shrink-0 bg-accent" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-border/60">
          <span className="flex items-center gap-1"><User className="h-3 w-3" />{report.reporter_name || t("reports.anon")}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{report.location}</span>
          <span className="flex items-center gap-1 ml-auto">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale })}
          </span>
        </div>

        <div className="-mt-1 -mb-1 flex justify-between items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setShowWhy((v) => !v)}
          >
            {showWhy ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {t("why.title")}
          </Button>
          <ReportAbuseDialog reportId={report.id} />
        </div>

        {showWhy && (
          <WhyThisResult reportId={report.id} description={report.description} compact />
        )}
      </div>
    </article>
  );
}
