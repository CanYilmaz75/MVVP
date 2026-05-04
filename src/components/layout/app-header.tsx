import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function AppHeader({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-border bg-card px-4 py-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 xl:px-20">
      <div>
        <p className="carevo-eyebrow">Arbeitsbereich</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-[32px]">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="relative w-full lg:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Beratungen durchsuchen" />
      </div>
    </header>
  );
}
