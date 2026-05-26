import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ReportList } from "@/components/ReportList";
import {
  Sparkles,
  Languages,
  Smartphone,
  Lock,
  ArrowRight,
  Search,
  Users,
  Brain,
  Radio,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Eye,
  Target,
  Globe2,
  BookOpen,
  Fingerprint,
  Zap,
} from "lucide-react";
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
    { icon: Brain, title: t("features.aiTitle"), desc: t("features.aiDesc") },
    { icon: Languages, title: t("features.bilingualTitle"), desc: t("features.bilingualDesc") },
    { icon: Smartphone, title: t("features.momoTitle"), desc: t("features.momoDesc") },
    { icon: Lock, title: t("features.secureTitle"), desc: t("features.secureDesc") },
  ];

  const tips = [
    {
      icon: Fingerprint,
      title: "Never share OTPs or PINs",
      desc: "No legitimate bank, MoMo agent, or telecom will ever ask for your verification code.",
    },
    {
      icon: Zap,
      title: "Pause on urgency",
      desc: "Scammers manufacture emergencies. If a message rushes you to pay, it is a red flag.",
    },
    {
      icon: Eye,
      title: "Verify the source",
      desc: "Call back on an official number. Don't trust caller ID or copied logos alone.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-cyber-grid opacity-60 pointer-events-none" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" aria-hidden="true" />
          <div className="container relative pt-14 md:pt-24 pb-16 md:pb-24 px-5 md:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-7 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-accent/30 shadow-xs text-xs font-semibold text-foreground/85 ring-trust">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-pulse-ring" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                {t("hero.badge")}
              </div>
              <h1 className="font-display text-[2.6rem] sm:text-5xl md:text-[4.25rem] font-extrabold leading-[1.02] tracking-tight text-foreground">
                {t("hero.title")}{" "}
                <span className="text-gradient-primary">{t("hero.titleAccent")}</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/75 max-w-2xl mx-auto leading-[1.65]">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base h-12 px-7 rounded-full shadow-glow hover:-translate-y-0.5 transition-smooth"
                >
                  <Link to="/report">
                    <AlertTriangle className="h-4 w-4" /> {t("hero.ctaReport")}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="font-semibold text-base h-12 px-7 rounded-full border-accent/40 text-accent hover:bg-accent/5"
                >
                  <Link to="/check">
                    <Search className="h-4 w-4" /> {t("hero.ctaCheck")}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="font-semibold text-base h-12 px-6 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Link to="/dashboard">
                    <BookOpen className="h-4 w-4" /> {t("hero.ctaBrowse")}
                  </Link>
                </Button>
              </div>

              {/* Trust micro-strip */}
              <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 pt-5">
                {[
                  { icon: Radio, label: t("hero.trust.realtime") },
                  { icon: Users, label: t("hero.trust.community") },
                  { icon: Brain, label: t("hero.trust.ai") },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-accent" /> {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Threat-intel dashboard preview card */}
            <div className="mt-14 md:mt-20 max-w-5xl mx-auto animate-fade-up">
              <div className="surface-elevated overflow-hidden border-accent/20 ring-trust">
                {/* terminal header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--warning))]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" />
                    <span className="ml-3 text-[11px] font-mono-tech text-muted-foreground">
                      camalert://intel/live-feed
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[hsl(var(--success))]">
                    <Activity className="h-3 w-3" /> LIVE
                  </span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-border/60">
                  {[
                    { v: stats.reports, k: "reports", icon: ShieldCheck },
                    { v: stats.protected, k: "protected", icon: Users },
                    { v: stats.types, k: "types", icon: Target },
                  ].map(({ v, k, icon: Icon }) => (
                    <div key={k} className="px-4 py-7 md:py-9 text-center relative">
                      <Icon className="h-4 w-4 text-accent mx-auto mb-2" />
                      <div className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
                        {v.toLocaleString()}
                      </div>
                      <div className="text-[11px] md:text-xs text-muted-foreground mt-1.5 font-semibold uppercase tracking-wider">
                        {t(`hero.stats.${k}`)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ MISSION ============ */}
        <section id="mission" className="container py-16 md:py-24">
          <div className="grid md:grid-cols-5 gap-10 items-center">
            <div className="md:col-span-2">
              <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-3">
                Our mission
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                A safer digital Africa, one alert at a time.
              </h2>
            </div>
            <div className="md:col-span-3">
              <p className="text-lg text-foreground/80 leading-relaxed">
                CAMALERT is a digital fraud awareness and scam intelligence platform helping individuals and
                businesses identify scams, report suspicious activity, and improve online safety across
                Cameroon and Africa.
              </p>
              <div className="mt-7 grid sm:grid-cols-3 gap-3">
                {[
                  { icon: Eye, label: "Detect", desc: "AI-assisted threat signals" },
                  { icon: AlertTriangle, label: "Report", desc: "Community-driven alerts" },
                  { icon: ShieldCheck, label: "Protect", desc: "Public safety intelligence" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="surface-card p-4">
                    <Icon className="h-5 w-5 text-accent mb-2" />
                    <div className="font-semibold text-sm text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ FEATURES ============ */}
        <section className="container py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-3">
              {t("features.eyebrow")}
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              {t("features.title")}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={i} className="surface-card p-6 lift-on-hover group">
                <div className="h-11 w-11 rounded-xl bg-gradient-primary text-white grid place-items-center mb-4 shadow-md group-hover:shadow-glow transition-smooth">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base mb-1.5 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ AI SCAM ANALYZER ============ */}
        <section className="container py-12 md:py-20">
          <div className="surface-elevated overflow-hidden border-accent/20 grid md:grid-cols-5 gap-0">
            <div className="md:col-span-3 p-8 md:p-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs font-bold text-accent uppercase tracking-wider mb-4">
                <Brain className="h-3.5 w-3.5" /> AI Scam Analyzer
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                Paste it. Scan it. Stay safe.
              </h2>
              <p className="mt-4 text-foreground/75 leading-relaxed">
                Submit a suspicious link, WhatsApp message, SMS, email, or phone number. Get an instant
                heuristic risk score, then launch a deeper AI investigation for human-readable reasoning.
              </p>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: "Link", icon: "🌐" },
                  { label: "WhatsApp", icon: "💬" },
                  { label: "SMS", icon: "📩" },
                  { label: "Email", icon: "✉️" },
                  { label: "Phone", icon: "📞" },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg border border-border/60 bg-card px-2 py-2.5 text-center text-xs font-semibold">
                    <div className="text-base mb-0.5">{c.icon}</div>
                    {c.label}
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full px-7">
                  <Link to="/analyzer"><Brain className="h-4 w-4" /> Open the Analyzer</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground rounded-full">
                  <Link to="/check"><Search className="h-4 w-4" /> Quick number lookup</Link>
                </Button>
              </div>
            </div>
            <div className="md:col-span-2 bg-gradient-hero text-white p-8 md:p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-cyber-grid opacity-25" aria-hidden="true" />
              <div className="relative space-y-3">
                {[
                  { l: "Risk score", v: "87 / 100", t: "High Risk" },
                  { l: "Indicators", v: "OTP · Urgency · Brand impersonation" },
                  { l: "Recommendation", v: "Do not reply. Report on CAMALERT." },
                ].map((x, i) => (
                  <div key={i} className="rounded-lg bg-white/5 border border-white/15 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-white/60">{x.l}</div>
                    <div className="font-mono-tech text-sm font-semibold mt-1">{x.v}</div>
                    {x.t && <div className="text-[11px] text-white/70 mt-0.5">{x.t}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ THREAT CATEGORIES ============ */}
        <section className="container py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-3">
              {t("categories.eyebrow")}
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              {t("categories.title")}
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {SCAM_TYPES.map((type) => {
              const meta = SCAM_META[type];
              const Icon = meta.icon;
              const slug = type === "mobile_money" ? "mobile-money" : type;
              return (
                <Link
                  key={type}
                  to={`/scams/${slug}`}
                  className="surface-card p-4 lift-on-hover text-center group"
                >
                  <div
                    className="h-11 w-11 rounded-xl mx-auto mb-3 grid place-items-center transition-smooth group-hover:scale-110"
                    style={{ background: `hsl(var(--scam-${type === "mobile_money" ? "mobile" : type}) / 0.12)` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: meta.hex }} />
                  </div>
                  <div className="text-xs font-bold text-foreground">{t(`scamTypes.${type}`)}</div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ============ ABOUT ============ */}
        <section id="about" className="container py-16 md:py-24">
          <div className="surface-elevated overflow-hidden border-accent/20 grid md:grid-cols-2">
            <div className="p-8 md:p-12 bg-gradient-hero text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-cyber-grid opacity-25" aria-hidden="true" />
              <div className="relative">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-3">
                  About CAMALERT
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Built for trust. Powered by community.
                </h2>
                <p className="text-white/80 leading-relaxed">
                  CAMALERT exists to make the digital experience safer for every African. We combine
                  community-driven fraud reporting, AI-assisted threat detection, and public digital safety
                  education into one trusted platform.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold border border-white/15">
                  <Sparkles className="h-3.5 w-3.5" /> Founded by Agbor Clauvet
                </div>
              </div>
            </div>
            <div className="p-8 md:p-12">
              <ul className="space-y-5">
                {[
                  {
                    icon: Globe2,
                    title: "Cyber awareness for Africa",
                    desc: "Localized intelligence on Mobile Money, phishing, job, and investment scams.",
                  },
                  {
                    icon: Users,
                    title: "Community-driven reporting",
                    desc: "Every report strengthens collective protection — anonymously if you prefer.",
                  },
                  {
                    icon: BookOpen,
                    title: "Public digital safety education",
                    desc: "Free resources, tips, and alerts that anyone can use, in English and French.",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent grid place-items-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{title}</div>
                      <div className="text-sm text-muted-foreground leading-relaxed mt-0.5">{desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ============ RECENT ALERTS ============ */}
        <section className="container py-16 md:py-20">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-2">
                {t("liveFeed.eyebrow")}
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                Recent scam alerts
              </h2>
              <p className="text-muted-foreground mt-2">{t("reports.subtitle")}</p>
            </div>
            <Button asChild variant="ghost" className="text-foreground font-semibold">
              <Link to="/reports">
                {t("hero.ctaBrowse")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ReportList limit={6} />
        </section>

        {/* ============ SAFETY TIPS ============ */}
        <section className="container py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-3">
              Fraud prevention
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Featured safety tips
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {tips.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="surface-card p-6 lift-on-hover">
                <div className="h-11 w-11 rounded-xl bg-accent/10 text-accent grid place-items-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base mb-1.5 text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="container pb-20 md:pb-28">
          <div className="surface-elevated p-8 md:p-14 text-center bg-gradient-hero text-white border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-cyber-grid opacity-25 pointer-events-none" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-mesh opacity-40 pointer-events-none" aria-hidden="true" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-5">
                <ShieldCheck className="h-3.5 w-3.5" /> Join the cyber-trust movement
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
                {t("cta.title")}
              </h2>
              <p className="text-white/75 max-w-xl mx-auto mb-7">{t("cta.subtitle")}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-semibold rounded-full h-12 px-7"
                >
                  <Link to="/report">
                    {t("hero.ctaReport")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="font-semibold rounded-full h-12 px-7 bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/check">{t("hero.ctaCheck")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
