import { useEffect, useState } from "react";
import { ScamType, SCAM_META, RiskLevel, maskContact } from "@/lib/scam-types";
import { ScamBadge } from "./ScamBadge";
import { RiskIndicator } from "./RiskIndicator";
import { ReportAbuseDialog } from "./ReportAbuseDialog";
import { WhyThisResult } from "./WhyThisResult";
import { suspiciousPhrases, detectTactics } from "@/lib/explain";
import { HighlightedText } from "./HighlightedText";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar, User, Lightbulb, ShieldAlert, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr as frLocale, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export interface Report {
  id: string;
  reporter_name: string | null;
  location: string;
  description: string;
  contact_info: string | null;
  scam_type: ScamType;
  ai_confidence: number | null;
  ai_advice: string[] | null;
  risk_level: RiskLevel;
  status?: "pending" | "approved" | "rejected" | null;
  created_at: string;
  phone_number?: string | null;
}

type BadgeKind = "verified" | "suspicious" | "unverified";

function getVerificationBadge(report: Report): { kind: BadgeKind; label: string; className: string; Icon: typeof ShieldAlert } {
  if (report.status === "approved" && report.risk_level === "high") {
    return {
      kind: "suspicious",
      label: "suspiciousBadge",
      className: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
      Icon: AlertTriangle,
    };
  }
  if (report.status === "approved") {
    return {
      kind: "verified",
      label: "verifiedBadge",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      Icon: ShieldCheck,
    };
  }
  return {
    kind: "unverified",
    label: "unverifiedBadge",
    className: "bg-muted text-muted-foreground border-border",
    Icon: ShieldAlert,
  };
}

interface PhoneStats { total: number; recent24h: number }

function buildReasons(report: Report, stats: PhoneStats | null): string[] {
  const reasons: string[] = [];
  try {
    if (stats && stats.total >= 2) reasons.push("reports.reasons.reportedMultiple");
    if (stats && stats.recent24h >= 3) reasons.push("reports.reasons.recentSpike");
    const tactics = detectTactics(report.description ?? "");
    for (const tac of tactics) reasons.push(`reports.reasons.tactic.${tac}`);
    if (report.status === "approved") reasons.push("reports.reasons.adminVerified");
    if (report.risk_level === "high") reasons.push("reports.reasons.highRisk");
    else if (report.risk_level === "medium") reasons.push("reports.reasons.mediumRisk");
    if (tactics.length === 0) {
      const phrases = suspiciousPhrases(report.description ?? "");
      if (phrases.length >= 2) reasons.push("reports.reasons.patternMatch");
    }
    if ((report.ai_confidence ?? 0) >= 80) reasons.push("reports.reasons.highConfidence");
    if (report.status !== "approved" && reasons.length === 0) reasons.push("reports.reasons.pending");
  } catch {
    // never crash the card on explainability
  }
  return Array.from(new Set(reasons)).slice(0, 5);
}

