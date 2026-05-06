"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ClipboardList, LayoutDashboard, FileAudio, Menu, PauseCircle, Settings, FileText, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isCareFacility, type CareSetting } from "@/lib/care-setting";
import type { PausedConsultationSummary } from "@/server/services/consultation-service";

const items: Array<{ href: Route; label: string; icon: typeof LayoutDashboard; careOnly?: boolean }> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/consultations", label: "Beratungen", icon: FileAudio },
  { href: "/sis", label: "SIS", icon: ClipboardList, careOnly: true },
  { href: "/templates", label: "Vorlagen", icon: FileText },
  { href: "/settings", label: "Einstellungen", icon: Settings }
];

function visibleItems(careSetting: CareSetting) {
  return items
    .filter((item) => !item.careOnly || isCareFacility(careSetting))
    .map((item) =>
      item.href === "/consultations"
        ? { ...item, label: isCareFacility(careSetting) ? "Pflegeberatung" : "Praxisberatung" }
        : item
    );
}

export function AppSidebar({
  careSetting,
  currentPath,
  organisationName,
  pausedConsultations = [],
  userName
}: {
  careSetting: CareSetting;
  currentPath: string;
  organisationName: string;
  pausedConsultations?: PausedConsultationSummary[];
  userName: string;
}) {
  return (
    <aside className="z-10 m-4 mr-0 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-white px-5 py-8 shadow-[0_18px_45px_rgba(10,10,15,0.08)] md:sticky md:top-4 md:flex xl:w-72 xl:px-6">
      <nav className="flex flex-1 flex-col gap-1">
        {visibleItems(careSetting).map(({ href, label, icon: Icon }) => {
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

export function AppMobileNav({ careSetting, currentPath }: { careSetting: CareSetting; currentPath: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = visibleItems(careSetting);
  const activeItem = navItems.find(({ href }) => currentPath === href || currentPath.startsWith(`${href}/`)) ?? navItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 z-40 bg-primary/20 md:hidden" onClick={() => setIsOpen(false)} />
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur md:hidden">
        {isOpen ? (
          <div className="mx-auto mb-3 max-w-md rounded-lg border border-border bg-card shadow-subtle">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">CAREVO</p>
                <p className="text-sm font-semibold">Navigation</p>
              </div>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Menue schliessen"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5 stroke-[1.5]" />
              </button>
            </div>

            <div className="p-2">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = currentPath === href || currentPath.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                    className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-base ease-carevo ${
                      isActive ? "bg-accent/10 text-accent" : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0 stroke-[1.5]" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-subtle">
          <div className="flex min-w-0 items-center gap-3">
            <ActiveIcon className="h-5 w-5 shrink-0 stroke-[1.5] text-accent" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase text-muted-foreground">Aktuell</p>
              <p className="truncate text-sm font-semibold">{activeItem.label}</p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors duration-base ease-carevo hover:bg-accent/90"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Menue schliessen" : "Menue oeffnen"}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? (
              <X className="h-5 w-5 stroke-[1.5]" />
            ) : (
              <Menu className="h-5 w-5 stroke-[1.5]" />
            )}
            Menü
          </button>
        </div>
      </nav>
    </>
  );
}
