// AI fraud-pattern detector. Admin-only. Aggregates reports for a phone (canonical 9 digits)
// and asks the AI to identify scam signature, behavioral patterns, and key insights.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    // Verify admin via SECURITY DEFINER rpc
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: claims.claims.sub, _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const { phone } = await req.json();
    if (typeof phone !== "string" || phone.length < 8) return json({ error: "invalid phone" }, 400);

    const canonical = phone.replace(/\D/g, "").slice(-9);

    // Service-role client to bypass RLS for analytics (server-side only)
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: reports } = await admin
      .from("scam_reports")
      .select("description,scam_type,location,risk_level,created_at")
      .eq("phone_number", canonical).eq("status", "approved")
      .order("created_at", { ascending: false }).limit(40);

    if (!reports || reports.length === 0) {
      return json({ signature: "Insufficient data", insights: ["No approved reports linked to this number yet."], severity: "low" });
    }

    const summary = reports.map((r, i) => `#${i + 1} [${r.scam_type}/${r.risk_level}/${r.location}] ${String(r.description).slice(0, 280)}`).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const tool = {
      type: "function",
      function: {
        name: "report_pattern",
        description: "Return structured fraud-pattern analysis.",
        parameters: {
          type: "object",
          properties: {
            signature: { type: "string", description: "Short named signature, e.g. 'Fake MoMo Transfer Reversal'." },
            insights: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
            severity: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: ["signature", "insights", "severity"],
          additionalProperties: false,
        },
      },
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a Cameroon fraud-intelligence analyst. Detect scam signatures, repeated tactics, regional spread, and behavioral patterns across reports linked to ONE phone number. Be concise and concrete. Each insight is one short sentence (<140 chars). Never reveal personal info." },
          { role: "user", content: `Reports linked to one number (canonical ${canonical}):\n${summary}\n\nIdentify the scam signature, 3-6 behavioral insights (e.g. repeated wording, region spread, escalation), and severity.` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "report_pattern" } },
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limit. Try again." }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return json({ error: "AI service error" }, 502);
    }
    const data = await aiRes.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return json({ error: "No tool call" }, 502);
    return json(JSON.parse(args));
  } catch (e) {
    console.error("detect-pattern", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
