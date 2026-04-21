import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">Terms of Use</h1>
        <p className="text-muted-foreground">CamAlert Sentinel</p>

        <h2 className="mt-8">1. Responsible Reporting</h2>
        <ul>
          <li>You will only submit accurate and truthful scam reports.</li>
          <li>You will not use the platform to defame, harass, or falsely accuse individuals.</li>
        </ul>

        <h2>2. No Guarantee of Accuracy</h2>
        <p>CamAlert Sentinel does not guarantee that all reports are verified or accurate.</p>

        <h2>3. Platform Role</h2>
        <p>This platform is for informational and awareness purposes only and does not replace official law enforcement investigations.</p>

        <h2>4. Prohibited Activities</h2>
        <ul>
          <li>Submitting fake scam reports</li>
          <li>Uploading harmful or illegal content</li>
          <li>Attempting to hack or disrupt the system</li>
        </ul>

        <h2>5. Account Control</h2>
        <p>We reserve the right to remove content, suspend or ban users who violate these terms.</p>

        <h2>6. Limitation of Liability</h2>
        <p>CamAlert Sentinel is not liable for actions taken based on user-submitted reports or any damages resulting from reliance on platform data.</p>

        <h2>7. Governing Context</h2>
        <p>These terms are intended to align with applicable laws in Cameroon.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
