import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BrandMark, ClauTechLogo } from "./BrandMark";
import founder from "@/assets/Founder.jpg.webp";
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Mail,
  Lock,
  Instagram,
} from "lucide-react";

export function SiteFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/60 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.35] pointer-events-none" aria-hidden="true" />
      <div className="container relative py-14 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2 space-y-4">
          <BrandMark size="md" />
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            {t("brand.tagline")}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="badge-trust"><ShieldCheck className="h-3 w-3" /> {t("brand.secure")}</span>
            <span className="badge-trust"><Sparkles className="h-3 w-3" /> {t("brand.aiProtected")}</span>
            <span className="badge-trust"><CheckCircle2 className="h-3 w-3" /> {t("brand.verified")}</span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <a href="https://www.facebook.com/share/1DAJgYMeN6/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-9 w-9 rounded-lg border border-border bg-background grid place-items-center text-muted-foreground hover:text-accent hover:border-accent/40 transition-smooth">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/Clauvet_scamshield" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="h-9 w-9 rounded-lg border border-border bg-background grid place-items-center text-muted-foreground hover:text-accent hover:border-accent/40 transition-smooth">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="mailto:clauvetmt19988@gmail.com" aria-label="Email" className="h-9 w-9 rounded-lg border border-border bg-background grid place-items-center text-muted-foreground hover:text-accent hover:border-accent/40 transition-smooth">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-4">
            {t("footer.product")}
          </div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/report" className="hover:text-accent transition-smooth">{t("footer.reportLink")}</Link></li>
            <li><Link to="/reports" className="hover:text-accent transition-smooth">{t("footer.browseLink")}</Link></li>
            <li><Link to="/dashboard" className="hover:text-accent transition-smooth">{t("footer.analyticsLink")}</Link></li>
            <li><Link to="/check" className="hover:text-accent transition-smooth">{t("footer.checkLink")}</Link></li>
            <li><Link to="/momo-guard" className="hover:text-accent transition-smooth">{t("footer.momoLink")}</Link></li>
            <li><Link to="/support" className="hover:text-accent transition-smooth">{t("footer.supportLink")}</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-4">
            {t("footer.company")}
          </div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
         <li><Link to="/about" className="hover:text-accent transition-smooth">{t("footer.aboutLink")}</Link></li>
            <li><a href="#mission" className="hover:text-accent transition-smooth">{t("footer.missionLink")}</a></li>
            <li><a href="mailto:clauvetmt19988@gmail.com" className="hover:text-accent transition-smooth">{t("footer.contactLink")}</a></li>
            <li><a href="mailto:clauvetmt19988@gmail.com?subject=Responsible%20Disclosure%20-%20CamAlert" className="hover:text-accent transition-smooth">{t("footer.disclosureLink")}</a></li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-4">
            {t("footer.legal")}
          </div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-accent transition-smooth">{t("footer.privacy")}</Link></li>
            <li><Link to="/terms" className="hover:text-accent transition-smooth">{t("footer.terms")}</Link></li>
            <li><Link to="/disclaimer" className="hover:text-accent transition-smooth">{t("footer.disclaimer")}</Link></li>
            <li><a href="mailto:clauvetmt19988@gmail.com?subject=Abuse%20Report%20-%20CamAlert" className="hover:text-accent transition-smooth">{t("footer.abuseLink")}</a></li>
          </ul>
          <div className="mt-6 inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3 text-accent" /> {t("footer.tlsNote")}
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 relative">
        <div className="container py-8 flex flex-col items-center gap-4">
          <ClauTechLogo className="h-10 opacity-90" />
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            {t("footer.tagline")}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-accent" />
            <span>{t("footer.cyberTrustTag")}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 relative">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {year} CamAlert · {t("footer.cyberTrustTag")}. {t("footer.rights")}</div>
          <div className="flex items-center gap-3">
            <img src={founder} alt="Agbor Clauvet" className="h-6 w-6 rounded-full object-cover object-top" width="24" height="24" />
            <span>{t("footer.foundedBy")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}