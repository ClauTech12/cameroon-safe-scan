import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, ShieldAlert, ArrowRight, Share2 } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  og_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string;
  intelligence_categories: { slug: string; name: string } | null;
}

export default function IntelligenceArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      const { data } = await supabase
        .from("intelligence_articles")
        .select("id, slug, title, excerpt, body, cover_image_url, og_image_url, seo_title, seo_description, published_at, intelligence_categories(slug, name)")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      setArticle((data as unknown as Article) ?? null);

      if (data) {
        void supabase.rpc("increment_intelligence_view" as never, { article_id: data.id } as never).then(() => {});
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!article) return;
    const prevTitle = document.title;
    document.title = article.seo_title || `${article.title} | CamAlert Intelligence`;

    const ensureMeta = (selector: string, create: () => HTMLElement) => {
      let el = document.head.querySelector(selector) as HTMLElement | null;
      if (!el) { el = create(); document.head.appendChild(el); }
      return el;
    };

    const desc = ensureMeta('meta[name="description"]', () => {
      const m = document.createElement("meta"); m.setAttribute("name", "description"); return m;
    });
    const prevDesc = desc.getAttribute("content");
    desc.setAttribute("content", article.seo_description || article.excerpt || "");

    const ogImage = article.og_image_url || article.cover_image_url;
    if (ogImage) {
      const og = ensureMeta('meta[property="og:image"]', () => {
        const m = document.createElement("meta"); m.setAttribute("property", "og:image"); return m;
      });
      og.setAttribute("content", ogImage);
    }

    const canonical = ensureMeta('link[rel="canonical"]', () => {
      const l = document.createElement("link"); l.setAttribute("rel", "canonical"); return l;
    });
    const prevCanonical = canonical.getAttribute("href");
    canonical.setAttribute("href", `${window.location.origin}/intelligence/${article.slug}`);

    const ldId = "intelligence-article-jsonld";
    document.getElementById(ldId)?.remove();
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = ldId;
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.excerpt,
      image: ogImage ? [ogImage] : undefined,
      datePublished: article.published_at,
      author: { "@type": "Organization", name: "CamAlert" },
      publisher: { "@type": "Organization", name: "CamAlert" },
      mainEntityOfPage: `${window.location.origin}/intelligence/${article.slug}`,
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) desc.setAttribute("content", prevDesc);
      if (prevCanonical !== null) canonical.setAttribute("href", prevCanonical);
      document.getElementById(ldId)?.remove();
    };
  }, [article]);

  if (article === undefined) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-12 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (article === null) return <Navigate to="/intelligence" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <article className="container max-w-3xl mx-auto px-4 py-10 space-y-6">
          <div className="space-y-3">
            {article.intelligence_categories && (
              <Badge variant="secondary">{article.intelligence_categories.name}</Badge>
            )}
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{article.title}</h1>
            <p className="text-sm text-muted-foreground">
              Published {format(new Date(article.published_at), "PPP")}
            </p>
          </div>

          {article.cover_image_url && (
            <img src={article.cover_image_url} alt={article.title} className="w-full rounded-xl object-cover max-h-96" />
          )}

          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{article.body}</ReactMarkdown>
          </div>

          <Card className="p-6 bg-primary/5 border-primary/20 space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Think you've spotted this scam?
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link to="/analyzer">
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze a suspicious message
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/report">
                  Report a scam
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>

          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
            <Share2 className="h-4 w-4" />
            Know someone who needs to see this? Share it — every share helps someone avoid a scam.
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
