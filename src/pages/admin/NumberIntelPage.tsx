import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { riskBand, maskPhone, fullPhone } from "@/lib/risk";
import { SCAM_META, ScamType } from "@/lib/scam-types";
import type { Database } from "@/integrations/supabase/types";

type FlagStatus = Database["public"]["Enums"]["flag_status"];
import { toast } from "sonner";
import { Search, Loader2, ShieldAlert, Sparkles, Eye, EyeOff } from "lucide-react";

type Summary = {
  phone: string;
  total_reports: number;
  high_risk_reports: number;
  first_seen: string | null;
  last_seen: string | null;
  type_counts: Record<string, number>;
  region_counts: Record<string, number>;
  risk_score: number;
  flag: { id: string; status: string; notes: string | null; updated_at: string } | null;
};

type Report = {
  id: string; created_at: string; description: string; location: string;
  scam_type: ScamType; risk_level: "low" | "medium" | "high";
};

type Pattern = { signature: string; insights: string[]; severity: "low" | "medium" | "high" };

export default function NumberIntelPage() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [revealFull, setRevealFull] = useState(false);
  const [flagStatus, setFlagStatus] = useState<string>("under_investigation");
  const [flagNotes, setFlagNotes] = useState("");
  const [savingFlag, setSavingFlag] = useState(false);

  useEffect(() => {
    const pre = sessionStorage.getItem("intel-prefill");
    if (pre) {
      sessionStorage.removeItem("intel-prefill");
      setPhone(pre);
      setTimeout(() => search(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search() {
    if (!phone.trim()) return;
    setLoading(true); setPattern(null); setReports([]);
    const { data, error } = await supabase.rpc("number_intel_summary", { _phone: phone });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const s = data as unknown as Summary;
    if ("error" in s && s.error) {
      toast.error(t("admin.intel.invalidPhone"));
      setSummary(null);
      setLoading(false);
      return;
    }
    setSummary(s);
    setFlagStatus(s.flag?.status ?? "under_investigation");
    setFlagNotes(s.flag?.notes ?? "");
    // fetch related reports
    const { data: r } = await supabase
      .from("scam_reports")
      .select("id,created_at,description,location,scam_type,risk_level")
      .eq("phone_number", s.phone).eq("status", "approved")
      .order("created_at", { ascending: false }).limit(50);
    setReports((r ?? []) as Report[]);
    setLoading(false);
  }

  async function runPattern() {
    if (!summary) return;
    setAiBusy(true);
    const { data, error } = await supabase.functions.invoke("detect-pattern", {
      body: { phone: summary.phone },
    });
    setAiBusy(false);
    if (error) { toast.error(error.message); return; }
    setPattern(data as Pattern);
  }

  async function saveFlag() {
    if (!summary) return;
    setSavingFlag(true);
    const { error } = await supabase.from("flagged_numbers").upsert(
      { phone_number: summary.phone, status: flagStatus as FlagStatus, notes: flagNotes || null },
      { onConflict: "phone_number" },
    );
    setSavingFlag(false);
    if (error) return toast.error(error.message);
    toast.success(t("admin.intel.flagSaved"));
    search();
  }

  const band = summary ? riskBand(summary.risk_score) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.intel.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.intel.subtitle")}</p>
      </div>

      <Card className="surface-elevated">
        <CardContent className="pt-6">
          <form onSubmit={(e) => { e.preventDefault(); search(); }} className="flex flex-col sm:flex-row gap-2">
            <Input placeholder={t("admin.intel.placeholder")} value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1" />
            <Button type="submit" disabled={loading} className="sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">{t("admin.intel.search")}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {summary && band && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="surface-elevated lg:col-span-2">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t("admin.intel.number")}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CardTitle className="text-2xl font-mono">
                      {revealFull ? fullPhone(summary.phone) : maskPhone(summary.phone)}
                    </CardTitle>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRevealFull(v => !v)}>
                      {revealFull ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
                {summary.flag && (
                  <Badge variant={summary.flag.status === "confirmed_scam" ? "destructive" : "secondary"}>
                    {t(`admin.intel.flagStatus.${summary.flag.status}`)}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Stat label={t("admin.intel.totalReports")} value={summary.total_reports} />
                <Stat label={t("admin.intel.highRisk")} value={summary.high_risk_reports} />
                <Stat label={t("admin.intel.regions")} value={Object.keys(summary.region_counts).length} />
                <Stat label={t("admin.intel.types")} value={Object.keys(summary.type_counts).length} />
              </CardContent>
            </Card>

            <Card className="surface-elevated">
              <CardHeader><CardTitle className="text-sm">{t("admin.intel.riskScore")}</CardTitle></CardHeader>
              <CardContent>
                <div className={`text-5xl font-bold ${band.cls}`}>{summary.risk_score}</div>
                <div className={`text-sm font-semibold mt-1 ${band.cls}`}>{t(`risk.${band.level}`)}</div>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${band.level === "high" ? "bg-risk-high" : band.level === "medium" ? "bg-risk-medium" : "bg-risk-low"}`}
                       style={{ width: `${summary.risk_score}%` }} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="surface-elevated">
              <CardHeader><CardTitle className="text-sm">{t("admin.intel.byType")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(summary.type_counts).length === 0 && <p className="text-sm text-muted-foreground">—</p>}
                {Object.entries(summary.type_counts).map(([k, v]) => {
                  const meta = SCAM_META[k as ScamType];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  return (
                    <div key={k} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <span className={`h-7 w-7 rounded-md ${meta.ring} flex items-center justify-center`}>
                          <Icon className={`h-4 w-4 ${meta.text}`} />
                        </span>
                        <span className="text-sm font-medium">{t(`scamTypes.${k}`)}</span>
                      </div>
                      <span className="font-semibold">{v}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="surface-elevated">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm">{t("admin.intel.flag")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">{t("admin.intel.status")}</Label>
                  <Select value={flagStatus} onValueChange={setFlagStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed_scam">{t("admin.intel.flagStatus.confirmed_scam")}</SelectItem>
                      <SelectItem value="under_investigation">{t("admin.intel.flagStatus.under_investigation")}</SelectItem>
                      <SelectItem value="cleared">{t("admin.intel.flagStatus.cleared")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("admin.intel.notes")}</Label>
                  <Textarea rows={3} value={flagNotes} onChange={(e) => setFlagNotes(e.target.value)} maxLength={1000} />
                </div>
                <Button onClick={saveFlag} disabled={savingFlag} size="sm">
                  {savingFlag && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                  {t("admin.intel.saveFlag")}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="surface-elevated">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> {t("admin.intel.aiPattern")}</CardTitle>
              <Button size="sm" variant="outline" onClick={runPattern} disabled={aiBusy || reports.length === 0}>
                {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("admin.intel.runAi")}
              </Button>
            </CardHeader>
            <CardContent>
              {!pattern && <p className="text-sm text-muted-foreground">{t("admin.intel.aiHint")}</p>}
              {pattern && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-primary/5">
                    <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">{t("admin.intel.signature")}</div>
                    <div className="font-semibold">{pattern.signature}</div>
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {pattern.insights.map((i, idx) => (
                      <li key={idx} className="flex gap-2"><ShieldAlert className="h-4 w-4 text-risk-medium shrink-0 mt-0.5" /> {i}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader><CardTitle className="text-sm">{t("admin.intel.timeline", { count: reports.length })}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {reports.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
              {reports.map((r) => {
                const meta = SCAM_META[r.scam_type];
                const Icon = meta.icon;
                return (
                  <div key={r.id} className="p-3 rounded-lg border flex gap-3">
                    <span className={`h-9 w-9 rounded-md ${meta.ring} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${meta.text}`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{t(`scamTypes.${r.scam_type}`)} · {r.location}</span>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm mt-1 line-clamp-2">{r.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
