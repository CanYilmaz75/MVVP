import Link from "next/link";

import { ConsentSettingsButton } from "@/components/consent/consent-settings-button";
import { CarevoWordmark } from "@/components/shared/logo";

export function SiteFooter() {
  return (
    <footer className="bg-white">
      <div className="carevo-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="max-w-md">
          <CarevoWordmark subline="" />
          <p className="mt-5 text-sm leading-6 text-secondary-foreground">
            Ruhige KI-Dokumentation fuer sensible Pflege- und Versorgungsablaeufe.
          </p>
        </div>
        <div className="space-y-3 text-sm text-secondary-foreground">
          <Link href="/preise" className="block transition-colors hover:text-foreground">
            Preise
          </Link>
          <Link href="/demo-buchen" className="block transition-colors hover:text-foreground">
            Demo buchen
          </Link>
          <Link href="/dashboard" className="block transition-colors hover:text-foreground">
            Zur App
          </Link>
        </div>
        <div className="space-y-3 text-sm text-secondary-foreground">
          <Link href="/agb" className="block transition-colors hover:text-foreground">
            AGB
          </Link>
          <Link href="/cookies" className="block transition-colors hover:text-foreground">
            Cookies
          </Link>
          <ConsentSettingsButton />
          <Link href="/avv" className="block transition-colors hover:text-foreground">
            AVV / TOM
          </Link>
        </div>
        <div className="space-y-3 text-sm text-secondary-foreground">
          <Link href="/impressum" className="block transition-colors hover:text-foreground">
            Impressum
          </Link>
          <Link href="/datenschutz" className="block transition-colors hover:text-foreground">
            Datenschutz
          </Link>
          <p className="text-muted-foreground">© 2026 CAREVO</p>
        </div>
      </div>
    </footer>
  );
}
