// CamAlert AI Cyber Safety Assistant. Uses Google Gemini.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Lang = "en" | "fr" | "pcm";
interface ChatMessage { role: "user" | "assistant"; content: string; }
interface Body { messages: ChatMessage[]; language?: Lang; }

const MAX_MSG_LEN = 4000;
const MAX_HISTORY = 20;

function buildSystemPrompt(lang: Lang): string {
  const langDirective = lang === "fr" ? "Respond ONLY in natural French." : lang === "pcm" ? "Respond ONLY in natural Cameroon Pidgin English." : "Respond ONLY in clear, friendly English.";
  return `You are CamAlert AI, a Cyber Safety Assistant for Cameroon and Africa. Help people spot scams and stay safe online. ${langDirective} Cover: phishing, SIM swap, MoMo fraud, OTP theft, romance/investment/job scams. Guide users to: /check (check number), /report (report scam), /analyzer (AI analysis), /momo-guard (MoMo fraud), /reports (recent reports). Be warm, calm, non-technical. Keep answers under 180 words.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  let body: Body;
  try { body = (await req.json()) as Body; }
  catch { return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
  const lang: Lang = body.language === "fr" || body.language === "pcm" ? body.language : "en";
  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages = raw.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0).slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MSG_LEN) }));
  if (messages.length === 0) return new Response(JSON.stringify({ error: "empty_messages" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "missing_key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const systemPrompt = buildSystemPrompt(lang);
    const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system_instruction: { parts: [{ text: systemPrompt }] }, contents }),
    });
    if (upstream.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!upstream.ok) { const t = await upstream.text().catch(() => ""); console.error("Gemini error", upstream.status, t); return new Response(JSON.stringify({ error: "ai_unavailable" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
    const data = await upstream.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return new Response(JSON.stringify({ content }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) { console.error("chat-assistant error", e); return new Response(JSON.stringify({ error: "server_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
});
