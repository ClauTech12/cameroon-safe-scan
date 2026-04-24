import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">{t("legal.terms.title")}</h1>
        <p className="text-muted-foreground">{t("legal.sub")}</p>

        <h2 className="mt-8">{t("legal.terms.h1")}</h2>
        <ul>
          <li>{t("legal.terms.i1")}</li>
          <li>{t("legal.terms.i2")}</li>
        </ul>

        <h2>{t("legal.terms.h2")}</h2>
        <p>{t("legal.terms.p2")}</p>

        <h2>{t("legal.terms.h3")}</h2>
        <p>{t("legal.terms.p3")}</p>

        <h2>{t("legal.terms.h4")}</h2>
        <ul>
          <li>{t("legal.terms.i3")}</li>
          <li>{t("legal.terms.i4")}</li>
          <li>{t("legal.terms.i5")}</li>
        </ul>

        <h2>{t("legal.terms.h5")}</h2>
        <p>{t("legal.terms.p5")}</p>

        <h2>{t("legal.terms.h6")}</h2>
        <p>{t("legal.terms.p6")}</p>

        <h2>{t("legal.terms.h7")}</h2>
        <p>{t("legal.terms.p7")}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
