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
    <main className="min-h-screen bg-[#f5ede2] px-6 py-10 text-stone-900 sm:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-stone-200 bg-[#fffaf3] p-8 shadow-[0_24px_80px_rgba(79,57,32,0.08)] sm:p-10">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark className="bg-stone-950 text-[#f7f1e7]" />
          <div>
            <p className="text-sm font-semibold tracking-[0.24em]">CAREVO</p>
            <p className="text-sm text-stone-500">Zurueck zur Landing Page</p>
          </div>
        </Link>

        <h1
          className="mt-10 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl"
          style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
        >
          Datenschutz
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
          Diese Seite ist als Datenschutz-Grundgeruest vorbereitet. Vor dem produktiven Einsatz muessen die Inhalte mit
          euren realen Prozessen, Dienstleistern und rechtlichen Vorgaben abgeglichen werden.
        </p>

        <section className="mt-10 space-y-5">
          {privacySections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-stone-200 bg-[#f8f1e6] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">{section.title}</p>
              <p className="mt-3 text-base leading-7 text-stone-700">{section.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-stone-200 bg-[#f8f1e6] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Wichtiger Hinweis</p>
          <p className="mt-3 text-base leading-7 text-stone-700">
            Diese Vorlage ist bewusst kein fertiger DSGVO-Text. Sie soll euch helfen, den Footer und die Landing Page
            schon jetzt sauber zu verlinken, bis die finale juristische Fassung vorliegt.
          </p>
        </section>
      </div>
    </main>
  );
}
