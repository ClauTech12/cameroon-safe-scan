import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThresholdBadge, type ThresholdStatus } from "@/components/ThresholdBadge";
import { toast } from "@/hooks/use-toast";
import {
  Search, Clipboard, ShieldAlert, ShieldCheck, ShieldQuestion, AlertTriangle,
  ChevronDown, FileWarning, Share2, Phone, TrendingUp, Sparkles, Loader2,
} from "lucide-react";

type Status = ThresholdStatus;

interface PhoneStatus {
  phone: string;
  status: Status;
  label: string;
  total: number;
  recent_24h: number;
  spike: boolean;
}

interface RelatedReport {
  id: string;
  scam_type: string;
  description: string;
  created_at: string;
  location: string;
}

function formatPhone(canonical: string) {
  if (canonical.length === 9) {
    return `+237 ${canonical.slice(0, 3)} ${canonical.slice(3, 6)} ${canonical.slice(6)}`;
  }
  return `+${canonical}`;
}

function maskPhone(canonical: string) {
  if (canonical.length === 9) return `+237 ${canonical.slice(0, 3)} •• •• ${canonical.slice(-2)}`;
  return canonical;
}

const STATUS_TONE: Record<Status, { ring: string; text: string; Icon: typeof ShieldAlert; gradient: string }> = {
  unknown:        { ring: "ring-muted",                  text: "text-muted-foreground", Icon: ShieldQuestion, gradient: "from-muted/30 to-transparent" },
  unverified:     { ring: "ring-amber-500/30",           text: "text-amber-700 dark:text-amber-300", Icon: ShieldQuestion, gradient: "from-amber-500/10 to-transparent" },
  suspicious:     { ring: "ring-orange-500/30",          text: "text-orange-700 dark:text-orange-300", Icon: AlertTriangle, gradient: "from-orange-500/10 to-transparent" },
  high_risk_scam: { ring: "ring-destructive/40",         text: "text-destructive", Icon: ShieldAlert, gradient: "from-destructive/10 to-transparent" },
  verified:       { ring: "ring-destructive/40",         text: "text-destructive", Icon: ShieldAlert, gradient: "from-destructive/10 to-transparent" },
  cleared:        { ring: "ring-emerald-500/30",         text: "text-emerald-700 dark:text-emerald-300", Icon: ShieldCheck, gradient: "from-emerald-500/10 to-transparent" },
};

