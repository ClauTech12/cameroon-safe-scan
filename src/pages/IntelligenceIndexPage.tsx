import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string;
  intelligence_categories: { slug: string; name: string } | null;
}

const PAGE_SIZE = 9;

export default function IntelligenceIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("intelligence_categories")
        .select("id, slug, name")
        .order("sort_order");
      setCategories(data ?? []);
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      setArticles(null);
      let query = supabase
        .from("intelligence_articles")
        .select("id, slug, title, excerpt, cover_image_url, published_at, intelligence_categories(slug, name)", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (activeCategory) {
        const cat = categories.find((c) => c.slug === activeCategory);
        if (cat) query = query.eq("category_id", cat.id);
      }
      if (search.trim()) {
        query = query.textSearch("search_vector", search.trim(), { type: "websearch" });
      }

      const { data, count } = await query;
      setArticles((data as unknown as Article[]) ?? []);
      setTotalCount(count ?? 0);
    })();
  }, [activeCategory, search, page, categories]);

  useEffect(() => {
    document.title = "CamAlert Intelligence — Scam Alerts & Cybersecurity Guides | CamAlert";
    const ensureMeta = (selector: string, create: () => HTMLElement) => {
      let el = document.head.querySelector(selector) as HTMLElement | null;
      if (!el) { el = create(); document.head.appendChild(el); }
      return el;
    };
    const desc = ensureMeta('meta[name="description"]', () => {
      const m = document.createElement("meta"); m.setAttribute("name", "description"); return m;
    });
    desc.setAttribute("content",
      "Recent scam alerts, emerging fraud patterns, and practical safety guides for Cameroon and Africa — MoMo scams, WhatsApp scams, phishing, and more.");
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-primary/5 border-b py-12">
          <div className="container max-w-5xl mx-auto px-4 text-center space-y-3">
            <div className="inline-flex items-center gap-2 text-primary font-semibold">
              <ShieldAlert className="h-5 w-5" />
              CamAlert Intelligence
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Stay informed. Stay alert. Stay protected.</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Recent scam alerts, emerging fraud patterns, and practical safety guides for Cameroon and Africa.
            </p>
          </div>
        </section>

        <section className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={activeCategory === "" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => { setPage(1); setSearchParams((p) => { p.delete("category"); return p; }); }}
              >
                All
              </Badge>
              {categories.map((c) => (
                <Badge
                  key={c.id}
                  variant={activeCategory === c.slug ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => { setPage(1); setSearchParams((p) => { p.set("category", c.slug); return p; }); }}
                >
                  {c.name}
                </Badge>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                className="pl-8"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {articles === null ? (
            <div className="grid md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No articles found. Try a different search or category.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {articles.map((a) => (
                <Link key={a.id} to={`/intelligence/${a.slug}`}>
                  <Card className="h-full overflow-hidden hover:shadow-md transition-smooth">
                    {a.cover_image_url && (
                      <img src={a.cover_image_url} alt={a.title} className="h-40 w-full object-cover" />
                    )}
                    <div className="p-4 space-y-2">
                      {a.intelligence_categories && (
                        <Badge variant="secondary" className="text-xs">{a.intelligence_categories.name}</Badge>
                      )}
                      <h2 className="font-semibold leading-snug line-clamp-2">{a.title}</h2>
                      {a.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{a.excerpt}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(a.published_at), "PPP")}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
