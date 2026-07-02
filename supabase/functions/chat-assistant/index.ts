// Edge function: CAMALERT AI Cyber Safety Assistant (public chatbot).
// Streams answers from Lovable AI Gateway. Language-aware (en/fr/pcm).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Lang = "en" | "fr" | "pcm";
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
interface Body {
  messages: ChatMessage[];
  language?: Lang;
}

const MAX_MSG_LEN = 4000;
const MAX_HISTORY = 20;

function buildSystemPrompt(lang: Lang): string {
  const langDirective =
    lang === "fr"
      ? "Respond ONLY in natural French."
      : lang === "pcm"
        ? "Respond ONLY in natural Cameroon Pidgin English (e.g. 'Na wa oh', 'no worry', 'you fit', 'sabi'). Do NOT write in standard English or French."
        : "Respond ONLY in clear, friendly English.";

  return `You are CAMALERT AI, a Cyber Safety Assistant for Cameroon and Africa.
You help everyday people spot scams, protect their Mobile Money, and stay safe online.

${langDirective}

Scope you cover:
- Explain scam types: phishing, SIM swap, MoMo fraud, OTP theft, romance/investment/job scams, impersonation.
- Analyse suspicious SMS, WhatsApp, email, calls, or links the user pastes.
- Guide users to the right CAMALERT tool:
  * Check a number: /check
  * Report a scam: /report
  * AI Analyzer (deep analysis of URL/SMS/WhatsApp/email/phone): /analyzer
  * MoMo Guard (MTN & Orange Mobile Money fraud): /momo-guard
  * Recent reports: /reports
  * Fraud dashboard: /dashboard
- Give safety advice: never share PIN/OTP, verify agents, avoid clicking unknown links.

Style:
- Warm, calm, non-technical. Short paragraphs. Use bullet points when useful.
- If something looks like a scam, say so directly and explain why in 2-3 signals.
- Never invent CAMALERT data (report counts, verdicts). Suggest the relevant tool instead.
- Never ask for or repeat passwords, full card numbers, or full PINs.
- If a question is off-topic, gently steer back to online safety.
- Keep answers under ~180 words unless the user asks for detail.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const lang: Lang = body.language === "fr" || body.language === "pcm" ? body.language : "en";
  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages = raw
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MSG_LEN) }));

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "empty_messages" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "missing_key", message: "AI assistant is not configured." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: buildSystemPrompt(lang) }, ...messages],
      }),
    });

    if (upstream.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (upstream.status === 402) {
      return new Response(JSON.stringify({ error: "credits_exhausted" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text().catch(() => "");
      console.error("chat-assistant upstream error", upstream.status, t);
      return new Response(JSON.stringify({ error: "ai_unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("chat-assistant server error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
