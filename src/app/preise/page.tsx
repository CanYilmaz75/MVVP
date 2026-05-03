import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, HelpCircle, Minus } from "lucide-react";

import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Preise | CAREVO",
  description:
    "CAREVO Preise fuer kleine Praxen, Pflegeheime, ambulante Dienste und Enterprise-Organisationen mit aktiver Seat-Abrechnung."
};

const plans = [
  {
    name: "Starter",
    label: "Self-Service",
    audience: "Fuer kleine Praxen, ambulante Dienste und einzelne Pflegeheime",
    price: "49 EUR",
    cadence: "pro Monat",
    subline: "1 aktiver Nutzer inklusive",
    cta: "Jetzt starten",
    href: "/signup" as Route,
    highlighted: false,
    features: [
      "Dokumentationsentwuerfe aus Audio und Kontext",
      "SIS-nahe Strukturierung",
      "Exportfaehige Notizen",
      "Admin kann Nutzer einladen",
      "Offene Einladungen kosten nichts"
    ]
  },
  {
    name: "Team",
    label: "Beliebt",
    audience: "Fuer wachsende Teams mit mehreren aktiven Nutzern",
    price: "30 EUR",
    cadence: "pro aktivem Zusatznutzer/Monat",
    subline: "zusaetzlich zum Starter-Grundpreis",
    cta: "Kostenlos registrieren",
    href: "/signup" as Route,
    highlighted: true,
    features: [
      "Bis 20 aktive Nutzer im Self-Service",
      "Automatische monatliche Seat-Anpassung",
      "Team- und Rollenverwaltung",
      "Abo-Uebersicht fuer Admins",
      "Enterprise-Anfrage beim Limit"
    ]
  },
  {
    name: "Enterprise",
    label: "Ab 21 Nutzern",
    audience: "Fuer Traeger, Verbunde und groessere Versorgungseinrichtungen",
    price: "Individuell",
    cadence: "Vertrag und Rechnung",
    subline: "manuell betreut statt automatisch gebucht",
    cta: "Kontaktanfrage",
    href: "/demo-buchen" as Route,
    highlighted: false,
    features: [
      "Alles aus Team",
      "Mehrere Standorte und Organisationseinheiten",
      "Individuelles Onboarding",
      "Vorbereitet fuer SSO und SLA",
      "Zentrale Abrechnung"
    ]
  }
];

const comparisonRows = [
  ["Dokumentationsentwuerfe", "Inklusive", "Inklusive", "Inklusive"],
  ["SIS-nahe Strukturierung", "Inklusive", "Inklusive", "Inklusive"],
  ["Aktive Nutzer", "1 inklusive", "Bis 20", "Individuell"],
  ["Zusatznutzer", "30 EUR / Monat", "30 EUR / Monat", "Nach Vertrag"],
  ["Offene Einladungen", "Kostenlos", "Kostenlos", "Kostenlos"],
  ["Team- und Rollenverwaltung", "Basis", "Inklusive", "Erweitert"],
  ["Automatische Abrechnung", "Inklusive", "Inklusive", "Manueller Vertrag"],
  ["Enterprise-Anfrage", "Ab Seat 21", "Ab Seat 21", "Inklusive"],
  ["SSO / SLA", "-", "-", "Nach Vereinbarung"],
  ["Onboarding", "-", "Optional", "Individuell"]
];

const faqs = [
  {
    question: "Welche Nutzer werden abgerechnet?",
    answer:
      "Nur aktive Nutzer zaehlen als billable Seats. Offene Einladungen und deaktivierte Nutzer erhoehen den monatlichen Beitrag nicht."
  },
  {
    question: "Was passiert beim 21. aktiven Nutzer?",
    answer:
      "Self-Service stoppt bei 20 aktiven Nutzern. Beim naechsten Aktivierungsversuch erscheint der Enterprise-Prozess, damit groessere Organisationen mit Vertrag und Rechnung arbeiten."
  },
  {
    question: "Zaehlen Admins als aktive Nutzer?",
    answer:
      "Ja. Admins zaehlen als aktive Seats, solange ihr Konto aktiv ist. Dadurch bleibt die Abrechnung einfach und nachvollziehbar."
  },
  {
    question: "Kann eine kleine Praxis ohne Enterprise-Vertrag starten?",
    answer:
      "Ja. Kleine Teams koennen sich selbst registrieren, Nutzer einladen und bis zum Self-Service-Limit eigenstaendig wachsen."
  }
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">{children}</p>;
}

