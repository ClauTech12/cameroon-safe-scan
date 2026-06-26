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
      toast.error("Please fill in all fields.");
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
        toast.success("Message sent! We'll get back to you soon.");
        setName(""); setEmail(""); setSubject(""); setMessage("");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
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
              Contact Us
            </h1>
            <p className="text-muted-foreground text-lg">
              Have a question, want to report abuse, or interested in partnering with CamAlert?
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
                  <div className="font-semibold text-sm">Email</div>
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
                  <div className="font-semibold text-sm">WhatsApp</div>
                </div>
                <a href="https://wa.me/237650556715" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-accent transition-smooth">
                  +237 650 556 715
                </a>
              </Card>

              <Card className="glass-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="font-semibold text-sm">Security</div>
                </div>
                <a href="mailto:clauvetmt19988@gmail.com?subject=Responsible%20Disclosure%20-%20CamAlert" className="text-sm text-muted-foreground hover:text-accent transition-smooth">
                  Responsible disclosure
                </a>
              </Card>

              <Card className="glass-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-lg bg-scam-mobile/10 text-scam-mobile grid place-items-center">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="font-semibold text-sm">Response time</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  We typically respond within 24-48 hours.
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
                    <h2 className="font-display font-bold text-2xl">Message Sent!</h2>
                    <p className="text-muted-foreground">Thank you for reaching out. We'll get back to you within 24-48 hours.</p>
                    <Button onClick={() => setSent(false)} variant="outline">Send another message</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="Agbor Clauvet" value={name} onChange={(e) => setName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger id="subject">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General inquiry">General inquiry</SelectItem>
                          <SelectItem value="Report abuse">Report abuse</SelectItem>
                          <SelectItem value="Partnership">Partnership</SelectItem>
                          <SelectItem value="Media inquiry">Media inquiry</SelectItem>
                          <SelectItem value="Technical issue">Technical issue</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help..."
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground font-semibold">
                      {submitting ? "Sending..." : "Send Message"}
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