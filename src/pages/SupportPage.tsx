import { useState } from "react";
import { Copy, Check, Heart, Shield, Phone, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl gap-2 min-w-24">
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-6">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Support CamAlert
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            CamAlert is a free platform protecting Cameroonians from fraud and scams.
            Your support — no matter how small — helps us keep it running and growing.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        {/* What your support does */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Shield, title: "Keep it free", desc: "CamAlert will always be free for everyone" },
            { icon: Phone, title: "Better coverage", desc: "Expand fraud database across more regions" },
            { icon: Users, title: "Community safety", desc: "Help protect more Cameroonians from scams" },
          ].map((s) => (
            <Card key={s.title} className="surface-elevated border-0 shadow-sm text-center">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center mx-auto mb-3">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="font-medium text-sm mb-1">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
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
                <div className="font-semibold text-lg">MTN Mobile Money</div>
                <div className="text-sm text-muted-foreground">Send any amount — every franc counts</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">MoMo Number</div>
                  <div className="font-display text-2xl font-bold tracking-wide">650 556 715</div>
                  <div className="text-xs text-muted-foreground mt-1">+237 650 556 715</div>
                </div>
                <CopyButton text="+237650556715" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Account Name</div>
                  <div className="font-medium">Agbor Clauvet</div>
                  <div className="text-xs text-muted-foreground">CamAlert · ClauTech</div>
                </div>
                <CopyButton text="Agbor Clauvet" />
              </div>
            </div>

            {/* Suggested amounts */}
            <div className="mt-5">
              <div className="text-xs text-muted-foreground mb-3 font-medium">Suggested amounts</div>
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
                How to send via MTN MoMo
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Dial *126# on your MTN line",
                  "Select Transfer Money → To MoMo User",
                  "Enter number: 650 556 715",
                  "Enter your amount and confirm",
                  "Enter your MoMo PIN to complete",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="h-5 w-5 rounded-full bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 text-xs grid place-items-center shrink-0 font-medium">
                      {i + 1}
                    </span>
                    {step}
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
                <div className="font-semibold text-lg">PayPal</div>
                <div className="text-sm text-muted-foreground">Send money directly — no PayPal account needed on your end</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">PayPal Email</div>
                  <div className="font-display text-lg font-bold tracking-wide">yain.noel@yahoo.com</div>
                </div>
                <CopyButton text="yain.noel@yahoo.com" />
              </div>
            </div>

            {/* Steps */}
            <div className="mt-6 p-4 rounded-xl bg-blue-400/5 border border-blue-400/20">
              <div className="text-sm font-medium mb-3 text-blue-700 dark:text-blue-400">
                How to send via PayPal
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Log in to your PayPal account at paypal.com",
                  'Click "Send & Request" at the top',
                  'Click "Send Money"',
                  "Enter email: yain.noel@yahoo.com",
                  "Enter your amount, choose currency and send",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="h-5 w-5 rounded-full bg-blue-400/20 text-blue-700 dark:text-blue-400 text-xs grid place-items-center shrink-0 font-medium">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              💡 Select <span className="font-medium">"Sending to a friend"</span> to avoid extra fees
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
                Thank you for your support
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                Every contribution — big or small — keeps CamAlert free and helps protect more Cameroonians from fraud and scams.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="rounded-xl gap-2 px-6"
              >
                <Heart className="h-4 w-4" fill="currentColor" />
                Support CamAlert
              </Button>
              <Button
                variant="outline"
                className="rounded-xl gap-2 px-6"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Support CamAlert",
                      text: "CamAlert protects Cameroonians from fraud — support them!",
                      url: window.location.href,
                    });
                  }
                }}
              >
                Share this page
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              🇨🇲 Built for Cameroon, by Cameroonians
            </p>
          </div> 
        </div>

      </div>
    </div>
  );
}