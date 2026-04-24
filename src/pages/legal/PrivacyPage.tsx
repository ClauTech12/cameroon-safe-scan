import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">{t("legal.privacy.title")}</h1>
        <p className="text-muted-foreground">{t("legal.sub")}</p>

        <h2 className="mt-8">{t("legal.privacy.h1")}</h2>
        <ul>
          <li>{t("legal.privacy.i1")}</li>
          <li>{t("legal.privacy.i2")}</li>
          <li>{t("legal.privacy.i3")}</li>
          <li>{t("legal.privacy.i4")}</li>
        </ul>

        <h2>{t("legal.privacy.h2")}</h2>
        <ul>
          <li>{t("legal.privacy.i5")}</li>
          <li>{t("legal.privacy.i6")}</li>
          <li>{t("legal.privacy.i7")}</li>
          <li>{t("legal.privacy.i8")}</li>
        </ul>

        <h2>{t("legal.privacy.h3")}</h2>
        <p>{t("legal.privacy.p3")}</p>

        <h2>{t("legal.privacy.h4")}</h2>
        <p>{t("legal.privacy.p4")}</p>

        <h2>{t("legal.privacy.h5")}</h2>
        <p>{t("legal.privacy.p5")}</p>

        <h2>{t("legal.privacy.h6")}</h2>
        <p>{t("legal.privacy.p6")}</p>

        <h2>{t("legal.privacy.h7")}</h2>
        <p>{t("legal.privacy.p7")} <a href="mailto:Camalert2026@gmail.com">Camalert2026@gmail.com</a></p>
      </main>
      <SiteFooter />
    </div>
  );
}
