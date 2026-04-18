import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const setLang = (lng: "en" | "fr") => i18n.changeLanguage(lng);

  return (
    <div className="hidden sm:inline-flex items-center rounded-full border border-border bg-secondary/50 p-0.5 text-xs font-semibold">
      {(["en", "fr"] as const).map((l) => {
        const active = (l === "fr") === isFr;
        return (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={cn(
              "px-2.5 py-1 rounded-full uppercase tracking-wider transition-smooth",
              active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
