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
    <header className="flex flex-col gap-5 border-b border-border/70 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Arbeitsbereich</p>
        <h1
          className="mt-2 text-3xl font-semibold tracking-[-0.04em]"
          style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
        >
          {title}
        </h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="border-x-0 border-t-0 rounded-none bg-transparent px-0 pl-9 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" placeholder="Beratungen durchsuchen" />
      </div>
    </header>
  );
}