export default function CheckNumberPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<PhoneStatus | null>(null);
  const [reports, setReports] = useState<RelatedReport[]>([]);

  const canonicalize = (raw: string) => raw.replace(/\D/g, "").slice(-9);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setQuery(text.trim());
    } catch {
      toast({ title: t("check.clipboardError"), description: t("check.clipboardErrorDesc"), variant: "destructive" });
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const canonical = canonicalize(query);
    if (canonical.length < 8) {
      toast({ title: t("check.invalidNumber"), description: t("check.invalidNumberDesc"), variant: "destructive" });
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const [{ data: statusData, error: statusErr }, { data: reportData }] = await Promise.all([
        supabase.rpc("phone_status", { _phone: canonical }),
        supabase
          .from("public_scam_reports")
          .select("id, scam_type, description, created_at, location")
          .eq("phone_number", canonical)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (statusErr) throw statusErr;
      setResult(statusData as unknown as PhoneStatus);
      setReports((reportData as RelatedReport[]) || []);
    } catch (err) {
      console.error(err);
      toast({ title: t("check.searchFailed"), description: t("check.searchFailedDesc"), variant: "destructive" });
      setResult(null);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    const text = t("check.shareText", { label: result.label, phone: formatPhone(result.phone), n: result.total });
    try {
      if (navigator.share) await navigator.share({ title: t("check.shareTitle"), text });
      else {
        await navigator.clipboard.writeText(text);
        toast({ title: t("check.copiedTitle"), description: t("check.copiedDesc") });
      }
    } catch {/* user cancelled */}
  };

  const reasonsBreakdown = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.scam_type] = (acc[r.scam_type] || 0) + 1;
    return acc;
  }, {});
  const topReasons = Object.entries(reasonsBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const tone = result ? STATUS_TONE[result.status] : STATUS_TONE.unknown;
  const ToneIcon = tone.Icon;
  const hasResult = !!result && result.total > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
          <div className="container relative pt-14 md:pt-20 pb-8">
            <div className="max-w-2xl mx-auto text-center space-y-4 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-xs text-xs font-medium text-foreground/80">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                {t("check.badge")}
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                {t("check.title")} <span className="text-gradient-primary">{t("check.titleAccent")}</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {t("check.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto animate-fade-up">
              <div className="surface-elevated p-2 flex items-center gap-2">
                <div className="flex items-center gap-2 pl-3 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-semibold">+237</span>
                </div>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("check.placeholder")}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-0 h-11 text-base flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handlePaste}
                  aria-label={t("check.paste")}
                  className="h-10 w-10 shrink-0"
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold px-5 shrink-0"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="hidden sm:inline">{loading ? t("check.checking") : t("check.checkNow")}</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2.5">
                {t("check.autoDetect")}
              </p>
            </form>
          </div>
        </section>

        <section className="container pb-20">
          <div className="max-w-2xl mx-auto">
            {!searched && (
              <div className="surface-card p-8 md:p-10 text-center animate-fade-in">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 grid place-items-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display text-lg font-bold mb-1.5">{t("check.emptyTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("check.emptySubtitle")}</p>
              </div>
            )}

            {searched && loading && (
              <div className="surface-card p-10 text-center animate-fade-in">
                <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("check.searching")}</p>
              </div>
            )}

            {searched && !loading && result && !hasResult && (
              <div className="surface-elevated p-8 md:p-10 text-center animate-fade-up">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 grid place-items-center mx-auto mb-4">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-display text-xl font-bold mb-1.5">{t("check.noReportsTitle")}</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  {t("check.noReportsSub", { phone: formatPhone(result.phone) })}
                </p>
                <Button asChild className="bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-full h-11 px-6">
                  <Link to={`/report?phone=${result.phone}`}>
                    <FileWarning className="h-4 w-4" /> {t("check.beFirst")}
                  </Link>
                </Button>
              </div>
            )}

            {searched && !loading && result && hasResult && (
              <div className="space-y-4 animate-fade-up">
                <div className={`surface-elevated overflow-hidden ring-1 ${tone.ring}`}>
                  <div className={`bg-gradient-to-br ${tone.gradient} px-6 md:px-8 py-6 md:py-8 border-b border-border/60`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-2xl bg-card grid place-items-center shadow-sm ${tone.text}`}>
                          <ToneIcon className="h-7 w-7" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("check.phoneLabel")}</div>
                          <div className="font-display text-xl md:text-2xl font-bold tabular-nums">{formatPhone(result.phone)}</div>
                        </div>
                      </div>
                      <ThresholdBadge status={result.status} className="text-sm py-1 px-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-border/60">
                    <div className="px-6 py-5 text-center">
                      <div className="font-display text-3xl font-bold tabular-nums">{result.total}</div>
                      <div className="text-xs text-muted-foreground mt-1 font-medium">{t("check.totalReports")}</div>
                    </div>
                    <div className="px-6 py-5 text-center">
                      <div className="font-display text-3xl font-bold tabular-nums flex items-center justify-center gap-1.5">
                        {result.recent_24h}
                        {result.spike && <TrendingUp className="h-5 w-5 text-destructive" />}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 font-medium">{t("check.last24h")}</div>
                    </div>
                  </div>

                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="w-full flex items-center justify-between px-6 py-3.5 border-t border-border/60 hover:bg-secondary/40 transition-smooth group">
                      <span className="text-sm font-semibold inline-flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" /> {t("check.why")}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-6 pb-5 pt-1 space-y-3 border-t border-border/60 bg-secondary/20">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                          <span><strong className="font-semibold">{result.total}</strong> {t("check.verifiedReport", { count: result.total })}</span>
                        </li>
                        {result.spike && (
                          <li className="flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                            <span><strong className="font-semibold text-destructive">{t("check.spikeDetected")}</strong> — {t("check.spikeReports", { n: result.recent_24h })}</span>
                          </li>
                        )}
                        {topReasons.length > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                            <span>
                              {t("check.commonReasons")}{" "}
                              {topReasons.map(([type, count], i) => (
                                <span key={type}>
                                  <strong className="font-semibold">{t(`scamReasons.${type}`)}</strong>{" "}
                                  ({count})
                                  {i < topReasons.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </span>
                          </li>
                        )}
                        {result.status === "high_risk_scam" && (
                          <li className="flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                            <span>{t("check.highRiskWarning")}</span>
                          </li>
                        )}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="px-6 py-4 border-t border-border/60 flex items-center gap-2 flex-wrap">
                    <Button asChild className="bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-full h-10 px-5 flex-1 sm:flex-initial">
                      <Link to={`/report?phone=${result.phone}`}>
                        <FileWarning className="h-4 w-4" /> {t("check.reportNumber")}
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleShare}
                      className="rounded-full h-10 px-5 font-semibold flex-1 sm:flex-initial"
                    >
                      <Share2 className="h-4 w-4" /> {t("check.shareWarning")}
                    </Button>
                  </div>
                </div>

                {reports.length > 0 && (
                  <div className="surface-card p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-base font-bold">{t("check.recentActivity")}</h3>
                      <Badge variant="secondary" className="text-xs">{t("check.latest", { n: reports.length })}</Badge>
                    </div>
                    <ul className="space-y-3">
                      {reports.map((r) => (
                        <li key={r.id} className="flex items-start justify-between gap-3 pb-3 border-b border-border/60 last:border-0 last:pb-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                                {t(`scamReasons.${r.scam_type}`)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{r.location}</span>
                            </div>
                            <p className="text-sm text-foreground/80 line-clamp-2">{r.description}</p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground px-4">
                  {maskPhone(result.phone)} · {t("reports.unverifiedBadge")}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
