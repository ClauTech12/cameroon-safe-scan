import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, AlertTriangle, TrendingUp, Filter } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Cameroon regions with coordinates ────────────────────────────────────────

const REGIONS = [
  { name: "Adamawa",      aliases: ["adamawa", "adamaoua"],           color: "#3B82F6" },
  { name: "Centre",       aliases: ["centre", "center"],              color: "#EF4444" },
  { name: "East",         aliases: ["east", "est"],                   color: "#F59E0B" },
  { name: "Far North",    aliases: ["far north", "extrême-nord", "extreme nord", "extreme-nord"], color: "#8B5CF6" },
  { name: "Littoral",     aliases: ["littoral"],                      color: "#06B6D4" },
  { name: "North",        aliases: ["north", "nord"],                 color: "#10B981" },
  { name: "Northwest",    aliases: ["northwest", "nord-ouest", "nord ouest"], color: "#F97316" },
  { name: "South",        aliases: ["south", "sud"],                  color: "#EC4899" },
  { name: "Southwest",    aliases: ["southwest", "sud-ouest", "sud ouest"], color: "#14B8A6" },
  { name: "West",         aliases: ["west", "ouest"],                 color: "#6366F1" },
];

const SCAM_TYPES = ["All types", "momo_fraud", "phishing", "impersonation", "fake_investment", "other"];

function normalizeLocation(loc: string): string {
  const lower = loc.toLowerCase().trim();
  for (const region of REGIONS) {
    if (region.aliases.some((a) => lower.includes(a))) return region.name;
  }
  return "Unknown";
}

type Report = {
  location: string | null;
  scam_type: string | null;
  created_at: string;
  risk_level: string | null;
};

type RegionStat = {
  name: string;
  count: number;
  color: string;
  highRisk: number;
};

export default function HeatmapPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [scamFilter, setScamFilter] = useState("All types");
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from("scam_reports")
        .select("location, scam_type, created_at, risk_level")
        .not("location", "is", null);
      setReports((data ?? []) as Report[]);
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = useMemo(() => {
    let r = reports;
    if (scamFilter !== "All types") r = r.filter((x) => x.scam_type === scamFilter);
    if (timeFilter !== "all") {
      const days = timeFilter === "7d" ? 7 : timeFilter === "30d" ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      r = r.filter((x) => new Date(x.created_at) >= cutoff);
    }
    return r;
  }, [reports, scamFilter, timeFilter]);

  const regionStats: RegionStat[] = useMemo(() => {
    const counts: Record<string, { count: number; highRisk: number }> = {};
    for (const r of filtered) {
      const name = normalizeLocation(r.location ?? "");
      if (!counts[name]) counts[name] = { count: 0, highRisk: 0 };
      counts[name].count++;
      if (r.risk_level === "high" || r.risk_level === "critical") counts[name].highRisk++;
    }
    return REGIONS.map((reg) => ({
      name: reg.name,
      count: counts[reg.name]?.count ?? 0,
      color: reg.color,
      highRisk: counts[reg.name]?.highRisk ?? 0,
    })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const maxCount = Math.max(...regionStats.map((r) => r.count), 1);
  const totalReports = filtered.length;
  const hotspot = regionStats[0];
  const unknownCount = filtered.filter((r) => normalizeLocation(r.location ?? "") === "Unknown").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{t("adminHeatmap.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("adminHeatmap.subtitle")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={scamFilter} onValueChange={setScamFilter}>
          <SelectTrigger className="w-44 rounded-xl h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCAM_TYPES.map((st) => (
              <SelectItem key={st} value={st}>{st === "All types" ? t("adminHeatmap.allScamTypes") : t(`adminHeatmap.scamTypes.${st}`, st.replace(/_/g, " "))}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-36 rounded-xl h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("adminHeatmap.time.all")}</SelectItem>
            <SelectItem value="7d">{t("adminHeatmap.time.7d")}</SelectItem>
            <SelectItem value="30d">{t("adminHeatmap.time.30d")}</SelectItem>
            <SelectItem value="90d">{t("adminHeatmap.time.90d")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: t("adminHeatmap.cards.total"), value: totalReports, icon: AlertTriangle, color: "text-primary", bg: "bg-primary/10" },
          { label: t("adminHeatmap.cards.hotspot"), value: hotspot?.count > 0 ? t(`adminHeatmap.regions.${hotspot.name}`, hotspot.name) : t("adminHeatmap.cards.none"), icon: MapPin, color: "text-red-500", bg: "bg-red-500/10" },
          { label: t("adminHeatmap.cards.regionsAffected"), value: regionStats.filter((r) => r.count > 0).length, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((s) => (
          <Card key={s.label} className="surface-elevated border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`h-9 w-9 rounded-xl grid place-items-center mb-3 ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="font-display text-2xl font-bold tabular-nums">{s.value}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-2 font-medium">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar chart */}
      <Card className="surface-elevated border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> {t("adminHeatmap.reportsByRegion")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("adminHeatmap.loading")}</p>
          ) : totalReports === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("adminHeatmap.noMatch")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={regionStats} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tickFormatter={(name: string) => t(`adminHeatmap.regions.${name}`, name)}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(name: string) => t(`adminHeatmap.regions.${name}`, name)}
                  formatter={(value: number) => [`${value} ${t("adminHeatmap.report", { count: value })}`, t("adminHeatmap.chartTooltipLabel")]}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {regionStats.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} opacity={entry.count === 0 ? 0.2 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Region list */}
      <Card className="surface-elevated border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> {t("adminHeatmap.regionBreakdown")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("adminHeatmap.loading")}</p>
          ) : (
            regionStats.map((region) => (
              <div key={region.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-all">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ background: region.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{t(`adminHeatmap.regions.${region.name}`, region.name)}</span>
                    <div className="flex items-center gap-2">
                      {region.highRisk > 0 && (
                        <Badge variant="outline" className="text-xs border-red-500/40 text-red-500 bg-red-500/5">
                          {region.highRisk} {t("adminHeatmap.highRisk")}
                        </Badge>
                      )}
                      <span className="text-sm font-bold tabular-nums">{region.count}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(region.count / maxCount) * 100}%`,
                        background: region.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
          {unknownCount > 0 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              {unknownCount} {t("adminHeatmap.report", { count: unknownCount })} {t("adminHeatmap.unrecognizedLocation")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}