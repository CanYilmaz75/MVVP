import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Menu, Minus } from "lucide-react";

import { CarevoWordmark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Preise | CAREVO",
  description:
    "CAREVO Preise fuer kleine Teams, Pflegeeinrichtungen, ambulante Dienste und groessere Versorgungseinheiten."
};

const navigation: Array<{ label: string; href: Route }> = [
  { label: "Produkt", href: "/" as Route },
  { label: "Preise", href: "/preise" as Route },
  { label: "Demo", href: "/demo-buchen" as Route }
];

const plans = [
  {
    name: "Starter",
    audience: "Fuer kleine Teams, ambulante Dienste und einzelne Einrichtungen.",
    price: "49 EUR",
    cadence: "pro Monat",
    note: "1 aktiver Nutzer inklusive",
    cta: "Starten",
    href: "/signup" as Route,
    features: ["Audio zu Entwurf", "SIS-nahe Strukturierung", "Exportfaehige Notizen", "Einladungen ohne Zusatzkosten"]
  },
  {
    name: "Team",
    audience: "Fuer Organisationen, die mit mehreren aktiven Nutzern arbeiten.",
    price: "30 EUR",
    cadence: "pro Zusatznutzer / Monat",
    note: "zusaetzlich zum Starter-Grundpreis",
    cta: "Team starten",
    href: "/signup" as Route,
    features: ["bis 20 aktive Nutzer", "Team- und Rollenverwaltung", "monatliche Seat-Anpassung", "Abo-Uebersicht fuer Admins"]
  },
  {
    name: "Enterprise",
    audience: "Fuer Traeger, Verbunde und groessere Versorgungseinrichtungen.",
    price: "Individuell",
    cadence: "Vertrag und Rechnung",
    note: "ab 21 aktiven Nutzern",
    cta: "Demo buchen",
    href: "/demo-buchen" as Route,
    features: ["mehrere Standorte", "individuelles Onboarding", "zentrale Abrechnung", "SSO und SLA nach Vereinbarung"]
  }
];

const comparisonRows = [
  ["Dokumentationsentwuerfe", "Inklusive", "Inklusive", "Inklusive"],
  ["SIS-nahe Strukturierung", "Inklusive", "Inklusive", "Inklusive"],
  ["Aktive Nutzer", "1 inklusive", "Bis 20", "Individuell"],
  ["Zusatznutzer", "30 EUR / Monat", "30 EUR / Monat", "Nach Vertrag"],
  ["Offene Einladungen", "Kostenlos", "Kostenlos", "Kostenlos"],
  ["Teamverwaltung", "Basis", "Inklusive", "Erweitert"],
  ["Onboarding", "-", "Optional", "Individuell"]
];

const faqs = [
  {
    question: "Welche Nutzer werden abgerechnet?",
    answer: "Nur aktive Nutzer zaehlen. Offene Einladungen und deaktivierte Nutzer erhoehen den monatlichen Beitrag nicht."
  },
  {
    question: "Was passiert ab 21 aktiven Nutzern?",
    answer: "Self-Service endet bei 20 aktiven Nutzern. Groessere Organisationen wechseln in einen Enterprise-Prozess."
  },
  {
    question: "Kann ein kleines Team ohne Vertrag starten?",
    answer: "Ja. Kleine Organisationen koennen sich selbst registrieren und spaeter in Team oder Enterprise wachsen."
  }
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{children}</p>;
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white text-foreground">
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
                className={`flex min-h-11 items-center rounded-lg px-3 text-sm transition-colors hover:bg-white hover:text-foreground ${
                  item.href === "/preise" ? "font-semibold text-foreground" : "text-secondary-foreground"
                }`}
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
            </div>
          </details>
        </header>
      </div>

      <section className="carevo-container py-20 text-center sm:py-28">
        <div className="mx-auto max-w-4xl">
          <h1 className="mx-auto max-w-3xl text-[36px] font-bold leading-tight text-foreground sm:text-[48px] lg:text-[56px]">
            Preise, die mit dem Team wachsen.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-secondary-foreground sm:text-lg">
            CAREVO berechnet aktive Nutzer, nicht offene Einladungen. Kleine Teams starten im Self-Service, groessere
            Organisationen wechseln in Enterprise.
          </p>
        </div>
      </section>

      <section className="bg-[#F4F4F6] py-12">
        <div className="carevo-container grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <Eyebrow>Modelle</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-foreground sm:text-5xl">Drei Wege in CAREVO.</h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name}>
                <p className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">{plan.name}</p>
                <p className="mt-4 text-[36px] font-semibold leading-none text-foreground">{plan.price}</p>
                <p className="mt-2 text-sm text-secondary-foreground">{plan.cadence}</p>
                <p className="mt-4 text-sm leading-6 text-secondary-foreground">{plan.audience}</p>
                <p className="mt-3 text-xs font-medium text-muted-foreground">{plan.note}</p>
                <Button asChild variant={plan.name === "Enterprise" ? "outline" : "default"} className="mt-6">
                  <Link href={plan.href}>
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="carevo-container py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <Eyebrow>Enthalten</Eyebrow>
            <h2 className="mt-5 carevo-h2">Weniger Paketlogik, mehr Klarheit.</h2>
            <p className="mt-5 text-lg leading-8 text-secondary-foreground">
              Die Kernfunktionen bleiben ueber die Plaene hinweg sichtbar. Unterschiede entstehen vor allem durch Teamgroesse,
              Abrechnung und Rollout.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name}>
                <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex gap-3 text-sm leading-6 text-secondary-foreground">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#1E6B72]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="carevo-container py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <Eyebrow>Vergleich</Eyebrow>
            <h2 className="mt-5 carevo-h2">Die Details auf einen Blick.</h2>
            <Link href="/demo-buchen" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              Beratung anfragen
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[1.25fr_0.8fr_0.8fr_0.8fr] bg-[#F4F4F6] px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
              <span>Funktion</span>
              <span>Starter</span>
              <span>Team</span>
              <span>Enterprise</span>
            </div>
            {comparisonRows.map((row) => (
              <div key={row[0]} className="grid grid-cols-[1.25fr_0.8fr_0.8fr_0.8fr] px-4 py-4 text-sm">
                <span className="font-medium text-foreground">{row[0]}</span>
                {row.slice(1).map((value, index) => (
                  <span key={`${row[0]}-${index}`} className="text-secondary-foreground">
                    {value === "-" ? <Minus className="h-4 w-4 text-muted-foreground" /> : value}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F4F4F6] py-16 sm:py-20">
        <div className="carevo-container grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              Fragen zu Seats und Start.
            </h2>
          </div>
          <div className="space-y-8">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-xl font-semibold text-foreground">{faq.question}</h3>
                <p className="mt-3 text-sm leading-7 text-secondary-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="carevo-container py-16 text-center sm:py-20">
        <h2 className="mx-auto max-w-3xl carevo-h2">CAREVO im echten Ablauf pruefen.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-secondary-foreground">
          Demo buchen, Workflow ansehen und mit eigenen Dokumentationsfaellen bewerten.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="px-7">
            <Link href="/demo-buchen">Demo buchen</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="px-7">
            <Link href="/signup">Self-Service starten</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
