import logo from "@/assets/clautech-logo.png";
import { Shield } from "lucide-react";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-8" : size === "lg" ? "h-14" : "h-10";
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className={`${dim} aspect-square rounded-xl bg-gradient-primary grid place-items-center shadow-glow`}>
          <Shield className="h-1/2 w-1/2 text-primary-foreground" strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-display font-bold text-lg tracking-tight">
          Cam<span className="text-accent">Alert</span>
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">AI Scam Defense</span>
      </div>
    </div>
  );
}

export function ClauTechLogo({ className = "" }: { className?: string }) {
  return <img src={logo} alt="ClauTech Digital Solutions" className={className} loading="lazy" />;
}
