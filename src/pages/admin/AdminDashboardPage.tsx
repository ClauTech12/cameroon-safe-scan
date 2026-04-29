import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CameroonHeatmap } from "@/components/CameroonHeatmap";
import { SCAM_META, ScamType } from "@/lib/scam-types";
import { maskPhone } from "@/lib/risk";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  FileWarning, ShieldAlert, Bell, Flame, CalendarClock,
  ArrowUpRight, AlertTriangle, MapPin, Activity, ChevronRight,
} from "lucide-react";

type Report = {
  id: string;
  created_at: string;
  scam_type: ScamType;
  risk_level: "low" | "medium" | "high";
  location: string;
  description: string;
  phone_number: string | null;
};

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data } = await supabase
        .from("scam_reports")
        .select("id, created_at, scam_type, risk_level, location, description, phone_number")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false });
      setReports((data ?? []) as Report[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const reportsToday = reports.filter((r) => new Date(r.created_at) >= today).length;
    const high = reports.filter((r) => r.risk_level === "high").length;
    const typeCount = new Map<ScamType, number>();
    reports.forEach((r) => typeCount.set(r.scam_type, (typeCount.get(r.scam_type) ?? 0) + 1));
    const dominant = [...typeCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
    return {
      total: reports.length,
      high,
      activeAlerts: reports.filter((r) => r.risk_level === "high").slice(0, 8).length,
      dominant,
      reportsToday,
    };
  }, [reports]);

  const trend = useMemo(() => {
    const map = new Map<string, number>();
    reports.forEach((r) => {
      const k = new Date(r.created_at).toISOString().slice(0, 10);
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    const out: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      out.push({ date: k.slice(5), count: map.get(k) ?? 0 });
    }
    return out;
  }, [reports]);

  const liveAlerts = useMemo(() => {
    const alerts: { id: string; title: string; desc: string; tone: "high" | "med" | "info" }[] = [];
    // High risk recent
    reports.filter((r) => r.risk_level === "high").slice(0, 3).forEach((r) =>
      alerts.push({
        id: r.id,
        title: `High risk in ${r.location || "Unknown"}`,
        desc: SCAM_META[r.scam_type] ? r.scam_type.replace("_", " ") : "scam",
        tone: "high",
      }),
    );
    // Region spike
    const regionCount = new Map<string, number>();
    reports.slice(0, 30).forEach((r) =>
      regionCount.set(r.location, (regionCount.get(r.location) ?? 0) + 1),
    );
    [...regionCount.entries()]
      .filter(([, c]) => c >= 3)
      .slice(0, 2)
      .forEach(([loc, c]) =>
        alerts.push({ id: `r-${loc}`, title: `Spike in ${loc}`, desc: `${c} recent reports`, tone: "med" }),
      );
    if (alerts.length === 0) {
      alerts.push({ id: "ok", title: "All quiet", desc: "No critical alerts in the last 30 days", tone: "info" });
    }
    return alerts.slice(0, 6);
  }, [reports]);

  const recent = reports.slice(0, 6);

  const cards: { label: string; value: string | number; icon: typeof FileWarning; tint: string; small?: boolean }[] = [
    { label: "Total Reports", value: stats.total, icon: FileWarning, tint: "primary" },
    { label: "High Risk", value: stats.high, icon: ShieldAlert, tint: "danger" },
    { label: "Active Alerts", value: stats.activeAlerts, icon: Bell, tint: "warning" },
    { label: "Top Scam", value: stats.dominant.replace("_", " "), icon: Flame, tint: "accent", small: true },
    { label: "Reports Today", value: stats.reportsToday, icon: CalendarClock, tint: "success" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time scam intelligence across Cameroon</p>
        </div>
        <Button asChild size="sm" variant="outline" className="rounded-xl">
          <Link to="/admin/reports">View all reports <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className="surface-elevated border-0 shadow-sm hover:shadow-md transition-smooth">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-9 w-9 rounded-xl grid place-items-center ${tintBg(c.tint)}`}>
                  <c.icon className={`h-4 w-4 ${tintText(c.tint)}`} />
                </div>
              </div>
              <div className={`font-display font-bold tabular-nums leading-none ${c.small ? "text-lg capitalize mt-1" : "text-3xl"}`}>
                {c.value || (typeof c.value === "number" ? 0 : "—")}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-2 font-medium">
                {c.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Heatmap + Live Alerts */}
      <div className="grid gap-4 lg:grid-cols-10">
        <Card className="surface-elevated border-0 shadow-sm lg:col-span-7">
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Cameroon scam heatmap
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Hover regions for details</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/admin/heatmap">Full view <ChevronRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <CameroonHeatmap reports={reports.map((r) => ({ location: r.location }))} />
          </CardContent>
        </Card>

        <Card className="surface-elevated border-0 shadow-sm lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-risk-high" /> Live alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {liveAlerts.map((a) => (
              <div key={a.id} className={`flex gap-3 p-3 rounded-xl border ${alertTint(a.tone)}`}>
                <div className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${alertIconBg(a.tone)}`}>
                  {a.tone === "high" ? <AlertTriangle className="h-4 w-4 text-risk-high" />
                    : a.tone === "med" ? <Activity className="h-4 w-4 text-risk-medium" />
                    : <Bell className="h-4 w-4 text-primary" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground capitalize truncate">{a.desc}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Trends + Recent */}
      <div className="grid gap-4 lg:grid-cols-10">
        <Card className="surface-elevated border-0 shadow-sm lg:col-span-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Scam trends · last 14 days</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {trend.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">No data</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={trend} margin={{ left: -10, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-reports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#grad-reports)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="surface-elevated border-0 shadow-sm lg:col-span-4">
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent reports</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/admin/reports">All <ChevronRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
            ) : recent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No reports yet.</p>
            ) : (
              recent.map((r) => {
                const meta = SCAM_META[r.scam_type];
                const Icon = meta.icon;
                return (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-smooth">
                    <span className={`h-9 w-9 rounded-lg ${meta.ring} grid place-items-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${meta.text}`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate capitalize">
                        {r.scam_type.replace("_", " ")} · {r.location}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {r.phone_number ? maskPhone(r.phone_number) : "No number"} ·{" "}
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        r.risk_level === "high" ? "border-risk-high/40 text-risk-high bg-risk-high/5"
                        : r.risk_level === "medium" ? "border-risk-medium/40 text-risk-medium bg-risk-medium/5"
                        : "border-risk-low/40 text-risk-low bg-risk-low/5"
                      }
                    >
                      {r.risk_level}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function tintBg(t: string) {
  return {
    primary: "bg-primary/10",
    danger: "bg-risk-high/10",
    warning: "bg-risk-medium/10",
    success: "bg-risk-low/10",
    accent: "bg-accent/10",
  }[t] ?? "bg-muted";
}
function tintText(t: string) {
  return {
    primary: "text-primary",
    danger: "text-risk-high",
    warning: "text-risk-medium",
    success: "text-risk-low",
    accent: "text-accent",
  }[t] ?? "text-foreground";
}
function alertTint(t: "high" | "med" | "info") {
  return t === "high" ? "border-risk-high/30 bg-risk-high/5"
    : t === "med" ? "border-risk-medium/30 bg-risk-medium/5"
    : "border-border bg-muted/30";
}
function alertIconBg(t: "high" | "med" | "info") {
  return t === "high" ? "bg-risk-high/15"
    : t === "med" ? "bg-risk-medium/15"
    : "bg-primary/10";
}
