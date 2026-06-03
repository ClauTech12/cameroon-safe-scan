import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ReportList } from "@/components/ReportList";

export default function ReportsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-12">
        <header className="mb-8 space-y-2">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">{t("reports.title")}</h1>
          <p className="text-muted-foreground">{t("reports.subtitle")}</p>
        </header>
        <div className="mb-8 rounded-xl border p-6">
  <h2 className="text-2xl font-bold mb-2">
    Phone Number Lookup
  </h2>

  <p className="text-muted-foreground mb-4">
    Check if a phone number has been reported before sending money.
  </p>

  <input
    type="text"
    placeholder="Enter phone number..."
    className="w-full px-3 py-2 border rounded-lg"
  />
</div>

<ReportList />
      </main>
      <SiteFooter />
    </div>
  );
}
