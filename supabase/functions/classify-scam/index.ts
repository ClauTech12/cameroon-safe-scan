// AI scam detection via Google Gemini.
import { jsonResponse, requireSupabaseCaller } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCAM_TYPES = ["mobile_money", "job", "phishing", "investment", "bank", "other"] as const;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = await requireSupabaseCaller(req, corsHeaders);
  if (!auth.ok) return auth.response;
  try {
    const { description, language = "en" } = await req.json();
    if (!description || typeof description !== "string" || description.trim().length < 10) return jsonResponse({ error: "Description must be at least 10 characters." }, 400, corsHeaders);
    if (description.length > 5000) return jsonResponse({ error: "Description too long." }, 400, corsHeaders);
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
    const lang = language === "fr" ? "French" : "English";
    const prompt = `You are CamAlert AI, a scam classifier for Cameroon. Analyze this report and return STRICT JSON only with: scam_type (one of ${SCAM_TYPES.join(", ")}), confidence (0-100), risk_level (low|medium|high), advice (array of 4-5 tips in ${lang}). No prose outside JSON.\n\nReport: ${description}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (response.status === 429) return jsonResponse({ error: "Rate limit exceeded." }, 429, corsHeaders);
    if (!response.ok) { const t = await response.text(); console.error("Gemini error:", response.status, t); return jsonResponse({ error: "AI service unavailable" }, 502, corsHeaders); }
    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let parsed;
    try { const jsonMatch = content.match(/\{[\s\S]*\}/); parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content); }
    catch { return jsonResponse({ error: "AI did not return valid classification" }, 502, corsHeaders); }
    return jsonResponse(parsed, 200, corsHeaders);
  } catch (e) { console.error("classify-scam error:", e); return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500, corsHeaders); }
});
