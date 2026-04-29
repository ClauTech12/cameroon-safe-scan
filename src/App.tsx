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
import CheckNumberPage from "./pages/CheckNumberPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import { AdminLayout } from "./pages/admin/AdminLayout.tsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.tsx";
import FraudDashboardPage from "./pages/admin/FraudDashboardPage.tsx";
import NumberIntelPage from "./pages/admin/NumberIntelPage.tsx";
import FlaggedListPage from "./pages/admin/FlaggedListPage.tsx";
import { PlaceholderPage } from "./pages/admin/PlaceholderPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { RequireAdmin } from "./components/RequireAdmin.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import ReportsModerationPage from "./pages/admin/ReportsModerationPage.tsx";
import PrivacyPage from "./pages/legal/PrivacyPage.tsx";
import TermsPage from "./pages/legal/TermsPage.tsx";
import DisclaimerPage from "./pages/legal/DisclaimerPage.tsx";
import { useEffect, useState } from "react";
import { WhatsAppFAB } from "./components/WhatsAppFAB.tsx";

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
              <Route path="/dashboard" element={<RequireAdmin><DashboardPage /></RequireAdmin>} />
              <Route path="/momo-guard" element={<MoMoGuardPage />} />
              <Route path="/check" element={<CheckNumberPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/disclaimer" element={<DisclaimerPage />} />
              <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="reports" element={<ReportsModerationPage />} />
                <Route path="numbers" element={<NumberIntelPage />} />
                <Route path="patterns" element={<FraudDashboardPage />} />
                <Route path="heatmap" element={<PlaceholderPage title="Heatmap" subtitle="Full-screen Cameroon scam heatmap with filters." />} />
                <Route path="alerts" element={<FlaggedListPage />} />
                <Route path="settings" element={<PlaceholderPage title="Settings" subtitle="Profile, notifications, language and branding." />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <WhatsAppFAB />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
