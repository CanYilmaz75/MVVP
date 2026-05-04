import Link from "next/link";
import type { Route } from "next";
import { ClipboardList, LayoutDashboard, FileAudio, FileOutput, PauseCircle, Settings, FileText } from "lucide-react";

import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import type { PausedConsultationSummary } from "@/server/services/consultation-service";

const items: Array<{ href: Route; label: string; icon: typeof LayoutDashboard }> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/consultations", label: "Beratungen", icon: FileAudio },
  { href: "/sis", label: "SIS", icon: ClipboardList },
  { href: "/templates", label: "Vorlagen", icon: FileText },
  { href: "/exports", label: "Exporte", icon: FileOutput },
  { href: "/settings", label: "Einstellungen", icon: Settings }
];

export function AppSidebar({
  currentPath,
  organisationName,
  pausedConsultations = [],
  userName
}: {
  currentPath: string;
  organisationName: string;
  pausedConsultations?: PausedConsultationSummary[];
  userName: string;
}) {
  return (
    <aside className="hidden w-72 flex-col border-r border-border bg-card px-6 py-8 lg:flex">
      <div className="flex items-center gap-3">
        <LogoMark />
        <div>
          <p className="text-sm font-medium text-muted-foreground">Dokumentation fuer Pflege und Versorgung</p>
          <p className="text-lg font-semibold">CAREVO</p>
        </div>
      </div>

      <nav className="mt-12 flex flex-1 flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = currentPath === href || currentPath.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-11 items-center gap-3 rounded-lg border-l-2 px-4 py-3 text-sm font-medium transition-colors duration-base ease-carevo ${
                isActive
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 stroke-[1.5]" />
              {label}
            </Link>
          );
        })}

        {pausedConsultations.length ? (
          <div className="mt-8 space-y-1 border-t border-border pt-6">
            <div className="flex items-center gap-2 px-4 text-xs font-medium uppercase text-muted-foreground">
              <PauseCircle className="h-4 w-4 stroke-[1.5]" />
              Unterbrochen
            </div>
            {pausedConsultations.map((consultation) => (
              <Link
                key={consultation.id}
                href={`/consultations/${consultation.id}` as Route}
                className="block rounded-lg border-l-2 border-transparent px-4 py-3 text-sm transition-colors duration-base ease-carevo hover:border-border hover:bg-secondary hover:text-foreground"
              >
                <p className="truncate font-medium">{consultation.patient_reference}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{consultation.specialty}</p>
              </Link>
            ))}
          </div>
        ) : null}
      </nav>

      <div className="space-y-4 border-t border-border pt-6">
        <div className="space-y-1">
          <p className="text-xs uppercase text-muted-foreground">Organisation</p>
          <p className="font-medium">{organisationName}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase text-muted-foreground">Behandelnde Person</p>
          <p className="font-medium">{userName}</p>
        </div>
        <form action="/api/auth/signout" method="post">
          <Button type="submit" variant="ghost" className="w-full justify-start px-0">
            Abmelden
          </Button>
        </form>
      </div>
    </aside>
  );
}

export function AppMobileNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-6 gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = currentPath === href || currentPath.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium transition-colors duration-base ease-carevo ${
                isActive ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 stroke-[1.5]" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
