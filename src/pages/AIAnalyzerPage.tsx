import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { analyze, type AnalyzerKind, type HeuristicResult, type RiskLabel } from "@/lib/analyzer";
import { messageFromInvokeError } from "@/lib/invoke-error";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Brain,
  Globe,
  MessageCircle,
  Mail,
  Phone,
  Sparkles,
  Loader2,
  AlertTriangle,
  Lightbulb,
  ScanLine,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AIAnalysis {
  score: number;
  label: RiskLabel;
  summary: string;
  reasons: string[];
  highlights: string[];
  recommendations: string[];
}

const TABS: { key: AnalyzerKind; label: string; icon: typeof Globe; placeholder: string; multiline: boolean }[] = [
  { key: "url", label: "Website Link", icon: Globe, placeholder: "https://suspicious-site.example/login", multiline: false },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "Paste a suspicious WhatsApp message…", multiline: true },
  { key: "sms", label: "SMS", icon: MessageCircle, placeholder: "Paste a suspicious SMS…", multiline: true },
  { key: "email", label: "Email", icon: Mail, placeholder: "Paste the email body (and subject)…", multiline: true },
  { key: "phone", label: "Phone Number", icon: Phone, placeholder: "+237 6XX XXX XXX", multiline: false },
];

function labelMeta(label: RiskLabel) {
  switch (label) {
    case "safe":
      return { text: "Safe", tone: "success", Icon: ShieldCheck, ring: "ring-[hsl(var(--success))]/30", bg: "bg-[hsl(var(--success))]/10", fg: "text-[hsl(var(--success))]" };
    case "suspicious":
      return { text: "Suspicious", tone: "warning", Icon: ShieldAlert, ring: "ring-[hsl(var(--warning))]/30", bg: "bg-[hsl(var(--warning))]/10", fg: "text-[hsl(var(--warning))]" };
    case "high_risk":
      return { text: "High Risk", tone: "danger", Icon: ShieldX, ring: "ring-destructive/30", bg: "bg-destructive/10", fg: "text-destructive" };
    case "phishing":
      return { text: "Potential Phishing", tone: "danger", Icon: ShieldX, ring: "ring-destructive/40", bg: "bg-destructive/15", fg: "text-destructive" };
  }
}

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <span className="whitespace-pre-wrap break-words">{text}</span>;
  const escaped = terms.filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return <span className="whitespace-pre-wrap break-words">{text}</span>;
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(re);
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((p, i) =>
        re.test(p) ? (
          <mark key={i} className="rounded px-1 bg-destructive/15 text-destructive font-semibold">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}

export default function AIAnalyzerPage() {
  const { t, i18n } = useTranslation();
  const [kind, setKind] = useState<AnalyzerKind>("url");
  const [inputs, setInputs] = useState<Record<AnalyzerKind, string>>({
    url: "",
    whatsapp: "",
    sms: "",
    email: "",
    phone: "",
  });
  const [result, setResult] = useState<HeuristicResult | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const currentInput = inputs[kind];
  const meta = TABS.find((x) => x.key === kind)!;

  const runHeuristic = () => {
    setAiResult(null);
    if (!currentInput.trim()) {
      toast({ title: "Enter content to analyze", variant: "destructive" });
      return;
    }
    const r = analyze(kind, currentInput);
    setResult(r);
  };

  const runDeepAI = async () => {
    if (!currentInput.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-scam", {
        body: { kind, input: currentInput, language: i18n.language?.startsWith("fr") ? "fr" : "en" },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error === "rate_limited") {
          toast({ title: "Too many requests, try again shortly", variant: "destructive" });
        } else if (data.error === "credits_exhausted") {
          toast({ title: "AI credits exhausted", description: "Please add credits in workspace settings.", variant: "destructive" });
        } else if (data.error === "missing_key") {
          toast({
            title: "AI analysis unavailable",
            description: (data as { message?: string }).message ?? "Server configuration is incomplete.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "AI analysis failed",
            description: (data as { message?: string }).message ?? String(data.error),
            variant: "destructive",
          });
        }
        return;
      }
      setAiResult(data.analysis as AIAnalysis);
    } catch (e) {
      toast({
        title: "AI analysis failed",
        description: messageFromInvokeError(e, "Something went wrong. Please try again."),
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const headerMeta = useMemo(() => (result ? labelMeta(result.label) : null), [result]);
  const aiMeta = useMemo(() => (aiResult ? labelMeta(aiResult.label) : null), [aiResult]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container py-10 md:py-14">
        <header className="max-w-3xl mx-auto text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-xs font-semibold text-accent">
            <Brain className="h-3.5 w-3.5" /> AI Scam Analyzer
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
            Analyze any suspicious content in seconds
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Paste a website, WhatsApp message, SMS, email, or phone number. CamAlert runs an instant
            heuristic scan and can launch a deeper AI investigation on demand.
          </p>
        </header>

        <Card className="max-w-4xl mx-auto border-accent/20 shadow-sm">
          <CardHeader className="pb-3">
            <Tabs value={kind} onValueChange={(v) => { setKind(v as AnalyzerKind); setResult(null); setAiResult(null); }}>
              <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-secondary/60">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <TabsTrigger key={key} value={key} className="flex flex-col gap-1 py-2.5 text-[11px] md:text-xs">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {TABS.map(({ key, placeholder, multiline }) => (
                <TabsContent key={key} value={key} className="mt-5 space-y-4">
                  {multiline ? (
                    <Textarea
                      value={inputs[key]}
                      onChange={(e) => setInputs((s) => ({ ...s, [key]: e.target.value }))}
                      placeholder={placeholder}
                      rows={7}
                      maxLength={8000}
                      className="font-mono-tech text-sm resize-y"
                    />
                  ) : (
                    <Input
                      value={inputs[key]}
                      onChange={(e) => setInputs((s) => ({ ...s, [key]: e.target.value }))}
                      placeholder={placeholder}
                      maxLength={500}
                      className="font-mono-tech"
                    />
                  )}
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Your input is analyzed privately. We never share it without your consent.
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={runHeuristic} variant="outline" className="gap-2">
                        <ScanLine className="h-4 w-4" /> Quick scan
                      </Button>
                      <Button onClick={runDeepAI} disabled={aiLoading || !currentInput.trim()} className="gap-2">
                        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Deep AI analysis
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Heuristic result */}
            {result && headerMeta && (
              <div className={`rounded-xl border p-5 ring-1 ${headerMeta.ring} ${headerMeta.bg}`}>
                <div className="flex items-start gap-4 flex-wrap">
                  <div className={`h-12 w-12 rounded-xl grid place-items-center ${headerMeta.bg} ${headerMeta.fg}`}>
                    <headerMeta.Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`${headerMeta.fg} border-current font-bold`}>
                        {headerMeta.text}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono-tech">Heuristic scan</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={result.score} className="h-2 flex-1" />
                      <span className="font-mono-tech text-sm font-bold tabular-nums">{result.score}/100</span>
                    </div>
                  </div>
                </div>

                {result.signals.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Threat indicators
                    </div>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {result.signals.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${s.severity === "high" ? "text-destructive" : s.severity === "medium" ? "text-[hsl(var(--warning))]" : "text-muted-foreground"}`} />
                          <span><span className="font-semibold">{s.label}</span>{s.match ? <span className="text-muted-foreground"> — “{s.match}”</span> : null}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.kind !== "url" && result.kind !== "phone" && (
                  <div className="mt-4 rounded-lg bg-background/60 p-3 border border-border/60 text-sm leading-relaxed">
                    <Highlighted text={currentInput} terms={result.highlights} />
                  </div>
                )}

                <div className="mt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" /> Recommended actions
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2"><ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* AI loading skeleton */}
            {aiLoading && (
              <div className="rounded-xl border p-5 border-accent/30 bg-accent/5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-accent font-semibold">
                  <Sparkles className="h-4 w-4 animate-pulse" /> Running deep AI analysis…
                </div>
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            )}

            {/* AI result */}
            {aiResult && aiMeta && !aiLoading && (
              <div className={`rounded-xl border p-5 ring-1 ${aiMeta.ring} ${aiMeta.bg}`}>
                <div className="flex items-start gap-4 flex-wrap">
                  <div className={`h-12 w-12 rounded-xl grid place-items-center ${aiMeta.bg} ${aiMeta.fg}`}>
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`${aiMeta.fg} border-current font-bold`}>
                        {aiMeta.text}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono-tech">AI deep analysis</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={aiResult.score} className="h-2 flex-1" />
                      <span className="font-mono-tech text-sm font-bold tabular-nums">{aiResult.score}/100</span>
                    </div>
                    <p className="mt-3 text-sm text-foreground/85 leading-relaxed">{aiResult.summary}</p>
                  </div>
                </div>

                {aiResult.reasons?.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      AI reasoning
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      {aiResult.reasons.map((r, i) => (
                        <li key={i} className="flex gap-2"><Brain className="h-4 w-4 text-accent mt-0.5 shrink-0" />{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiResult.recommendations?.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5" /> Suggested actions
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      {aiResult.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2"><ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!result && !aiResult && !aiLoading && (
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Privacy-first analysis</AlertTitle>
                <AlertDescription>
                  Quick scan runs entirely in your browser. Deep AI analysis sends the content to our secure
                  threat-intelligence model for richer reasoning.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto mt-6 flex justify-center">
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link to="/report">Found a real scam? Report it on CamAlert →</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
