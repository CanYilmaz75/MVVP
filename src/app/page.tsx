import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileAudio,
  FileText,
  LockKeyhole,
  Menu,
  Mic,
  ShieldCheck,
  Sparkles,
  Workflow
} from "lucide-react";

import { CarevoWordmark } from "@/components/shared/logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "CAREVO | KI-Dokumentation fuer Pflege und Versorgung",
  description:
    "CAREVO erstellt pruefbare Dokumentationsentwuerfe aus Audio, Kontext und SIS-Informationen fuer Pflege- und Versorgungsteams."
};

const navigation: Array<{ label: string; href: `#${string}` | Route }> = [
  { label: "Produkt", href: "#produkt" },
  { label: "Workflow", href: "#workflow" },
  { label: "Sicherheit", href: "#sicherheit" },
  { label: "Preise", href: "/preise" as Route }
];

const proofPoints = [
  { value: "Audio", label: "zu strukturiertem Entwurf" },
  { value: "SIS", label: "sprach- und textgestuetzt" },
  { value: "Review", label: "vor jeder Freigabe" },
  { value: "Export", label: "erst nach Abschluss" }
];

const workflowSteps = [
  {
    title: "Aufnehmen oder hochladen",
    description: "Audio im Browser aufnehmen, Datei hochladen oder ergaenzenden Kontext erfassen.",
    icon: FileAudio
  },
  {
    title: "Entwurf erzeugen",
    description: "Transkript, Notiz und SIS-Felder werden als bearbeitbarer Entwurf vorbereitet.",
    icon: Sparkles
  },
  {
    title: "Pruefen und freigeben",
    description: "Offene Punkte pruefen, Text anpassen und den Stand explizit freigeben.",
    icon: ClipboardCheck
  },
  {
    title: "Exportieren",
    description: "Freigegebene Inhalte kopieren oder als PDF fuer die Weitergabe erzeugen.",
    icon: FileText
  }
];

const productFeatures = [
  {
    title: "Beratungsdokumentation",
    description:
      "Audio, Transkript und Zusatztexte laufen in einem Arbeitsbereich zusammen. Der Entwurf bleibt editierbar.",
    points: ["Browser-Aufnahme oder Upload", "strukturierte Entwurfsnotiz", "Bearbeitung per Text oder Sprache"],
    icon: Mic
  },
  {
    title: "SIS-Unterstuetzung",
    description:
      "Pflegegespraeche werden in Themenfelder, Ressourcen, Risiken und Massnahmen vorsortiert.",
    points: ["sechs SIS-Themenfelder", "Risiko- und Review-Hinweise", "kopierbare Zusammenfassung"],
    icon: Workflow
  },
  {
    title: "Team- und Exportfluss",
    description:
      "Dashboard, Vorlagen und Exporte zeigen, was offen ist, was freigegeben wurde und was weitergegeben werden kann.",
    points: ["offene Entwuerfe sichtbar", "Freigabe vor Export", "Exportverlauf fuer Nachvollziehbarkeit"],
    icon: BadgeCheck
  }
];

const securityItems = [
  {
    title: "Geschuetzte Bereiche",
    description: "Dokumentationsdaten liegen hinter Login, Organisation und geschuetzten App-Bereichen.",
    icon: ShieldCheck
  },
  {
    title: "Private Dateiwege",
    description: "Audio-Uploads und Exporte sind auf kontrollierte Speicherung und begrenzte Zugriffe ausgelegt.",
    icon: LockKeyhole
  },
  {
    title: "Auditierbare Schritte",
    description: "Erstellung, Bearbeitung, Freigabe und Export sind als nachvollziehbare Schritte angelegt.",
    icon: BadgeCheck
  },
  {
    title: "Menschliche Freigabe",
    description: "CAREVO erstellt Entwuerfe. Die finale Verantwortung bleibt sichtbar beim Team.",
    icon: Check
  }
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{children}</p>;
}