export function ReportCard({ report }: { report: Report }) {
  const { t, i18n } = useTranslation();
  const [showWhy, setShowWhy] = useState(false);
  const [stats, setStats] = useState<PhoneStats | null>(null);
  const meta = SCAM_META[report.scam_type];
  const locale = i18n.language?.startsWith("fr") ? frLocale : enUS;
  const badge = getVerificationBadge(report);
  const BadgeIcon = badge.Icon;

  useEffect(() => {
    const phone = report.phone_number?.trim();
    if (!phone) return;
    let cancelled = false;
    (async () => {
      try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const [{ count: total }, { count: recent24h }] = await Promise.all([
          supabase.from("scam_reports").select("id", { count: "exact", head: true })
            .eq("status", "approved").eq("phone_number", phone),
          supabase.from("scam_reports").select("id", { count: "exact", head: true })
            .eq("status", "approved").eq("phone_number", phone).gte("created_at", since),
        ]);
        if (!cancelled) setStats({ total: total ?? 0, recent24h: recent24h ?? 0 });
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [report.phone_number]);

  const reasons = buildReasons(report, stats);
  const confidenceLabel =
    (report.ai_confidence ?? 0) >= 85 ? "Very High Confidence" :
    (report.ai_confidence ?? 0) >= 70 ? "High Confidence" :
    (report.ai_confidence ?? 0) >= 50 ? "Medium Confidence" : "Low Confidence";
const handleDownloadPDF = () => {
  const win = window.open("", "_blank");
  if (!win) return;

  const badgeColor = report.risk_level === "high" ? "#ef4444" : report.risk_level === "medium" ? "#f97316" : "#22c55e";
  const borderColor = report.risk_level === "high" ? "#fecaca" : report.risk_level === "medium" ? "#fed7aa" : "#bbf7d0";
  const verifiedHTML = report.status === "approved"
    ? `<div style="display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:20px; background:#f0fdf4; border:1px solid #bbf7d0; color:#16a34a; font-size:12px; font-weight:bold; margin-bottom:16px;">
        ✅ Verified & Approved by CAMALERT
      </div>`
    : `<div style="display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:20px; background:#fafafa; border:1px solid #e5e7eb; color:#6b7280; font-size:12px; font-weight:bold; margin-bottom:16px;">
        ⏳ Pending Verification
      </div>`;

  win.document.write(`
    <html>
      <head>
        <title>CAMALERT Report - ${report.id}</title>
        <style>
          body { font-family: sans-serif; padding: 32px; max-width: 700px; margin: 0 auto; color: #111; }
          .section { margin-bottom: 16px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 4px; }
          .value { font-size: 14px; color: #111; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #f3f4f6; margin-bottom: 16px; }
          .advice { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-top: 8px; }
          .advice li { font-size: 13px; color: #374151; margin-bottom: 6px; list-style: none; }
          .what-to-do { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-top: 8px; }
          .what-to-do li { font-size: 13px; color: #92400e; margin-bottom: 8px; list-style: none; }
          .risk-bar { height: 6px; border-radius: 3px; margin-bottom: 20px; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
          .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div style="height:6px; background:${badgeColor}; border-radius:3px; margin-bottom:20px;"></div>

        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
          <img src="${window.location.origin}/src/assets/clautech-logo.png"
            alt="CAMALERT"
            style="height:40px; width:40px; object-fit:contain; border-radius:8px;"
            onerror="this.style.display='none'"
          />
          <div>
            <div style="font-size:20px; font-weight:900; letter-spacing:-0.5px;">
              CAM<span style="color:#6366f1;">ALERT</span>
            </div>
            <div style="font-size:10px; color:#9ca3af; letter-spacing:0.15em; text-transform:uppercase;">
              Cyber Trust · Cameroon
            </div>
          </div>
        </div>

        <h1 style="font-size:18px; margin-bottom:4px;">Scam Report</h1>
        <div class="badge">${report.scam_type.replace(/_/g, " ").toUpperCase()}</div>
        <br/>
        ${verifiedHTML}

        <div style="background:${borderColor}; height:4px; border-radius:2px; margin-bottom:20px;"></div>

        <div class="section">
          <div class="label">Description</div>
          <div class="value">${report.description}</div>
        </div>

        <div class="section">
          <div class="label">Risk Level</div>
          <div class="value" style="color:${badgeColor}; font-weight:bold;">${report.risk_level?.toUpperCase() ?? "—"}</div>
        </div>

        <div class="section">
          <div class="label">AI Confidence</div>
          <div class="value">${report.ai_confidence ?? "—"}%</div>
        </div>

        ${report.contact_info ? `
        <div class="section">
          <div class="label">Contact / Number</div>
          <div class="value">${report.contact_info}</div>
        </div>` : ""}

        <div class="section">
          <div class="label">Location</div>
          <div class="value">${report.location}</div>
        </div>

        <div class="section">
          <div class="label">Reported by</div>
          <div class="value">${report.reporter_name ?? "Anonymous"}</div>
        </div>

        <div class="section">
          <div class="label">Date</div>
          <div class="value">${new Date(report.created_at).toLocaleDateString()}</div>
        </div>

        ${report.ai_advice && report.ai_advice.length > 0 ? `
        <div class="section">
          <div class="label">AI Advice</div>
          <div class="advice">
            <ul>${report.ai_advice.map((tip) => `<li>• ${tip}</li>`).join("")}</ul>
          </div>
        </div>` : ""}

        <hr class="divider"/>

        <div class="section">
          <div class="label" style="color:#92400e;">⚠️ What to do if you were scammed</div>
          <div class="what-to-do">
            <ul>
              <li>1. 📞 Call MTN (dial 180) or Orange (dial 122) immediately to freeze your account</li>
              <li>2. 🔒 Change your MoMo PIN right away via the app or USSD</li>
              <li>3. 🚔 File a complaint with your local police and keep this report as evidence</li>
              <li>4. 🚫 Do NOT send any more money or share any codes with the scammer</li>
              <li>5. 📢 Warn family and friends by sharing this report on WhatsApp</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          Generated by CAMALERT · camalert.app · Report ID: ${report.id}
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
  win.close();
};
  return (
    <article className="surface-card overflow-hidden lift-on-hover flex flex-col">
      <div className="h-1 w-full" style={{ background: meta.hex }} />
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <ScamBadge type={report.scam_type} confidence={report.ai_confidence} />
            <p className="text-[11px] text-muted-foreground mt-1">{confidenceLabel}</p>
          </div>
          <RiskIndicator level={report.risk_level} />
        </div>

        <HighlightedText
          text={report.description}
          className="text-sm leading-relaxed text-foreground/85 line-clamp-4 flex-1"
        />

        {report.ai_advice && report.ai_advice.length > 0 && (
          <div className="rounded-xl bg-secondary/60 border border-border/60 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent">
              <Lightbulb className="h-3.5 w-3.5" />
              {t("reports.advice")}
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {report.ai_advice.slice(0, 2).map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ background: meta.hex }} />
                  <span className="line-clamp-2">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.contact_info && (
          <div className="text-xs">
            <span className="font-mono px-2 py-1 rounded-md bg-muted text-muted-foreground">
              {maskContact(report.contact_info)}
            </span>
          </div>
        )}

        <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium w-fit ${badge.className}`}>
          <BadgeIcon className="h-3 w-3" /> {t(`reports.${badge.label}`)}
        </div>

        {reasons.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
              <Lightbulb className="h-3 w-3 text-accent" />
              {t("reports.whyFlagged")}
            </div>
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              {reasons.map((key) => (
                <li key={key} className="flex gap-1.5">
                  <span className="mt-1.5 h-1 w-1 rounded-full shrink-0 bg-accent" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-muted-foreground/70 italic pt-1">
              {t("reports.basedOnPattern")}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-border/60">
          <span className="flex items-center gap-1"><User className="h-3 w-3" />{report.reporter_name || t("reports.anon")}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{report.location}</span>
          <span className="flex items-center gap-1 ml-auto">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale })}
          </span>
        </div>

        <div className="-mt-1 -mb-1 flex justify-between items-center gap-2">
  <Button
    type="button"
    variant="ghost"
    size="sm"
    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
    onClick={() => setShowWhy((v) => !v)}
  >
    {showWhy ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
    {t("why.title")}
  </Button>
  <div className="flex items-center gap-1">
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
      onClick={handleDownloadPDF}
    >
      <Download className="h-3 w-3" />
      PDF
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
      onClick={() => {
        const text = encodeURIComponent(
          `⚠️ *SCAM ALERT via CAMALERT*\n\n` +
          `*Type:* ${report.scam_type.replace(/_/g, " ").toUpperCase()}\n` +
          `*Risk:* ${report.risk_level?.toUpperCase() ?? "—"}\n` +
          `*Location:* ${report.location}\n\n` +
          `*Description:*\n${report.description}\n\n` +
          `🔗 See more alerts: https://camalert.app/reports\n` +
          `_Powered by CAMALERT · Cyber Trust · Cameroon_`
        );
        window.open(`https://wa.me/?text=${text}`, "_blank");
      }}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.86L.057 23.943l6.244-1.635A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.369l-.36-.214-3.706.972.988-3.614-.235-.372A9.818 9.818 0 1112 21.818z"/>
      </svg>
      Share
    </Button>
    <ReportAbuseDialog reportId={report.id} />
  </div>
</div>
        {showWhy && (
          <WhyThisResult reportId={report.id} description={report.description} compact />
        )}
      </div>
    </article>
  );
}