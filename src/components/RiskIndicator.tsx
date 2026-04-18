import { RiskLevel, RISK_META } from "@/lib/scam-types";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";

const ICONS = { low: ShieldCheck, medium: ShieldQuestion, high: ShieldAlert } as const;

export function RiskIndicator({ level, className }: { level: RiskLevel; className?: string }) {
  const { t } = useTranslation();
  const Icon = ICONS[level];
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", RISK_META[level].color, className)}>
      <Icon className="h-4 w-4" />
      {t(`risk.${level}`)}
    </div>
  );
}
