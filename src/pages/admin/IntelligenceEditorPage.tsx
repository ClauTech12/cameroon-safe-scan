import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Save, CalendarIcon, ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

interface Category {
  id: string;
  name: string;
}

const ARTICLE_TEMPLATE = `## What is this scam?

Describe the scam in one or two clear sentences.

## How it works

Walk through the steps a scammer typically takes.

## Warning signs

- Sign one
- Sign two
- Sign three

## How to protect yourself

- Tip one
- Tip two

## What to do if you've already been affected

Explain the concrete next steps — who to contact, how to report it.
`;

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function IntelligenceEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState(ARTICLE_TEMPLATE);
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"draft" | "scheduled" | "published" | "archived">("draft");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(undefined);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("intelligence_categories")
        .select("id, name")
        .order("sort_order");
      if (error) { toast.error(error.message); return; }
      setCategories(data ?? []);
    })();
  }, []);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      const { data, error } = await supabase
        .from("intelligence_articles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) { toast.error(error.message); setLoading(false); return; }
      setTitle(data.title);
      setSlug(data.slug);
      setSlugTouched(true);
      setExcerpt(data.excerpt ?? "");
      setBody(data.body);
      setCategoryId(data.category_id);
      setStatus(data.status as typeof status);
      setCoverImageUrl(data.cover_image_url ?? "");
      setSeoTitle(data.seo_title ?? "");
      setSeoDescription(data.seo_description ?? "");
      setScheduledFor(data.scheduled_for ? new Date(data.scheduled_for) : undefined);
      setLoading(false);
    })();
  }, [id, isNew]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  async function save(nextStatus: "draft" | "scheduled" | "published") {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!categoryId) { toast.error("Pick a category"); return; }
    if (!slug.trim()) { toast.error("Slug is required"); return; }

    setSaving(nextStatus === "published" ? "publish" : "draft");

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      body,
      category_id: categoryId,
      status: nextStatus,
      cover_image_url: coverImageUrl.trim() || null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      scheduled_for: nextStatus === "scheduled" && scheduledFor ? scheduledFor.toISOString() : null,
      published_at: nextStatus === "published" ? new Date().toISOString() : undefined,
      author_id: user?.id,
    };

    const { error } = isNew
      ? await supabase.from("intelligence_articles").insert(payload)
      : await supabase.from("intelligence_articles").update(payload).eq("id", id);

    setSaving(null);

    if (error) { toast.error(error.message); return; }
    toast.success(nextStatus === "published" ? "Article published" : "Saved");
    navigate("/admin/intelligence");
  }

  const captionPreview = useMemo(() => {
    const lines = [
      `🛡️ ${title || "Article title"}`,
      "",
      excerpt || "Short summary goes here.",
      "",
      "Read the full guide + report or check a scam at camalert.org",
      "Follow CamAlert — @camalert on Facebook, @camalert.org on Instagram 🛡️",
      "#CamAlert #ScamAlert #Cameroon",
    ];
    return lines.join("\n");
  }, [title, excerpt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/intelligence"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">{isNew ? "New Article" : "Edit Article"}</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How the fake MTN MoMo refund SMS scam works" />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug}
                onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} />
              <p className="text-xs text-muted-foreground mt-1">camalert.org/intelligence/{slug || "..."}</p>
            </div>
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
                placeholder="One or two sentences shown in listings and social previews" rows={2} />
            </div>
          </Card>

          <Card className="p-4">
            <Tabs defaultValue="write">
              <TabsList>
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea value={body} onChange={(e) => setBody(e.target.value)}
                  rows={24} className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground mt-2">
                  Markdown. Keep the What it is / How it works / Warning signs / Protect yourself /
                  If affected structure so every article stays consistent.
                </p>
              </TabsContent>
              <TabsContent value="preview">
                <article className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{body}</ReactMarkdown>
                </article>
              </TabsContent>
            </Tabs>
          </Card>

          <Card className="p-4 space-y-4">
            <h2 className="font-semibold text-sm">SEO</h2>
            <div>
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input id="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Falls back to article title if left blank" />
            </div>
            <div>
              <Label htmlFor="seoDescription">SEO description</Label>
              <Textarea id="seoDescription" value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)} rows={2} />
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h2 className="font-semibold text-sm">Social caption preview</h2>
            <p className="text-xs text-muted-foreground">
              Copyable caption for Facebook, Instagram, LinkedIn, and WhatsApp — pairs with the cover image.
            </p>
            <Textarea readOnly value={captionPreview} rows={6} className="text-sm" />
            <Button variant="outline" size="sm"
              onClick={() => { navigator.clipboard.writeText(captionPreview); toast.success("Caption copied"); }}>
              Copy caption
            </Button>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cover">Cover image URL</Label>
              <Input id="cover" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..." />
            </div>
            <div>
              <Label>Schedule for (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {scheduledFor ? format(scheduledFor, "PPP p") : "Not scheduled"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Calendar mode="single" selected={scheduledFor} onSelect={setScheduledFor} />
                </PopoverContent>
              </Popover>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <Button className="w-full" variant="outline" disabled={!!saving}
              onClick={() => save("draft")}>
              {saving === "draft" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save draft
            </Button>
            {scheduledFor && (
              <Button className="w-full" variant="secondary" disabled={!!saving}
                onClick={() => save("scheduled")}>
                Schedule for {format(scheduledFor, "PPP")}
              </Button>
            )}
            <Button className="w-full" disabled={!!saving} onClick={() => save("published")}>
              {saving === "publish" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Publish now
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
