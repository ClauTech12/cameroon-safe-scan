// Edge function: deep AI scam analysis via Google Gemini.
import { jsonResponse, requireSupabaseCaller } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INPUT_KINDS = ["url", "whatsapp", "sms", "email", "phone"] as const;
type InputKind = (typeof INPUT_KINDS)[number];
interface Body { kind: InputKind; input: string; language?: "en" | "fr"; }
function isInputKind(value: string): value is InputKind {
  return (INPUT_KINDS as readonly string[]).includes(value);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405, corsHeaders);
  const auth = await requireSupabaseCaller(req, corsHeaders);
  if (!auth.ok) return auth.response;
  try {
    const body = (await req.json()) as Body;
    if (!body?.kind || !isInputKind(body.kind) || !body?.input || body.input.length > 8000) {
      return jsonResponse({ error: "invalid_body" }, 400, corsHeaders);
    }
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return jsonResponse({ error: "missing_key" }, 500, corsHeaders);
    const lang = body.language === "fr" ? "French" : "English";
    const prompt = `You are CamAlert, an African cyber threat analyst. Analyze the supplied ${body.kind} content for scam indicators. Respond in ${lang}. Return STRICT JSON only with keys: score (0-100 integer), label (one of "safe","suspicious","high_risk","phishing"), summary (one sentence), reasons (array of short bullet strings, max 5), highlights (array of suspicious phrases max 5), recommendations (array of action items max 4). No prose outside JSON.\n\nKind: ${body.kind}\n---\n${body.input}`;
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (resp.status === 429) return jsonResponse({ error: "rate_limited" }, 429, corsHeaders);
    if (!resp.ok) { const t = await resp.text(); console.error("Gemini error", resp.status, t); return jsonResponse({ error: "ai_unavailable" }, 502, corsHeaders); }
    const data = await resp.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let parsed: unknown;
    try { const jsonMatch = content.match(/\{[\s\S]*\}/); parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content); }
    catch { parsed = { score: 0, label: "safe", summary: "Could not parse AI output.", reasons: [], highlights: [], recommendations: [] }; }
    return jsonResponse({ ok: true, analysis: parsed }, 200, corsHeaders);
  } catch (e) { console.error("analyze-scam error", e); return jsonResponse({ error: "server_error" }, 500, corsHeaders); }
});
