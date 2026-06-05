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

const PATTERNS_EN = [
  { title: "Fake 'wrong number' transfer", desc: "Scammer sends a small amount, then claims it was a mistake and asks you to refund — but the original SMS was forged." },
  { title: "Agent impersonation", desc: "Caller pretends to be MTN MoMo / Orange Money support asking for your PIN to 'unblock' your account. Real agents NEVER ask for your PIN." },
  { title: "Lottery / promo win", desc: "You're told you won a prize but must send a 'fee' to receive it." },
  { title: "Reverse-billing trick", desc: "Fake withdrawal SMS to pressure you into transferring money quickly." },
  { title: "Fake merchant payment", desc: "Scammer poses as a seller, collects MoMo payment, and disappears without delivering goods." },
  { title: "SIM swap fraud", desc: "Scammer convinces your network to transfer your number to their SIM, gaining access to your MoMo account." },
];
const PATTERNS_FR = [
  { title: "Transfert 'faux numéro'", desc: "L'escroc envoie un petit montant puis prétend s'être trompé et demande un remboursement — mais le SMS d'origine est faux." },
  { title: "Faux agent MoMo / Orange", desc: "L'appelant se fait passer pour le support et demande votre PIN pour 'débloquer' votre compte. Un vrai agent ne demande JAMAIS votre PIN." },
  { title: "Loterie / promo gagnante", desc: "On vous annonce un gain mais vous devez payer des 'frais' pour le recevoir." },
  { title: "SMS de retrait truqué", desc: "Un faux SMS de retrait vous pousse à transférer de l'argent rapidement." },
  { title: "Faux paiement marchand", desc: "L'escroc se fait passer pour un vendeur, encaisse le paiement MoMo et disparaît sans livrer." },
  { title: "Fraude par échange de SIM", desc: "L'escroc convainc votre opérateur de transférer votre numéro sur sa SIM, accédant ainsi à votre compte MoMo." },
];

const STEPS_EN = [
  { icon: PhoneCall, title: "Call your operator", desc: "Contact MTN (dial 180) or Orange (dial 122) immediately to freeze your account." },
  { icon: Flag, title: "Report to authorities", desc: "File a complaint with your local police and the national cybercrime unit." },
  { icon: ShieldCheck, title: "Change your PIN", desc: "Reset your MoMo PIN immediately via the app or USSD code." },
  { icon: ArrowRight, title: "Warn others", desc: "Submit a report here so others in the community are protected." },
];
const STEPS_FR = [
  { icon: PhoneCall, title: "Appelez votre opérateur", desc: "Contactez MTN (composez le 180) ou Orange (composez le 122) immédiatement pour bloquer votre compte." },
  { icon: Flag, title: "Signalez aux autorités", desc: "Déposez une plainte auprès de la police locale et de l'unité nationale de cybercriminalité." },
  { icon: ShieldCheck, title: "Changez votre PIN", desc: "Réinitialisez votre PIN MoMo immédiatement via l'application ou le code USSD." },
  { icon: ArrowRight, title: "Alertez les autres", desc: "Soumettez un signalement ici pour protéger la communauté." },
];

export default function MoMoGuardPage() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const patterns = isFr ? PATTERNS_FR : PATTERNS_EN;
  const steps = isFr ? STEPS_FR : STEPS_EN;

  const [reports, setReports] = useState<Report[] | null>(null);
  const [reportCount, setReportCount] = useState(0);

  // Phone lookup state
  const [phoneLookup, setPhoneLookup] = useState("");
  const [lookupResult, setLookupResult] = useState<{ phone_number: string; description: string }[] | null>(null);
  const [loadingLookup, setLoadingLookup] = useState(false);

  useEffect(() => {
    supabase
      .from("scam_reports")
      .select("id, reporter_name, location, description, contact_info, scam_type, ai_confidence, ai_advice, risk_level, created_at")
      .eq("status", "approved")
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
      .from("scam_reports")
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
                {isFr ? "Protégez votre " : "Protect your "}
                <span className="text-gradient-gold">Mobile Money</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {isFr
                  ? "Arnaques MTN Mobile Money et Orange Money — schémas courants et alertes en temps réel."
                  : "MTN Mobile Money & Orange Money scams — common patterns and live community alerts."}
              </p>
              <div className="mt-6 flex gap-4 flex-wrap items-center">
                <div className="glass-card px-5 py-3">
                  <div className="text-2xl font-bold text-scam-mobile">{reportCount}</div>
                  <div className="text-xs text-muted-foreground">MoMo Reports Logged</div>
                </div>
                {/* 1. Report a scam CTA */}
                <Link
                  to="/report"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-scam-mobile text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  <Flag className="h-4 w-4" />
                  {isFr ? "Signaler une arnaque" : "Report a scam"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Phone Number Lookup */}
        <section className="container py-12">
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <Search className="h-6 w-6 text-scam-mobile" />
              <h2 className="font-display text-2xl font-bold">
                {isFr ? "Vérifier un numéro" : "Check a number"}
              </h2>
            </div>
            <p className="text-muted-foreground mb-4">
              {isFr
                ? "Entrez un numéro MoMo pour voir s'il a été signalé avant d'envoyer de l'argent."
                : "Enter a MoMo number to see if it has been reported before sending money."}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={isFr ? "Entrez le numéro de téléphone..." : "Enter phone number..."}
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
                {loadingLookup ? "..." : isFr ? "Vérifier" : "Search"}
              </button>
            </div>
            {lookupResult !== null && (
              <div className="mt-4 rounded-lg border p-4">
                {lookupResult.length === 0 ? (
                  <p className="text-green-600 font-medium">
                    {isFr ? "✅ Aucun signalement pour ce numéro." : "✅ No reports found for this number."}
                  </p>
                ) : (
                  <>
                    <p className="font-bold text-destructive mb-2">
                      ⚠️ {lookupResult.length} {isFr ? "signalement(s) trouvé(s)" : "report(s) found"}
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

        {/* Golden rule */}
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

        {/* 3. What to do if scammed */}
        <section className="container py-16">
          <h2 className="font-display text-3xl font-bold mb-8">
            {isFr ? "Que faire si vous êtes victime ?" : "What to do if you're scammed"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, i) => (
              <Card key={i} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-scam-mobile/15 flex items-center justify-center text-scam-mobile font-bold text-sm">
                    {i + 1}
                  </div>
                  <step.icon className="h-5 w-5 text-scam-mobile" />
                </div>
                <h3 className="font-display font-bold text-base mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent reports */}
        <section className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold">
              {isFr ? "Signalements MoMo récents" : "Recent MoMo reports"}
            </h2>
            {/* 4. View all reports link */}
            <Link
              to="/reports"
              className="inline-flex items-center gap-1 text-sm font-medium text-scam-mobile hover:underline"
            >
              {isFr ? "Voir tout" : "View all"} <ArrowRight className="h-4 w-4" />
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