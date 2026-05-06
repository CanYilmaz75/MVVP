import { cn } from "@/lib/utils";

export function LogoMark({ className, label = "C" }: { className?: string; label?: string }) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground shadow-none",
        className
      )}
    >
      {label}
    </div>
  );
}

export function CarevoWordmark({
  className,
  subline = "Dokumentation fuer Pflege und Versorgung"
}: {
  className?: string;
  subline?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="font-sans text-[28px] font-bold leading-none text-[#1E6B72]">C</span>
      <span>
        <span className="block text-sm font-bold leading-none text-[#0A0A0F]">CAREVO</span>
        {subline ? <span className="mt-1 block text-[10px] leading-none text-[#9B9BA8]">{subline}</span> : null}
      </span>
    </div>
  );
}
