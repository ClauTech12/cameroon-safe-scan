import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScamBadge } from "@/components/ScamBadge";
import { RiskIndicator } from "@/components/RiskIndicator";
import { Check, X, Trash2, Eye, Loader2, Inbox } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScamType, RiskLevel } from "@/lib/scam-types";

type Status = "pending" | "approved" | "rejected";

interface Row {
  id: string;
  reporter_name: string | null;
  location: string;
  description: string;
  contact_info: string | null;
  scam_type: ScamType;
  ai_confidence: number | null;
  risk_level: RiskLevel;
  status: Status;
  created_at: string;
}

export default function ReportsModerationPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Status>("pending");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [view, setView] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    const { data, error } = await supabase
      .from("scam_reports")
      .select("id, reporter_name, location, description, contact_info, scam_type, ai_confidence, risk_level, status, created_at")
      .eq("status", tab)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { toast.error(error.message); setRows([]); return; }
    setRows((data as Row[]) ?? []);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: Status) {
    setBusyId(id);
    const { error } = await supabase.from("scam_reports").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(
      status === "approved"
        ? t("adminReportsMod.toast.approved")
        : t("adminReportsMod.toast.rejected")
    );
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
    if (view?.id === id) setView(null);
  }

  async function remove(id: string) {
    if (!confirm(t("adminReportsMod.toast.confirmDelete"))) return;
    setBusyId(id);
    const { error } = await supabase.from("scam_reports").delete().eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(t("adminReportsMod.toast.deleted"));
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
    if (view?.id === id) setView(null);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight">{t("adminReportsMod.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("adminReportsMod.subtitle")}</p>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
          <TabsList>
            <TabsTrigger value="pending">{t("adminReportsMod.tabs.pending")}</TabsTrigger>
            <TabsTrigger value="approved">{t("adminReportsMod.tabs.approved")}</TabsTrigger>
            <TabsTrigger value="rejected">{t("adminReportsMod.tabs.rejected")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <Card className="overflow-hidden">
        {rows === null ? (
          <div className="p-12 grid place-items-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            <Inbox className="h-10 w-10 mx-auto mb-2 opacity-50" />
            {t(`adminReportsMod.noReports.${tab}`)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("adminReportsMod.table.date")}</TableHead>
                <TableHead>{t("adminReportsMod.table.region")}</TableHead>
                <TableHead>{t("adminReportsMod.table.type")}</TableHead>
                <TableHead>{t("adminReportsMod.table.risk")}</TableHead>
                <TableHead>{t("adminReportsMod.table.description")}</TableHead>
                <TableHead className="text-right">{t("adminReportsMod.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.location}</Badge></TableCell>
                  <TableCell><ScamBadge type={r.scam_type} confidence={r.ai_confidence} /></TableCell>
                  <TableCell><RiskIndicator level={r.risk_level} /></TableCell>
                  <TableCell className="max-w-xs"><p className="line-clamp-2 text-sm">{r.description}</p></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* View */}
                      <Button size="icon" variant="ghost" onClick={() => setView(r)} title={t("adminReportsMod.actions.view")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {/* Approve — only on pending and rejected tabs */}
                      {tab !== "approved" && (
                        <Button size="icon" variant="ghost" disabled={busyId === r.id}
                          onClick={() => setStatus(r.id, "approved")} title={t("adminReportsMod.actions.approve")}
                          className="text-emerald-600 hover:bg-emerald-500/10">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Reject — only on pending and approved tabs */}
                      {tab !== "rejected" && (
                        <Button size="icon" variant="ghost" disabled={busyId === r.id}
                          onClick={() => setStatus(r.id, "rejected")} title={t("adminReportsMod.actions.reject")}
                          className="text-amber-600 hover:bg-amber-500/10">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Delete */}
                      <Button size="icon" variant="ghost" disabled={busyId === r.id}
                        onClick={() => remove(r.id)} title={t("adminReportsMod.actions.delete")}
                        className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("adminReportsMod.dialog.title")}</DialogTitle>
            <DialogDescription>
              {view && `${view.location} · ${formatDistanceToNow(new Date(view.created_at), { addSuffix: true })}`}
            </DialogDescription>
          </DialogHeader>
          {view && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <ScamBadge type={view.scam_type} confidence={view.ai_confidence} />
                <RiskIndicator level={view.risk_level} />
                <Badge variant="outline" className={
                  view.status === "approved"
                    ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/5"
                    : view.status === "rejected"
                    ? "border-amber-500/40 text-amber-600 bg-amber-500/5"
                    : "border-border text-muted-foreground"
                }>
                  {t(`adminReportsMod.status.${view.status}`)}
                </Badge>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{view.description}</p>
              {view.contact_info && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">{t("adminReportsMod.dialog.contact")}</span> {view.contact_info}
                </p>
              )}
              {view.reporter_name && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">{t("adminReportsMod.dialog.reporter")}</span> {view.reporter_name}
                </p>
              )}
              {/* Quick actions in dialog */}
              <div className="flex gap-2 pt-2 border-t border-border">
                {view.status !== "approved" && (
                  <Button size="sm" disabled={busyId === view.id}
                    onClick={() => setStatus(view.id, "approved")}
                    className="text-emerald-600 border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10"
                    variant="outline">
                    <Check className="h-4 w-4 mr-1" /> {t("adminReportsMod.actions.approve")}
                  </Button>
                )}
                {view.status !== "rejected" && (
                  <Button size="sm" disabled={busyId === view.id}
                    onClick={() => setStatus(view.id, "rejected")}
                    className="text-amber-600 border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10"
                    variant="outline">
                    <X className="h-4 w-4 mr-1" /> {t("adminReportsMod.actions.reject")}
                  </Button>
                )}
                <Button size="sm" variant="outline" disabled={busyId === view.id}
                  onClick={() => remove(view.id)}
                  className="text-destructive border-destructive/40 bg-destructive/5 hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-1" /> {t("adminReportsMod.actions.delete")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}