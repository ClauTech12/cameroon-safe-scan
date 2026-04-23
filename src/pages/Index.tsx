import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ReportList } from "@/components/ReportList";
import { Sparkles, Languages, Smartphone, Lock, ArrowRight, ShieldCheck, CheckCircle2, Search, Users, Brain, Radio } from "lucide-react";
import { SCAM_TYPES, SCAM_META } from "@/lib/scam-types";

const Index = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ reports: 0, types: SCAM_TYPES.length, protected: 0 });

  useEffect(() => {
    supabase
      .from("scam_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .then(({ count }) => {
        setStats((s) => ({ ...s, reports: count || 0, protected: (count || 0) * 17 }));
      });
  }, []);

  const features = [
    { icon: Sparkles, title: t("features.aiTitle"), desc: t("features.aiDesc") },
    { icon: Languages, title: t("features.bilingualTitle"), desc: t("features.bilingualDesc") },
    { icon: Smartphone, title: t("features.momoTitle"), desc: t("features.momoDesc") },
    { icon: Lock, title: t("features.secureTitle"), desc: t("features.secureDesc") },
  ];


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
          <div className="container relative pt-16 md:pt-24 pb-16 md:pb-20 px-5 md:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-xs text-xs font-medium text-foreground/80">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                {t("hero.badge")}
              </div>
              <h1 className="font-display text-[2.5rem] sm:text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight text-foreground">
                {t("hero.title")}{" "}
                <span className="text-gradient-primary">{t("hero.titleAccent")}</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/75 max-w-2xl mx-auto leading-[1.65]">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base h-13 px-8 rounded-full shadow-glow hover:shadow-lg transition-smooth hover:-translate-y-0.5">
                  <Link to="/check">
                    <Search className="h-4 w-4" /> Check a Number <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-semibold text-base h-12 px-7 rounded-full border-border bg-card hover:bg-secondary">
                  <Link to="/report">{t("hero.ctaReport")}</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="font-semibold text-base h-12 px-6 rounded-full text-muted-foreground hover:text-foreground">
                  <Link to="/reports">{t("hero.ctaBrowse")}</Link>
                </Button>
              </div>

              {/* Trust micro-strip */}
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-5">
                {[
                  { icon: Radio, label: "Real-time scam detection" },
                  { icon: Users, label: "Community-powered reports" },
                  { icon: Brain, label: "AI risk analysis" },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-accent" /> {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats card */}
            <div className="mt-16 md:mt-20 max-w-4xl mx-auto">
              <div className="surface-elevated grid grid-cols-3 divide-x divide-border/60 overflow-hidden">
                {[
                  { v: stats.reports, k: "reports" },
                  { v: stats.protected, k: "protected" },
                  { v: stats.types, k: "types" },
                ].map(({ v, k }) => (
                  <div key={k} className="px-4 py-6 md:py-8 text-center">
                    <div className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground tabular-nums">{v.toLocaleString()}</div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1.5 font-medium">
                      {t(`hero.stats.${k}`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="container py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Why CamAlert</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              {t("features.title")}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={i} className="surface-card p-6 lift-on-hover">
                <div className="h-10 w-10 rounded-lg bg-accent/10 grid place-items-center mb-4">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-base mb-1.5 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SCAM CATEGORIES */}
        <section className="container py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Categories</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Tracked scam types</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {SCAM_TYPES.map((type) => {
              const meta = SCAM_META[type];
              const Icon = meta.icon;
              return (
                <div key={type} className="surface-card p-4 lift-on-hover text-center">
                  <div
                    className="h-10 w-10 rounded-lg mx-auto mb-3 grid place-items-center"
                    style={{ background: `hsl(var(--scam-${type === "mobile_money" ? "mobile" : type}) / 0.12)` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: meta.hex }} />
                  </div>
                  <div className="text-xs font-semibold text-foreground">{t(`scamTypes.${type}`)}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RECENT REPORTS */}
        <section className="container py-16 md:py-24">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="text-xs font-semibold text-accent uppercase tracking-widest mb-2">Live feed</div>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">{t("reports.title")}</h2>
              <p className="text-muted-foreground mt-2">{t("reports.subtitle")}</p>
            </div>
            <Button asChild variant="ghost" className="text-foreground font-semibold">
              <Link to="/reports">{t("hero.ctaBrowse")} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <ReportList limit={6} />
        </section>

        {/* CTA */}
        <section className="container pb-20 md:pb-28">
          <div className="surface-elevated p-8 md:p-14 text-center bg-gradient-hero text-white border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-mesh opacity-50 pointer-events-none" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Spotted something suspicious?
              </h2>
              <p className="text-white/70 max-w-xl mx-auto mb-7">
                Report it in 30 seconds. AI analyzes it instantly and shares safety advice.
              </p>
              <Button asChild size="lg" className="bg-white text-foreground hover:bg-white/90 font-semibold rounded-full h-12 px-7">
                <Link to="/report">{t("hero.ctaReport")} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
