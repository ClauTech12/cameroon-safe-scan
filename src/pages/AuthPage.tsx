import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShieldCheck, Loader2 } from "lucide-react";

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(8).max(72);

export default function AuthPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!loading && session) nav(isAdmin ? "/admin" : "/", { replace: true });
  }, [session, isAdmin, loading, nav]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const ev = emailSchema.safeParse(email);
    const pv = passwordSchema.safeParse(password);
    if (!ev.success) return toast.error(t("auth.invalidEmail"));
    if (!pv.success) return toast.error(t("auth.invalidPassword"));
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: ev.data, password: pv.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.welcome"));
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const ev = emailSchema.safeParse(email);
    const pv = passwordSchema.safeParse(password);
    if (!ev.success) return toast.error(t("auth.invalidEmail"));
    if (!pv.success) return toast.error(t("auth.invalidPassword"));
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: ev.data, password: pv.data,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.checkEmail"));
  }

  async function google() {
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (r.error) { toast.error(r.error.message ?? "Google sign-in failed"); setBusy(false); }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    const ev = emailSchema.safeParse(resetEmail);
    if (!ev.success) return toast.error(t("auth.invalidEmail"));
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(ev.data, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setResetSent(true);
    toast.success("Password reset email sent! Check your inbox.");
  }

  if (showReset) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container py-12 md:py-20 flex items-center justify-center">
          <Card className="w-full max-w-md surface-elevated">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>
                Enter your email and we'll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetSent ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    ✅ Reset email sent to <strong>{resetEmail}</strong>. Check your inbox and spam folder.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => { setShowReset(false); setResetSent(false); }}>
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={resetPassword} className="space-y-3">
                  <Field id="reset-email" label="Email" type="email" value={resetEmail} setValue={setResetEmail} />
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Send Reset Link
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setShowReset(false)}>
                    Back to Sign In
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-12 md:py-20 flex items-center justify-center">
        <Card className="w-full max-w-md surface-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t("auth.title")}</CardTitle>
            <CardDescription>{t("auth.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
                <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-3">
                  <Field id="email" label="Email" type="email" value={email} setValue={setEmail} />
                  <Field id="password" label={t("auth.password")} type="password" value={password} setValue={setPassword} />
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t("auth.signIn")}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setResetEmail(email); setShowReset(true); }}
                    className="w-full text-xs text-muted-foreground hover:text-foreground text-center mt-1 underline"
                  >
                    Forgot password?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-3">
                  <Field id="su-email" label="Email" type="email" value={email} setValue={setEmail} />
                  <Field id="su-password" label={t("auth.password")} type="password" value={password} setValue={setPassword} />
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t("auth.createAccount")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t("auth.or")}</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={google} disabled={busy}>
              <GoogleIcon /> {t("auth.continueGoogle")}
            </Button>

            {session && !isAdmin && (
              <Button variant="ghost" size="sm" className="w-full mt-3 text-xs"
                onClick={async () => {
                  const { data } = await supabase.rpc("claim_first_admin");
                  const r = data as { ok?: boolean; error?: string };
                  if (r?.ok) { toast.success("You are now admin. Reloading…"); setTimeout(() => location.reload(), 800); }
                  else toast.error(r?.error === "admin_exists" ? "An admin already exists." : "Could not claim admin.");
                }}>
                Claim first admin (one-time)
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">
              {t("auth.adminNote")} <Link to="/" className="underline">{t("nav.home")}</Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  setValue: (value: string) => void;
}

function Field({ id, label, type, value, setValue }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => setValue(e.target.value)} required autoComplete={type === "password" ? "current-password" : "email"} />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09A6.96 6.96 0 015.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
