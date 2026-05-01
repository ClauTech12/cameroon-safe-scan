import { Card, CardContent } from "@/components/ui/card";
import { Hammer, Sparkles, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
  /** Optional context-rich description shown inside the card. */
  context?: string;
  /** Optional icon override. Defaults to Hammer. */
  icon?: LucideIcon;
}

export function PlaceholderPage({ title, subtitle, context, icon: Icon = Hammer }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      <Card className="surface-elevated border-0 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/60" />
        <CardContent className="py-16 md:py-20 text-center max-w-xl mx-auto">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-2xl" aria-hidden />
            <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 flex items-center justify-center">
              <Icon className="h-7 w-7 text-primary" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary mb-3">
            <Sparkles className="h-3 w-3" /> Roadmap
          </div>

          <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
            Feature in Development
          </h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            This feature is being built and will be available in a future update.
          </p>

          {context && (
            <div className="mt-6 rounded-xl border border-border/60 bg-muted/40 p-4 text-sm text-foreground/80 leading-relaxed text-left">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                <span>{context}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
