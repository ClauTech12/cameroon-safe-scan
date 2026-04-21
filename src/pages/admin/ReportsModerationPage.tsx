import { useEffect, useState } from "react";
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
import { Check, Trash2, Eye, Loader2, Inbox } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Status = "pending" | "approved" | "rejected";

interface Row {
  id: string;
  reporter_name: string | null;
  location: string;
  description: string;
  contact_info: string | null;
  scam_type: any;
  ai_confidence: number | null;
  risk_level: any;
  status: Status;
  created_at: string;
}

export default function ReportsModerationPage() {
  const [tab, setTab] = useState<Status>("pending");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [view, setView] = useState<Row | null>(null);

  async function load() {
    setRows(null);
    const { data, error } = await supabase
      .from("scam_reports")
      .select("id, reporter_name, location, description, contact_info, scam_type, ai_confidence, risk_level, status, created_at")
      .eq("status", tab)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { toast.error(error.message); setRows([]); return; }
    setRows((data as any) ?? []);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  async function setStatus(id: string, status: Status) {
    setBusyId(id);
    const { error } = await supabase.from("scam_reports").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Report verified & published" : "Report rejected");
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this report permanently?")) return;
    setBusyId(id);
    const { error } = await supabase.from("scam_reports").delete().eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Report deleted");
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Review, verify and remove user-submitted reports.</p>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Verified</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
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
            No {tab} reports.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                      <Button size="icon" variant="ghost" onClick={() => setView(r)} title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {tab !== "approved" && (
                        <Button size="icon" variant="ghost" disabled={busyId === r.id}
                          onClick={() => setStatus(r.id, "approved")} title="Verify"
                          className="text-emerald-600 hover:bg-emerald-500/10">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" disabled={busyId === r.id}
                        onClick={() => remove(r.id)} title="Delete"
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

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Report details</DialogTitle>
            <DialogDescription>
              {view && `${view.location} · ${formatDistanceToNow(new Date(view.created_at), { addSuffix: true })}`}
            </DialogDescription>
          </DialogHeader>
          {view && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <ScamBadge type={view.scam_type} confidence={view.ai_confidence} />
                <RiskIndicator level={view.risk_level} />
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{view.description}</p>
              {view.contact_info && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">Contact:</span> {view.contact_info}
                </p>
              )}
              {view.reporter_name && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">Reporter:</span> {view.reporter_name}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
