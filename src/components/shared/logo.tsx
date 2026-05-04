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
