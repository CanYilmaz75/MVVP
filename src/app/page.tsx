import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  MessageSquareText,
  Quote,
  ShieldCheck,
  Users
} from "lucide-react";

import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "CAREVO | Dokumentation fuer die Pflege- und Versorgungsindustrie",
  description:
    "CAREVO reduziert Dokumentationsaufwand in der Pflege- und Versorgungsindustrie mit deutschsprachigen Entwuerfen, klaren Freigaben und auditierbaren Schritten."
};

const navigation = [
  { label: "Kunden", href: "#kunden" },
  { label: "Stimmen", href: "#stimmen" },
  { label: "Sicherheit", href: "#sicherheit" }
];

const logoSlots = [
  { name: "Pflegedienst", subline: "Logo-Slot fuer Pilotpartner" },
  { name: "Seniorenresidenz", subline: "Logo-Slot fuer Referenzkunde" },
  { name: "Klinikverbund", subline: "Logo-Slot fuer Pilotprogramm" },
  { name: "Pflegegruppe", subline: "Logo-Slot fuer SIS-Einsatz" },
  { name: "Versorgungsnetzwerk", subline: "Logo-Slot fuer spaeteren Rollout" },
  { name: "Traegergruppe", subline: "Logo-Slot fuer Erfolgsstory" }
];

const useCases = [
  "Beratungsdokumentation",
  "Freigabeprozesse",
  "Entwuerfe nach Audio",
  "SIS-nahe Strukturierung",
  "Exportfaehige Notizen",
  "Auditierbare Schritte"
];

const featuredQuote = {
  quote:
    "Hier kann spaeter die erste starke Kundenstimme stehen: etwa aus einem Pflegedienst, einer Einrichtung oder einem Traeger, der CAREVO fuer weniger Nachdokumentation und schnellere Freigaben einsetzt.",
  author: "Name nach Freigabe",
  role: "Einrichtungsleitung, PDL oder Bereichsverantwortung",
  organisation: "Pilotkunde"
};

const testimonials = [
  {
    quote:
      "Vorbereiteter Testimonial-Slot fuer eine Einrichtung, die kuerzer bis zur finalen Dokumentation kommt und weniger Medienbruch im Alltag erlebt.",
    author: "Name nach Freigabe",
    role: "Einrichtungsleitung",
    organisation: "Pflegeeinrichtung"
  },
  {
    quote:
      "Vorbereiteter Testimonial-Slot fuer einen Traeger oder Verbund, der einen ruhigeren Ablauf zwischen Erfassung, Entwurf und Freigabe beschreiben will.",
    author: "Name nach Freigabe",
    role: "Regionalleitung oder Operations",
    organisation: "Traegergruppe"
  },
  {
    quote:
      "Vorbereiteter Testimonial-Slot fuer Pflege oder ambulante Versorgung, wenn die ersten echten Aussagen zur SIS-Nutzung vorliegen.",
    author: "Name nach Freigabe",
    role: "Fachkraft oder PDL",
    organisation: "Ambulanter Dienst"
  }
];

const storyCards = [
  {
    title: "Pilotpartner aus der Pflegeeinrichtung",
    description: "Slot fuer eine spaetere Fallstudie zu schnellerer Pruefung, kuerzerer Nachdokumentation und hoeherer Routine im Alltag."
  },
  {
    title: "Pilotpartner aus dem Traegerverbund",
    description: "Slot fuer eine spaetere Story zu Teamkoordination, geringerem Reibungsverlust und klareren Freigabeschritten."
  },
  {
    title: "SIS oder Pflegeeinsatz",
    description: "Slot fuer eine spaetere Referenz zur sprachgestuetzten Strukturierung in dokumentationsintensiven Versorgungsszenarien."
  }
];

const securityCards = [
  {
    title: "Geschuetzte Bereiche",
    description: "Die App trennt oeffentliche Einstiege von geschuetzten Arbeitsbereichen fuer dokumentationsrelevante Inhalte."
  },
  {
    title: "Private Dateiwege",
    description: "Audio und Exporte sind fuer kontrollierte Speicherung und kurze Zugriffe ausgelegt, nicht fuer offene Streuwege."
  },
  {
    title: "Auditierbare Schritte",
    description: "Erstellung, Bearbeitung, Freigabe und Export sind auf Nachvollziehbarkeit ausgelegt."
  },
  {
    title: "Explizite Freigabe",
    description: "CAREVO erzeugt Entwuerfe, finalisiert aber nicht autonom. Die Verantwortung bleibt beim Team."
  }
];

