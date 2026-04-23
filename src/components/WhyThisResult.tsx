import { useEffect, useState } from "react";
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
  /** Pass when explaining a stored report (will fetch via RPC). */
  reportId?: string;
  /** Pass when explaining a freshly submitted, not-yet-stored result. */
  data?: ExplainData;
  /** Description text — used for suspicious-phrase extraction. */
  description?: string;
  className?: string;
  compact?: boolean;
}

const RISK_COLOR = (score: number) =>
  score >= 70 ? "bg-destructive" : score >= 35 ? "bg-amber-500" : "bg-emerald-500";

export function WhyThisResult({ reportId, data, description, className, compact }: Props) {
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
        <Loader2 className="h-4 w-4 animate-spin" /> Building explanation…
      </Card>
    );
  }
  if (!loaded) return null;

  const phrases = description ? suspiciousPhrases(description) : [];
  const risk = loaded.risk?.total ?? 0;

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
          <h3 className="font-semibold text-sm">Why this result</h3>
        </div>
        <ThresholdBadge status={loaded.status} count={loaded.total_reports} />
      </header>

      {/* Risk score with breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Combined risk score</span>
          <span className="font-bold tabular-nums">{risk}/100</span>
        </div>
        <Progress value={risk} className={cn("h-2 [&>div]:transition-all", `[&>div]:${RISK_COLOR(risk)}`)} />
        <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
          <ScoreChip label="Reports" value={loaded.risk?.reports ?? 0} max={40} tone="blue" />
          <ScoreChip label="Patterns" value={loaded.risk?.pattern ?? 0} max={40} tone="purple" />
          <ScoreChip label="AI" value={loaded.risk?.ai ?? 0} max={35} tone="emerald" />
        </div>
      </div>

      <Separator />

      <ul className="space-y-2">
        <Row icon={FileBarChart} label="Total reports on this number" value={loaded.total_reports} />
        <Row icon={Activity}     label="In the last 24 hours" value={
          <span className={loaded.spike ? "text-destructive" : ""}>
            {loaded.recent_24h}{loaded.spike ? " · spike" : ""}
          </span>
        } />
        <Row icon={Network}      label="Pattern match detected" value={loaded.pattern_match ? "Yes" : "No"} />
        <Row icon={Brain}        label="AI confidence" value={`${loaded.ai_confidence}%`} />
      </ul>

      {!compact && phrases.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Suspicious phrases detected
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
            Linked to <span className="font-semibold text-foreground">{loaded.related_report_ids.length}</span> related report{loaded.related_report_ids.length === 1 ? "" : "s"} on the same number.
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
