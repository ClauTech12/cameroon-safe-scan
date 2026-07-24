import { useEffect, useState } from "react";
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

const LABEL_TEXT: Record<string, string> = {
  confirmed_scam: "Confirmed Scam",
  under_investigation: "Under Investigation",
  cleared: "Cleared",
};

const STATUS_TEXT: Record<string, string> = {
  high_risk_scam: "High Risk",
  suspicious: "Suspicious",
  unverified: "Unverified",
  unknown: "No Reports",
};

export default function ModelAccuracyPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AccuracyStats | null>(null);

  useEffect(() => {
    load();
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
        <Header />
        <Card className="surface-elevated">
          <CardContent className="py-12 text-center space-y-2">
            <DatabaseIcon className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-semibold">No labeled data yet</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Every time an admin sets a number's flag status to "Confirmed Scam" or "Cleared" on
              the Number Intelligence page, that decision is captured alongside what the rule
              engine predicted at that moment. Once a few of those exist, accuracy stats will show
              up here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<DatabaseIcon className="h-4 w-4" />}
          label="Labeled Cases"
          value={stats.total_labels}
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Accuracy"
          value={stats.accuracy_pct !== null ? `${stats.accuracy_pct}%` : "—"}
          highlight
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-risk-medium" />}
          label="False Positives"
          value={stats.false_positives}
          hint="Predicted risky, admin cleared"
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4 text-risk-high" />}
          label="False Negatives"
          value={stats.false_negatives}
          hint="Predicted safe, admin confirmed scam"
        />
      </div>

      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle className="text-sm">Prediction vs. Admin Verdict</CardTitle>
          <p className="text-xs text-muted-foreground">
            Rows = what the rule engine predicted. Columns = what an admin later confirmed.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Predicted
                </th>
                {ADMIN_LABELS.map((label) => (
                  <th key={label} className="text-center p-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {LABEL_TEXT[label]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PREDICTED_STATUSES.map((status) => (
                <tr key={status} className="border-t">
                  <td className="p-2 font-medium">{STATUS_TEXT[status]}</td>
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

      <p className="text-xs text-muted-foreground">
        This dataset builds automatically from moderation decisions on the Number Intelligence
        page — no extra work required. Once it's large enough, it's what a future ML model would
        train and validate against.
      </p>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Rule Engine Accuracy</h1>
      <p className="text-sm text-muted-foreground mt-1">
        How well the automatic risk scoring matches what admins confirm.
      </p>
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
