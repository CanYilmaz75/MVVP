import { cn } from "@/lib/utils";

export function LogoMark({ className, label = "C" }: { className?: string; label?: string }) {
  return <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-soft", className)}>{label}</div>;
}
