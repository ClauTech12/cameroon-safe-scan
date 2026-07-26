import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, TrendingDown, TrendingUp, Database as DatabaseIcon } from "lucide-react";
import { toast } from "sonner";

type AccuracyStats = {
  total_labels: number;
  correct: number;
  accuracy_pct: number | null;
  false_positives: number;
  false_negatives: number;
  matrix: Record<string, number>;
};

const ADMIN_LABELS = ["confirmed_scam", "under_investigation", "cleared"] as const;
const PREDICTED_STATUSES = ["high_risk_scam", "suspicious", "unverified", "unknown"] as const;

export default function ModelAccuracyPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AccuracyStats | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("algorithm_accuracy_stats");
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setStats(data as unknown as AccuracyStats);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats || stats.total_labels === 0) {
    return (
      <div className="space-y-6">
        <Header t={t} />
        <Card className="surface-elevated">
          <CardContent className="py-12 text-center space-y-2">
            <DatabaseIcon className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-semibold">{t("admin.accuracy.emptyTitle")}</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t("admin.accuracy.emptyBody")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header t={t} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<DatabaseIcon className="h-4 w-4" />}
          label={t("admin.accuracy.labeledCases")}
          value={stats.total_labels}
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label={t("admin.accuracy.accuracyStat")}
          value={stats.accuracy_pct !== null ? `${stats.accuracy_pct}%` : "—"}
          highlight
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-risk-medium" />}
          label={t("admin.accuracy.falsePositives")}
          value={stats.false_positives}
          hint={t("admin.accuracy.falsePositivesHint")}
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4 text-risk-high" />}
          label={t("admin.accuracy.falseNegatives")}
          value={stats.false_negatives}
          hint={t("admin.accuracy.falseNegativesHint")}
        />
      </div>

      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle className="text-sm">{t("admin.accuracy.matrixTitle")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("admin.accuracy.matrixSubtitle")}</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 text-xs uppercase tracking-wider text-muted-foreground">
                  {t("admin.accuracy.predicted")}
                </th>
                {ADMIN_LABELS.map((label) => (
                  <th key={label} className="text-center p-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {t(`admin.intel.flagStatus.${label}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PREDICTED_STATUSES.map((status) => (
                <tr key={status} className="border-t">
                  <td className="p-2 font-medium">{t(`admin.accuracy.predictedStatus.${status}`)}</td>
                  {ADMIN_LABELS.map((label) => {
                    const key = `${label}__${status}`;
                    const count = stats.matrix[key] ?? 0;
                    const isGoodCell =
                      (label === "confirmed_scam" && (status === "high_risk_scam" || status === "suspicious")) ||
                      (label === "cleared" && (status === "unverified" || status === "unknown"));
                    const isBadCell =
                      (label === "cleared" && (status === "high_risk_scam" || status === "suspicious")) ||
                      (label === "confirmed_scam" && (status === "unverified" || status === "unknown"));
                    return (
                      <td key={key} className="p-2 text-center">
                        {count > 0 ? (
                          <Badge variant={isGoodCell ? "default" : isBadCell ? "destructive" : "secondary"}>
                            {count}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{t("admin.accuracy.footerNote")}</p>
    </div>
  );
}

function Header({ t }: { t: (key: string) => string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t("admin.accuracy.title")}</h1>
      <p className="text-sm text-muted-foreground mt-1">{t("admin.accuracy.subtitle")}</p>
    </div>
  );
}

function StatCard({
  icon, label, value, hint, highlight,
}: {
  icon: React.ReactNode; label: string; value: string | number; hint?: string; highlight?: boolean;
}) {
  return (
    <Card className={`surface-elevated ${highlight ? "border-primary/40" : ""}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs uppercase tracking-wider font-semibold">{label}</span>
        </div>
        <div className={`text-3xl font-bold mt-2 ${highlight ? "text-primary" : ""}`}>{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}
