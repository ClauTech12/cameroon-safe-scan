import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type CorsHeaders = Record<string, string>;

export function jsonResponse(body: unknown, status: number, corsHeaders: CorsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Read JWT claims after platform verify_jwt (signature already validated at the gateway). */
function readJwtClaims(token: string): { role: string; userId: string | null } | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const json = atob(segment.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { role?: string; sub?: string };
    const role = String(payload.role ?? "");
    if (role !== "anon" && role !== "authenticated") return null;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    return { role, userId };
  } catch {
    return null;
  }
}

export type CallerAuth =
  | { ok: true; supabase: SupabaseClient; userId: string | null; role: string }
  | { ok: false; response: Response };

/**
 * Requires Authorization: Bearer <JWT>.
 * Works with verify_jwt = true in config.toml (gateway validates the signature first).
 */
export async function requireSupabaseCaller(
  req: Request,
  corsHeaders: CorsHeaders,
): Promise<CallerAuth> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, response: jsonResponse({ error: "Unauthorized" }, 401, corsHeaders) };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
    return { ok: false, response: jsonResponse({ error: "Server misconfigured" }, 500, corsHeaders) };
  }

  const token = authHeader.replace("Bearer ", "");
  const claims = readJwtClaims(token);
  if (!claims) {
    return { ok: false, response: jsonResponse({ error: "Unauthorized" }, 401, corsHeaders) };
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  return { ok: true, supabase, userId: claims.userId, role: claims.role };
}

export type AdminAuth =
  | { ok: true; supabase: SupabaseClient; userId: string }
  | { ok: false; response: Response };

/** Requires a signed-in user with the admin role. */
export async function requireAdmin(
  req: Request,
  corsHeaders: CorsHeaders,
): Promise<AdminAuth> {
  const caller = await requireSupabaseCaller(req, corsHeaders);
  if (!caller.ok) return caller;

  if (!caller.userId) {
    return { ok: false, response: jsonResponse({ error: "Unauthorized" }, 401, corsHeaders) };
  }

  const { data: isAdmin, error } = await caller.supabase.rpc("has_role", {
    _user_id: caller.userId,
    _role: "admin",
  });
  if (error || !isAdmin) {
    return { ok: false, response: jsonResponse({ error: "Forbidden" }, 403, corsHeaders) };
  }

  return { ok: true, supabase: caller.supabase, userId: caller.userId };
}
