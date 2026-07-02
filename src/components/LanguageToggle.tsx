import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "pcm", label: "CM" },
] as const;

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("fr")
    ? "fr"
    : i18n.language?.startsWith("pcm")
      ? "pcm"
      : "en";
  const setLang = (lng: "en" | "fr" | "pcm") => i18n.changeLanguage(lng);

  return (
    <div className="hidden sm:inline-flex items-center rounded-full border border-border bg-secondary/50 p-0.5 text-xs font-semibold">
      {LANGS.map((l) => {
        const active = current === l.code;
        return (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            aria-label={`Switch language to ${l.label}`}
            className={cn(
              "px-2.5 py-1 rounded-full uppercase tracking-wider transition-smooth",
              active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
