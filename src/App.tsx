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
import ScamCategoryPage from "./pages/ScamCategoryPage.tsx";
import MoMoGuardPage from "./pages/MoMoGuardPage.tsx";
import CheckNumberPage from "./pages/CheckNumberPage.tsx";
import AIAnalyzerPage from "./pages/AIAnalyzerPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import { AdminLayout } from "./pages/admin/AdminLayout.tsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.tsx";
import FraudDashboardPage from "./pages/admin/FraudDashboardPage.tsx";
import NumberIntelPage from "./pages/admin/NumberIntelPage.tsx";
import FlaggedListPage from "./pages/admin/FlaggedListPage.tsx";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage.tsx";
import HeatmapPage from "./pages/admin/HeatmapPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { RequireAdmin } from "./components/RequireAdmin.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import ReportsModerationPage from "./pages/admin/ReportsModerationPage.tsx";
import PrivacyPage from "./pages/legal/PrivacyPage.tsx";
import TermsPage from "./pages/legal/TermsPage.tsx";
import DisclaimerPage from "./pages/legal/DisclaimerPage.tsx";
import StatusPage from "./pages/StatusPage.tsx";
import { useEffect, useState } from "react";
import { WhatsAppFAB } from "./components/WhatsAppFAB.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import SupportPage from "./pages/SupportPage.tsx"; // ✅ Added
import { AppNavigation } from "./components/ui/navigation-menu";
import { AppFooter } from "./components/ui/navigation-menu";

const queryClient = new QueryClient();

const App = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("theme"); } catch { /* storage unavailable */ }
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
            <div className="flex flex-col min-h-screen">
              <AppNavigation /> {/* ✅ Header nav bar */}

              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/report" element={<ReportPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/scams/:type" element={<ScamCategoryPage />} />
                  <Route path="/fr/scams/:type" element={<ScamCategoryPage />} />
                  <Route path="/momo-guard" element={<MoMoGuardPage />} />
                  <Route path="/check" element={<CheckNumberPage />} />
                  <Route path="/analyzer" element={<AIAnalyzerPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/disclaimer" element={<DisclaimerPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="/support" element={<SupportPage />} /> {/* ✅ Support route */}
                  <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="reports" element={<ReportsModerationPage />} />
                    <Route path="numbers" element={<NumberIntelPage />} />
                    <Route path="patterns" element={<FraudDashboardPage />} />
                    <Route path="heatmap" element={<HeatmapPage />} />
                    <Route path="alerts" element={<FlaggedListPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>

              <AppFooter /> {/* ✅ Footer */}
            </div>

            <WhatsAppFAB />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
