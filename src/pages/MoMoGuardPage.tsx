import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Smartphone, AlertTriangle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReportCard, type Report } from "@/components/ReportCard";
import { Skeleton } from "@/components/ui/skeleton";

const PATTERNS_EN = [
  { title: "Fake 'wrong number' transfer", desc: "Scammer sends a small amount, then claims it was a mistake and asks you to refund — but the original SMS was forged." },
  { title: "Agent impersonation", desc: "Caller pretends to be MTN MoMo / Orange Money support asking for your PIN to 'unblock' your account. Real agents NEVER ask for your PIN." },
  { title: "Lottery / promo win", desc: "You're told you won a prize but must send a 'fee' to receive it." },
  { title: "Reverse-billing trick", desc: "Fake withdrawal SMS to pressure you into transferring money quickly." },
];
const PATTERNS_FR = [
  { title: "Transfert 'faux numéro'", desc: "L'escroc envoie un petit montant puis prétend s'être trompé et demande un remboursement — mais le SMS d'origine est faux." },
  { title: "Faux agent MoMo / Orange", desc: "L'appelant se fait passer pour le support et demande votre PIN pour 'débloquer' votre compte. Un vrai agent ne demande JAMAIS votre PIN." },
  { title: "Loterie / promo gagnante", desc: "On vous annonce un gain mais vous devez payer des 'frais' pour le recevoir." },
  { title: "SMS de retrait truqué", desc: "Un faux SMS de retrait vous pousse à transférer de l'argent rapidement." },
];

export default function MoMoGuardPage() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const patterns = isFr ? PATTERNS_FR : PATTERNS_EN;
  const [reports, setReports] = useState<Report[] | null>(null);

  useEffect(() => {
    supabase
      .from("scam_reports")
      .select("id, reporter_name, location, description, contact_info, scam_type, ai_confidence, ai_advice, risk_level, created_at")
      .eq("status", "approved")
      .eq("scam_type", "mobile_money")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setReports((data as any) || []));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-scam-mobile/20 via-background to-background" />
          <div className="container py-16 md:py-24 relative">
            <div className="max-w-3xl space-y-6 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-scam-mobile/15 border border-scam-mobile/40 text-sm font-bold text-scam-mobile">
                <Smartphone className="h-4 w-4" /> MoMo Guard
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tighter">
                {isFr ? "Protégez votre " : "Protect your "}
                <span className="text-gradient-gold">Mobile Money</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {isFr
                  ? "Arnaques MTN Mobile Money et Orange Money — schémas courants et alertes en temps réel."
                  : "MTN Mobile Money & Orange Money scams — common patterns and live community alerts."}
              </p>
            </div>
          </div>
        </section>

        <section className="container py-16">
          <h2 className="font-display text-3xl font-bold mb-8 flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-scam-mobile" />
            {isFr ? "Schémas de fraude courants" : "Common fraud patterns"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {patterns.map((p) => (
              <Card key={p.title} className="glass-card p-6 border-l-4 border-l-scam-mobile">
                <h3 className="font-display font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="container py-8">
          <div className="glass-card rounded-2xl p-6 md:p-8 border-l-4 border-l-accent">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-8 w-8 text-accent shrink-0" />
              <div>
                <h3 className="font-display font-bold text-xl mb-2">
                  {isFr ? "Règle d'or" : "Golden rule"}
                </h3>
                <p className="text-foreground/90">
                  {isFr
                    ? "Ne donnez JAMAIS votre code PIN MoMo ou OTP à qui que ce soit — pas même à un 'agent'. MTN et Orange ne vous le demanderont jamais."
                    : "NEVER share your MoMo PIN or OTP with anyone — not even an 'agent'. MTN and Orange will never ask for it."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-16">
          <h2 className="font-display text-3xl font-bold mb-8">
            {isFr ? "Signalements MoMo récents" : "Recent MoMo reports"}
          </h2>
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
