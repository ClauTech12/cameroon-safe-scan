import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BrandMark, ClauTechLogo } from "./BrandMark";
import founder from "@/assets/founder.png";
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Lock,
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
            {[Twitter, Facebook, Linkedin, Mail].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social"
                className="h-9 w-9 rounded-lg border border-border bg-background grid place-items-center text-muted-foreground hover:text-accent hover:border-accent/40 transition-smooth"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
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
            <li><Link to="/check" className="hover:text-accent transition-smooth">Check a number</Link></li>
            <li><Link to="/momo-guard" className="hover:text-accent transition-smooth">{t("footer.momoLink")}</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-4">
            Company
          </div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><a href="#about" className="hover:text-accent transition-smooth">About CAMALERT</a></li>
            <li><a href="#mission" className="hover:text-accent transition-smooth">Our mission</a></li>
            <li><a href="mailto:clauvetmt19988@gmail.com" className="hover:text-accent transition-smooth">Contact us</a></li>
            <li><a href="mailto:clauvetmt19988@gmail.com?subject=Responsible%20Disclosure%20-%20CAMALERT" className="hover:text-accent transition-smooth">Responsible disclosure</a></li>
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
            <li><a href="mailto:clauvetmt19988@gmail.com?subject=Abuse%20Report%20-%20CAMALERT" className="hover:text-accent transition-smooth">Report abuse</a></li>
          </ul>
          <div className="mt-6 inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3 text-accent" /> TLS · privacy-first
          </div>
        </div>
      </div>

      {/* Centered logo section */}
      <div className="border-t border-border/60 relative">
        <div className="container py-8 flex flex-col items-center gap-4">
          <ClauTechLogo className="h-10 opacity-90" />
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            CAMALERT is a product of ClauTech Digital Solutions — building digital trust tools for Cameroon and Africa.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-accent" />
            <span>Cyber Trust · Cameroon</span>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-border/60 relative">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {year} CAMALERT · Cyber Trust · Cameroon. {t("footer.rights")}</div>
          <div className="flex items-center gap-3">
            <img
              src={founder}
              alt="Agbor Clauvet"
              className="h-6 w-6 rounded-full object-cover object-top"
            />
            <span>Founded by Agbor Clauvet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}