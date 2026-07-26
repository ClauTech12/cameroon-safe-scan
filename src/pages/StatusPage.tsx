import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, Clock, Search } from "lucide-react";

type Status = "pending" | "approved" | "rejected";

interface Report {
  id: string;
  status: Status;
  scam_type: string;
  risk_level: string;
  location: string;
  created_at: string;
  description: string;
}

function StatusBadge({ status, t }: { status: Status; t: (key: string) => string }) {
  if (status === "approved") return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold text-sm w-fit">
      <ShieldCheck className="h-4 w-4" /> {t("statusPage.badge.approved")}
    </div>
  );
  if (status === "rejected") return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-semibold text-sm w-fit">
      <AlertTriangle className="h-4 w-4" /> {t("statusPage.badge.rejected")}
    </div>
  );
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 font-semibold text-sm w-fit">
      <Clock className="h-4 w-4" /> {t("statusPage.badge.pending")}
    </div>
  );
}

export default function StatusPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [reportId, setReportId] = useState(searchParams.get("id") ?? "");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("id")) handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    if (!reportId.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    // Try the base table first -- covers a logged-in submitter checking
    // their own report at any status (RLS: "Submitters can view their
    // own reports") and admins. Anonymous visitors have no base-table
    // read policy anymore, so this simply returns nothing for them.
    let { data, error } = await supabase
      .from("scam_reports")
      .select("id, status, scam_type, risk_level, location, created_at, description")
      .eq("id", reportId.trim())
      .maybeSingle();

    // Fall back to the public safe view -- covers anonymous visitors
    // checking a report that has since been approved.
    if (!data) {
      const fallback = await supabase
        .from("public_scam_reports")
        .select("id, status, scam_type, risk_level, location, created_at, description")
        .eq("id", reportId.trim())
        .maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) {
      setReport(null);
      setError(t("statusPage.notFoundError"));
    } else {
      setReport(data as Report);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 space-y-2 text-center">
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              {t("statusPage.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("statusPage.subtitle")}
            </p>
          </div>

          <Card className="glass-card p-6 mb-6">
            <div className="flex gap-2">
              <Input
                placeholder={t("statusPage.placeholder")}
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 font-mono text-sm"
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? t("statusPage.searching") : t("statusPage.checkBtn")}
              </Button>
            </div>
          </Card>

          {searched && !loading && (
            <>
              {error && (
                <Card className="glass-card p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                </Card>
              )}
              {report && (
                <Card className="glass-card p-6 space-y-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t("statusPage.reportIdLabel")}</p>
                      <p className="font-mono text-sm font-bold break-all">{report.id}</p>
                    </div>
                    <StatusBadge status={report.status} t={t} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/60">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("statusPage.scamTypeLabel")}</p>
                      <p className="text-sm font-semibold capitalize">{report.scam_type.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("statusPage.riskLevelLabel")}</p>
                      <p className="text-sm font-semibold capitalize">{report.risk_level}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("statusPage.locationLabel")}</p>
                      <p className="text-sm font-semibold">{report.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("statusPage.submittedLabel")}</p>
                      <p className="text-sm font-semibold">{new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60">
                    <p className="text-xs text-muted-foreground mb-1">{t("statusPage.descriptionLabel")}</p>
                    <p className="text-sm text-foreground/80 line-clamp-3">{report.description}</p>
                  </div>

                  {report.status === "pending" && (
                    <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 text-xs text-orange-700 dark:text-orange-300">
                      {t("statusPage.statusNote.pending")}
                    </div>
                  )}
                  {report.status === "approved" && (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                      {t("statusPage.statusNote.approved")}
                    </div>
                  )}
                  {report.status === "rejected" && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                      {t("statusPage.statusNote.rejected")}
                    </div>
                  )}
                </Card>
              )}
            </>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            {t("statusPage.noIdPre")}{" "}
            <Link to="/report" className="text-accent hover:underline">{t("statusPage.submitLink")}</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
