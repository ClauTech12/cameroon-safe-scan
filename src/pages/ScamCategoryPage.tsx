import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
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
import { ChevronLeft, ChevronRight, Inbox, Plus } from "lucide-react";

// URL slug <-> DB enum mapping
const SLUG_TO_TYPE: Record<string, ScamType> = {
  phishing: "phishing",
  "mobile-money": "mobile_money",
  job: "job",
  investment: "investment",
  bank: "bank",
  other: "other",
};

type Lang = "en" | "fr";

const SEO: Record<Lang, Record<ScamType, { title: string; description: string; label: string }>> = {
  en: {
    phishing: {
      title: "Phishing Scams in Cameroon | CamAlert",
      description:
        "Latest phishing scam reports in Cameroon. Spot fake links, SMS, and emails impersonating banks, MTN, Orange and more.",
      label: "Phishing scams",
    },
    mobile_money: {
      title: "Mobile Money (MoMo) Scams in Cameroon | CamAlert",
      description:
        "Real MTN & Orange Mobile Money scam reports across Cameroon. Tactics, risk levels and reported numbers.",
      label: "Mobile Money scams",
    },
    job: {
      title: "Job Scams in Cameroon | CamAlert",
      description:
        "Fake job offers and recruitment scams reported across Cameroon. Stay safe before you apply.",
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
      description: "Fake bank agents, card fraud and impersonation scams reported across Cameroon.",
      label: "Bank scams",
    },
    other: {
      title: "Other Scams in Cameroon | CamAlert",
      description: "Miscellaneous scam reports from across Cameroon.",
      label: "Other scams",
    },
  },
  fr: {
    phishing: {
      title: "Arnaques par hameçonnage au Cameroun | CamAlert",
      description:
        "Derniers signalements d'hameçonnage au Cameroun. Repérez faux liens, SMS et e-mails imitant banques, MTN, Orange.",
      label: "Arnaques par hameçonnage",
    },
    mobile_money: {
      title: "Arnaques Mobile Money (MoMo) au Cameroun | CamAlert",
      description:
        "Signalements réels d'arnaques MTN & Orange Money au Cameroun. Tactiques, niveaux de risque et numéros signalés.",
      label: "Arnaques Mobile Money",
    },
    job: {
      title: "Arnaques à l'emploi au Cameroun | CamAlert",
      description:
        "Fausses offres d'emploi et arnaques de recrutement signalées au Cameroun. Restez prudent avant de postuler.",
      label: "Arnaques à l'emploi",
    },
    investment: {
      title: "Arnaques à l'investissement au Cameroun | CamAlert",
      description:
        "Arnaques crypto, forex et schémas de Ponzi signalés au Cameroun. Vérifiez avant d'investir.",
      label: "Arnaques à l'investissement",
    },
    bank: {
      title: "Arnaques bancaires au Cameroun | CamAlert",
      description: "Faux agents bancaires, fraudes par carte et usurpations signalés au Cameroun.",
      label: "Arnaques bancaires",
    },
    other: {
      title: "Autres arnaques au Cameroun | CamAlert",
      description: "Signalements divers d'arnaques à travers le Cameroun.",
      label: "Autres arnaques",
    },
  },
};

const PAGE_SIZE = 12;

