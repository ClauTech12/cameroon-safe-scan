import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function PrivacyPage() {
  const year = new Date().getFullYear();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: June {year} · Effective immediately upon use of CAMALERT.</p>

        <div className="not-prose text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 my-4">
          📄 This legal document is currently available in English only. French version coming soon. / Ce document juridique est disponible en anglais uniquement. Version française à venir.
        </div>

        <h2 className="mt-8">1. Introduction</h2>
        <p>CAMALERT ("we", "our", "us") is operated by ClauTech Digital Solutions, Cameroon. We are committed to protecting your privacy and handling your data responsibly. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.</p>

        <h2>2. Information We Collect</h2>
        <ul>
          <li><strong>Report submissions:</strong> Name (optional), location, description of scam, contact information of suspected scammer, and any uploaded screenshots.</li>
          <li><strong>Account information:</strong> Email address and password for admin accounts only. Regular users can submit reports anonymously.</li>
          <li><strong>Contact form:</strong> Name, email, subject and message when you contact us via our contact form.</li>
          <li><strong>Technical data:</strong> IP address, browser type, and usage data collected automatically for security and performance purposes.</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To publish scam reports for public awareness after moderation review.</li>
          <li>To improve our AI scam detection and classification system.</li>
          <li>To respond to your inquiries, takedown requests, and appeals.</li>
          <li>To protect the platform from abuse, spam, and malicious activity.</li>
          <li>To comply with applicable Cameroonian law including Law No. 2010/012 on Cybersecurity and Cybercrime.</li>
        </ul>

        <h2>4. Anonymous Reporting</h2>
        <p>CAMALERT supports anonymous reporting. You are not required to provide your name or contact information when submitting a scam report. If you choose to submit anonymously, we will not be able to contact you about your report or provide status updates.</p>

        <h2>5. Data Sharing</h2>
        <ul>
          <li>We do <strong>not sell</strong> your personal data to any third party.</li>
          <li>Approved scam reports are made publicly visible on the platform for community awareness.</li>
          <li>Contact information of alleged scammers submitted in reports may be visible in approved reports.</li>
          <li>We use Supabase for database hosting and may share data with them as our data processor.</li>
          <li>We may share data with law enforcement authorities if required by Cameroonian law or court order.</li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>We retain approved scam reports indefinitely for public awareness purposes. Rejected reports are deleted after 30 days. Contact form submissions are retained for 12 months. You may request deletion of your data at any time by contacting us.</p>

        <h2>7. Your Rights</h2>
        <ul>
          <li><strong>Right to access:</strong> Request a copy of your personal data we hold.</li>
          <li><strong>Right to correction:</strong> Request correction of inaccurate data.</li>
          <li><strong>Right to deletion:</strong> Request deletion of your personal data subject to legal obligations.</li>
          <li><strong>Right to object:</strong> Object to the processing of your data for certain purposes.</li>
          <li><strong>Takedown requests:</strong> If a report contains your personal information and you believe it is false or defamatory, you may request its removal.</li>
        </ul>

        <h2>8. Security</h2>
        <p>We implement industry-standard security measures including HTTPS encryption, secure database storage via Supabase, and regular security audits. However, no system is 100% secure and we cannot guarantee absolute security of your data.</p>

        <h2>9. Children's Privacy</h2>
        <p>CAMALERT is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe a child has submitted information to our platform please contact us immediately.</p>

        <h2>10. Cookies</h2>
        <p>CAMALERT uses minimal cookies necessary for platform functionality such as authentication tokens. We do not use advertising or tracking cookies. You can disable cookies in your browser settings but this may affect platform functionality.</p>

        <h2>11. Third Party Services</h2>
        <ul>
          <li><strong>Supabase</strong> — database and authentication hosting</li>
          <li><strong>Vercel</strong> — website hosting and deployment</li>
          <li><strong>Formspree</strong> — contact form processing</li>
          <li><strong>Anthropic Claude API</strong> — AI scam classification</li>
        </ul>

        <h2>12. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify users of significant changes by posting a notice on our platform. Continued use of CAMALERT after changes constitutes acceptance of the updated policy.</p>

        <h2>13. Contact & Data Requests</h2>
        <p>For privacy inquiries, data access requests, deletion requests, or takedown requests contact us at: <a href="mailto:clauvetmt19988@gmail.com">clauvetmt19988@gmail.com</a></p>
        <p>We will respond to all requests within <strong>7 business days</strong>.</p>
        <p>© {year} CAMALERT · ClauTech Digital Solutions · Cameroon & Africa</p>
      </main>
      <SiteFooter />
    </div>
  );
}