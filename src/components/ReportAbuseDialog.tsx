import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Flag, Loader2 } from "lucide-react";

export function ReportAbuseDialog({ reportId }: { reportId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [contact, setContact] = useState("");

  const schema = z.object({
    reason: z.string().trim().min(5, t("abuse.minChars")).max(1000),
    reporter_contact: z.string().trim().max(120).optional(),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ reason, reporter_contact: contact || undefined });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("abuse_reports").insert({
      report_id: reportId,
      reason: parsed.data.reason,
      reporter_contact: parsed.data.reporter_contact ?? null,
      submitter_id: user?.id ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("abuse.success"));
    setReason(""); setContact(""); setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-destructive">
          <Flag className="h-3.5 w-3.5 mr-1.5" /> {t("abuse.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("abuse.title")}</DialogTitle>
          <DialogDescription>{t("abuse.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ab-reason">{t("abuse.reason")} <span className="text-destructive">*</span></Label>
            <Textarea id="ab-reason" rows={4} maxLength={1000}
              value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder={t("abuse.reasonPlaceholder")} />
            <p className="text-[11px] text-muted-foreground">{reason.length}/1000</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ab-contact">{t("abuse.contact")}</Label>
            <Input id="ab-contact" maxLength={120} value={contact}
              onChange={(e) => setContact(e.target.value)} placeholder={t("abuse.contactPlaceholder")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t("abuse.cancel")}</Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} {t("abuse.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
