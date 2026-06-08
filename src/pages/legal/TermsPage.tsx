import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function TermsPage() {
  const year = new Date().getFullYear();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: June {year} · Effective immediately upon use of CAMALERT.</p>

        <div className="not-prose text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 my-4">
          📄 This legal document is currently available in English only. French version coming soon. / Ce document juridique est disponible en anglais uniquement. Version française à venir.
        </div>

        <h2 className="mt-8">1. About CAMALERT</h2>
        <p>CAMALERT is a community-driven digital fraud awareness and scam intelligence platform operated by ClauTech Digital Solutions, Cameroon. Our platform allows users to submit, view, and share scam reports for public awareness purposes. CAMALERT is not a law enforcement body, judicial authority, or government institution.</p>

        <h2>2. Acceptance of Terms</h2>
        <p>By accessing or using CAMALERT, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform. These terms apply to all visitors, users, and contributors.</p>

        <h2>3. Nature of Reports — Important Disclaimer</h2>
        <ul>
          <li>All reports on CAMALERT are <strong>user-submitted</strong> and may contain unverified allegations.</li>
          <li>CAMALERT <strong>does not determine criminal guilt</strong> or legal liability of any individual or entity.</li>
          <li>Reports represent the subjective experience of the submitter and do not constitute legal findings.</li>
          <li>CAMALERT uses AI to assist in classification and risk assessment — this is not a substitute for professional legal advice.</li>
          <li>The presence of a report on CAMALERT does not imply that the reported party has committed any crime.</li>
        </ul>

        <h2>4. PDF Export Disclaimer</h2>
        <ul>
          <li>PDF exports from CAMALERT are <strong>formatted compilations</strong> of submitted information and AI verification metadata.</li>
          <li>PDF exports are described as "generated reports" or "exported dossiers" — they are <strong>not court-certified documents</strong>.</li>
          <li>Use of a CAMALERT PDF export does not guarantee acceptance by any authority, financial institution, court, or legal body.</li>
          <li>CAMALERT does not have legal authority to issue official documents for use in criminal or civil proceedings.</li>
        </ul>

        <h2>5. User Responsibilities</h2>
        <ul>
          <li>You must be at least 18 years old to submit reports.</li>
          <li>You agree to submit only truthful and accurate information to the best of your knowledge.</li>
          <li>You must not submit false, malicious, or defamatory reports about individuals or businesses.</li>
          <li>You are solely responsible for the accuracy of information you submit.</li>
          <li>You agree not to use CAMALERT for harassment, targeted attacks, or personal vendettas.</li>
          <li>You agree not to submit content that violates Cameroon's Law No. 2010/012 on Cybersecurity and Cybercrime.</li>
        </ul>

        <h2>6. Takedown & Correction Policy</h2>
        <p>CAMALERT is committed to fairness and accuracy. If you believe a report about you or your business is false, defamatory, or violates your rights:</p>
        <ul>
          <li>Contact us at <a href="mailto:clauvetmt19988@gmail.com">clauvetmt19988@gmail.com</a> with subject line <strong>"Takedown Request"</strong></li>
          <li>Provide your full name, the Report ID, and a detailed explanation of why the report should be removed or corrected.</li>
          <li>We will review your request within <strong>7 business days</strong>.</li>
          <li>If we find the report violates our guidelines or applicable law, we will remove or correct it promptly.</li>
          <li>Repeated false takedown requests may result in your access being restricted.</li>
        </ul>

        <h2>7. Appeals Process</h2>
        <p>If your report was rejected or removed and you believe this was in error:</p>
        <ul>
          <li>Contact us at <a href="mailto:clauvetmt19988@gmail.com">clauvetmt19988@gmail.com</a> with subject line <strong>"Appeal Request"</strong></li>
          <li>Include your Report ID and supporting evidence.</li>
          <li>We will review your appeal within <strong>7 business days</strong>.</li>
        </ul>

        <h2>8. Intellectual Property</h2>
        <p>All content, design, code, and branding on CAMALERT is the property of ClauTech Digital Solutions. You may not reproduce, distribute, or use our content without written permission. User-submitted reports remain the property of the submitter but by submitting you grant CAMALERT a non-exclusive license to display and use the content for public awareness purposes.</p>

        <h2>9. Limitation of Liability</h2>
        <p>CAMALERT and ClauTech Digital Solutions shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform, including but not limited to reliance on any report, PDF export, or AI analysis provided. Use of CAMALERT is at your own risk.</p>

        <h2>10. Governing Law</h2>
        <p>These Terms are governed by the laws of the Republic of Cameroon. Any disputes arising from the use of CAMALERT shall be subject to the jurisdiction of Cameroonian courts.</p>

        <h2>11. Changes to Terms</h2>
        <p>We reserve the right to update these Terms at any time. Continued use of CAMALERT after changes constitutes acceptance of the new terms. We will notify users of significant changes via the platform.</p>

        <h2>12. Contact</h2>
        <p>For legal requests, takedowns, appeals, or general inquiries contact us at: <a href="mailto:clauvetmt19988@gmail.com">clauvetmt19988@gmail.com</a></p>
        <p>© {year} CAMALERT · ClauTech Digital Solutions · Cameroon & Africa</p>
      </main>
      <SiteFooter />
    </div>
  );
}