export default function PricingPage() {
  return (
    <main
      className="min-h-screen bg-[#f7f3ec] text-stone-950"
      style={{ fontFamily: '"Avenir Next", "Segoe UI", sans-serif' }}
    >
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
            <Link href="/" className="text-sm text-stone-700 transition-colors hover:text-stone-950">
              Produkt
            </Link>
            <Link href="/preise" className="text-sm font-medium text-stone-950">
              Preise
            </Link>
            <Link href="/demo-buchen" className="text-sm text-stone-700 transition-colors hover:text-stone-950">
              Kontakt
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden text-stone-700 hover:bg-transparent hover:text-stone-950 sm:inline-flex">
              <Link href="/dashboard">Einloggen</Link>
            </Button>
            <Button asChild className="rounded-full bg-stone-950 px-5 text-[#f7f3ec] hover:bg-stone-800">
              <Link href="/signup">Starten</Link>
            </Button>
          </div>
        </header>

        <section className="py-20 text-center sm:py-24">
          <Eyebrow>Von der kleinen Praxis bis zur grossen Versorgungseinrichtung</Eyebrow>
          <h1
            className="mx-auto mt-6 max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.05em] text-stone-950 sm:text-6xl lg:text-7xl"
            style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
          >
            Preise, die mit aktiven Teams wachsen.
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-stone-700 sm:text-xl">
            Starten Sie eigenstaendig im Self-Service oder wechseln Sie ab 21 aktiven Nutzern in einen Enterprise-Vertrag.
            CAREVO berechnet aktive Nutzer, nicht offene Einladungen.
          </p>
          <div className="mx-auto mt-10 inline-flex rounded-full border border-stone-200 bg-white p-1 text-sm">
            <span className="rounded-full bg-stone-950 px-5 py-2 font-medium text-[#f7f3ec]">Monatlich</span>
            <span className="px-5 py-2 text-stone-500">Jaehrlich spaeter</span>
          </div>
        </section>

        <section className="grid gap-5 border-b border-stone-200 pb-20 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex min-h-[34rem] flex-col rounded-[1.75rem] border p-7 ${
                plan.highlighted ? "border-stone-950 bg-stone-950 text-[#f7f3ec]" : "border-stone-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em]">{plan.name}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    plan.highlighted ? "bg-[#f7f3ec] text-stone-950" : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {plan.label}
                </span>
              </div>
              <p className={`mt-5 text-sm leading-6 ${plan.highlighted ? "text-stone-300" : "text-stone-600"}`}>
                {plan.audience}
              </p>
              <div className="mt-8">
                <p className="text-5xl font-semibold tracking-[-0.05em]">{plan.price}</p>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-stone-300" : "text-stone-500"}`}>{plan.cadence}</p>
                <p className={`mt-4 text-sm leading-6 ${plan.highlighted ? "text-stone-300" : "text-stone-600"}`}>{plan.subline}</p>
              </div>
              <Button
                asChild
                className={`mt-8 h-12 rounded-full ${
                  plan.highlighted
                    ? "bg-[#f7f3ec] text-stone-950 hover:bg-stone-100"
                    : "bg-stone-950 text-[#f7f3ec] hover:bg-stone-800"
                }`}
              >
                <Link href={plan.href}>
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6">
                    <CheckCircle2 className={`mt-1 h-4 w-4 shrink-0 ${plan.highlighted ? "text-[#f7f3ec]" : "text-stone-500"}`} />
                    <span className={plan.highlighted ? "text-stone-100" : "text-stone-700"}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="border-b border-stone-200 py-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Unsere Plaene im Detail</Eyebrow>
              <h2
                className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-950 sm:text-5xl"
                style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
              >
                Vergleichen Sie Self-Service und Enterprise.
              </h2>
            </div>
            <Link href="/demo-buchen" className="inline-flex items-center gap-2 text-sm font-medium text-stone-900">
              Beratung anfragen
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white">
            <div className="grid grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr] border-b border-stone-200 bg-stone-50 px-5 py-4 text-sm font-semibold text-stone-700">
              <span>Funktion</span>
              <span>Starter</span>
              <span>Team</span>
              <span>Enterprise</span>
            </div>
            {comparisonRows.map((row) => (
              <div key={row[0]} className="grid grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr] border-b border-stone-100 px-5 py-4 text-sm last:border-b-0">
                <span className="font-medium text-stone-900">{row[0]}</span>
                {row.slice(1).map((value, index) => (
                  <span key={`${row[0]}-${index}`} className="text-stone-600">
                    {value === "-" ? <Minus className="h-4 w-4 text-stone-300" /> : value}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 border-b border-stone-200 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2
              className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-950"
              style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
            >
              Haeufige Fragen zu Preisen und Seats.
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-[1.25rem] border border-stone-200 bg-white p-6">
                <div className="flex gap-3">
                  <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-stone-500" />
                  <div>
                    <h3 className="font-semibold text-stone-950">{faq.question}</h3>
                    <p className="mt-3 text-sm leading-7 text-stone-600">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20">
          <div className="rounded-[2rem] border border-stone-200 bg-white px-8 py-10 text-center sm:px-10">
            <h2
              className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] text-stone-950 sm:text-5xl"
              style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
            >
              Starten Sie klein oder planen Sie den Rollout direkt mit Vertrag.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-stone-700">
              CAREVO ist so gebaut, dass kleine Organisationen buchen koennen und groessere Teams nicht in einem zu engen
              Self-Service-Modell stecken bleiben.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full bg-stone-950 px-7 text-[#f7f3ec] hover:bg-stone-800">
                <Link href="/signup">Self-Service starten</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 rounded-full border border-stone-300 px-7 text-stone-900 hover:bg-stone-100">
                <Link href="/demo-buchen">Enterprise anfragen</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
