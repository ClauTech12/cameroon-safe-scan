import logo from "@/assets/clautech-logo.png";
import { ShieldCheck } from "lucide-react";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${dim} relative rounded-xl bg-gradient-primary grid place-items-center shadow-md overflow-hidden`}
        aria-hidden="true"
      >
        <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.5} />
        <span className="absolute inset-0 bg-cyber-grid opacity-30" />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-display font-extrabold tracking-tight ${text} text-foreground`}>
          CAM<span className="text-accent">ALERT</span>
        </span>
        {size !== "sm" && (
          <span className="text-[10px] text-muted-foreground font-semibold tracking-[0.18em] uppercase mt-1">
            Cyber Trust · Africa
          </span>
        )}
      </div>
    </div>
  );
}

export function ClauTechLogo({ className = "" }: { className?: string }) {
  return <img src={logo} alt="ClauTech Digital Solutions" className={className} loading="lazy" />;
}
