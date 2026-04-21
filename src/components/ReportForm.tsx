import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CAMEROON_REGIONS, ScamType, RiskLevel } from "@/lib/scam-types";
import { ScamBadge } from "./ScamBadge";
import { RiskIndicator } from "./RiskIndicator";
import { Sparkles, Upload, Loader2, Lightbulb, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

const schema = z.object({
  reporter_name: z.string().trim().max(80).optional(),
  location: z.string().trim().min(1).max(80),
  description: z.string().trim().min(10, "Min 10 characters").max(5000),
  contact_info: z.string().trim().max(120).optional(),
  truthful: z.literal(true, { errorMap: () => ({ message: "You must confirm the report is truthful" }) }),
});

interface AIResult {
  scam_type: ScamType;
  confidence: number;
  risk_level: RiskLevel;
  advice: string[];
}

export function ReportForm() {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [truthful, setTruthful] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  const handleFile = (f: File | null) => {
    if (!f) return setFile(null);
    if (!f.type.startsWith("image/")) {
      toast.error("Only image files allowed");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    setFile(f);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    const parsed = schema.safeParse({
      reporter_name: name || undefined,
      location,
      description,
      contact_info: contact || undefined,
      truthful: truthful as true,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      // 1) AI classification
      const { data: ai, error: aiErr } = await supabase.functions.invoke<AIResult>("classify-scam", {
        body: { description: parsed.data.description, language: i18n.language?.startsWith("fr") ? "fr" : "en" },
      });
      if (aiErr) throw aiErr;
      if (!ai) throw new Error("No AI response");

      // 2) optional screenshot upload
      let screenshot_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "png";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("screenshots").upload(path, file, {
          contentType: file.type,
        });
        if (!upErr) {
          const { data } = supabase.storage.from("screenshots").getPublicUrl(path);
          screenshot_url = data.publicUrl;
        }
      }

      // 3) insert report
      const { error: insErr } = await supabase.from("scam_reports").insert({
        reporter_name: parsed.data.reporter_name || null,
        location: parsed.data.location,
        description: parsed.data.description,
        contact_info: parsed.data.contact_info || null,
        screenshot_url,
        scam_type: ai.scam_type,
        ai_confidence: ai.confidence,
        ai_advice: ai.advice,
        risk_level: ai.risk_level,
        language: i18n.language?.startsWith("fr") ? "fr" : "en",
      });
      if (insErr) throw insErr;

      setResult(ai);
      toast.success("Report submitted for moderation. It will appear publicly once approved.");
      setName(""); setLocation(""); setDescription(""); setContact(""); setFile(null); setTruthful(false);
    } catch (err: any) {
      console.error(err);
      const msg = err?.context?.body ? JSON.parse(err.context.body)?.error : err?.message;
      toast.error(msg || t("form.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Card className="glass-card p-6 md:p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">{t("form.name")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("form.namePlaceholder")} maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">{t("form.location")} <span className="text-destructive">*</span></Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="location"><SelectValue placeholder={t("form.locationPlaceholder")} /></SelectTrigger>
              <SelectContent>
                {CAMEROON_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">{t("form.description")} <span className="text-destructive">*</span></Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={t("form.descriptionPlaceholder")} rows={6} maxLength={5000} required />
            <p className="text-xs text-muted-foreground">{t("form.descriptionHelp")} • {description.length}/5000</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">{t("form.contact")}</Label>
            <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t("form.contactPlaceholder")} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">{t("form.screenshot")}</Label>
            <label htmlFor="file" className={cn(
              "flex items-center gap-3 rounded-xl border-2 border-dashed border-border/70 p-4 cursor-pointer hover:border-primary/50 transition-smooth",
              file && "border-primary/60 bg-primary/5",
            )}>
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">
                {file ? file.name : "PNG, JPG, WEBP — max 5MB"}
              </span>
              <input id="file" type="file" accept="image/*" className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-secondary/40 p-3">
            <Checkbox id="truthful" checked={truthful}
              onCheckedChange={(v) => setTruthful(v === true)} className="mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="truthful" className="text-sm font-medium leading-snug cursor-pointer">
                I confirm this report is truthful and not defamatory.
              </Label>
              <p className="text-xs text-muted-foreground leading-snug">
                By submitting you agree to our{" "}
                <Link to="/terms" className="underline hover:text-foreground">Terms</Link>,{" "}
                <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link> and{" "}
                <Link to="/disclaimer" className="underline hover:text-foreground">Disclaimer</Link>.
                Reports are reviewed by moderators before becoming public.
              </p>
            </div>
          </div>
          <Button type="submit" disabled={submitting || !truthful} size="lg"
            className="w-full bg-gradient-primary hover:opacity-90 shadow-glow font-semibold text-base">
            {submitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {t("form.submitting")}</>
            ) : (
              <><Sparkles className="h-5 w-5" /> {t("form.submit")}</>
            )}
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        <Card className={cn("glass-card p-6 transition-smooth", result && "shadow-glow")}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-accent" />
            <h3 className="font-display font-bold">{t("form.aiResult")}</h3>
          </div>
          {!result && !submitting && (
            <p className="text-sm text-muted-foreground">
              Submit a report to see instant AI analysis here.
            </p>
          )}
          {submitting && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {t("form.submitting")}
            </div>
          )}
          {result && (
            <div className="space-y-4 animate-fade-up">
              <div className="flex flex-wrap items-center gap-3">
                <ScamBadge type={result.scam_type} confidence={result.confidence} />
                <RiskIndicator level={result.risk_level} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                  <Lightbulb className="h-4 w-4" /> {t("reports.advice")}
                </div>
                <ul className="space-y-2 text-sm">
                  {result.advice.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-foreground/90">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
