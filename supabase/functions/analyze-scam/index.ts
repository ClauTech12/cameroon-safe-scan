// Edge function: deep AI scam analysis via Lovable AI Gateway.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Body {
  kind: "url" | "whatsapp" | "sms" | "email" | "phone";
  input: string;
  language?: "en" | "fr";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body?.kind || !body?.input || typeof body.input !== "string" || body.input.length > 8000) {
      return new Response(JSON.stringify({ error: "invalid_body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "missing_key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = body.language === "fr" ? "French" : "English";
    const system = `You are CAMALERT, an African cyber threat analyst. Analyze the supplied ${body.kind} content for scam indicators (phishing, mobile money fraud, OTP theft, impersonation, romance, investment, job, fake delivery). Respond in ${lang}. Return STRICT JSON only with keys: score (0-100 integer), label (one of "safe","suspicious","high_risk","phishing"), summary (one sentence), reasons (array of short bullet strings, max 5), highlights (array of suspicious phrases lifted verbatim from input, max 5), recommendations (array of action items, max 4). No prose outside JSON.`;

    const userMsg = `Kind: ${body.kind}\n---\n${body.input}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "credits_exhausted" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: "ai_error", detail: t }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { score: 0, label: "safe", summary: "Could not parse AI output.", reasons: [], highlights: [], recommendations: [] };
    }

    return new Response(JSON.stringify({ ok: true, analysis: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
