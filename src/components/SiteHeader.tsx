import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BrandMark } from "./BrandMark";
import { LanguageToggle } from "./LanguageToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileWarning, LayoutDashboard, Smartphone, Home } from "lucide-react";

export function SiteHeader() {
  const { t } = useTranslation();
  const links = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/reports", label: t("nav.reports"), icon: FileWarning },
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/momo-guard", label: t("nav.momoGuard"), icon: Smartphone },
  ];
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="shrink-0"><BrandMark /></Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button asChild size="sm" className="bg-gradient-primary hover:opacity-90 shadow-glow font-semibold">
            <Link to="/report">{t("nav.report")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
