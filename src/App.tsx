import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/i18n";
import Index from "./pages/Index.tsx";
import ReportPage from "./pages/ReportPage.tsx";
import ReportsPage from "./pages/ReportsPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import MoMoGuardPage from "./pages/MoMoGuardPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import { AdminLayout } from "./pages/admin/AdminLayout.tsx";
import FraudDashboardPage from "./pages/admin/FraudDashboardPage.tsx";
import NumberIntelPage from "./pages/admin/NumberIntelPage.tsx";
import FlaggedListPage from "./pages/admin/FlaggedListPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { RequireAdmin } from "./components/RequireAdmin.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("theme"); } catch {}
    const prefers = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial = (saved as "light" | "dark" | null) || (prefers ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner theme={theme} />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/momo-guard" element={<MoMoGuardPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<FraudDashboardPage />} />
                <Route path="numbers" element={<NumberIntelPage />} />
                <Route path="flagged" element={<FlaggedListPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
