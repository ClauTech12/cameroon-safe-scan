import { ScamType, SCAM_META, RiskLevel, maskContact } from "@/lib/scam-types";
import { ScamBadge } from "./ScamBadge";
import { RiskIndicator } from "./RiskIndicator";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar, User, Lightbulb } from "lucide-react";
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
  created_at: string;
}

export function ReportCard({ report }: { report: Report }) {
  const { t, i18n } = useTranslation();
  const meta = SCAM_META[report.scam_type];
  const locale = i18n.language?.startsWith("fr") ? frLocale : enUS;

  return (
    <article
      className={cn(
        "glass-card rounded-2xl overflow-hidden transition-smooth hover:shadow-elegant hover:-translate-y-0.5",
        "border-l-4",
        meta.border.replace("border-", "border-l-").replace("/50", ""),
      )}
    >
      <div className={cn("h-1 w-full", meta.bg)} />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <ScamBadge type={report.scam_type} confidence={report.ai_confidence} />
          <RiskIndicator level={report.risk_level} />
        </div>

        <p className="text-sm leading-relaxed text-foreground/90 line-clamp-4">
          {report.description}
        </p>

        {report.ai_advice && report.ai_advice.length > 0 && (
          <div className="rounded-xl bg-secondary/40 border border-border/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent">
              <Lightbulb className="h-3.5 w-3.5" />
              {t("reports.advice")}
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {report.ai_advice.slice(0, 3).map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className={cn("mt-1 h-1 w-1 rounded-full shrink-0", meta.bg)} />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.contact_info && (
          <div className="text-xs text-muted-foreground">
            <span className="font-mono px-2 py-1 rounded bg-secondary/60">
              {maskContact(report.contact_info)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span className="flex items-center gap-1"><User className="h-3 w-3" />{report.reporter_name || t("reports.anon")}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{report.location}</span>
          <span className="flex items-center gap-1 ml-auto">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale })}
          </span>
        </div>
      </div>
    </article>
  );
}
