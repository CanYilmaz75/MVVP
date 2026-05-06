import type { Route } from "next";
import Link from "next/link";
import { Menu } from "lucide-react";

import { CarevoWordmark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

const navigation: Array<{ label: string; href: Route }> = [
  { label: "Produkt", href: "/" as Route },
  { label: "Preise", href: "/preise" as Route },
  { label: "Demo", href: "/demo-buchen" as Route }
];

export function SiteHeader() {
  return (
    <div className="carevo-container">
      <header className="flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <CarevoWordmark subline="" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm text-secondary-foreground transition-colors hover:bg-white hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Button asChild variant="ghost" className="text-secondary-foreground hover:bg-white hover:text-foreground">
            <Link href="/dashboard">Einloggen</Link>
          </Button>
          <Button asChild>
            <Link href="/demo-buchen">Demo buchen</Link>
          </Button>
        </div>

        <details className="group md:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-border bg-white [&::-webkit-details-marker]:hidden">
            <Menu className="h-5 w-5 text-secondary-foreground" />
          </summary>
          <div className="absolute left-4 right-4 z-20 mt-3 rounded-lg border border-border bg-white p-2 shadow-subtle">
            {navigation.map((item) => (
              <Link key={item.label} href={item.href} className="flex min-h-11 items-center rounded-lg px-3 text-sm">
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-2">
              <Link href="/dashboard" className="flex min-h-11 items-center rounded-lg px-3 text-sm">
                Einloggen
              </Link>
              <Link href="/demo-buchen" className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold">
                Demo buchen
              </Link>
            </div>
          </div>
        </details>
      </header>
    </div>
  );
}
