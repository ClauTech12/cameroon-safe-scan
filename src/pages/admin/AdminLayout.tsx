import { NavLink, Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { BrandMark } from "@/components/BrandMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Activity, LogOut, ShieldCheck, AlertTriangle } from "lucide-react";

export function AdminLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const links = [
    { to: "/admin", label: t("admin.nav.fraud"), icon: Activity, end: true },
    { to: "/admin/numbers", label: t("admin.nav.numbers"), icon: Search },
    { to: "/admin/flagged", label: t("admin.nav.flagged"), icon: AlertTriangle },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark size="sm" />
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
              <ShieldCheck className="h-3 w-3" /> ADMIN
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="hidden md:inline text-xs text-muted-foreground mr-2">{user?.email}</span>
            <LanguageToggle />
            <ThemeToggle />
            <Button size="sm" variant="ghost" onClick={signOut} className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav className="container flex gap-1 overflow-x-auto pb-2">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-smooth",
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/70",
              )}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 container py-6">
        <Outlet />
      </main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        {t("admin.disclaimer")}
      </footer>
    </div>
  );
}
