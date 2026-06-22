import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, ShieldCheck, Trash2, Clock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminRole = "super_admin" | "admin" | "moderator";

type AdminEntry = {
  id: string;         // user_roles.id
  user_id: string;    // user_roles.user_id
  role: AdminRole;
  created_at: string;
  email: string;      // joined from auth.users
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderator",
};

const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: "border-primary/40 text-primary bg-primary/5",
  admin:       "border-green-500/40 text-green-700 bg-green-500/5",
  moderator:   "border-amber-500/40 text-amber-700 bg-amber-500/5",
};

const AVATAR_COLORS = [
  "bg-primary/15 text-primary",
  "bg-green-500/15 text-green-700",
  "bg-amber-500/15 text-amber-700",
  "bg-purple-500/15 text-purple-700",
  "bg-rose-500/15 text-rose-700",
];

function avatarColor(str: string) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function RoleBadge({ role }: { role: AdminRole }) {
  return (
    <Badge variant="outline" className={ROLE_COLORS[role]}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const [admins, setAdmins]           = useState<AdminEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState<AdminRole>("admin");
  const [inviting, setInviting]       = useState(false);

  const [removeTarget, setRemoveTarget] = useState<AdminEntry | null>(null);
  const [removing, setRemoving]         = useState(false);

  // ── Get current user ───────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  // ── Fetch admins ───────────────────────────────────────────────────────────
  async function fetchAdmins() {
    setLoading(true);

    // Get all rows from user_roles
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Failed to load admins", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Get emails for each user_id from the edge function
    // (Supabase auth.users is not directly queryable from the client)
    const enriched: AdminEntry[] = await Promise.all(
      (roles ?? []).map(async (r) => {
        // Try to get email via RPC or fall back to user_id display
        let email = r.user_id;
        try {
          const { data } = await supabase.rpc("get_user_email", { uid: r.user_id });
          if (data) email = data;
        } catch {
          // RPC not available yet, show user_id shortened
          email = r.user_id.slice(0, 8) + "...";
        }
        return { ...r, email, role: r.role as AdminRole };
      })
    );

    setAdmins(enriched);
    setLoading(false);
  }

  useEffect(() => { fetchAdmins(); }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const superAdmins = admins.filter((a) => a.role === "super_admin").length;
  const total       = admins.length;

  // ── Invite ─────────────────────────────────────────────────────────────────
  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    setInviting(true);

    // 1. Invite user via Supabase Auth (sends email)
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      inviteEmail.trim()
    );

    if (inviteError && !inviteError.message.toLowerCase().includes("already")) {
      toast({ title: "Invite failed", description: inviteError.message, variant: "destructive" });
      setInviting(false);
      return;
    }

    // 2. Add role to user_roles table
    const userId = inviteData?.user?.id;
    if (userId) {
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: inviteRole,
      });
      if (roleError) {
        toast({ title: "Could not assign role", description: roleError.message, variant: "destructive" });
        setInviting(false);
        return;
      }
    }

    toast({
      title: "Invitation sent!",
      description: `${inviteEmail} invited as ${ROLE_LABELS[inviteRole]}.`,
    });
    setInviteEmail("");
    fetchAdmins();
    setInviting(false);
  }

  // ── Change role ────────────────────────────────────────────────────────────
  async function handleRoleChange(admin: AdminEntry, newRole: AdminRole) {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("id", admin.id);

    if (error) {
      toast({ title: "Role update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role updated", description: `Role changed to ${ROLE_LABELS[newRole]}.` });
      fetchAdmins();
    }
  }

  // ── Remove ─────────────────────────────────────────────────────────────────
  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    const { error } = await supabase.from("user_roles").delete().eq("id", removeTarget.id);
    if (error) {
      toast({ title: "Remove failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Admin removed", description: `${removeTarget.email} has been removed.` });
      setRemoveTarget(null);
      fetchAdmins();
    }
    setRemoving(false);
  }

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage admin access for your CamAlert workspace
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: "Total admins",  value: total,       icon: Users,      color: "text-primary",    bg: "bg-primary/10"    },
          { label: "Super admins",  value: superAdmins, icon: ShieldCheck, color: "text-green-600", bg: "bg-green-500/10"  },
          { label: "Roles assigned",value: total,       icon: Clock,      color: "text-amber-600",  bg: "bg-amber-500/10"  },
        ].map((s) => (
          <Card key={s.label} className="surface-elevated border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`h-9 w-9 rounded-xl grid place-items-center mb-3 ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="font-display text-3xl font-bold tabular-nums">{s.value}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-2 font-medium">
                {s.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invite */}
      <Card className="surface-elevated border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Invite a new admin
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            They'll receive an email with a link to set up their account.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              className="flex-1 min-w-48 rounded-xl"
            />
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AdminRole)}>
              <SelectTrigger className="w-36 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleInvite} disabled={inviting} className="rounded-xl">
              {inviting ? "Sending…" : "Send invite"}
            </Button>
          </div>

          {/* Role descriptions */}
          <div className="mt-4 grid gap-1.5 grid-cols-1 sm:grid-cols-3 text-xs text-muted-foreground">
            <div><span className="font-medium text-foreground">Super Admin</span> — full control, manages all admins</div>
            <div><span className="font-medium text-foreground">Admin</span> — manages reports, numbers, alerts</div>
            <div><span className="font-medium text-foreground">Moderator</span> — reviews and actions reports only</div>
          </div>
        </CardContent>
      </Card>

      {/* Admin list */}
      <Card className="surface-elevated border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Admin team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No admins yet. Invite someone above.
            </p>
          ) : (
            admins.map((admin) => {
              const isMe = admin.user_id === currentUserId;
              const isSuperAdmin = admin.role === "super_admin";
              return (
                <div
                  key={admin.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-all"
                >
                  {/* Avatar */}
                  <div className={`h-9 w-9 rounded-full grid place-items-center shrink-0 text-sm font-medium ${avatarColor(admin.email)}`}>
                    {initials(admin.email)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {admin.email} {isMe && <span className="text-xs text-muted-foreground">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Added {new Date(admin.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Role */}
                  {isSuperAdmin || isMe ? (
                    <RoleBadge role={admin.role} />
                  ) : (
                    <Select
                      value={admin.role}
                      onValueChange={(v) => handleRoleChange(admin, v as AdminRole)}
                    >
                      <SelectTrigger className="w-36 h-7 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Remove — can't remove yourself or other super admins */}
                  {!isMe && !isSuperAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      onClick={() => setRemoveTarget(admin)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Confirm remove dialog */}
      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove admin</DialogTitle>
            <DialogDescription>
              Remove <span className="font-medium text-foreground">{removeTarget?.email}</span>? They
              will lose all access to the CamAlert dashboard immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRemoveTarget(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removing} className="rounded-xl">
              {removing ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}