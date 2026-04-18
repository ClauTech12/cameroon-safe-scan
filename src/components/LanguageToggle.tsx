import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const next = i18n.language?.startsWith("fr") ? "en" : "fr";
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => i18n.changeLanguage(next)}
      className="gap-2 font-semibold uppercase tracking-wider text-xs"
      aria-label="Toggle language"
    >
      <Languages className="h-4 w-4" />
      {next === "fr" ? "FR" : "EN"}
    </Button>
  );
}