export default function ScamCategoryPage() {
  const { type: slug } = useParams<{ type: string }>();
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const scamType = slug ? SLUG_TO_TYPE[slug] : undefined;

  // If user lands on /fr/scams/* keep language synced to FR; lang switch updates the URL too.
  const isFrenchRoute = pathname.startsWith("/fr/");
  useEffect(() => {
    if (isFrenchRoute && !i18n.language?.startsWith("fr")) {
      i18n.changeLanguage("fr");
    }
  }, [isFrenchRoute, i18n]);

  const lang: Lang = i18n.language?.startsWith("fr") ? "fr" : "en";

  const [reports, setReports] = useState<Report[] | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState(1);

  // Reset page when category changes
  useEffect(() => {
    setPage(1);
  }, [scamType]);

  useEffect(() => {
    if (!scamType) return;
    let active = true;
    setReports(null);
    (async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from("scam_reports")
        .select(
          "id, location, description, scam_type, ai_confidence, ai_advice, risk_level, status, created_at, phone_number",
          { count: "exact" },
        )
        .eq("status", "approved")
        .eq("scam_type", scamType)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (!active) return;
      if (error) {
        console.error(error);
        setReports([]);
        setTotalCount(0);
        return;
      }
      setReports((data as Report[]) || []);
      setTotalCount(count ?? 0);
    })();
    return () => {
      active = false;
    };
  }, [scamType, page]);

  const seo = useMemo(() => (scamType ? SEO[lang][scamType] : null), [scamType, lang]);

  // Title, meta description, canonical, hreflang, and JSON-LD schema
  useEffect(() => {
    if (!seo || !scamType || !slug) return;

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

    const origin = window.location.origin;
    const enHref = `${origin}/scams/${slug}`;
    const frHref = `${origin}/fr/scams/${slug}`;
    const selfHref = lang === "fr" ? frHref : enHref;

    const canonical = ensureMeta('link[rel="canonical"]', () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      return l;
    });
    const prevCanonical = canonical.getAttribute("href");
    canonical.setAttribute("href", selfHref);

    // hreflang alternates
    const altEn = ensureMeta('link[rel="alternate"][hreflang="en"]', () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "alternate");
      l.setAttribute("hreflang", "en");
      return l;
    });
    altEn.setAttribute("href", enHref);

    const altFr = ensureMeta('link[rel="alternate"][hreflang="fr"]', () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "alternate");
      l.setAttribute("hreflang", "fr");
      return l;
    });
    altFr.setAttribute("href", frHref);

    const altX = ensureMeta('link[rel="alternate"][hreflang="x-default"]', () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "alternate");
      l.setAttribute("hreflang", "x-default");
      return l;
    });
    altX.setAttribute("href", enHref);

    // JSON-LD structured data (WebPage + Dataset)
    const ldId = "scam-category-jsonld";
    document.getElementById(ldId)?.remove();
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = ldId;
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          name: seo.title,
          description: seo.description,
          url: selfHref,
          inLanguage: lang,
        },
        {
          "@type": "Dataset",
          name: seo.label,
          description: seo.description,
          url: selfHref,
          inLanguage: lang,
          keywords: [seo.label, "Cameroon", "scam", "fraud", scamType],
          variableMeasured: "Number of approved scam reports",
          measurementTechnique: "Community-submitted reports moderated by CamAlert",
          ...(totalCount > 0 ? { size: `${totalCount} reports` } : {}),
        },
      ],
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) desc.setAttribute("content", prevDesc);
      if (prevCanonical !== null) canonical.setAttribute("href", prevCanonical);
      document.getElementById(ldId)?.remove();
    };
  }, [seo, slug, lang, scamType, totalCount]);

  if (!scamType || !seo) {
    return <Navigate to="/reports" replace />;
  }

  const meta = SCAM_META[scamType];
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const reportSuffix = totalCount === 1
    ? t("threshold.reportSuffix_one", { defaultValue: "report" })
    : t("threshold.reportSuffix_other", { defaultValue: "reports" });

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
                <Link to="/reports">{t("nav.reports")}</Link>
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
              {t(`scamTypes.${scamType}`)}
            </h1>
            <p className="text-muted-foreground max-w-2xl">{seo.description}</p>
          </div>
          <Button asChild>
            <Link to={`/report?type=${slug}`}>
              <Plus className="h-4 w-4" />{" "}
              {lang === "fr" ? "Signaler une arnaque similaire" : "Report similar scam"}
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
              {totalCount} {reportSuffix}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reports.map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                className="flex items-center justify-between gap-3 pt-4 border-t border-border/60"
                aria-label="Pagination"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {lang === "fr" ? "Précédent" : "Previous"}
                </Button>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const n = i + 1;
                    const active = n === page;
                    // Compact: show first, last, current ±1
                    const show =
                      n === 1 ||
                      n === totalPages ||
                      Math.abs(n - page) <= 1;
                    if (!show) {
                      if (n === page - 2 || n === page + 2) {
                        return (
                          <span key={n} className="px-1 opacity-50">
                            …
                          </span>
                        );
                      }
                      return null;
                    }
                    return (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        aria-current={active ? "page" : undefined}
                        className={`min-w-8 h-8 px-2 rounded-md text-sm font-medium border transition-smooth ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  {lang === "fr" ? "Suivant" : "Next"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
