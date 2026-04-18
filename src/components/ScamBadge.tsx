import { useTranslation } from "react-i18next";
import { ScamType, SCAM_META } from "@/lib/scam-types";
import { cn } from "@/lib/utils";

export function ScamBadge({ type, confidence, className }: { type: ScamType; confidence?: number | null; className?: string }) {
  const { t } = useTranslation();
  const meta = SCAM_META[type];
  const Icon = meta.icon;
  const tokenKey = type === "mobile_money" ? "mobile" : type;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide",
        className,
      )}
      style={{
        color: meta.hex,
        background: `hsl(var(--scam-${tokenKey}) / 0.12)`,
        border: `1px solid hsl(var(--scam-${tokenKey}) / 0.25)`,
      }}
    >
      <Icon className="h-3 w-3" />
      <span>{t(`scamTypes.${type}`)}</span>
      {typeof confidence === "number" && (
        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-foreground/10 text-[10px] tabular-nums text-foreground/80">
          {confidence}%
        </span>
      )}
    </div>
  );
}
