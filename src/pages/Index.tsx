import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ReportList } from "@/components/ReportList";
import { Sparkles, ShieldCheck, Languages, Smartphone, Lock, ArrowRight } from "lucide-react";
import { SCAM_TYPES } from "@/lib/scam-types";

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
    { icon: Sparkles, title: t("features.aiTitle"), desc: t("features.aiDesc"), color: "text-accent", bg: "bg-accent/10" },
    { icon: Languages, title: t("features.bilingualTitle"), desc: t("features.bilingualDesc"), color: "text-primary", bg: "bg-primary/10" },
    { icon: Smartphone, title: t("features.momoTitle"), desc: t("features.momoDesc"), color: "text-scam-mobile", bg: "bg-scam-mobile/10" },
    { icon: Lock, title: t("features.secureTitle"), desc: t("features.secureDesc"), color: "text-scam-investment", bg: "bg-scam-investment/10" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-shield">
          <div className="container py-20 md:py-32 relative">
            <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                {t("hero.badge")}
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tighter">
                {t("hero.title")}{" "}
                <span className="text-gradient-gold">{t("hero.titleAccent")}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow font-semibold text-base px-8 h-12">
                  <Link to="/report"><Sparkles className="h-5 w-5" /> {t("hero.ctaReport")}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-semibold text-base px-8 h-12 border-border/70 hover:bg-secondary/60">
                  <Link to="/reports">{t("hero.ctaBrowse")} <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-12 max-w-xl mx-auto">
                {[
                  { v: stats.reports, k: "reports" },
                  { v: stats.protected, k: "protected" },
                  { v: stats.types, k: "types" },
                ].map(({ v, k }) => (
                  <div key={k} className="glass-card rounded-2xl py-4 px-2">
                    <div className="font-display text-3xl font-bold text-gradient-primary">{v}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                      {t(`hero.stats.${k}`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="container py-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">
            {t("features.title")}
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 transition-smooth hover:-translate-y-1 hover:shadow-elegant">
                <div className={`h-12 w-12 rounded-xl ${f.bg} grid place-items-center mb-4`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RECENT REPORTS */}
        <section className="container py-12">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold">{t("reports.title")}</h2>
              <p className="text-muted-foreground mt-2">{t("reports.subtitle")}</p>
            </div>
            <Button asChild variant="ghost" className="text-primary">
              <Link to="/reports">{t("hero.ctaBrowse")} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <ReportList limit={6} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