const footerColumns = {
  produkt: [
    { label: "Zur App", href: "/dashboard" },
    { label: "Kunden", href: "#kunden" },
    { label: "Sicherheit", href: "#sicherheit" }
  ],
  rechtliches: [
    { label: "Impressum", href: "/impressum" },
    { label: "Datenschutz", href: "/datenschutz" }
  ],
  social: [
    { label: "LinkedIn", href: null, note: "Profil-URL vor Go-live hinterlegen" },
    { label: "X / Twitter", href: null, note: "Profil-URL vor Go-live hinterlegen" },
    { label: "Instagram", href: null, note: "Profil-URL vor Go-live hinterlegen" }
  ]
} as const;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">{children}</p>;
}

export default function HomePage() {
  return (
    <main
      className="min-h-screen bg-[#f7f3ec] text-stone-950"
      style={{ fontFamily: '"Avenir Next", "Segoe UI", sans-serif' }}
    >
      <div className="border-b border-stone-200 bg-[#f1ebe2]">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-3 text-center text-sm text-stone-700 sm:px-8 lg:px-10">
          CAREVO ist fuer die Pflege- und Versorgungsindustrie gebaut: ruhig im Auftritt, klar in der Verantwortung.
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-stone-200 py-6">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark className="bg-stone-950 text-[#f7f3ec]" />
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-stone-950">CAREVO</p>
              <p className="text-xs text-stone-500">Dokumentation fuer Pflege und Versorgung</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navigation.map((item) => (
              <a key={item.label} href={item.href} className="text-sm text-stone-700 transition-colors hover:text-stone-950">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden text-stone-700 hover:bg-transparent hover:text-stone-950 sm:inline-flex">
              <Link href="/demo-buchen">Demo buchen</Link>
            </Button>
            <Button asChild className="rounded-full bg-stone-950 px-5 text-[#f7f3ec] hover:bg-stone-800">
              <Link href="/dashboard">Zur App</Link>
            </Button>
          </div>
        </header>

        <section className="border-b border-stone-200 py-20 sm:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <Eyebrow>Dokumentation fuer Pflege und Versorgung</Eyebrow>
            <h1
              className="mt-6 text-5xl font-semibold leading-[0.96] tracking-[-0.05em] text-stone-950 sm:text-6xl lg:text-7xl"
              style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
            >
              Weniger Dokumentationslast.
              <span className="block">Mehr Zeit fuer die naechste Versorgung.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-stone-700 sm:text-xl">
              CAREVO hilft Einrichtungen, Diensten und Traegern, schneller von Audio und Kontext zu einer pruefbaren,
              deutschsprachigen Dokumentation zu kommen. Mit klaren Freigaben, auditierbaren Schritten und einem
              ruhigen Produktfluss.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full bg-stone-950 px-7 text-[#f7f3ec] hover:bg-stone-800">
                <Link href="/dashboard">
                  Zur App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 rounded-full border border-stone-300 px-7 text-stone-900 hover:bg-stone-100"
              >
                <Link href="/demo-buchen">Demo buchen</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-b border-stone-200 py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Eyebrow>Vorbereitet fuer Logos und Pilotpartner</Eyebrow>
              <p className="mt-3 text-base leading-7 text-stone-700">
                Die Struktur ist bewusst wie eine echte Customer Wall angelegt, damit spaetere Referenzen direkt an
                den richtigen Stellen sitzen.
              </p>
            </div>
            <a href="#stimmen" className="inline-flex items-center gap-2 text-sm font-medium text-stone-900">
              Zu den Kundenstimmen
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {logoSlots.map((slot) => (
              <div key={slot.name} className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-6">
                <div className="flex h-12 items-center justify-center rounded-xl border border-dashed border-stone-300 text-sm font-medium text-stone-400">
                  {slot.name}
                </div>
                <p className="mt-3 text-sm text-stone-500">{slot.subline}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="kunden" className="grid gap-12 border-b border-stone-200 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="max-w-xl">
            <Eyebrow>Kunden</Eyebrow>
            <h2
              className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-950 sm:text-5xl"
              style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
            >
              CAREVO ist fuer Teams gebaut, die unter echter Dokumentationslast arbeiten.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              Nicht fuer Demo-Effekte, sondern fuer Pflegeeinrichtungen, ambulante Dienste, Traeger und
              Versorgungsteams, die einen klaren Weg von der Aufnahme bis zur Freigabe brauchen.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {useCases.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
                  <CheckCircle2 className="h-4 w-4 text-stone-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Card className="rounded-[2rem] border-stone-200 bg-white shadow-none">
            <CardContent className="p-8 sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-950 text-[#f7f3ec]">
                <Quote className="h-5 w-5" />
              </div>
              <p className="mt-8 text-2xl leading-[1.5] tracking-[-0.02em] text-stone-900">
                {featuredQuote.quote}
              </p>
              <div className="mt-10 border-t border-stone-200 pt-6">
                <p className="font-semibold text-stone-950">{featuredQuote.author}</p>
                <p className="mt-1 text-sm text-stone-600">{featuredQuote.role}</p>
                <p className="mt-1 text-sm text-stone-500">{featuredQuote.organisation}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="stimmen" className="border-b border-stone-200 py-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Eyebrow>Stimmen</Eyebrow>
              <h2
                className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-950 sm:text-5xl"
                style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
              >
                Vorbereitet fuer echte Aussagen aus der Pflege- und Versorgungsindustrie.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-stone-700">
              Statt erfundener Testimonials stehen hier bewusst Slots, die spaeter mit freigegebenen Kundenstimmen
              gefuellt werden koennen.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {testimonials.map((item) => (
              <Card key={item.organisation} className="rounded-[1.75rem] border-stone-200 bg-white shadow-none">
                <CardContent className="p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100">
                    <Quote className="h-5 w-5 text-stone-700" />
                  </div>
                  <p className="mt-6 text-lg leading-8 text-stone-800">{item.quote}</p>
                  <div className="mt-8 border-t border-stone-200 pt-5">
                    <p className="font-semibold text-stone-950">{item.author}</p>
                    <p className="mt-1 text-sm text-stone-600">{item.role}</p>
                    <p className="mt-1 text-sm text-stone-500">{item.organisation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-b border-stone-200 py-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Eyebrow>Realer Nutzen</Eyebrow>
              <h2
                className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-950 sm:text-5xl"
                style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
              >
                Die besten Referenzen sind keine Claims, sondern spaetere Kundengeschichten.
              </h2>
            </div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-stone-900">
              Produkt oeffnen
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {storyCards.map((card) => (
              <div key={card.title} className="rounded-[1.75rem] border border-stone-200 bg-white p-7">
                <div className="h-48 rounded-[1.25rem] bg-[linear-gradient(135deg,#ebe3d7,#f8f4ed)]" />
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-stone-950">{card.title}</h3>
                <p className="mt-4 text-base leading-7 text-stone-700">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="sicherheit" className="border-b border-stone-200 py-20">
          <div className="max-w-3xl">
            <Eyebrow>Sicherheit</Eyebrow>
            <h2
              className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-950 sm:text-5xl"
              style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
            >
              Sicherheits- und Kontrollprinzipien, die B2B-Kaeufer sofort einordnen koennen.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              CAREVO kommuniziert Sicherheit bewusst nicht als Marketingfolie, sondern als Produktverhalten: klar,
              konkret und nachvollziehbar.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {securityCards.map((card) => (
              <div key={card.title} className="rounded-[1.75rem] border border-stone-200 bg-white p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100">
                  {card.title === "Geschuetzte Bereiche" ? (
                    <ShieldCheck className="h-5 w-5 text-stone-700" />
                  ) : card.title === "Private Dateiwege" ? (
                    <LockKeyhole className="h-5 w-5 text-stone-700" />
                  ) : card.title === "Auditierbare Schritte" ? (
                    <BadgeCheck className="h-5 w-5 text-stone-700" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-stone-700" />
                  )}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-stone-950">{card.title}</h3>
                <p className="mt-4 text-sm leading-7 text-stone-700">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20">
          <div className="rounded-[2rem] border border-stone-200 bg-white px-8 py-10 sm:px-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-3 py-1 text-sm text-stone-700">
                <BadgeCheck className="h-4 w-4" />
                Transparent statt ueberverkauft
              </div>
              <h2
                className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-950 sm:text-5xl"
                style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
              >
                Gute Gesundheitssoftware verkauft nicht nur Tempo, sondern Verantwortung.
              </h2>
              <p className="mt-5 text-lg leading-8 text-stone-700">
                CAREVO ist fuer sensible Dokumentationsablaeufe, klare Freigaben und nachvollziehbare Produktentscheidungen
                gebaut. Genau das sollte man auf der Startseite spueren.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button asChild size="lg" className="h-12 rounded-full bg-stone-950 px-7 text-[#f7f3ec] hover:bg-stone-800">
                <Link href="/dashboard">
                  Zur App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <div className="flex flex-col gap-3 sm:items-end">
                <Button asChild variant="ghost" className="rounded-full border border-stone-300 px-5 text-stone-900 hover:bg-stone-100">
                  <Link href="/demo-buchen">Demo buchen</Link>
                </Button>
                <p className="max-w-xl text-sm leading-6 text-stone-500">
                  Hinweis: Die Seite beschreibt den aktuellen MVP und seine Sicherheitsprinzipien. Sie ist bewusst keine
                  Aussage ueber formale MDR-, ISO- oder vollstaendige DSGVO-Zertifizierung.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-stone-200 py-10">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <LogoMark className="bg-stone-950 text-[#f7f3ec]" />
                <div>
                  <p className="text-sm font-semibold tracking-[0.24em] text-stone-950">CAREVO</p>
                  <p className="text-sm text-stone-600">Dokumentation fuer Pflege und Versorgung</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-stone-600">
                Eigenstaendig fuer CAREVO gestaltet, mit einer ruhigeren Enterprise-Informationsarchitektur fuer
                deutsche B2B-Gesundheitssoftware.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Produkt</p>
              <div className="mt-4 space-y-3">
                {footerColumns.produkt.map((link) => (
                  link.href.startsWith("#") ? (
                    <a key={link.label} href={link.href} className="flex items-center gap-2 text-sm text-stone-700 transition-colors hover:text-stone-950">
                      <ChevronRight className="h-4 w-4 text-stone-500" />
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.label} href={link.href} className="flex items-center gap-2 text-sm text-stone-700 transition-colors hover:text-stone-950">
                      <ChevronRight className="h-4 w-4 text-stone-500" />
                      {link.label}
                    </Link>
                  )
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Rechtliches</p>
              <div className="mt-4 space-y-3">
                {footerColumns.rechtliches.map((link) => (
                  <Link key={link.label} href={link.href} className="flex items-center gap-2 text-sm text-stone-700 transition-colors hover:text-stone-950">
                    <ChevronRight className="h-4 w-4 text-stone-500" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Social & Kontakt</p>
              <div className="mt-4 space-y-3">
                {footerColumns.social.map((link) =>
                  link.href ? (
                    <a
                      key={link.label}
                      href={link.href}
                      className="flex items-start gap-2 text-sm text-stone-700 transition-colors hover:text-stone-950"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Users className="mt-0.5 h-4 w-4 text-stone-500" />
                      <span>{link.label}</span>
                    </a>
                  ) : (
                    <div key={link.label} className="flex items-start gap-2 text-sm text-stone-500">
                      <MessageSquareText className="mt-0.5 h-4 w-4 text-stone-500" />
                      <div>
                        <p>{link.label}</p>
                        <p className="text-xs text-stone-400">{link.note}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-stone-200 py-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 CAREVO. Alle Rechte vorbehalten.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/impressum" className="transition-colors hover:text-stone-900">
                Impressum
              </Link>
              <Link href="/datenschutz" className="transition-colors hover:text-stone-900">
                Datenschutz
              </Link>
              <Link href="/dashboard" className="transition-colors hover:text-stone-900">
                Zur App
              </Link>
              <Link href="/demo-buchen" className="transition-colors hover:text-stone-900">
                Demo buchen
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
