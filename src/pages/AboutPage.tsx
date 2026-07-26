import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import founder from "@/assets/Founder.jpg.webp";
import {
  ShieldCheck,
  Users,
  Eye,
  Heart,
  Globe2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";

const VALUE_KEYS = [
  { key: "trust", icon: ShieldCheck },
  { key: "community", icon: Users },
  { key: "transparency", icon: Eye },
  { key: "protection", icon: Heart },
] as const;

const WHAT_WE_DO_KEYS = [
  { key: "detect", icon: Eye },
  { key: "report", icon: AlertTriangle },
  { key: "protect", icon: ShieldCheck },
] as const;

export default function AboutPage() {
  const { t } = useTranslation();

  const stats = [
    { value: "2026", label: t("aboutPage.stats.founded") },
    { value: "6+", label: t("aboutPage.stats.categories") },
    { value: "EN + FR + PCM", label: t("aboutPage.stats.bilingual") },
    { value: "Cameroon", label: t("aboutPage.stats.growing") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-background" />
          <div className="container py-20 md:py-28 relative">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-sm font-bold text-accent">
                <Sparkles className="h-4 w-4" /> {t("aboutPage.badge")}
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tighter">
                {t("aboutPage.heroTitle")}{" "}
                <span className="text-gradient-primary">{t("aboutPage.heroTitleAccent")}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {t("aboutPage.heroSubtitle")}
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-border/50">
          <div className="container py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-display text-3xl font-extrabold text-accent">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-semibold uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our story */}
        <section className="container py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="text-xs font-bold text-accent uppercase tracking-[0.2em]">{t("aboutPage.storyLabel")}</div>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                {t("aboutPage.storyTitle")}
              </h2>
              <p className="text-foreground/80 leading-relaxed">{t("aboutPage.storyP1")}</p>
              <p className="text-foreground/80 leading-relaxed">{t("aboutPage.storyP2")}</p>
              <p className="text-foreground/80 leading-relaxed">{t("aboutPage.storyP3")}</p>
            </div>
            <div className="glass-card rounded-2xl p-8 border-l-4 border-l-accent">
              <div className="flex items-start gap-5">
                <img
                  src={founder}
                  alt="Agbor Clauvet"
                  className="h-20 w-20 rounded-full object-cover object-top border-2 border-accent/30 shrink-0" width="80" height="80"
                />
                <div>
                  <div className="font-display font-bold text-xl">Agbor Clauvet</div>
                  <div className="text-sm text-accent font-semibold mb-3">{t("aboutPage.founderRole")}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("aboutPage.founderQuote")}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                    <span>{t("aboutPage.founderTag")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What we do */}
        <section className="bg-secondary/30 border-y border-border/50">
          <div className="container py-16 md:py-20">
            <div className="text-center mb-12">
              <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-3">{t("aboutPage.whatWeDoLabel")}</div>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                {t("aboutPage.whatWeDoTitle")}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {WHAT_WE_DO_KEYS.map(({ key, icon: Icon }) => (
                <Card key={key} className="glass-card p-6 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-accent/10 text-accent grid place-items-center mx-auto mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-2">{t(`aboutPage.whatWeDo.${key}.title`)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`aboutPage.whatWeDo.${key}.desc`)}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="container py-16 md:py-24">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-3">{t("aboutPage.valuesLabel")}</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              {t("aboutPage.valuesTitle")}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUE_KEYS.map(({ key, icon: Icon }) => (
              <Card key={key} className="glass-card p-6 border-t-4 border-t-accent">
                <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent grid place-items-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base mb-2">{t(`aboutPage.values.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`aboutPage.values.${key}.desc`)}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Vision */}
        <section className="container py-8 pb-16">
          <div className="glass-card rounded-2xl p-8 md:p-12 border border-accent/20 bg-gradient-to-br from-accent/5 to-background">
            <div className="flex items-start gap-5">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 text-accent grid place-items-center shrink-0">
                <Globe2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-2">{t("aboutPage.visionLabel")}</div>
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-3">
                  {t("aboutPage.visionTitle")}
                </h2>
                <p className="text-foreground/80 leading-relaxed max-w-2xl">
                  {t("aboutPage.visionBody")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container pb-20">
          <div className="surface-elevated p-8 md:p-12 text-center bg-gradient-hero text-white border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-cyber-grid opacity-25 pointer-events-none" />
            <div className="relative space-y-4">
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                {t("aboutPage.ctaTitle")}
              </h2>
              <p className="text-white/75 max-w-xl mx-auto">
                {t("aboutPage.ctaBody")}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold rounded-full h-12 px-7">
                  <Link to="/report">
                    {t("aboutPage.ctaReport")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-semibold rounded-full h-12 px-7 bg-transparent border-white/40 text-white hover:bg-white/10">
                  <Link to="/contact">
                    <BookOpen className="h-4 w-4" /> {t("aboutPage.ctaContact")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
