import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground">CamAlert Sentinel</p>

        <h2 className="mt-8">1. Information We Collect</h2>
        <ul>
          <li>Phone numbers involved in reported scams</li>
          <li>Description of scam incidents</li>
          <li>Location data (approximate, if provided)</li>
          <li>Device/browser information for security purposes</li>
        </ul>

        <h2>2. How We Use Information</h2>
        <ul>
          <li>Identify and analyze scam patterns</li>
          <li>Display aggregated scam activity (e.g. heatmaps)</li>
          <li>Improve fraud detection and user safety</li>
          <li>Prevent misuse of the platform</li>
        </ul>

        <h2>3. Data Sharing</h2>
        <p>We do not sell personal data. Data may be shared with law enforcement authorities in Cameroon if required, or in aggregated, anonymized form for public awareness.</p>

        <h2>4. Data Storage & Security</h2>
        <p>We take reasonable measures to protect your data. However, no system is 100% secure.</p>

        <h2>5. User Responsibility</h2>
        <p>Users must not submit false, misleading, or defamatory reports.</p>

        <h2>6. Your Rights</h2>
        <p>Users may request correction or removal of submitted data where applicable.</p>

        <h2>7. Contact</h2>
        <p>For concerns, contact: <a href="mailto:Camalert2026@gmail.com">Camalert2026@gmail.com</a></p>
      </main>
      <SiteFooter />
    </div>
  );
}
