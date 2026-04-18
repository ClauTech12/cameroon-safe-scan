import { useTranslation } from "react-i18next";
import { ScamType, SCAM_META } from "@/lib/scam-types";
import { cn } from "@/lib/utils";

export function ScamBadge({ type, confidence, className }: { type: ScamType; confidence?: number | null; className?: string }) {
  const { t } = useTranslation();
  const meta = SCAM_META[type];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide",
        meta.ring,
        meta.text,
        "border",
        meta.border,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{t(`scamTypes.${type}`)}</span>
      {typeof confidence === "number" && (
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-foreground/10 text-[10px] tabular-nums">
          {confidence}%
        </span>
      )}
    </div>
  );
}