function ProductMockup() {
  const transcriptLines = [
    "Bewohnerin berichtet ueber unsicheren Transfer am Morgen.",
    "Tochter nennt neue Stolpersituation im Bad.",
    "Pflegekraft ergaenzt: Rollator wird im Zimmer genutzt."
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-subtle">
      <div className="rounded-lg border border-border bg-[#F4F4F6]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A0A0F] text-white">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Pflegeberatung / SIS</p>
              <p className="text-xs text-muted-foreground">Audio bereit zur Strukturierung</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-secondary-foreground sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#1E6B72]" />
            Review offen
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border-b border-border bg-white p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Transkript</p>
              <span className="rounded-lg bg-[#F4F4F6] px-2 py-1 text-xs text-secondary-foreground">03:42</span>
            </div>
            <div className="mt-5 space-y-4">
              {transcriptLines.map((line, index) => (
                <div key={line} className="flex gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-border text-xs text-muted-foreground">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-secondary-foreground">{line}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Naechster Schritt</p>
              <p className="mt-2 text-sm font-medium text-foreground">Entwurf generieren und offene Punkte pruefen</p>
            </div>
          </div>

          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Notizentwurf</p>
                <h3 className="mt-3 text-lg font-semibold text-foreground">Transfer und Wohnumfeld</h3>
                <div className="mt-4 space-y-2">
                  <div className="h-2 rounded-full bg-[#D8E7E9]" />
                  <div className="h-2 w-10/12 rounded-full bg-[#E8E8EC]" />
                  <div className="h-2 w-8/12 rounded-full bg-[#E8E8EC]" />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">SIS-Feld</p>
                <h3 className="mt-3 text-lg font-semibold text-foreground">Mobilitaet</h3>
                <p className="mt-3 text-sm leading-6 text-secondary-foreground">
                  Ressourcen vorhanden, Hilfsmittel pruefen, Bad-Situation klaeren.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-white p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Review</p>
                  <p className="mt-2 text-sm text-secondary-foreground">2 offene Hinweise vor Freigabe</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-secondary-foreground sm:min-w-56">
                  <span className="rounded-lg border border-border px-3 py-2">Validieren</span>
                  <span className="rounded-lg border border-border px-3 py-2">Freigeben</span>
                  <span className="rounded-lg border border-border px-3 py-2">Kopieren</span>
                  <span className="rounded-lg border border-border px-3 py-2">PDF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-foreground">
      <div className="bg-white">
        <div className="carevo-container flex min-h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <CarevoWordmark subline="" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navigation.map((item) =>
              item.href.startsWith("/") ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm text-secondary-foreground transition-colors hover:bg-white hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm text-secondary-foreground transition-colors hover:bg-white hover:text-foreground"
                >
                  {item.label}
                </a>
              )
            )}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Button asChild variant="ghost" className="hover:bg-white">
              <Link href="/dashboard">Zur App</Link>
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
              {navigation.map((item) =>
                item.href.startsWith("/") ? (
                  <Link key={item.label} href={item.href} className="flex min-h-11 items-center rounded-lg px-3 text-sm">
                    {item.label}
                  </Link>
                ) : (
                  <a key={item.label} href={item.href} className="flex min-h-11 items-center rounded-lg px-3 text-sm">
                    {item.label}
                  </a>
                )
              )}
              <div className="mt-2 grid gap-2 pt-2">
                <Button asChild variant="outline">
                  <Link href="/dashboard">Zur App</Link>
                </Button>
                <Button asChild>
                  <Link href="/demo-buchen">Demo buchen</Link>
                </Button>
              </div>
            </div>
          </details>
        </div>
      </div>

      <section className="carevo-container bg-white py-20 text-center sm:py-28 lg:py-32">
        <div className="mx-auto max-w-4xl">
            <h1 className="mx-auto max-w-3xl text-[36px] font-bold leading-tight text-foreground sm:text-[48px] lg:text-[56px]">
              Ihr KI-Assistent fuer weniger Dokumentation.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-secondary-foreground sm:text-lg">
              CAREVO verwandelt Pflegegespraeche, Audio und Kontext in pruefbare Entwuerfe. So bleibt mehr Zeit fuer
              Versorgung, Abstimmung und Freigabe.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="px-7">
                <Link href="/demo-buchen">
                  Demo buchen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-7">
                <Link href="/dashboard">Zur App</Link>
              </Button>
            </div>
        </div>
      </section>

      <section className="bg-[#F4F4F6] py-10 sm:py-12">
        <div className="carevo-container">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {proofPoints.map((item) => (
              <div key={item.value}>
                <p className="text-3xl font-semibold text-foreground">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-secondary-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="carevo-container bg-white py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <Eyebrow>Workflow</Eyebrow>
            <h2 className="mt-5 carevo-h2">Vier Schritte, keine Show.</h2>
            <p className="mt-5 text-lg leading-8 text-secondary-foreground">
              Die Startseite zeigt jetzt den Kern des Produkts: erfassen, strukturieren, pruefen, weitergeben.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#F4F4F6]">
                    <Icon className="h-5 w-5 text-[#1E6B72]" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-secondary-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="produkt" className="carevo-container bg-white py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <ProductMockup />
          <div>
            <Eyebrow>Produkt im Ablauf</Eyebrow>
            <h2 className="mt-5 carevo-h2">Die wichtigen Flaechen zuerst.</h2>
            <div className="mt-8 space-y-8">
              {productFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title}>
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-[#1E6B72]" />
                      <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                    </div>
                    <p className="mt-3 text-base leading-7 text-secondary-foreground">{feature.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {feature.points.map((point) => (
                        <span key={point} className="rounded-lg bg-[#F4F4F6] px-3 py-2 text-xs font-medium text-secondary-foreground">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="sicherheit" className="carevo-container bg-white py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Sicherheit & Kontrolle</Eyebrow>
            <h2 className="mt-5 carevo-h2">Kontrolle bleibt im Workflow sichtbar.</h2>
            <p className="mt-5 text-lg leading-8 text-secondary-foreground">
              CAREVO macht keine Zertifizierungsversprechen auf der Startseite. Gezeigt werden die Kontrollpunkte, die
              bereits im Produkt angelegt sind.
            </p>
          </div>
          <div className="space-y-4">
            {securityItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="grid gap-4 py-2 sm:grid-cols-[auto_1fr]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-card">
                    <Icon className="h-5 w-5 text-[#1E6B72]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-secondary-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="carevo-container bg-white py-16 sm:py-20">
        <div className="grid gap-8 rounded-lg border border-border bg-card p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <Eyebrow>Referenzen</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              Eine gute Referenz reicht, wenn sie echt ist.
            </h2>
          </div>
          <div className="lg:pl-8">
            <p className="text-xl leading-8 text-foreground">
              Bis freigegebene Kundenaussagen vorliegen, bleibt dieser Bereich knapp. Keine erfundenen Stimmen, keine
              Logo-Wand, keine kuenstliche Beweisfuehrung.
            </p>
            <Link href="/demo-buchen" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              Demo-Gespraech planen
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="carevo-container bg-white py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <Eyebrow>Starten</Eyebrow>
            <h2 className="mt-5 carevo-h2">CAREVO im echten Ablauf pruefen.</h2>
            <p className="mt-5 text-lg leading-8 text-secondary-foreground">
              Demo buchen, Workflow ansehen, mit eigenen Dokumentationsfaellen bewerten.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button asChild size="lg" className="px-7">
              <Link href="/demo-buchen">Demo buchen</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-7">
              <Link href="/dashboard">Zur App</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
