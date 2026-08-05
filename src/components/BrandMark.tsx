import { useTranslation } from "react-i18next";
import logo from "@/assets/camalert-logo.webp";
import clautechLogo from "@/assets/clautech-logo.png";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { t } = useTranslation();
  const dim = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logo}
        alt="CAMALERT"
        className={`${dim} rounded-xl object-contain`}
        aria-hidden="true"
      />
      <div className="flex flex-col leading-none">
        <span className={`font-display font-extrabold tracking-tight ${text} text-foreground`}>
          CAM<span className="text-accent">ALERT</span>
        </span>
        {size !== "sm" && (
          <span className="text-[10px] text-muted-foreground font-semibold tracking-[0.18em] uppercase mt-1">
            {t("footer.cyberTrustTag")}
          </span>
        )}
      </div>
    </div>
  );
}

export function ClauTechLogo({ className = "" }: { className?: string }) {
  return <img src={clautechLogo} alt="ClauTech Digital Solutions" className={className} loading="lazy" width="200" height="60" />;
}