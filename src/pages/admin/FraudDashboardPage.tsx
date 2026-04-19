import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { SCAM_META, ScamType } from "@/lib/scam-types";
import { riskBand, maskPhone } from "@/lib/risk";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { Activity, TrendingUp, AlertTriangle, Phone } from "lucide-react";

type TopNum = { phone_number: string; report_count: number; dominant_type: ScamType; last_seen: string };

export default function FraudDashboardPage() {
  const { t } = useTranslation();
  const [top, setTop] = useState<TopNum[]>([]);
  const [trend, setTrend] = useState<{ date: string; count: number }[]>([]);
  const [typeData, setTypeData] = useState<{ name: string; value: number; color: string; key: ScamType }[]>([]);
  const [alerts, setAlerts] = useState<{ phone: string; reason: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: tn } = await supabase.rpc("top_reported_numbers", { _limit: 10 });
      setTop((tn ?? []) as TopNum[]);

      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data: rs } = await supabase
        .from("scam_reports")
        .select("created_at,scam_type,risk_level")
        .eq("status", "approved")
        .gte("created_at", since.toISOString());

      const dayMap = new Map<string, number>();
      const typeMap = new Map<string, number>();
      (rs ?? []).forEach((r: any) => {
        const d = new Date(r.created_at).toISOString().slice(0, 10);
        dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
        typeMap.set(r.scam_type, (typeMap.get(r.scam_type) ?? 0) + 1);
      });
      const days: { date: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        days.push({ date: k.slice(5), count: dayMap.get(k) ?? 0 });
      }
      setTrend(days);
      setTypeData([...typeMap.entries()].map(([k, v]) => ({
        name: k, value: v, color: SCAM_META[k as ScamType]?.hex ?? "#94a3b8", key: k as ScamType,
      })).sort((a, b) => b.value - a.value));

      // alerts: top 3 numbers w/ ≥3 reports + spike detection
      const a: { phone: string; reason: string }[] = [];
      (tn ?? []).slice(0, 5).forEach((n: TopNum) => {
        if (n.report_count >= 3) a.push({ phone: n.phone_number, reason: `${n.report_count} reports` });
      });
      // spike: last 7d > avg of prior 21d * 1.5
      const last7 = days.slice(-7).reduce((s, d) => s + d.count, 0);
      const prior = days.slice(0, 23).reduce((s, d) => s + d.count, 0) / 3;
      if (last7 > prior * 1.5 && last7 >= 3) {
        a.unshift({ phone: "*", reason: t("admin.fraud.spike", { n: last7 }) });
      }
      setAlerts(a);
    })();
  }, [t]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.fraud.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.fraud.subtitle")}</p>
      </div>

      {alerts.length > 0 && (
        <Card className="surface-elevated border-risk-medium/40 bg-risk-medium/5">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <AlertTriangle className="h-4 w-4 text-risk-medium" />
            <CardTitle className="text-sm">{t("admin.fraud.alerts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 rounded-md bg-background/60">
                <span className="font-medium">{a.phone === "*" ? t("admin.fraud.trendAlert") : maskPhone(a.phone)}</span>
                <span className="text-muted-foreground">{a.reason}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="surface-elevated lg:col-span-2">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> {t("admin.fraud.trend")}</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="surface-elevated">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> {t("admin.fraud.byType")}</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={90}
                  tickFormatter={(v) => t(`scamTypes.${v}`)} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: any, _n, p: any) => [v, t(`scamTypes.${p.payload.key}`)]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {typeData.map((d) => <Cell key={d.key} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-elevated">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4" /> {t("admin.fraud.topNumbers")}</CardTitle></CardHeader>
        <CardContent>
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.fraud.noData")}</p>
          ) : (
            <div className="space-y-2">
              {top.map((n) => {
                const meta = SCAM_META[n.dominant_type];
                const Icon = meta?.icon;
                return (
                  <Link key={n.phone_number} to="/admin/numbers"
                    onClick={() => sessionStorage.setItem("intel-prefill", n.phone_number)}
                    className="flex items-center gap-3 p-3 rounded-lg border lift-on-hover">
                    <span className={`h-9 w-9 rounded-md ${meta?.ring} flex items-center justify-center shrink-0`}>
                      {Icon && <Icon className={`h-4 w-4 ${meta?.text}`} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-semibold text-sm">{maskPhone(n.phone_number)}</div>
                      <div className="text-xs text-muted-foreground">{t(`scamTypes.${n.dominant_type}`)}</div>
                    </div>
                    <Badge variant="secondary">{n.report_count}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
