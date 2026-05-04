import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Impressum | CAREVO",
  description: "Vorbereitete Impressumsseite fuer CAREVO."
};

const impressumFields = [
  "Unternehmensname oder verantwortliche Person",
  "Anschrift",
  "Kontakt-E-Mail",
  "Telefon",
  "Vertretungsberechtigte Person",
  "Registereintrag und USt-ID, falls vorhanden"
];

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card p-8 shadow-subtle sm:p-10">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark className="bg-primary text-primary-foreground" />
          <div>
            <p className="text-sm font-semibold tracking-normal">CAREVO</p>
            <p className="text-sm text-muted-foreground">Zurueck zur Landing Page</p>
          </div>
        </Link>

        <h1
          className="mt-10 carevo-h2"
        >
          Impressum
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-secondary-foreground">
          Diese Seite ist als rechtliche Grundstruktur vorbereitet. Vor dem Go-live muessen die Platzhalter durch eure
          echten Unternehmens- und Kontaktangaben ersetzt werden.
        </p>

        <section className="mt-10 space-y-5">
          {impressumFields.map((field) => (
            <div key={field} className="rounded-lg border border-border bg-secondary p-5">
              <p className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">{field}</p>
              <p className="mt-3 text-base text-secondary-foreground">[Bitte vor Go-live eintragen]</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-lg border border-border bg-secondary p-5">
          <p className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">Hinweis</p>
          <p className="mt-3 text-base leading-7 text-secondary-foreground">
            Je nach Gesellschaftsform, Sitz und regulatorischem Kontext koennen weitere Pflichtangaben noetig sein.
            Diese Vorlage ersetzt keine rechtliche Pruefung.
          </p>
        </section>
      </div>
    </main>
  );
}
