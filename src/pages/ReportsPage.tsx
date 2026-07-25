import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ReportList } from "@/components/ReportList";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function exportToCSV(data: Record<string, unknown>[]) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = val === null || val === undefined ? "" : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `camalert-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const { data, error } = await supabase
      .from("public_scam_reports")
      .select("id, reporter_name, location, description, scam_type, risk_level, ai_confidence, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else if (data) {
      exportToCSV(data as Record<string, unknown>[]);
    }
    setExporting(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-12">
        <header className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              {t("reports.title")}
            </h1>
            <p className="text-muted-foreground">{t("reports.subtitle")}</p>
          </div>
          <Button
            onClick={handleExport}
            disabled={exporting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </header>

        <ReportList />
      </main>
      <SiteFooter />
    </div>
  );
}