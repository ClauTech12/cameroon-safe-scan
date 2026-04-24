import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AlertTriangle } from "lucide-react";

export default function DisclaimerPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <div className="not-prose flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 grid place-items-center">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">{t("legal.disclaimer.title")}</h1>
            <p className="text-muted-foreground text-sm">{t("legal.sub")}</p>
          </div>
        </div>
        <ul>
          <li>{t("legal.disclaimer.i1")}</li>
          <li>{t("legal.disclaimer.i2")}</li>
          <li>{t("legal.disclaimer.i3")}</li>
          <li>{t("legal.disclaimer.i4")}</li>
        </ul>
        <p><strong>{t("legal.disclaimer.strong")}</strong></p>
      </main>
      <SiteFooter />
    </div>
  );
}
