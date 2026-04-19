import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { maskPhone } from "@/lib/risk";

type Row = { id: string; phone_number: string; status: string; notes: string | null; updated_at: string };

export default function FlaggedListPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase.from("flagged_numbers").select("*").order("updated_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.flagged.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.flagged.subtitle")}</p>
      </div>
      <Card className="surface-elevated">
        <CardHeader><CardTitle className="text-sm">{rows.length} {t("admin.flagged.total")}</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.flagged.empty")}</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <Link key={r.id} to="/admin/numbers"
                  onClick={() => sessionStorage.setItem("intel-prefill", r.phone_number)}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border lift-on-hover">
                  <div className="min-w-0">
                    <div className="font-mono font-semibold">{maskPhone(r.phone_number)}</div>
                    {r.notes && <div className="text-xs text-muted-foreground truncate mt-0.5">{r.notes}</div>}
                  </div>
                  <Badge variant={r.status === "confirmed_scam" ? "destructive" : r.status === "cleared" ? "outline" : "secondary"}>
                    {t(`admin.intel.flagStatus.${r.status}`)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
