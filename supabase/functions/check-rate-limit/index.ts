// Rate limits report submissions: max 3 per IP per hour, max 2 per (IP, phone) per 24h.
// Records the attempt on success so subsequent calls within the window are blocked.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jsonResponse, requireSupabaseCaller } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_PER_IP_HOUR = 3;
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
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405, corsHeaders);
  }

  const auth = await requireSupabaseCaller(req, corsHeaders);
  if (!auth.ok) return auth.response;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!serviceKey || !supabaseUrl) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL");
    return jsonResponse(
      {
        allowed: false,
        error: "service_unavailable",
        message: "Rate limit service is temporarily unavailable. Please try again shortly.",
      },
      503,
      corsHeaders,
    );
  }

  try {
    const { contact_info } = await req.json().catch(() => ({}));
    const phone = canonicalPhone(contact_info);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";
    const ipHash = await sha256(ip + ":camalert-salt-v1");

    const supabase = createClient(supabaseUrl, serviceKey);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count: ipCount, error: ipCountErr } = await supabase
      .from("report_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gt("created_at", since1h);

    if (ipCountErr) throw ipCountErr;

    if ((ipCount ?? 0) >= MAX_PER_IP_HOUR) {
      return jsonResponse(
        {
          allowed: false,
          reason: "ip_limit",
          message: "Too many reports from your network in the last hour. Please try again later.",
        },
        429,
        corsHeaders,
      );
    }

    if (phone) {
      const { count: dupCount, error: dupCountErr } = await supabase
        .from("report_rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .eq("phone_number", phone)
        .gt("created_at", since24h);

      if (dupCountErr) throw dupCountErr;

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

    const { error: insertErr } = await supabase
      .from("report_rate_limits")
      .insert({ ip_hash: ipHash, phone_number: phone });

    if (insertErr) throw insertErr;

    return jsonResponse({ allowed: true }, 200, corsHeaders);
  } catch (e) {
    console.error("check-rate-limit error:", e);
    return jsonResponse(
      {
        allowed: false,
        error: "service_unavailable",
        message: "Rate limit service is temporarily unavailable. Please try again shortly.",
      },
      503,
      corsHeaders,
    );
  }
});
