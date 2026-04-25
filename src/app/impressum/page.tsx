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
          Impressum
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
          Diese Seite ist als rechtliche Grundstruktur vorbereitet. Vor dem Go-live muessen die Platzhalter durch eure
          echten Unternehmens- und Kontaktangaben ersetzt werden.
        </p>

        <section className="mt-10 space-y-5">
          {impressumFields.map((field) => (
            <div key={field} className="rounded-2xl border border-stone-200 bg-[#f8f1e6] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">{field}</p>
              <p className="mt-3 text-base text-stone-700">[Bitte vor Go-live eintragen]</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-stone-200 bg-[#f8f1e6] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Hinweis</p>
          <p className="mt-3 text-base leading-7 text-stone-700">
            Je nach Gesellschaftsform, Sitz und regulatorischem Kontext koennen weitere Pflichtangaben noetig sein.
            Diese Vorlage ersetzt keine rechtliche Pruefung.
          </p>
        </section>
      </div>
    </main>
  );
}
