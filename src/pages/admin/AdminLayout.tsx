import { NavLink, Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { BrandMark } from "@/components/BrandMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger, SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, Search, Brain, Map, Bell,
  Settings, LogOut, Search as SearchIcon, ShieldCheck, Target,
} from "lucide-react";

const NAV = [
  { to: "/admin", key: "dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/reports", key: "reports", icon: FileText },
  { to: "/admin/numbers", key: "numbers", icon: Search },
  { to: "/admin/patterns", key: "patterns", icon: Brain },
  { to: "/admin/heatmap", key: "heatmap", icon: Map },
  { to: "/admin/alerts", key: "alerts", icon: Bell },
  { to: "/admin/accuracy", key: "accuracy", icon: Target },
  { to: "/admin/settings", key: "settings", icon: Settings },
];

export function AdminLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const initials = (user?.email ?? "A").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        {/* Sidebar */}
        <Sidebar collapsible="icon" className="border-r">
          <SidebarContent className="bg-card">
            <div className="px-4 py-5 flex items-center gap-2 border-b">
              <BrandMark size="sm" />
              <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold tracking-wider">
                <ShieldCheck className="h-3 w-3" /> ADMIN
              </span>
            </div>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1 px-2 pt-3">
                  {NAV.map(({ to, key, icon: Icon, end }) => (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton asChild className="h-10">
                        <NavLink
                          to={to}
                          end={end}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-xl px-3 transition-smooth",
                              isActive
                                ? "bg-primary/10 text-primary font-semibold shadow-sm"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                            )
                          }
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{t(`admin.nav.${key}`)}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="bg-card border-t p-3 text-[11px] text-muted-foreground">
            © CamAlert · ClauTech
          </SidebarFooter>
        </Sidebar>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="sticky top-0 z-30 h-16 border-b bg-background/85 backdrop-blur-xl">
            <div className="h-full flex items-center gap-3 px-4 md:px-6">
              <SidebarTrigger className="rounded-lg" />
              <div className="relative hidden md:flex items-center flex-1 max-w-md">
                <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports, numbers…"
                  className="pl-9 h-10 bg-muted/50 border-transparent focus-visible:bg-card"
                />
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-risk-high ring-2 ring-background" />
                </Button>
                <LanguageToggle />
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full pl-1.5 pr-2 py-1 hover:bg-secondary transition-smooth">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline text-xs font-medium max-w-[140px] truncate">
                        {user?.email}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="text-xs text-muted-foreground">Signed in as</div>
                      <div className="text-sm truncate">{user?.email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/settings"><Settings className="h-4 w-4 mr-2" /> Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/">Public site</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            <Outlet />
          </main>

          <footer className="border-t bg-card/50 py-3 text-center text-[11px] text-muted-foreground">
            {t("admin.disclaimer")}
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
