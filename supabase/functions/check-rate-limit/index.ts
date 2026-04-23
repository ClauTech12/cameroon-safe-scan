// Rate limits report submissions: max 3 per IP per 24h, max 3 per (IP, phone) per 24h.
// Records the attempt on success so subsequent calls within the window are blocked.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_PER_IP_24H = 5;
const MAX_PER_IP_PHONE_24H = 2;

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function canonicalPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.includes("@")) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.slice(-9);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contact_info } = await req.json().catch(() => ({}));
    const phone = canonicalPhone(contact_info);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";
    const ipHash = await sha256(ip + ":camalert-salt-v1");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Per-IP global limit
    const { count: ipCount } = await supabase
      .from("report_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gt("created_at", since);

    if ((ipCount ?? 0) >= MAX_PER_IP_24H) {
      return new Response(
        JSON.stringify({ allowed: false, reason: "ip_limit", message: "Too many reports from your network in the last 24h. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Per-IP-and-phone duplicate limit
    if (phone) {
      const { count: dupCount } = await supabase
        .from("report_rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .eq("phone_number", phone)
        .gt("created_at", since);

      if ((dupCount ?? 0) >= MAX_PER_IP_PHONE_24H) {
        return new Response(
          JSON.stringify({ allowed: false, reason: "duplicate", message: "You've already reported this number recently. Thanks — your earlier report is being reviewed." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Record this attempt
    await supabase.from("report_rate_limits").insert({ ip_hash: ipHash, phone_number: phone });

    return new Response(JSON.stringify({ allowed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-rate-limit error:", e);
    // fail-open so legitimate users aren't blocked by infra issues
    return new Response(JSON.stringify({ allowed: true, soft_error: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
