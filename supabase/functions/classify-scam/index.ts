// AI scam detection via Lovable AI Gateway with structured tool calling.
// Returns: { scam_type, confidence, risk_level, advice: string[] }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCAM_TYPES = ["mobile_money", "job", "phishing", "investment", "bank", "other"] as const;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description, language = "en" } = await req.json();

    if (!description || typeof description !== "string" || description.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Description must be at least 10 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (description.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Description too long." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const lang = language === "fr" ? "French" : "English";
    const systemPrompt = `You are CamAlert AI, a scam classifier focused on Cameroon (MTN Mobile Money, Orange Money, local job & bank fraud, phishing, investment scams).
Analyze the user's report and call the classify_scam tool with:
- scam_type: one of ${SCAM_TYPES.join(", ")}
- confidence: integer 0-100
- risk_level: low | medium | high (high if user lost money or shared credentials; medium if active attempt; low if vague)
- advice: 4-5 short, actionable safety tips written in ${lang}. Each tip must be one sentence, imperative voice, max 140 chars. NEVER ask follow-up questions.`;

    const tool = {
      type: "function",
      function: {
        name: "classify_scam",
        description: "Classify a scam report and return structured advice.",
        parameters: {
          type: "object",
          properties: {
            scam_type: { type: "string", enum: SCAM_TYPES },
            confidence: { type: "integer", minimum: 0, maximum: 100 },
            risk_level: { type: "string", enum: ["low", "medium", "high"] },
            advice: {
              type: "array",
              items: { type: "string" },
              minItems: 4,
              maxItems: 5,
            },
          },
          required: ["scam_type", "confidence", "risk_level", "advice"],
          additionalProperties: false,
        },
      },
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: description },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "classify_scam" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call returned", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI did not return a classification" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-scam error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
