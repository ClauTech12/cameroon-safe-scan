import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function PrivacyPage() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">{t("legal.privacy.title")}</h1>
        <p className="text-muted-foreground">{t("legal.privacy.lastUpdated", { year })}</p>

        <h2 className="mt-8">{t("legal.privacy.s1Title")}</h2>
        <p>{t("legal.privacy.s1Body")}</p>

        <h2>{t("legal.privacy.s2Title")}</h2>
        <ul>
          <li>{t("legal.privacy.s2i1")}</li>
          <li>{t("legal.privacy.s2i2")}</li>
          <li>{t("legal.privacy.s2i3")}</li>
          <li>{t("legal.privacy.s2i4")}</li>
        </ul>

        <h2>{t("legal.privacy.s3Title")}</h2>
        <ul>
          <li>{t("legal.privacy.s3i1")}</li>
          <li>{t("legal.privacy.s3i2")}</li>
          <li>{t("legal.privacy.s3i3")}</li>
          <li>{t("legal.privacy.s3i4")}</li>
          <li>{t("legal.privacy.s3i5")}</li>
        </ul>

        <h2>{t("legal.privacy.s4Title")}</h2>
        <p>{t("legal.privacy.s4Body")}</p>

        <h2>{t("legal.privacy.s5Title")}</h2>
        <ul>
          <li>{t("legal.privacy.s5i1")}</li>
          <li>{t("legal.privacy.s5i2")}</li>
          <li>{t("legal.privacy.s5i3")}</li>
          <li>{t("legal.privacy.s5i4")}</li>
          <li>{t("legal.privacy.s5i5")}</li>
        </ul>

        <h2>{t("legal.privacy.s6Title")}</h2>
        <p>{t("legal.privacy.s6Body")}</p>

        <h2>{t("legal.privacy.s7Title")}</h2>
        <ul>
          <li>{t("legal.privacy.s7i1")}</li>
          <li>{t("legal.privacy.s7i2")}</li>
          <li>{t("legal.privacy.s7i3")}</li>
          <li>{t("legal.privacy.s7i4")}</li>
          <li>{t("legal.privacy.s7i5")}</li>
        </ul>

        <h2>{t("legal.privacy.s8Title")}</h2>
        <p>{t("legal.privacy.s8Body")}</p>

        <h2>{t("legal.privacy.s9Title")}</h2>
        <p>{t("legal.privacy.s9Body")}</p>

        <h2>{t("legal.privacy.s10Title")}</h2>
        <p>{t("legal.privacy.s10Body")}</p>

        <h2>{t("legal.privacy.s11Title")}</h2>
        <ul>
          <li>{t("legal.privacy.s11i1")}</li>
          <li>{t("legal.privacy.s11i2")}</li>
          <li>{t("legal.privacy.s11i3")}</li>
          <li>{t("legal.privacy.s11i4")}</li>
        </ul>

        <h2>{t("legal.privacy.s12Title")}</h2>
        <p>{t("legal.privacy.s12Body")}</p>

        <h2>{t("legal.privacy.s13Title")}</h2>
        <p>
          {t("legal.privacy.s13Body1")}{" "}
          <a href="mailto:clauvetmt19988@gmail.com">clauvetmt19988@gmail.com</a>
        </p>
        <p>{t("legal.privacy.s13Body2", { days: 7 })}</p>
        <p>{t("legal.privacy.footer", { year })}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
