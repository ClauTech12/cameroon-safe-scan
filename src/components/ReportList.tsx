import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReportCard, type Report } from "./ReportCard";
import { SCAM_TYPES } from "@/lib/scam-types";
import { Skeleton } from "./ui/skeleton";
import { useTranslation } from "react-i18next";
import { Inbox } from "lucide-react";

export function ReportList({ limit }: { limit?: number }) {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[] | null>(null);
const [selectedCategory, setSelectedCategory] = useState<string>("all");
const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      let q = supabase
        .from("scam_reports")
        .select("id, reporter_name, location, description, contact_info, scam_type, ai_confidence, ai_advice, risk_level, status, created_at, phone_number")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (!active) return;
      if (error) { console.error(error); setReports([]); return; }
      setReports((data as Report[]) || []);
    })();
    return () => { active = false; };
  }, [limit]);

  if (reports === null) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: limit || 6 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
      ))}
    </div>
  );
}
const filteredReports = reports?.filter((report) => {
  const matchesCategory =
    selectedCategory === "all" ||
    report.scam_type === selectedCategory;

  const query = searchTerm.toLowerCase();

  const matchesSearch =
    report.description?.toLowerCase().includes(query) ||
    report.location?.toLowerCase().includes(query) ||
    report.reporter_name?.toLowerCase().includes(query) ||
    report.phone_number?.toLowerCase().includes(query) ||
    report.contact_info?.toLowerCase().includes(query);

  return matchesCategory && matchesSearch;
});
  if (reports.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{t("reports.empty")}</p>
      </div>
    );
  }
  return (
  <>
    <div className="mb-4 space-y-3">
  <h2 className="text-xl font-bold">
    Scam Reports ({filteredReports?.length ?? 0})
  </h2>
<input
  type="text"
  placeholder="Search phone number, name or keyword..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="w-full px-3 py-2 border rounded-lg"
/>
  <div className="flex flex-wrap gap-2">
    <button
  onClick={() => setSelectedCategory("all")}
  className={`px-3 py-1 rounded border transition-colors ${
    selectedCategory === "all"
      ? "bg-primary text-primary-foreground"
      : "hover:bg-secondary"
  }`}
>
  {t("common.all") || "All"}
</button>

    {SCAM_TYPES.map((type) => (
  <button
    key={type}
    onClick={() => setSelectedCategory(type)}
    className={`px-3 py-1 rounded border transition-colors ${
      selectedCategory === type
        ? "bg-primary text-primary-foreground"
        : "hover:bg-secondary"
    }`}
  >
    {t(`scamTypes.${type}`)}
  </button>
))}
  </div>
</div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredReports?.map((r) => (
  <ReportCard key={r.id} report={r} />
))}
    </div>
  </>
);
}