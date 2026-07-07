// AI fraud-pattern detector. Admin-only. Uses Google Gemini.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jsonResponse, requireAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = await requireAdmin(req, corsHeaders);
  if (!auth.ok) return auth.response;
  try {
    const { phone } = await req.json();
    if (typeof phone !== "string" || phone.length < 8) return jsonResponse({ error: "invalid phone" }, 400, corsHeaders);
    const canonical = phone.replace(/\D/g, "").slice(-9);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: reports } = await admin.from("scam_reports").select("description,scam_type,location,risk_level,created_at").eq("phone_number", canonical).eq("status", "approved").order("created_at", { ascending: false }).limit(40);
    if (!reports || reports.length === 0) return jsonResponse({ signature: "Insufficient data", insights: ["No approved reports linked to this number yet."], severity: "low" }, 200, corsHeaders);
    const summary = reports.map((r, i) => `#${i + 1} [${r.scam_type}/${r.risk_level}/${r.location}] ${String(r.description).slice(0, 280)}`).join("\n");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) return jsonResponse({ error: "GEMINI_API_KEY missing" }, 500, corsHeaders);
    const prompt = `You are a Cameroon fraud analyst. Analyze these reports for phone ${canonical} and return STRICT JSON only with: signature (short name e.g. "Fake MoMo Transfer"), insights (array of 3-6 short insights), severity (low|medium|high). No prose outside JSON.\n\nReports:\n${summary}`;
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (aiRes.status === 429) return jsonResponse({ error: "Rate limit. Try again." }, 429, corsHeaders);
    if (!aiRes.ok) { const t = await aiRes.text(); console.error("Gemini error", aiRes.status, t); return jsonResponse({ error: "AI service error" }, 502, corsHeaders); }
    const data = await aiRes.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let parsed;
    try { const jsonMatch = content.match(/\{[\s\S]*\}/); parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content); }
    catch { return jsonResponse({ error: "Failed to parse AI response" }, 502, corsHeaders); }
    return jsonResponse(parsed, 200, corsHeaders);
  } catch (e) { console.error("detect-pattern", e); return jsonResponse({ error: e instanceof Error ? e.message : "Unknown" }, 500, corsHeaders); }
});
