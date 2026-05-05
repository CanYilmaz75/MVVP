export function AppHeader({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex flex-col gap-5 bg-[#f4f4f6] px-4 py-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10 xl:px-20">
      <div>
        <p className="carevo-eyebrow">Arbeitsbereich</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-[32px]">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
      </div>
    </header>
  );
}
