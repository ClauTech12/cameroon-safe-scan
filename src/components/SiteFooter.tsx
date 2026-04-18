import { useTranslation } from "react-i18next";
import { ClauTechLogo, BrandMark } from "./BrandMark";

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="mt-24 border-t border-border/50 bg-card/30">
      <div className="container py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-3">
          <BrandMark size="sm" />
          <p className="text-xs text-muted-foreground max-w-xs text-center md:text-left">
            {t("brand.tagline")}
          </p>
        </div>
        <div className="flex flex-col items-center md:items-end gap-2">
          <ClauTechLogo className="h-10 opacity-90" />
          <p className="text-xs text-muted-foreground">{t("brand.poweredBy")}</p>
        </div>
      </div>
    </footer>
  );
}
