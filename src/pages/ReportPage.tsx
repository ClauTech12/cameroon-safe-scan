import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ReportForm } from "@/components/ReportForm";

export default function ReportPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-12 md:py-16">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="text-center space-y-3">
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              {t("form.title")}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("form.subtitle")}</p>
          </header>
          <ReportForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
