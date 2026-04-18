import logo from "@/assets/clautech-logo.png";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${dim} rounded-xl bg-gradient-primary grid place-items-center shadow-sm overflow-hidden`}>
        <img src={logo} alt="" className="h-full w-full object-contain p-1" />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-display font-bold tracking-tight ${text} text-foreground`}>
          Cam<span className="text-accent">Alert</span>
        </span>
        {size !== "sm" && (
          <span className="text-[10px] text-muted-foreground font-medium tracking-wide mt-0.5">
            AI-Powered Scam Defense
          </span>
        )}
      </div>
    </div>
  );
}

export function ClauTechLogo({ className = "" }: { className?: string }) {
  return <img src={logo} alt="ClauTech Digital Solutions" className={className} loading="lazy" />;
}
