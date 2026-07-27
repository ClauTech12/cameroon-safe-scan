import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/i18n";
import { lazy, Suspense, useEffect, useState } from "react";
import { WhatsAppFAB } from "./components/WhatsAppFAB.tsx";
import { FloatingAssistant } from "./components/FloatingAssistant.tsx";
import { RequireAdmin } from "./components/RequireAdmin.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index.tsx"));
const ReportPage = lazy(() => import("./pages/ReportPage.tsx"));
const ReportsPage = lazy(() => import("./pages/ReportsPage.tsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.tsx"));
const ScamCategoryPage = lazy(() => import("./pages/ScamCategoryPage.tsx"));
const MoMoGuardPage = lazy(() => import("./pages/MoMoGuardPage.tsx"));
const CheckNumberPage = lazy(() => import("./pages/CheckNumberPage.tsx"));
const AIAnalyzerPage = lazy(() => import("./pages/AIAnalyzerPage.tsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.tsx"));
const PrivacyPage = lazy(() => import("./pages/legal/PrivacyPage.tsx"));
const TermsPage = lazy(() => import("./pages/legal/TermsPage.tsx"));
const DisclaimerPage = lazy(() => import("./pages/legal/DisclaimerPage.tsx"));
const StatusPage = lazy(() => import("./pages/StatusPage.tsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.tsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.tsx"));
const SupportPage = lazy(() => import("./pages/SupportPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Admin pages
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout.tsx").then(m => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage.tsx"));
const FraudDashboardPage = lazy(() => import("./pages/admin/FraudDashboardPage.tsx"));
const NumberIntelPage = lazy(() => import("./pages/admin/NumberIntelPage.tsx"));
const FlaggedListPage = lazy(() => import("./pages/admin/FlaggedListPage.tsx"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage.tsx"));
const HeatmapPage = lazy(() => import("./pages/admin/HeatmapPage.tsx"));
const ReportsModerationPage = lazy(() => import("./pages/admin/ReportsModerationPage.tsx"));
const ModelAccuracyPage = lazy(() => import("./pages/admin/ModelAccuracyPage.tsx"));

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
              <main className="flex-1">
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
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
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                      <Route index element={<AdminDashboardPage />} />
                      <Route path="reports" element={<ReportsModerationPage />} />
                      <Route path="numbers" element={<NumberIntelPage />} />
                      <Route path="patterns" element={<FraudDashboardPage />} />
                      <Route path="heatmap" element={<HeatmapPage />} />
                      <Route path="alerts" element={<FlaggedListPage />} />
                      <Route path="accuracy" element={<ModelAccuracyPage />} />
                      <Route path="settings" element={<AdminSettingsPage />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
            <WhatsAppFAB />
            <FloatingAssistant />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;