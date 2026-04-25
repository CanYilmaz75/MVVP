import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Uebersicht</p>
        <h1
          className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
          style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
        >
          {title}
        </h1>
        {description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
