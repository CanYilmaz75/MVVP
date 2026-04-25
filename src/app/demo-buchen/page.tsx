import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Users } from "lucide-react";

import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Demo buchen | CAREVO",
  description: "Vorbereitete Demo-Seite fuer spaetere Terminbuchungen mit CAREVO."
};

const agenda = [
  "Kurzer Blick auf euren Dokumentationsprozess",
  "Live-Eindruck von Dashboard, Beratung und SIS",
  "Einordnung fuer Einrichtung, Dienst oder Traeger",
  "Naechste Schritte fuer Pilot oder Teststellung"
];

export default function DemoBuchenPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] text-stone-950">
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-stone-200 py-6">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark className="bg-stone-950 text-[#f7f3ec]" />
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-stone-950">CAREVO</p>
              <p className="text-xs text-stone-500">Demo und Pilotgespraeche</p>
            </div>
          </Link>

          <Button asChild variant="ghost" className="text-stone-700 hover:bg-transparent hover:text-stone-950">
            <Link href="/">Zurueck zur Startseite</Link>
          </Button>
        </header>

        <section className="py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Demo buchen</p>
            <h1
              className="mt-5 text-5xl font-semibold leading-[0.96] tracking-[-0.05em] sm:text-6xl"
              style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
            >
              Ein klarer Produkttermin statt generischer Vertriebsshow.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">
              Diese Seite ist als sauberer Einstieg fuer spaetere Demo-Buchungen vorbereitet. Vor dem Go-live kann hier
              direkt Calendly, HubSpot oder euer bevorzugter Terminlink eingebunden werden.
            </p>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <div className="border-b border-stone-200 pb-6">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-stone-700" />
                  <p className="text-lg font-medium">Was in der Demo passieren sollte</p>
                </div>
                <div className="mt-6 space-y-4">
                  {agenda.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm leading-7 text-stone-700">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-stone-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 border-b border-stone-200 pb-6 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-5 w-5 text-stone-700" />
                    <p className="font-medium">Empfohlene Dauer</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-stone-700">20 bis 30 Minuten fuer einen ersten klaren Produktabgleich.</p>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-stone-700" />
                    <p className="font-medium">Sinnvolle Teilnehmer</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-stone-700">PDL, Einrichtungsleitung, Operations oder Dokumentationsverantwortung.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 border-t border-stone-200 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Naechster Schritt</p>
                <h2
                  className="mt-3 text-3xl font-semibold tracking-[-0.04em]"
                  style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
                >
                  Terminlink hier einbinden
                </h2>
              </div>

              <p className="text-sm leading-7 text-stone-700">
                Aktuell ist dies ein vorbereiteter Slot. Ersetzt den CTA vor Go-live durch euren echten Buchungslink,
                zum Beispiel ueber Calendly oder HubSpot Meetings.
              </p>

              <div className="space-y-3 border-t border-stone-200 pt-5">
                <Button asChild className="w-full justify-between">
                  <Link href="/">
                    Zur Landing Page
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-between rounded-none border-b border-stone-200 px-0 py-0 pb-3 hover:bg-transparent">
                  <Link href="/dashboard">
                    Zur App
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
