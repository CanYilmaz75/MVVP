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
  return <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{children}</p>;
}

export default function PricingPage() {
  return (
    <main
      className="min-h-screen bg-background text-foreground"
    >
      <div className="carevo-container">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5 sm:py-6">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark className="bg-primary text-primary-foreground" />
            <div>
              <p className="text-sm font-semibold tracking-normal text-foreground">CAREVO</p>
              <p className="text-xs text-muted-foreground">Pflege & Versorgung</p>
            </div>
          </Link>
          <nav className="order-3 grid w-full grid-cols-3 gap-2 border-t border-border pt-4 md:order-none md:flex md:w-auto md:border-t-0 md:pt-0">
            <Link href="/" className="flex min-h-11 items-center justify-center rounded-lg border border-border px-3 py-3 text-sm text-secondary-foreground transition-colors hover:bg-secondary hover:text-foreground md:border-transparent">
              Produkt
            </Link>
            <Link href="/preise" className="flex min-h-11 items-center justify-center rounded-lg border border-border bg-secondary px-3 py-3 text-sm font-medium text-foreground md:border-transparent">
              Preise
            </Link>
            <Link href="/demo-buchen" className="flex min-h-11 items-center justify-center rounded-lg border border-border px-3 py-3 text-sm text-secondary-foreground transition-colors hover:bg-secondary hover:text-foreground md:border-transparent">
              Kontakt
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden text-secondary-foreground hover:bg-transparent hover:text-foreground sm:inline-flex">
              <Link href="/dashboard">Einloggen</Link>
            </Button>
            <Button asChild className="px-4">
              <Link href="/signup">Starten</Link>
            </Button>
          </div>
        </header>

        <section className="py-20 text-center sm:py-24">
          <Eyebrow>Von der kleinen Praxis bis zur grossen Versorgungseinrichtung</Eyebrow>
          <h1
            className="mx-auto mt-6 max-w-5xl carevo-h1"
          >
            Preise, die mit aktiven Teams wachsen.
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-secondary-foreground sm:text-xl">
            Starten Sie eigenstaendig im Self-Service oder wechseln Sie ab 21 aktiven Nutzern in einen Enterprise-Vertrag.
            CAREVO berechnet aktive Nutzer, nicht offene Einladungen.
          </p>
          <div className="mx-auto mt-10 inline-flex rounded-lg border border-border bg-card p-1 text-sm">
            <span className="rounded-lg bg-accent px-5 py-2 font-medium text-accent-foreground">Monatlich</span>
            <span className="px-5 py-2 text-muted-foreground">Jaehrlich spaeter</span>
          </div>
        </section>

        <section className="grid gap-5 border-b border-border pb-20 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex min-h-[34rem] flex-col rounded-lg border p-7 ${
                plan.highlighted ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-normal">{plan.name}</p>
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-medium ${
                    plan.highlighted ? "bg-background text-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {plan.label}
                </span>
              </div>
              <p className={`mt-5 text-sm leading-6 ${plan.highlighted ? "text-muted-foreground" : "text-secondary-foreground"}`}>
                {plan.audience}
              </p>
              <div className="mt-8">
                <p className="text-[40px] font-semibold tracking-normal">{plan.price}</p>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-muted-foreground" : "text-muted-foreground"}`}>{plan.cadence}</p>
                <p className={`mt-4 text-sm leading-6 ${plan.highlighted ? "text-muted-foreground" : "text-secondary-foreground"}`}>{plan.subline}</p>
              </div>
              <Button
                asChild
                className={`mt-8 h-12 rounded-lg ${
                  plan.highlighted
                    ? "bg-background text-foreground hover:bg-secondary"
                    : "bg-accent text-accent-foreground hover:bg-accent/90"
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
                    <CheckCircle2 className={`mt-1 h-4 w-4 shrink-0 ${plan.highlighted ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    <span className={plan.highlighted ? "text-primary-foreground" : "text-secondary-foreground"}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="border-b border-border py-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Unsere Plaene im Detail</Eyebrow>
              <h2
                className="mt-5 carevo-h2"
              >
                Vergleichen Sie Self-Service und Enterprise.
              </h2>
            </div>
            <Link href="/demo-buchen" className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              Beratung anfragen
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <div className="grid grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr] border-b border-border bg-secondary px-5 py-4 text-sm font-semibold text-secondary-foreground">
              <span>Funktion</span>
              <span>Starter</span>
              <span>Team</span>
              <span>Enterprise</span>
            </div>
            {comparisonRows.map((row) => (
              <div key={row[0]} className="grid grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr] border-b border-border px-5 py-4 text-sm last:border-b-0">
                <span className="font-medium text-foreground">{row[0]}</span>
                {row.slice(1).map((value, index) => (
                  <span key={`${row[0]}-${index}`} className="text-secondary-foreground">
                    {value === "-" ? <Minus className="h-4 w-4 text-muted-foreground" /> : value}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-10 space-y-3 md:hidden">
            {comparisonRows.map((row) => (
              <div key={row[0]} className="rounded-lg border border-border bg-card p-4 text-sm">
                <p className="font-semibold text-foreground">{row[0]}</p>
                <div className="mt-3 grid gap-2">
                  {["Starter", "Team", "Enterprise"].map((planName, index) => (
                    <div key={`${row[0]}-${planName}`} className="flex items-center justify-between gap-3 border-t border-border pt-2">
                      <span className="text-muted-foreground">{planName}</span>
                      <span className="text-right text-secondary-foreground">
                        {row[index + 1] === "-" ? <Minus className="h-4 w-4 text-muted-foreground" /> : row[index + 1]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 border-b border-border py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2
              className="mt-5 carevo-h2"
            >
              Haeufige Fragen zu Preisen und Seats.
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-border bg-card p-6">
                <div className="flex gap-3">
                  <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-foreground">{faq.question}</h3>
                    <p className="mt-3 text-sm leading-7 text-secondary-foreground">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20">
          <div className="rounded-lg border border-border bg-card px-8 py-10 text-center sm:px-10">
            <h2
              className="mx-auto max-w-3xl carevo-h2"
            >
              Starten Sie klein oder planen Sie den Rollout direkt mit Vertrag.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-secondary-foreground">
              CAREVO ist so gebaut, dass kleine Organisationen buchen koennen und groessere Teams nicht in einem zu engen
              Self-Service-Modell stecken bleiben.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7">
                <Link href="/signup">Self-Service starten</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 rounded-lg border border-border px-7 text-foreground hover:bg-secondary">
                <Link href="/demo-buchen">Enterprise anfragen</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
