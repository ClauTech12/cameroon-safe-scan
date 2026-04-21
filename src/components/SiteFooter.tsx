import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ClauTechLogo, BrandMark } from "./BrandMark";
import { ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="mt-12 border-t border-border/60 bg-card/40">
      <div className="container py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2 space-y-4">
          <BrandMark size="sm" />
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            {t("brand.tagline")}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Secure</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-accent" /> AI Protected</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Verified</span>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Product</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/report" className="hover:text-foreground transition-smooth">Report a scam</Link></li>
            <li><Link to="/reports" className="hover:text-foreground transition-smooth">Browse reports</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground transition-smooth">Analytics</Link></li>
            <li><Link to="/momo-guard" className="hover:text-foreground transition-smooth">MoMo Guard</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Legal</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground transition-smooth">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground transition-smooth">Terms of Use</Link></li>
            <li><Link to="/disclaimer" className="hover:text-foreground transition-smooth">Disclaimer</Link></li>
          </ul>
          <div className="mt-5">
            <ClauTechLogo className="h-7 mb-1" />
            <p className="text-[11px] text-muted-foreground">{t("brand.poweredBy")}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container py-5 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} CamAlert. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
