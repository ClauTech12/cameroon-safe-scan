import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function TermsPage() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">{t("legal.terms.title")}</h1>
        <p className="text-muted-foreground">{t("legal.terms.lastUpdated", { year })}</p>

        <h2 className="mt-8">{t("legal.terms.s1Title")}</h2>
        <p>{t("legal.terms.s1Body")}</p>

        <h2>{t("legal.terms.s2Title")}</h2>
        <p>{t("legal.terms.s2Body")}</p>

        <h2>{t("legal.terms.s3Title")}</h2>
        <ul>
          <li>{t("legal.terms.s3i1")}</li>
          <li>{t("legal.terms.s3i2")}</li>
          <li>{t("legal.terms.s3i3")}</li>
          <li>{t("legal.terms.s3i4")}</li>
          <li>{t("legal.terms.s3i5")}</li>
        </ul>

        <h2>{t("legal.terms.s4Title")}</h2>
        <ul>
          <li>{t("legal.terms.s4i1")}</li>
          <li>{t("legal.terms.s4i2")}</li>
          <li>{t("legal.terms.s4i3")}</li>
          <li>{t("legal.terms.s4i4")}</li>
        </ul>

        <h2>{t("legal.terms.s5Title")}</h2>
        <ul>
          <li>{t("legal.terms.s5i1")}</li>
          <li>{t("legal.terms.s5i2")}</li>
          <li>{t("legal.terms.s5i3")}</li>
          <li>{t("legal.terms.s5i4")}</li>
          <li>{t("legal.terms.s5i5")}</li>
          <li>{t("legal.terms.s5i6")}</li>
        </ul>

        <h2>{t("legal.terms.s6Title")}</h2>
        <p>{t("legal.terms.s6Intro")}</p>
        <ul>
          <li>
            {t("legal.terms.s6i1Pre")} <a href="mailto:clauvetmt19988@gmail.com">clauvetmt19988@gmail.com</a> {t("legal.terms.s6i1Post")}
          </li>
          <li>{t("legal.terms.s6i2")}</li>
          <li>{t("legal.terms.s6i3", { days: 7 })}</li>
          <li>{t("legal.terms.s6i4")}</li>
          <li>{t("legal.terms.s6i5")}</li>
        </ul>

        <h2>{t("legal.terms.s7Title")}</h2>
        <p>{t("legal.terms.s7Intro")}</p>
        <ul>
          <li>
            {t("legal.terms.s7i1Pre")} <a href="mailto:clauvetmt19988@gmail.com">clauvetmt19988@gmail.com</a> {t("legal.terms.s7i1Post")}
          </li>
          <li>{t("legal.terms.s7i2")}</li>
          <li>{t("legal.terms.s7i3", { days: 7 })}</li>
        </ul>

        <h2>{t("legal.terms.s8Title")}</h2>
        <p>{t("legal.terms.s8Body")}</p>

        <h2>{t("legal.terms.s9Title")}</h2>
        <p>{t("legal.terms.s9Body")}</p>

        <h2>{t("legal.terms.s10Title")}</h2>
        <p>{t("legal.terms.s10Body")}</p>

        <h2>{t("legal.terms.s11Title")}</h2>
        <p>{t("legal.terms.s11Body")}</p>

        <h2>{t("legal.terms.s12Title")}</h2>
        <p>
          {t("legal.terms.s12Body")}{" "}
          <a href="mailto:clauvetmt19988@gmail.com">clauvetmt19988@gmail.com</a>
        </p>
        <p>{t("legal.terms.footer", { year })}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
