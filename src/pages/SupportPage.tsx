import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Heart, Shield, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

function CopyButton({ text, copyLabel, copiedLabel }: { text: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl gap-2 min-w-24">
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      {copied ? copiedLabel : copyLabel}
    </Button>
  );
}

export default function SupportPage() {
  const { t } = useTranslation();

  const whatSupport = [
    { icon: Shield, key: "keepFree" },
    { icon: Phone, key: "coverage" },
    { icon: Users, key: "community" },
  ] as const;

  const momoSteps = ["s1", "s2", "s3", "s4", "s5"] as const;
  const paypalSteps = ["s1", "s2", "s3", "s4", "s5"] as const;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-6">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t("supportPage.title")}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("supportPage.subtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        {/* What your support does */}
        <div className="grid gap-4 sm:grid-cols-3">
          {whatSupport.map(({ icon: Icon, key }) => (
            <Card key={key} className="surface-elevated border-0 shadow-sm text-center">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center mx-auto mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="font-medium text-sm mb-1">{t(`supportPage.whatSupport.${key}.title`)}</div>
                <div className="text-xs text-muted-foreground">{t(`supportPage.whatSupport.${key}.desc`)}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* MTN MoMo */}
        <Card className="surface-elevated border-0 shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 grid place-items-center shrink-0">
                <span className="text-2xl">📱</span>
              </div>
              <div>
                <div className="font-semibold text-lg">{t("supportPage.momo.title")}</div>
                <div className="text-sm text-muted-foreground">{t("supportPage.momo.subtitle")}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t("supportPage.momo.numberLabel")}</div>
                  <div className="font-display text-2xl font-bold tracking-wide">650 556 715</div>
                  <div className="text-xs text-muted-foreground mt-1">+237 650 556 715</div>
                </div>
                <CopyButton text="+237650556715" copyLabel={t("supportPage.copy")} copiedLabel={t("supportPage.copied")} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t("supportPage.momo.nameLabel")}</div>
                  <div className="font-medium">Agbor Clauvet</div>
                  <div className="text-xs text-muted-foreground">CamAlert · ClauTech</div>
                </div>
                <CopyButton text="Agbor Clauvet" copyLabel={t("supportPage.copy")} copiedLabel={t("supportPage.copied")} />
              </div>
            </div>

            {/* Suggested amounts */}
            <div className="mt-5">
              <div className="text-xs text-muted-foreground mb-3 font-medium">{t("supportPage.momo.suggestedLabel")}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["500 XAF", "1,000 XAF", "2,500 XAF", "5,000 XAF"].map((amt) => (
                  <div key={amt} className="text-center p-2.5 rounded-xl border border-border bg-secondary/30 text-xs font-medium">
                    {amt}
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="mt-6 p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
              <div className="text-sm font-medium mb-3 text-yellow-700 dark:text-yellow-400">
                {t("supportPage.momo.howToTitle")}
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground">
                {momoSteps.map((key, i) => (
                  <li key={key} className="flex gap-3">
                    <span className="h-5 w-5 rounded-full bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 text-xs grid place-items-center shrink-0 font-medium">
                      {i + 1}
                    </span>
                    {t(`supportPage.momo.steps.${key}`)}
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* PayPal */}
        <Card className="surface-elevated border-0 shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-400/15 grid place-items-center shrink-0">
                <span className="text-2xl">💳</span>
              </div>
              <div>
                <div className="font-semibold text-lg">{t("supportPage.paypal.title")}</div>
                <div className="text-sm text-muted-foreground">{t("supportPage.paypal.subtitle")}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t("supportPage.paypal.emailLabel")}</div>
                  <div className="font-display text-lg font-bold tracking-wide">yain.noel@yahoo.com</div>
                </div>
                <CopyButton text="yain.noel@yahoo.com" copyLabel={t("supportPage.copy")} copiedLabel={t("supportPage.copied")} />
              </div>
            </div>

            {/* Steps */}
            <div className="mt-6 p-4 rounded-xl bg-blue-400/5 border border-blue-400/20">
              <div className="text-sm font-medium mb-3 text-blue-700 dark:text-blue-400">
                {t("supportPage.paypal.howToTitle")}
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground">
                {paypalSteps.map((key, i) => (
                  <li key={key} className="flex gap-3">
                    <span className="h-5 w-5 rounded-full bg-blue-400/20 text-blue-700 dark:text-blue-400 text-xs grid place-items-center shrink-0 font-medium">
                      {i + 1}
                    </span>
                    {t(`supportPage.paypal.steps.${key}`)}
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              {t("supportPage.paypal.feeTipPre")}{" "}
              <span className="font-medium">{t("supportPage.paypal.feeTipHighlight")}</span>{" "}
              {t("supportPage.paypal.feeTipPost")}
            </p>
          </CardContent>
        </Card>

        {/* Thank You Footer */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 px-6 py-12 text-center">
          {/* Decorative blobs */}
          <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

          <div className="relative space-y-5">
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Heart key={i} className="h-4 w-4 text-primary" fill="currentColor" style={{ opacity: 1 - i * 0.15 }} />
              ))}
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
                {t("supportPage.thankYou.title")}
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                {t("supportPage.thankYou.body")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="rounded-xl gap-2 px-6"
              >
                <Heart className="h-4 w-4" fill="currentColor" />
                {t("supportPage.thankYou.supportBtn")}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl gap-2 px-6"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: t("supportPage.thankYou.shareTitle"),
                      text: t("supportPage.thankYou.shareText"),
                      url: window.location.href,
                    });
                  }
                }}
              >
                {t("supportPage.thankYou.shareBtn")}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              {t("supportPage.thankYou.tagline")}
            </p>
          </div>
        </div>

      </div>
      <SiteFooter />
    </div>
  );
}
