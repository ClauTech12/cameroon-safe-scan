/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  Clock,
  Activity,
  FileText,
  Shield,
  ExternalLink,
  Filter,
} from "lucide-react";

type AdminRole = "super_admin" | "admin" | "moderator";
type Tab = "admins" | "activity" | "security";

type AdminEntry = {
  id: string;
  user_id: string;
  role: AdminRole;
  created_at: string;
  email: string;
};

type ActivityLog = {
  id: string;
  user_id: string | null;
  action: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  email?: string;
};

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderator",
};

const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: "border-primary/40 text-primary bg-primary/5",
  admin: "border-green-500/40 text-green-700 bg-green-500/5",
  moderator: "border-amber-500/40 text-amber-700 bg-amber-500/5",
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

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString();
}

function actionColor(action: string) {
  if (action.includes("delete") || action.includes("remove")) return "text-red-500 bg-red-500/10";
  if (action.includes("invite") || action.includes("add")) return "text-green-600 bg-green-500/10";
  if (action.includes("update") || action.includes("change")) return "text-amber-600 bg-amber-500/10";
  if (action.includes("report")) return "text-blue-600 bg-blue-500/10";
  return "text-muted-foreground bg-muted/40";
}

async function logActivity(
  userId: string,
  action: string,
  description: string,
  metadata?: Record<string, unknown>
) {
  await (supabase as any).from("activity_logs").insert({
    user_id: userId,
    action,
    description,
    metadata: metadata ?? null,
  });
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("admins");
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("admin");
  const [inviting, setInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AdminEntry | null>(null);
  const [removing, setRemoving] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logFilter, setLogFilter] = useState<"all" | "admin" | "report">("all");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
      setCurrentEmail(data.user?.email ?? null);
    });
  }, []);

  async function fetchAdmins() {
    setLoadingAdmins(true);
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Failed to load admins", description: error.message, variant: "destructive" });
      setLoadingAdmins(false);
      return;
    }

    const enriched: AdminEntry[] = await Promise.all(
      (roles ?? []).map(async (r) => {
        let email = r.user_id.slice(0, 8) + "...";
        try {
          const { data } = await supabase.rpc("get_user_email" as any, { uid: r.user_id });
          if (data) email = data;
        } catch { /* fallback */ }
        return { ...r, email, role: r.role as AdminRole };
      })
    );

    setAdmins(enriched);
    setLoadingAdmins(false);
  }

  async function fetchLogs() {
    setLoadingLogs(true);
    const { data, error } = await (supabase as any)
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast({ title: "Failed to load activity", description: error.message, variant: "destructive" });
      setLoadingLogs(false);
      return;
    }

    const enriched: ActivityLog[] = await Promise.all(
      ((data ?? []) as any[]).map(async (log: any) => {
        let email = "System";
        if (log.user_id) {
          try {
            const { data: e } = await supabase.rpc("get_user_email" as any, { uid: log.user_id });
            if (e) email = String(e);
          } catch { /* fallback */ }
        }
        return { ...log, email };
      })
    );

    setLogs(enriched);
    setLoadingLogs(false);
  }

  useEffect(() => { fetchAdmins(); fetchLogs(); }, []);

  const filteredLogs = logs.filter((l) => {
    if (logFilter === "admin") return !l.action.includes("report");
    if (logFilter === "report") return l.action.includes("report");
    return true;
  });

  const superAdmins = admins.filter((a) => a.role === "super_admin").length;
  const total = admins.length;

  // ── Invite via Edge Function ───────────────────────────────────────────────
  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    setInviting(true);

    const { data, error: inviteError } = await supabase.functions.invoke("invite-admin", {
      body: { email: inviteEmail.trim(), role: inviteRole },
    });

    if (inviteError || data?.error) {
      toast({
        title: "Invite failed",
        description: inviteError?.message ?? data?.error,
        variant: "destructive",
      });
      setInviting(false);
      return;
    }

    if (currentUserId) {
      await logActivity(currentUserId, "invite_admin", `Invited ${inviteEmail} as ${ROLE_LABELS[inviteRole]}`);
    }

    toast({ title: "Invitation sent!", description: `${inviteEmail} invited as ${ROLE_LABELS[inviteRole]}.` });
    setInviteEmail("");
    fetchAdmins();
    fetchLogs();
    setInviting(false);
  }

  async function handleRoleChange(admin: AdminEntry, newRole: AdminRole) {
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("id", admin.id);
    if (error) {
      toast({ title: "Role update failed", description: error.message, variant: "destructive" });
    } else {
      if (currentUserId) {
        await logActivity(currentUserId, "update_admin_role", `Changed ${admin.email} role to ${ROLE_LABELS[newRole]}`);
      }
      toast({ title: "Role updated" });
      fetchAdmins();
      fetchLogs();
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    const { error } = await supabase.from("user_roles").delete().eq("id", removeTarget.id);
    if (error) {
      toast({ title: "Remove failed", description: error.message, variant: "destructive" });
    } else {
      if (currentUserId) {
        await logActivity(currentUserId, "remove_admin", `Removed ${removeTarget.email} from admin team`);
      }
      toast({ title: "Admin removed" });
      setRemoveTarget(null);
      fetchAdmins();
      fetchLogs();
    }
    setRemoving(false);
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "admins", label: "Admin management", icon: Users },
    { id: "activity", label: "Activity log", icon: Activity },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your CamAlert workspace</p>
      </div>

      <div className="flex gap-1 border-b border-border pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "admins" && (
        <>
          <div className="grid gap-3 grid-cols-3">
            {[
              { label: "Total admins", value: total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
              { label: "Super admins", value: superAdmins, icon: ShieldCheck, color: "text-green-600", bg: "bg-green-500/10" },
              { label: "Roles assigned", value: total, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
            ].map((s) => (
              <Card key={s.label} className="surface-elevated border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className={`h-9 w-9 rounded-xl grid place-items-center mb-3 ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div className="font-display text-3xl font-bold tabular-nums">{s.value}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-2 font-medium">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="surface-elevated border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" /> Invite a new admin
              </CardTitle>
              <p className="text-xs text-muted-foreground">They'll receive an email with a link to set up their account.</p>
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
                  <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={inviting} className="rounded-xl">
                  {inviting ? "Sending…" : "Send invite"}
                </Button>
              </div>
              <div className="mt-4 grid gap-1.5 grid-cols-1 sm:grid-cols-3 text-xs text-muted-foreground">
                <div><span className="font-medium text-foreground">Super Admin</span> — full control</div>
                <div><span className="font-medium text-foreground">Admin</span> — manages reports, numbers, alerts</div>
                <div><span className="font-medium text-foreground">Moderator</span> — reviews reports only</div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Admin team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {loadingAdmins ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
              ) : admins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No admins yet.</p>
              ) : (
                admins.map((admin) => {
                  const isMe = admin.user_id === currentUserId;
                  const isSuperAdmin = admin.role === "super_admin";
                  return (
                    <div key={admin.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-all">
                      <div className={`h-9 w-9 rounded-full grid place-items-center shrink-0 text-sm font-medium ${avatarColor(admin.email)}`}>
                        {initials(admin.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {admin.email} {isMe && <span className="text-xs text-muted-foreground">(you)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">Added {new Date(admin.created_at).toLocaleDateString()}</div>
                      </div>
                      {isSuperAdmin || isMe ? (
                        <RoleBadge role={admin.role} />
                      ) : (
                        <Select value={admin.role} onValueChange={(v) => handleRoleChange(admin, v as AdminRole)}>
                          <SelectTrigger className="w-36 h-7 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {!isMe && !isSuperAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => setRemoveTarget(admin)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "activity" && (
        <Card className="surface-elevated border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Activity log
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={logFilter} onValueChange={(v) => setLogFilter(v as typeof logFilter)}>
                  <SelectTrigger className="w-36 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All activity</SelectItem>
                    <SelectItem value="admin">Admin actions</SelectItem>
                    <SelectItem value="report">Report submissions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Last 50 actions across admin and report activity.</p>
          </CardHeader>
          <CardContent className="space-y-1">
            {loadingLogs ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-all">
                  <div className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 text-xs font-medium mt-0.5 ${actionColor(log.action)}`}>
                    {log.action.includes("report") ? <FileText className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{log.description ?? log.action}</div>
                    <div className="text-xs text-muted-foreground">{log.email} · {timeAgo(log.created_at)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{new Date(log.created_at).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "security" && (
        <div className="space-y-4">
          <Card className="surface-elevated border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Your account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                <div>
                  <div className="text-sm font-medium">Signed in as</div>
                  <div className="text-xs text-muted-foreground">{currentEmail ?? "Loading…"}</div>
                </div>
                <Badge variant="outline" className="border-green-500/40 text-green-700 bg-green-500/5">Google</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                <div>
                  <div className="text-sm font-medium">Login method</div>
                  <div className="text-xs text-muted-foreground">Managed by Google — no CamAlert password needed</div>
                </div>
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Password & two-factor auth
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Since you sign in with Google, your password and 2FA are managed by your Google account.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div>
                  <div className="text-sm font-medium">Change your password</div>
                  <div className="text-xs text-muted-foreground">Update your Google account password</div>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open("https://myaccount.google.com/security", "_blank")}>
                  Open Google <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div>
                  <div className="text-sm font-medium">Two-factor authentication</div>
                  <div className="text-xs text-muted-foreground">Add an extra layer of security to your Google account</div>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open("https://myaccount.google.com/signinoptions/two-step-verification", "_blank")}>
                  Enable 2FA <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div>
                  <div className="text-sm font-medium">Review active sessions</div>
                  <div className="text-xs text-muted-foreground">See all devices signed into your Google account</div>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open("https://myaccount.google.com/device-activity", "_blank")}>
                  View devices <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Security tips for CamAlert admins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {[
                "Enable 2FA on your Google account — it's the single most effective protection",
                "Never share your admin login link or session with anyone",
                "Review the Activity Log regularly for unexpected actions",
                "Remove admins who no longer need access immediately",
                "Use a strong, unique password for your Google account",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-secondary/40">
                  <ShieldCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove admin</DialogTitle>
            <DialogDescription>
              Remove <span className="font-medium text-foreground">{removeTarget?.email}</span>? They will lose all access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRemoveTarget(null)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removing} className="rounded-xl">
              {removing ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}