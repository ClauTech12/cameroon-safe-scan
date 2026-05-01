import { useState } from "react";
import { ScamType, SCAM_META, RiskLevel, maskContact } from "@/lib/scam-types";
import { ScamBadge } from "./ScamBadge";
import { RiskIndicator } from "./RiskIndicator";
import { ReportAbuseDialog } from "./ReportAbuseDialog";
import { WhyThisResult } from "./WhyThisResult";
import { HighlightedText } from "./HighlightedText";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar, User, Lightbulb, ShieldAlert, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr as frLocale, enUS } from "date-fns/locale";

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

export function ReportCard({ report }: { report: Report }) {
  const { t, i18n } = useTranslation();
  const [showWhy, setShowWhy] = useState(false);
  const meta = SCAM_META[report.scam_type];
  const locale = i18n.language?.startsWith("fr") ? frLocale : enUS;
  const badge = getVerificationBadge(report);
  const BadgeIcon = badge.Icon;

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
