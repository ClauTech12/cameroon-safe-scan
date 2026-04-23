import { highlightSuspicious } from "@/lib/explain";

export function HighlightedText({ text, className }: { text: string; className?: string }) {
  const segs = highlightSuspicious(text);
  return (
    <p className={className}>
      {segs.map((s, i) =>
        s.match ? (
          <mark
            key={i}
            title={s.match}
            className="rounded px-0.5 bg-amber-400/30 text-foreground decoration-amber-500 underline decoration-dotted underline-offset-2"
          >
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </p>
  );
}
