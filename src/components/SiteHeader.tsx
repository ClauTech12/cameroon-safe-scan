import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BrandMark } from "./BrandMark";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { FileWarning, LayoutDashboard, Smartphone, Home, Menu, X, ArrowRight, ShieldCheck, Search, Brain } from "lucide-react";

export function SiteHeader() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/analyzer", label: t("nav.analyzer", "AI Analyzer"), icon: Brain },
    { to: "/check", label: t("nav.check"), icon: Search },
    { to: "/reports", label: t("nav.reports"), icon: FileWarning },
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/momo-guard", label: t("nav.momoGuard"), icon: Smartphone },
    ...(isAdmin ? [{ to: "/admin", label: t("nav.admin"), icon: ShieldCheck }] : []),
  ];
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="shrink-0" onClick={() => setOpen(false)}>
          <BrandMark size="sm" />
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <LanguageToggle />
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-full pl-4 pr-3 h-9">
            <Link to="/report">{t("nav.report")} <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setOpen((o) => !o)}
            aria-label={t("nav.menu")}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl animate-fade-in">
          <nav className="container py-3 flex flex-col gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/70",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
            <Button asChild size="sm" className="mt-2 bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-full">
              <Link to="/report" onClick={() => setOpen(false)}>{t("nav.report")} <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
