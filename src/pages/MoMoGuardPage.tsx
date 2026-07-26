import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Smartphone, AlertTriangle, ShieldCheck, Search, PhoneCall, Flag, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReportCard, type Report } from "@/components/ReportCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const PATTERN_KEYS = ["p1", "p2", "p3", "p4", "p5", "p6"] as const;
const STEP_KEYS = [
  { key: "s1", icon: PhoneCall },
  { key: "s2", icon: Flag },
  { key: "s3", icon: ShieldCheck },
  { key: "s4", icon: ArrowRight },
] as const;

export default function MoMoGuardPage() {
  const { t } = useTranslation();

  const [reports, setReports] = useState<Report[] | null>(null);
  const [reportCount, setReportCount] = useState(0);

  // Phone lookup state
  const [phoneLookup, setPhoneLookup] = useState("");
  const [lookupResult, setLookupResult] = useState<{ phone_number: string; description: string }[] | null>(null);
  const [loadingLookup, setLoadingLookup] = useState(false);

  useEffect(() => {
    supabase
      .from("public_scam_reports")
      .select("id, location, description, scam_type, ai_confidence, ai_advice, risk_level, created_at")
      .eq("scam_type", "mobile_money")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        const rows = data || [];
        setReports(rows);
        setReportCount(rows.length);
      });
  }, []);

  const handleLookup = async () => {
    if (!phoneLookup.trim()) return;
    setLoadingLookup(true);
    const { data, error } = await supabase
      .from("public_scam_reports")
      .select("phone_number, description")
      .eq("phone_number", phoneLookup.trim());
    if (error) {
      console.error(error);
      setLookupResult(null);
    } else {
      setLookupResult(data || []);
    }
    setLoadingLookup(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-scam-mobile/20 via-background to-background" />
          <div className="container py-16 md:py-24 relative">
            <div className="max-w-3xl space-y-6 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-scam-mobile/15 border border-scam-mobile/40 text-sm font-bold text-scam-mobile">
                <Smartphone className="h-4 w-4" /> MoMo Guard
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tighter">
                {t("momoGuardPage.heroTitle")}{" "}
                <span className="text-gradient-gold">Mobile Money</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {t("momoGuardPage.heroSubtitle")}
              </p>
              <div className="mt-6 flex gap-4 flex-wrap items-center">
                <div className="glass-card px-5 py-3">
                  <div className="text-2xl font-bold text-scam-mobile">{reportCount}</div>
                  <div className="text-xs text-muted-foreground">{t("momoGuardPage.reportsLoggedLabel")}</div>
                </div>
                <Link
                  to="/report"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-scam-mobile text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  <Flag className="h-4 w-4" />
                  {t("momoGuardPage.reportScamCta")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Phone Number Lookup */}
        <section className="container py-12">
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <Search className="h-6 w-6 text-scam-mobile" />
              <h2 className="font-display text-2xl font-bold">
                {t("momoGuardPage.checkNumberTitle")}
              </h2>
            </div>
            <p className="text-muted-foreground mb-4">
              {t("momoGuardPage.checkNumberSubtitle")}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t("momoGuardPage.phonePlaceholder")}
                value={phoneLookup}
                onChange={(e) => setPhoneLookup(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                className="flex-1 px-4 py-2 border rounded-lg bg-background"
              />
              <button
                onClick={handleLookup}
                disabled={loadingLookup}
                className="px-5 py-2 rounded-lg bg-scam-mobile text-white font-bold disabled:opacity-50"
              >
                {loadingLookup ? t("momoGuardPage.searching") : t("momoGuardPage.searchBtn")}
              </button>
            </div>
            {lookupResult !== null && (
              <div className="mt-4 rounded-lg border p-4">
                {lookupResult.length === 0 ? (
                  <p className="text-green-600 font-medium">
                    {t("momoGuardPage.noReportsFound")}
                  </p>
                ) : (
                  <>
                    <p className="font-bold text-destructive mb-2">
                      ⚠️ {lookupResult.length} {t("momoGuardPage.reportsFoundSuffix")}
                    </p>
                    {lookupResult.map((r, i) => (
                      <div key={i} className="mt-2 border-t pt-2 text-sm text-muted-foreground">
                        {r.description}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Fraud patterns */}
        <section className="container py-16">
          <h2 className="font-display text-3xl font-bold mb-8 flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-scam-mobile" />
            {t("momoGuardPage.patternsTitle")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {PATTERN_KEYS.map((key) => (
              <Card key={key} className="glass-card p-6 border-l-4 border-l-scam-mobile">
                <h3 className="font-display font-bold text-lg mb-2">{t(`momoGuardPage.patterns.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`momoGuardPage.patterns.${key}.desc`)}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Golden rule */}
        <section className="container py-8">
          <div className="glass-card rounded-2xl p-6 md:p-8 border-l-4 border-l-accent">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-8 w-8 text-accent shrink-0" />
              <div>
                <h3 className="font-display font-bold text-xl mb-2">
                  {t("momoGuardPage.goldenRuleTitle")}
                </h3>
                <p className="text-foreground/90">
                  {t("momoGuardPage.goldenRuleBody")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What to do if scammed */}
        <section className="container py-16">
          <h2 className="font-display text-3xl font-bold mb-8">
            {t("momoGuardPage.whatToDoTitle")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STEP_KEYS.map(({ key, icon: Icon }, i) => (
              <Card key={key} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-scam-mobile/15 flex items-center justify-center text-scam-mobile font-bold text-sm">
                    {i + 1}
                  </div>
                  <Icon className="h-5 w-5 text-scam-mobile" />
                </div>
                <h3 className="font-display font-bold text-base mb-1">{t(`momoGuardPage.steps.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`momoGuardPage.steps.${key}.desc`)}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent reports */}
        <section className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold">
              {t("momoGuardPage.recentReportsTitle")}
            </h2>
            <Link
              to="/reports"
              className="inline-flex items-center gap-1 text-sm font-medium text-scam-mobile hover:underline"
            >
              {t("momoGuardPage.viewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {reports === null ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : reports.length === 0 ? (
            <p className="text-muted-foreground">{t("reports.empty")}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reports.map((r) => <ReportCard key={r.id} report={r} />)}
            </div>
          )}
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
