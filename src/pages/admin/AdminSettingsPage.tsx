/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
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
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={ROLE_COLORS[role]}>
      {t(`adminSettings.roleLabels.${role}`, ROLE_LABELS[role])}
    </Badge>
  );
}

function timeAgo(date: string, t: TFunction) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("adminSettings.timeAgo.justNow");
  if (mins < 60) return t("adminSettings.timeAgo.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("adminSettings.timeAgo.hoursAgo", { count: hrs });
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
  const { t } = useTranslation();
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
      toast({ title: t("adminSettings.toast.failedLoadAdmins"), description: error.message, variant: "destructive" });
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
      toast({ title: t("adminSettings.toast.failedLoadActivity"), description: error.message, variant: "destructive" });
      setLoadingLogs(false);
      return;
    }

    const enriched: ActivityLog[] = await Promise.all(
      ((data ?? []) as any[]).map(async (log: any) => {
        let email = t("adminSettings.systemLabel");
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
      toast({ title: t("adminSettings.toast.enterValidEmail"), variant: "destructive" });
      return;
    }
    setInviting(true);

    const { data, error: inviteError } = await supabase.functions.invoke("invite-admin", {
      body: { email: inviteEmail.trim(), role: inviteRole },
    });

    if (inviteError || data?.error) {
      toast({
        title: t("adminSettings.toast.inviteFailed"),
        description: inviteError?.message ?? data?.error,
        variant: "destructive",
      });
      setInviting(false);
      return;
    }

    const roleLabel = t(`adminSettings.roleLabels.${inviteRole}`, ROLE_LABELS[inviteRole]);
    if (currentUserId) {
      await logActivity(currentUserId, "invite_admin", t("adminSettings.activityDesc.invited", { email: inviteEmail, role: roleLabel }));
    }

    toast({ title: t("adminSettings.toast.invitationSent"), description: t("adminSettings.toast.invitedAs", { email: inviteEmail, role: roleLabel }) });
    setInviteEmail("");
    fetchAdmins();
    fetchLogs();
    setInviting(false);
  }

  async function handleRoleChange(admin: AdminEntry, newRole: AdminRole) {
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("id", admin.id);
    if (error) {
      toast({ title: t("adminSettings.toast.roleUpdateFailed"), description: error.message, variant: "destructive" });
    } else {
      if (currentUserId) {
        const roleLabel = t(`adminSettings.roleLabels.${newRole}`, ROLE_LABELS[newRole]);
        await logActivity(currentUserId, "update_admin_role", t("adminSettings.activityDesc.roleChanged", { email: admin.email, role: roleLabel }));
      }
      toast({ title: t("adminSettings.toast.roleUpdated") });
      fetchAdmins();
      fetchLogs();
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    const { error } = await supabase.from("user_roles").delete().eq("id", removeTarget.id);
    if (error) {
      toast({ title: t("adminSettings.toast.removeFailed"), description: error.message, variant: "destructive" });
    } else {
      if (currentUserId) {
        await logActivity(currentUserId, "remove_admin", t("adminSettings.activityDesc.removed", { email: removeTarget.email }));
      }
      toast({ title: t("adminSettings.toast.adminRemoved") });
      setRemoveTarget(null);
      fetchAdmins();
      fetchLogs();
    }
    setRemoving(false);
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "admins", label: t("adminSettings.tabs.admins"), icon: Users },
    { id: "activity", label: t("adminSettings.tabs.activity"), icon: Activity },
    { id: "security", label: t("adminSettings.tabs.security"), icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{t("adminSettings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("adminSettings.subtitle")}</p>
      </div>

      <div className="flex gap-1 border-b border-border pb-0">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setActiveTab(tabItem.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === tabItem.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tabItem.icon className="h-4 w-4" />
            {tabItem.label}
          </button>
        ))}
      </div>

      {activeTab === "admins" && (
        <>
          <div className="grid gap-3 grid-cols-3">
            {[
              { label: t("adminSettings.cards.totalAdmins"), value: total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
              { label: t("adminSettings.cards.superAdmins"), value: superAdmins, icon: ShieldCheck, color: "text-green-600", bg: "bg-green-500/10" },
              { label: t("adminSettings.cards.rolesAssigned"), value: total, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
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
                <UserPlus className="h-4 w-4 text-primary" /> {t("adminSettings.invite.title")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t("adminSettings.invite.subtitle")}</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  type="email"
                  placeholder={t("adminSettings.invite.emailPlaceholder")}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  className="flex-1 min-w-48 rounded-xl"
                />
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AdminRole)}>
                  <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t("adminSettings.roleLabels.admin")}</SelectItem>
                    <SelectItem value="moderator">{t("adminSettings.roleLabels.moderator")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={inviting} className="rounded-xl">
                  {inviting ? t("adminSettings.invite.sending") : t("adminSettings.invite.send")}
                </Button>
              </div>
              <div className="mt-4 grid gap-1.5 grid-cols-1 sm:grid-cols-3 text-xs text-muted-foreground">
                <div><span className="font-medium text-foreground">{t("adminSettings.roleLabels.super_admin")}</span> — {t("adminSettings.invite.roleDesc.superAdmin")}</div>
                <div><span className="font-medium text-foreground">{t("adminSettings.roleLabels.admin")}</span> — {t("adminSettings.invite.roleDesc.admin")}</div>
                <div><span className="font-medium text-foreground">{t("adminSettings.roleLabels.moderator")}</span> — {t("adminSettings.invite.roleDesc.moderator")}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> {t("adminSettings.team.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {loadingAdmins ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("adminSettings.team.loading")}</p>
              ) : admins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("adminSettings.team.noAdmins")}</p>
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
                          {admin.email} {isMe && <span className="text-xs text-muted-foreground">{t("adminSettings.team.you")}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{t("adminSettings.team.added")} {new Date(admin.created_at).toLocaleDateString()}</div>
                      </div>
                      {isSuperAdmin || isMe ? (
                        <RoleBadge role={admin.role} />
                      ) : (
                        <Select value={admin.role} onValueChange={(v) => handleRoleChange(admin, v as AdminRole)}>
                          <SelectTrigger className="w-36 h-7 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t("adminSettings.roleLabels.admin")}</SelectItem>
                            <SelectItem value="moderator">{t("adminSettings.roleLabels.moderator")}</SelectItem>
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
                <Activity className="h-4 w-4 text-primary" /> {t("adminSettings.activityTab.title")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={logFilter} onValueChange={(v) => setLogFilter(v as typeof logFilter)}>
                  <SelectTrigger className="w-36 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("adminSettings.activityTab.filter.all")}</SelectItem>
                    <SelectItem value="admin">{t("adminSettings.activityTab.filter.admin")}</SelectItem>
                    <SelectItem value="report">{t("adminSettings.activityTab.filter.report")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("adminSettings.activityTab.subtitle")}</p>
          </CardHeader>
          <CardContent className="space-y-1">
            {loadingLogs ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("adminSettings.activityTab.loading")}</p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("adminSettings.activityTab.noActivity")}</p>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-all">
                  <div className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 text-xs font-medium mt-0.5 ${actionColor(log.action)}`}>
                    {log.action.includes("report") ? <FileText className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{log.description ?? log.action}</div>
                    <div className="text-xs text-muted-foreground">{log.email} · {timeAgo(log.created_at, t)}</div>
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
                <Shield className="h-4 w-4 text-primary" /> {t("adminSettings.security.yourAccount")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                <div>
                  <div className="text-sm font-medium">{t("adminSettings.security.signedInAs")}</div>
                  <div className="text-xs text-muted-foreground">{currentEmail ?? t("adminSettings.security.loading")}</div>
                </div>
                <Badge variant="outline" className="border-green-500/40 text-green-700 bg-green-500/5">Google</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                <div>
                  <div className="text-sm font-medium">{t("adminSettings.security.loginMethod")}</div>
                  <div className="text-xs text-muted-foreground">{t("adminSettings.security.loginMethodDesc")}</div>
                </div>
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> {t("adminSettings.security.passwordAnd2fa")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("adminSettings.security.passwordAnd2faDesc")}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div>
                  <div className="text-sm font-medium">{t("adminSettings.security.changePassword")}</div>
                  <div className="text-xs text-muted-foreground">{t("adminSettings.security.changePasswordDesc")}</div>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open("https://myaccount.google.com/security", "_blank")}>
                  {t("adminSettings.security.openGoogle")} <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div>
                  <div className="text-sm font-medium">{t("adminSettings.security.twoFactorAuth")}</div>
                  <div className="text-xs text-muted-foreground">{t("adminSettings.security.twoFactorDesc")}</div>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open("https://myaccount.google.com/signinoptions/two-step-verification", "_blank")}>
                  {t("adminSettings.security.enable2fa")} <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                <div>
                  <div className="text-sm font-medium">{t("adminSettings.security.reviewSessions")}</div>
                  <div className="text-xs text-muted-foreground">{t("adminSettings.security.reviewSessionsDesc")}</div>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open("https://myaccount.google.com/device-activity", "_blank")}>
                  {t("adminSettings.security.viewDevices")} <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> {t("adminSettings.security.tipsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {["t1", "t2", "t3", "t4", "t5"].map((key) => (
                <div key={key} className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-secondary/40">
                  <ShieldCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{t(`adminSettings.security.tips.${key}`)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("adminSettings.removeDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("adminSettings.removeDialog.desc", { email: removeTarget?.email })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRemoveTarget(null)} className="rounded-xl">{t("adminSettings.removeDialog.cancel")}</Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removing} className="rounded-xl">
              {removing ? t("adminSettings.removeDialog.removing") : t("adminSettings.removeDialog.remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}