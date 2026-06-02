import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles, FileBarChart, Activity, Brain, Network, Loader2, AlertTriangle, Info,
} from "lucide-react";
import { ThresholdBadge, ThresholdStatus } from "./ThresholdBadge";
import { suspiciousPhrases } from "@/lib/explain";
import { cn } from "@/lib/utils";

export interface ExplainData {
  total_reports: number;
  recent_24h: number;
  pattern_match: boolean;
  spike: boolean;
  ai_confidence: number;
  status: ThresholdStatus;
  status_label?: string;
  related_report_ids?: string[];
  risk: { reports: number; pattern: number; ai: number; total: number };
}

interface Props {
  reportId?: string;
  data?: ExplainData;
  description?: string;
  className?: string;
  compact?: boolean;
}

const RISK_COLOR = (score: number) =>
  score >= 70 ? "bg-destructive" : score >= 35 ? "bg-amber-500" : "bg-emerald-500";

export function WhyThisResult({ reportId, data, description, className, compact }: Props) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState<ExplainData | null>(data ?? null);
  const [loading, setLoading] = useState(!!reportId && !data);

  useEffect(() => {
    if (data) { setLoaded(data); return; }
    if (!reportId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: res, error } = await supabase.rpc("report_explainability", { _report_id: reportId });
      if (!cancelled) {
        if (!error && res && typeof res === "object") setLoaded(res as unknown as ExplainData);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reportId, data]);

  if (loading) {
    return (
      <Card className={cn("p-4 flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" /> {t("why.building")}
      </Card>
    );
  }
  if (!loaded) return null;

  const phrases = description ? suspiciousPhrases(description) : [];
  const risk = loaded.risk?.total ?? 0;
  const riskLevel =
  risk >= 85 ? "Critical Risk" :
  risk >= 70 ? "High Risk" :
  risk >= 40 ? "Medium Risk" :
  "Low Risk";

const riskDescription =
  risk >= 85
    ? "Multiple strong indicators suggest highly suspicious activity."
    : risk >= 70
    ? "Several indicators suggest a significant scam risk."
    : risk >= 40
    ? "Some suspicious indicators have been detected."
    : "Limited suspicious activity has been detected.";

  const Row = ({ icon: Icon, label, value }: { icon: typeof Info; label: string; value: React.ReactNode }) => (
    <li className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 flex justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground text-right">{value}</span>
      </div>
    </li>
  );

  return (
    <Card className={cn("p-5 space-y-4 border-border/70", className)}>
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-sm">{t("why.title")}</h3>
        </div>
        <ThresholdBadge status={loaded.status} count={loaded.total_reports} />
      </header>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t("why.combined")}</span>
          <div className="text-right">
  <div className="font-bold tabular-nums text-base">
    {risk}/100
  </div>
  <div className="text-[11px] text-muted-foreground">
    {riskLevel}
  </div>
</div>
        </div>
        <Progress value={risk} className={cn("h-2 [&>div]:transition-all", `[&>div]:${RISK_COLOR(risk)}`)} />
        <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
          <ScoreChip label={t("why.reports")} value={loaded.risk?.reports ?? 0} max={40} tone="blue" />
          <ScoreChip label={t("why.patterns")} value={loaded.risk?.pattern ?? 0} max={40} tone="purple" />
          <ScoreChip label={t("why.ai")} value={loaded.risk?.ai ?? 0} max={35} tone="emerald" />
        </div>
      </div>

      <Separator />
<Separator />

<div className="rounded-lg border bg-muted/30 p-4 space-y-2">
  <h4 className="font-semibold text-sm">
    Why CAMALERT flagged this result
  </h4>

  <p className="text-sm text-muted-foreground">
    {riskDescription}
  </p>

  <ul className="space-y-1 text-sm">
    {loaded.total_reports > 0 && (
      <li>• Community reports have been submitted regarding this activity.</li>
    )}

    {loaded.pattern_match && (
      <li>• Behaviour matches previously identified scam patterns.</li>
    )}

    {loaded.spike && (
      <li>• Reporting activity increased significantly within the last 24 hours.</li>
    )}

    {loaded.ai_confidence >= 70 && (
      <li>• AI analysis indicates a strong likelihood of suspicious behaviour.</li>
    )}
  </ul>
</div>
      <ul className="space-y-2">
        <Row icon={FileBarChart} label={t("why.totalReports")} value={loaded.total_reports} />
        <Row icon={Activity}     label={t("why.last24h")} value={
          <span className={loaded.spike ? "text-destructive" : ""}>
            {loaded.recent_24h}{loaded.spike ? ` · ${t("why.spike")}` : ""}
          </span>
        } />
        <Row icon={Network}      label={t("why.patternMatch")} value={loaded.pattern_match ? t("why.yes") : t("why.no")} />
        <Row icon={Brain}        label={t("why.aiConfidence")} value={`${loaded.ai_confidence}%`} />
      </ul>
<Separator />

<div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
  <div className="flex items-center gap-2 mb-2">
    <AlertTriangle className="h-4 w-4 text-amber-500" />
    <span className="font-semibold text-sm">
      Recommended Safety Actions
    </span>
  </div>

  <ul className="text-sm space-y-1 text-muted-foreground">
    <li>• Verify identities through an independent communication channel.</li>
    <li>• Never share OTPs, passwords, PINs, or banking credentials.</li>
    <li>• Do not send money until legitimacy is confirmed.</li>
    <li>• Report suspicious behaviour to CAMALERT and relevant authorities.</li>
  </ul>
</div>
      {!compact && phrases.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> {t("why.suspiciousPhrases")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {phrases.map((p) => (
                <span key={p} className="text-[11px] rounded-md bg-amber-400/15 border border-amber-500/30 px-2 py-0.5 font-mono">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {!compact && loaded.related_report_ids && loaded.related_report_ids.length > 0 && (
        <>
          <Separator />
          <div className="text-xs text-muted-foreground">
            {t("why.relatedPrefix")} <span className="font-semibold text-foreground">{loaded.related_report_ids.length}</span>{" "}
            {t("why.relatedSuffix", { count: loaded.related_report_ids.length })}
          </div>
        </>
      )}
    </Card>
  );
}

function ScoreChip({ label, value, max, tone }: { label: string; value: number; max: number; tone: "blue" | "purple" | "emerald" }) {
  const pct = Math.round((value / max) * 100);
  const toneCls = {
    blue:    "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    purple:  "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  }[tone];
  return (
    <div className={cn("rounded-md border px-2 py-1.5 flex flex-col gap-0.5", toneCls)}>
      <span className="opacity-80">{label}</span>
      <span className="font-bold tabular-nums">+{value}<span className="opacity-60 font-normal text-[10px]">/{max}</span></span>
      <span className="opacity-60 text-[10px]">{pct}%</span>
    </div>
  );
}
