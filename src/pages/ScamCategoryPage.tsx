import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ReportCard, type Report } from "@/components/ReportCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ScamType, SCAM_META } from "@/lib/scam-types";
import { ChevronRight, Inbox, Plus } from "lucide-react";

// URL slug <-> DB enum mapping
const SLUG_TO_TYPE: Record<string, ScamType> = {
  phishing: "phishing",
  "mobile-money": "mobile_money",
  job: "job",
  investment: "investment",
  bank: "bank",
  other: "other",
};

const SEO: Record<ScamType, { title: string; description: string; label: string }> = {
  phishing: {
    title: "Phishing Scams in Cameroon | CamAlert",
    description:
      "Latest phishing scam reports in Cameroon. Learn how to spot fake links, SMS, and emails impersonating banks, MTN, Orange and more.",
    label: "Phishing scams",
  },
  mobile_money: {
    title: "Mobile Money (MoMo) Scams in Cameroon | CamAlert",
    description:
      "Real MTN & Orange Mobile Money scam reports across Cameroon. See common tactics, risk levels and reported numbers.",
    label: "Mobile Money scams",
  },
  job: {
    title: "Job Scams in Cameroon | CamAlert",
    description:
      "Fake job offers, recruitment scams and advance-fee schemes reported across Cameroon. Stay safe before you apply.",
    label: "Job scams",
  },
  investment: {
    title: "Investment Scams in Cameroon | CamAlert",
    description:
      "Crypto, forex and Ponzi-style investment scams reported in Cameroon. Verify before you invest.",
    label: "Investment scams",
  },
  bank: {
    title: "Bank Scams in Cameroon | CamAlert",
    description:
      "Fake bank agents, card fraud and impersonation scams reported across Cameroon.",
    label: "Bank scams",
  },
  other: {
    title: "Other Scams in Cameroon | CamAlert",
    description: "Miscellaneous scam reports from across Cameroon.",
    label: "Other scams",
  },
};

export default function ScamCategoryPage() {
  const { type: slug } = useParams<{ type: string }>();
  const { t } = useTranslation();
  const scamType = slug ? SLUG_TO_TYPE[slug] : undefined;

  const [reports, setReports] = useState<Report[] | null>(null);

  useEffect(() => {
    if (!scamType) return;
    let active = true;
    setReports(null);
    (async () => {
      const { data, error } = await supabase
        .from("scam_reports")
        .select(
          "id, reporter_name, location, description, contact_info, scam_type, ai_confidence, ai_advice, risk_level, status, created_at, phone_number",
        )
        .eq("status", "approved")
        .eq("scam_type", scamType)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        console.error(error);
        setReports([]);
        return;
      }
      setReports((data as any) || []);
    })();
    return () => {
      active = false;
    };
  }, [scamType]);

  const seo = useMemo(() => (scamType ? SEO[scamType] : null), [scamType]);

  useEffect(() => {
    if (!seo) return;
    const prevTitle = document.title;
    document.title = seo.title;

    const ensureMeta = (selector: string, create: () => HTMLElement) => {
      let el = document.head.querySelector(selector) as HTMLElement | null;
      if (!el) {
        el = create();
        document.head.appendChild(el);
      }
      return el;
    };

    const desc = ensureMeta('meta[name="description"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "description");
      return m;
    });
    const prevDesc = desc.getAttribute("content");
    desc.setAttribute("content", seo.description);

    const canonical = ensureMeta('link[rel="canonical"]', () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      return l;
    });
    const prevCanonical = canonical.getAttribute("href");
    canonical.setAttribute("href", `${window.location.origin}/scams/${slug}`);

    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) desc.setAttribute("content", prevDesc);
      if (prevCanonical !== null) canonical.setAttribute("href", prevCanonical);
    };
  }, [seo, slug]);

  if (!scamType || !seo) {
    return <Navigate to="/reports" replace />;
  }

  const meta = SCAM_META[scamType];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-10 space-y-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">{t("nav.home")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/reports">Scams</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{t(`scamTypes.${scamType}`)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{
                color: meta.hex,
                background: `${meta.hex}1a`,
                border: `1px solid ${meta.hex}40`,
              }}
            >
              {seo.label}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              {t(`scamTypes.${scamType}`)} in Cameroon
            </h1>
            <p className="text-muted-foreground max-w-2xl">{seo.description}</p>
          </div>
          <Button asChild>
            <Link to={`/report?type=${slug}`}>
              <Plus className="h-4 w-4" /> Report similar scam
            </Link>
          </Button>
        </header>

        {reports === null ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t("reports.empty")}</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              {reports.length} {reports.length === 1 ? "report" : "reports"}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reports.map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
