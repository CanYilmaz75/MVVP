import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Datenschutz | CAREVO",
  description: "Vorbereitete Datenschutzseite fuer CAREVO."
};

const privacySections = [
  {
    title: "1. Verantwortliche Stelle",
    body: "Tragt hier eure verantwortliche juristische Person, Anschrift und Kontaktinformationen ein."
  },
  {
    title: "2. Verarbeitete Daten",
    body: "Beschreibt hier, welche personen- oder gesundheitsbezogenen Daten im Rahmen der Nutzung verarbeitet werden."
  },
  {
    title: "3. Zwecke und Rechtsgrundlagen",
    body: "Ergaenzt hier, auf welcher Rechtsgrundlage Verarbeitung, Authentifizierung, Speicherung und Protokollierung erfolgen."
  },
  {
    title: "4. Empfaenger und Dienstleister",
    body: "Fuegt hier die tatsaechlich eingesetzten Unterauftragsverarbeiter und Hosting-Dienstleister ein."
  },
  {
    title: "5. Speicherdauer",
    body: "Beschreibt hier Aufbewahrungsfristen, Loeschlogik und gegebenenfalls gesetzliche Dokumentationspflichten."
  },
  {
    title: "6. Betroffenenrechte",
    body: "Nennt hier Auskunft, Berichtigung, Loeschung, Einschraenkung, Widerspruch und Beschwerderecht."
  }
];

export default function DatenschutzPage() {
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
          Datenschutz
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-secondary-foreground">
          Diese Seite ist als Datenschutz-Grundgeruest vorbereitet. Vor dem produktiven Einsatz muessen die Inhalte mit
          euren realen Prozessen, Dienstleistern und rechtlichen Vorgaben abgeglichen werden.
        </p>

        <section className="mt-10 space-y-5">
          {privacySections.map((section) => (
            <div key={section.title} className="rounded-lg border border-border bg-secondary p-5">
              <p className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">{section.title}</p>
              <p className="mt-3 text-base leading-7 text-secondary-foreground">{section.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-lg border border-border bg-secondary p-5">
          <p className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">Wichtiger Hinweis</p>
          <p className="mt-3 text-base leading-7 text-secondary-foreground">
            Diese Vorlage ist bewusst kein fertiger DSGVO-Text. Sie soll euch helfen, den Footer und die Landing Page
            schon jetzt sauber zu verlinken, bis die finale juristische Fassung vorliegt.
          </p>
        </section>
      </div>
    </main>
  );
}
