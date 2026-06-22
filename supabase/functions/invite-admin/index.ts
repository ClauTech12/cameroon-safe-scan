import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "admin" | "moderator" | "user";
const ALLOWED_ROLES: Role[] = ["admin", "moderator", "user"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
    console.error("missing_supabase_env");
    return json({ error: "server_error" }, 500);
  }

  // ---- AuthN: verify caller JWT ----
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }
  const token = authHeader.slice("Bearer ".length);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: claimsData, error: claimsError } =
    await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return json({ error: "unauthorized" }, 401);
  }
  const callerId = claimsData.claims.sub as string;

  // ---- AuthZ: caller must be admin ----
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
    _user_id: callerId,
    _role: "admin",
  });
  if (roleErr) {
    console.error("has_role_error", roleErr);
    return json({ error: "server_error" }, 500);
  }
  if (!isAdmin) {
    return json({ error: "forbidden" }, 403);
  }

  // ---- Input validation ----
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const { email, role } = (body ?? {}) as { email?: unknown; role?: unknown };

  if (
    typeof email !== "string" ||
    email.length < 3 ||
    email.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return json({ error: "invalid_email" }, 400);
  }
  if (typeof role !== "string" || !ALLOWED_ROLES.includes(role as Role)) {
    return json({ error: "invalid_role" }, 400);
  }

  // ---- Invite user ----
  const { data: invited, error: inviteErr } =
    await admin.auth.admin.inviteUserByEmail(email);

  let userId = invited?.user?.id ?? null;

  if (inviteErr || !userId) {
    // If user already exists, fall back to looking them up by email.
    console.error("invite_error", inviteErr?.message);
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) {
      console.error("list_users_error", listErr);
      return json({ error: "invite_failed" }, 500);
    }
    const found = list.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!found) {
      return json({ error: "invite_failed" }, 500);
    }
    userId = found.id;
  }

  // ---- Assign role ----
  const { error: insertErr } = await admin
    .from("user_roles")
    .insert({ user_id: userId, role })
    .select()
    .single();

  if (insertErr && insertErr.code !== "23505") {
    // 23505 = unique_violation (already has role) — treat as success
    console.error("role_insert_error", insertErr);
    return json({ error: "role_assign_failed" }, 500);
  }

  return json({ ok: true, user_id: userId, role, invited: !inviteErr }, 200);
});
