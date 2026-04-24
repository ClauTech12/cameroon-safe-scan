import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, ShieldQuestion, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThresholdStatus = "unverified" | "suspicious" | "high_risk_scam" | "verified" | "cleared" | "unknown";

const META: Record<ThresholdStatus, { cls: string; Icon: typeof ShieldAlert }> = {
  unknown:        { cls: "bg-muted text-muted-foreground border-border", Icon: ShieldQuestion },
  unverified:     { cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30", Icon: ShieldQuestion },
  suspicious:     { cls: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30", Icon: AlertTriangle },
  high_risk_scam: { cls: "bg-destructive/10 text-destructive border-destructive/30", Icon: ShieldAlert },
  verified:       { cls: "bg-destructive text-destructive-foreground border-destructive", Icon: ShieldAlert },
  cleared:        { cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", Icon: ShieldCheck },
};

export function ThresholdBadge({ status, count, className }: { status: ThresholdStatus; count?: number; className?: string }) {
  const { t } = useTranslation();
  const m = META[status] ?? META.unknown;
  const Icon = m.Icon;
  const label = t(`threshold.${status}`);
  return (
    <Badge variant="outline" className={cn("gap-1.5 border font-semibold", m.cls, className)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
      {typeof count === "number" && count > 0 && (
        <span className="ml-1 text-[10px] opacity-80">
          · {count} {t("threshold.reportSuffix", { count })}
        </span>
      )}
    </Badge>
  );
}
