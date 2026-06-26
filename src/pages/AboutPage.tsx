import { Link } from "react-router-dom";
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

const values = [
  {
    icon: ShieldCheck,
    title: "Trust",
    desc: "Every report is reviewed before publication. We never compromise on accuracy or integrity.",
  },
  {
    icon: Users,
    title: "Community",
    desc: "CamAlert is built by the community, for the community. Every report helps protect someone else.",
  },
  {
    icon: Eye,
    title: "Transparency",
    desc: "We are open about how reports are verified, how AI is used, and how data is handled.",
  },
  {
    icon: Heart,
    title: "Protection",
    desc: "Our mission is simple — protect everyday Cameroonians from digital fraud and scams.",
  },
];

const whatWeDo = [
  {
    icon: Eye,
    title: "Detect",
    desc: "AI-assisted threat detection analyzes submitted reports and assigns risk levels instantly.",
  },
  {
    icon: AlertTriangle,
    title: "Report",
    desc: "Community-driven reporting lets anyone submit a scam alert anonymously in English or French.",
  },
  {
    icon: ShieldCheck,
    title: "Protect",
    desc: "Verified reports become public intelligence that helps thousands avoid falling victim to scams.",
  },
];

export default function AboutPage() {
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
                <Sparkles className="h-4 w-4" /> About CamAlert
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tighter">
                Built for trust.{" "}
                <span className="text-gradient-primary">Powered by community.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                CamAlert is Cameroon's first community-driven scam intelligence platform — combining AI-assisted threat detection, bilingual reporting, and public digital safety education to protect people across Cameroon, with plans to expand across Africa.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-border/50">
          <div className="container py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: "2026", label: "Founded" },
                { value: "6+", label: "Scam categories tracked" },
                { value: "EN + FR", label: "Bilingual platform" },
                { value: "Cameroon", label: "Starting here, growing Africa" },
              ].map((stat) => (
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
              <div className="text-xs font-bold text-accent uppercase tracking-[0.2em]">Our story</div>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                Why we built CamAlert
              </h2>
              <p className="text-foreground/80 leading-relaxed">
                Mobile Money scams, phishing attacks, and investment fraud are growing rapidly across Cameroon. Most victims had no way to warn others or check if a number was suspicious before sending money.
              </p>
              <p className="text-foreground/80 leading-relaxed">
                CamAlert was founded in 2026 by Agbor Clauvet to change that — giving every Cameroonian a free, bilingual tool to report scams, check suspicious numbers, and access real-time fraud intelligence powered by AI.
              </p>
              <p className="text-foreground/80 leading-relaxed">
                What started as a simple idea is now a growing platform trusted by the community to keep Cameroon safer — one alert at a time.
              </p>
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
                  <div className="text-sm text-accent font-semibold mb-3">Founder & CEO · ClauTech Digital Solutions</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "We built CamAlert because I believe every Cameroonian deserves access to the tools and information needed to stay safe in the digital age. Scammers count on silence — we're breaking it."
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                    <span>Cyber Trust · Cameroon & Africa</span>
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
              <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-3">What we do</div>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                Detect. Report. Protect.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {whatWeDo.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="glass-card p-6 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-accent/10 text-accent grid place-items-center mx-auto mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="container py-16 md:py-24">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-3">Our values</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              What we stand for
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="glass-card p-6 border-t-4 border-t-accent">
                <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent grid place-items-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
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
                <div className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-2">Our vision</div>
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-3">
                  Cameroon first. Africa next.
                </h2>
                <p className="text-foreground/80 leading-relaxed max-w-2xl">
                  CamAlert started in Cameroon because that's where we know the problem best. But digital fraud doesn't respect borders. Our vision is to expand CamAlert across Africa — giving every community the tools to fight back against scammers, in their own language.
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
                Join the movement
              </h2>
              <p className="text-white/75 max-w-xl mx-auto">
                Every report you submit protects someone in your community. Help us build a safer digital Cameroon.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold rounded-full h-12 px-7">
                  <Link to="/report">
                    Report a scam <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-semibold rounded-full h-12 px-7 bg-transparent border-white/40 text-white hover:bg-white/10">
                  <Link to="/contact">
                    <BookOpen className="h-4 w-4" /> Contact us
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