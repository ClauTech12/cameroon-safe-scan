import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function PlaceholderPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <Card className="surface-elevated border-0 shadow-sm">
        <CardContent className="py-20 text-center">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <Construction className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Coming next</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            This section is part of Phase 2. The layout and dashboard are live — ask to build this page next.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
