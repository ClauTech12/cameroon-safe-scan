import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { loading, session, isAdmin } = useAuth();
  const loc = useLocation();
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" state={{ from: loc }} replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <h2 className="text-xl font-semibold">{t("requireAdmin.title")}</h2>
          <p className="text-muted-foreground mt-2">{t("requireAdmin.body")}</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
