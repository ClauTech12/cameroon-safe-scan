import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/** Best-effort IP extraction -- same approach used by check-rate-limit. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMinutes: number };

/**
 * IP-based rate limit for a specific AI endpoint. Records the call on
 * success so subsequent calls within the window are counted.
 *
 * Fails OPEN on an unexpected database error -- a transient hiccup in
 * this table should not take down the AI features entirely. Gemini's
 * own per-key rate limit remains a backstop either way.
 */
export async function checkAiRateLimit(
  req: Request,
  endpoint: string,
  opts: { maxRequests: number; windowMinutes: number },
): Promise<RateLimitResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("checkAiRateLimit: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return { allowed: true };
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const ip = getClientIp(req);
    const ipHash = await sha256(ip + ":camalert-ai-salt-v1");
    const since = new Date(Date.now() - opts.windowMinutes * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from("ai_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("endpoint", endpoint)
      .gt("created_at", since);

    if (error) {
      console.error("checkAiRateLimit query error:", error);
      return { allowed: true };
    }

    if ((count ?? 0) >= opts.maxRequests) {
      return { allowed: false, retryAfterMinutes: opts.windowMinutes };
    }

    const { error: insertErr } = await supabase
      .from("ai_rate_limits")
      .insert({ ip_hash: ipHash, endpoint });
    if (insertErr) console.error("checkAiRateLimit insert error:", insertErr);

    return { allowed: true };
  } catch (e) {
    console.error("checkAiRateLimit unexpected error:", e);
    return { allowed: true };
  }
}
