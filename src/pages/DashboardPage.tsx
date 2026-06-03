import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { SCAM_TYPES, SCAM_META, ScamType } from "@/lib/scam-types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { FileWarning, ShieldAlert, TrendingUp, MapPin } from "lucide-react";
import { CameroonHeatmap } from "@/components/CameroonHeatmap";

export default function DashboardPage() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<Record<ScamType, number>>({
    mobile_money: 0, job: 0, phishing: 0, investment: 0, bank: 0, other: 0,
  });
  const [total, setTotal] = useState(0);
  const [highRisk, setHighRisk] = useState(0);
  const [locations, setLocations] = useState<{ location: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("scam_reports")
        .select("scam_type, risk_level, location")
        .eq("status", "approved");
      if (!data) return;
      const c: Record<ScamType, number> = { mobile_money: 0, job: 0, phishing: 0, investment: 0, bank: 0, other: 0 };
      let high = 0;
      data.forEach((r: any) => { c[r.scam_type as ScamType]++; if (r.risk_level === "high") high++; });
      setCounts(c);
      setTotal(data.length);
      setHighRisk(high);
      setLocations(data.map((r: any) => ({ location: r.location })));
    })();
  }, []);

  const chartData = SCAM_TYPES.map((k) => ({
    name: t(`scamTypes.${k}`),
    key: k,
    value: counts[k],
    fill: SCAM_META[k].hex,
  })).filter((d) => d.value > 0);

  const stats = [
    { label: t("hero.stats.reports"), value: total, icon: FileWarning, color: "text-primary", bg: "bg-primary/10" },
    { label: t("risk.high"), value: highRisk, icon: ShieldAlert, color: highRisk > 0 ? "text-risk-high" : "text-muted-foreground", bg: highRisk > 0 ? "bg-scam-bank/10" : "bg-muted/40" },
    { label: t("hero.stats.types"), value: SCAM_TYPES.length, icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-12 space-y-10">
        <header className="space-y-2">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">{t("nav.dashboard")}</h1>
          <p className="text-muted-foreground">Live insights from across Cameroon</p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="glass-card p-6 flex items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl ${s.bg} grid place-items-center`}>
                <s.icon className={`h-7 w-7 ${s.color}`} />
              </div>
              <div>
                <div className="text-3xl font-display font-bold tabular-nums">{s.value}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="glass-card p-6">
          <h3 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Cameroon scam heatmap
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Reports by region — hover for details</p>
          <CameroonHeatmap reports={locations} />
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-card p-6">
            <h3 className="font-display font-bold text-lg mb-4">Scam categories</h3>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No data yet</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                      {chartData.map((d) => <Cell key={d.key} fill={d.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {chartData.map((d) => (
                <Link
                  key={d.key}
                  to={`/scams/${d.key === "mobile_money" ? "mobile-money" : d.key}`}
                  className="flex items-center gap-2 text-xs rounded-md px-2 py-1 -mx-2 hover:bg-secondary transition-smooth group"
                >
                  <span className="h-3 w-3 rounded-sm" style={{ background: d.fill }} />
                  <span className="text-muted-foreground group-hover:text-foreground">{d.name}</span>
                  <span className="ml-auto font-semibold tabular-nums">{d.value}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="glass-card p-6">
            <h3 className="font-display font-bold text-lg mb-4">Reports by type</h3>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No data yet</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {chartData.map((d) => <Cell key={d.key} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
