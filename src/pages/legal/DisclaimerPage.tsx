import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AlertTriangle } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <div className="not-prose flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 grid place-items-center">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">Disclaimer</h1>
            <p className="text-muted-foreground text-sm">CamAlert Sentinel</p>
          </div>
        </div>
        <ul>
          <li>Reports on this platform are user-submitted and may not be independently verified.</li>
          <li>Inclusion of a phone number or report does not imply guilt.</li>
          <li>Users should exercise caution and verify information independently.</li>
          <li>For official action, contact law enforcement authorities in Cameroon.</li>
        </ul>
        <p><strong>CamAlert Sentinel is a public awareness tool, not a legal authority.</strong></p>
      </main>
      <SiteFooter />
    </div>
  );
}
