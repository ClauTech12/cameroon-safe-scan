// Rate limits report submissions: max 5 per IP per 24h, max 2 per (IP, phone) per 24h.
// Records the attempt on success so subsequent calls within the window are blocked.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jsonResponse, requireSupabaseCaller } from "../_shared/auth.ts";

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

  const auth = await requireSupabaseCaller(req, corsHeaders);
  if (!auth.ok) return auth.response;

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

    const { count: ipCount } = await supabase
      .from("report_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gt("created_at", since);

    if ((ipCount ?? 0) >= MAX_PER_IP_24H) {
      return jsonResponse(
        {
          allowed: false,
          reason: "ip_limit",
          message: "Too many reports from your network in the last 24h. Please try again later.",
        },
        429,
        corsHeaders,
      );
    }

    if (phone) {
      const { count: dupCount } = await supabase
        .from("report_rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .eq("phone_number", phone)
        .gt("created_at", since);

      if ((dupCount ?? 0) >= MAX_PER_IP_PHONE_24H) {
        return jsonResponse(
          {
            allowed: false,
            reason: "duplicate",
            message:
              "You've already reported this number recently. Thanks — your earlier report is being reviewed.",
          },
          429,
          corsHeaders,
        );
      }
    }

    await supabase.from("report_rate_limits").insert({ ip_hash: ipHash, phone_number: phone });

    return jsonResponse({ allowed: true }, 200, corsHeaders);
  } catch (e) {
    console.error("check-rate-limit error:", e);
    return jsonResponse({ allowed: true, soft_error: true }, 200, corsHeaders);
  }
});
