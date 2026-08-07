import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, FileText, Trash2, Eye } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Status = "draft" | "scheduled" | "published" | "archived";

interface Row {
  id: string;
  slug: string;
  title: string;
  status: Status;
  view_count: number;
  scheduled_for: string | null;
  published_at: string | null;
  updated_at: string;
  intelligence_categories: { name: string } | null;
}

const STATUS_VARIANT: Record<Status, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  scheduled: "outline",
  published: "default",
  archived: "destructive",
};

export default function IntelligenceAdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Status | "all">("all");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRows(null);
    let query = supabase
      .from("intelligence_articles")
      .select("id, slug, title, status, view_count, scheduled_for, published_at, updated_at, intelligence_categories(name)")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (tab !== "all") query = query.eq("status", tab);
    const { data, error } = await query;
    if (error) { toast.error(error.message); setRows([]); return; }
    setRows((data as unknown as Row[]) ?? []);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete() {
    if (!deleteId) return;
    setBusy(true);
    const { error } = await supabase.from("intelligence_articles").delete().eq("id", deleteId);
    setBusy(false);
    setDeleteId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Article deleted");
    void load();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            CamAlert Intelligence
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Scam-awareness articles, guides, and alerts.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/intelligence/new">
            <Plus className="h-4 w-4 mr-2" />
            New Article
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status | "all")}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="p-0 overflow-hidden">
        {rows === null ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No articles yet — click "New Article" to write the first one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.intelligence_categories?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
                  </TableCell>
                  <TableCell>{row.view_count}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(row.updated_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {row.status === "published" && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/intelligence/${row.slug}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/admin/intelligence/${row.id}`}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this article?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the article and its revision history. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
