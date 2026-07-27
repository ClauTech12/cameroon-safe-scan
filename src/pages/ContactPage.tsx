import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, MessageSquare, ShieldCheck, Phone } from "lucide-react";

export default function ContactPage() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error(t("contactPage.toast.fillAllFields"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("https://formspree.io/f/xaqzeklz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (res.ok) {
        setSent(true);
        toast.success(t("contactPage.toast.success"));
        setName(""); setEmail(""); setSubject(""); setMessage("");
      } else {
        toast.error(t("contactPage.toast.error"));
      }
    } catch {
      toast.error(t("contactPage.toast.error"));
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 space-y-2">
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
              {t("contactPage.title")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("contactPage.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Contact info */}
            <div className="space-y-6">
              <Card className="glass-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent grid place-items-center">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="font-semibold text-sm">{t("contactPage.emailLabel")}</div>
                </div>
                <a href="mailto:clauvetmt19988@gmail.com" className="text-sm text-muted-foreground hover:text-accent transition-smooth">
                  clauvetmt19988@gmail.com
                </a>
              </Card>

              <Card className="glass-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-lg bg-green-500/10 text-green-600 grid place-items-center">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="font-semibold text-sm">{t("contactPage.whatsappLabel")}</div>
                </div>
                <a href="https://wa.me/917626887457" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-accent transition-smooth">
                  +91 76268 87457
                </a>
              </Card>

              <Card className="glass-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="font-semibold text-sm">{t("contactPage.securityLabel")}</div>
                </div>
                <a href="mailto:clauvetmt19988@gmail.com?subject=Responsible%20Disclosure%20-%20CamAlert" className="text-sm text-muted-foreground hover:text-accent transition-smooth">
                  {t("contactPage.securityLink")}
                </a>
              </Card>

              <Card className="glass-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-lg bg-scam-mobile/10 text-scam-mobile grid place-items-center">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="font-semibold text-sm">{t("contactPage.responseTimeLabel")}</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("contactPage.responseTimeBody")}
                </p>
              </Card>
            </div>

            {/* Contact form */}
            <div className="md:col-span-2">
              <Card className="glass-card p-6 md:p-8">
                {sent ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="h-16 w-16 rounded-full bg-green-500/10 text-green-600 grid place-items-center mx-auto">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h2 className="font-display font-bold text-2xl">{t("contactPage.sentTitle")}</h2>
                    <p className="text-muted-foreground">{t("contactPage.sentBody")}</p>
                    <Button onClick={() => setSent(false)} variant="outline">{t("contactPage.sendAnother")}</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("contactPage.fullName")}</Label>
                        <Input id="name" placeholder="Agbor Clauvet" value={name} onChange={(e) => setName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t("contactPage.email")}</Label>
                        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">{t("contactPage.subject")}</Label>
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger id="subject">
                          <SelectValue placeholder={t("contactPage.subjectPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General inquiry">{t("contactPage.subjectOptions.general")}</SelectItem>
                          <SelectItem value="Report abuse">{t("contactPage.subjectOptions.abuse")}</SelectItem>
                          <SelectItem value="Partnership">{t("contactPage.subjectOptions.partnership")}</SelectItem>
                          <SelectItem value="Media inquiry">{t("contactPage.subjectOptions.media")}</SelectItem>
                          <SelectItem value="Technical issue">{t("contactPage.subjectOptions.technical")}</SelectItem>
                          <SelectItem value="Other">{t("contactPage.subjectOptions.other")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">{t("contactPage.message")}</Label>
                      <Textarea
                        id="message"
                        placeholder={t("contactPage.messagePlaceholder")}
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground font-semibold">
                      {submitting ? t("contactPage.sending") : t("contactPage.send")}
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
