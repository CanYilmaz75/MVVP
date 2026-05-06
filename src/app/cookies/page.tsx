import type { Metadata } from "next";
import { Cookie, Lock, Settings, Shield } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Cookie-Hinweise | CAREVO",
  description: "Hinweise zu Cookies und vergleichbaren Technologien bei CAREVO."
};

const cookieGroups = [
  {
    name: "Notwendige Cookies",
    purpose: "Login-Sitzung, Authentifizierung, Schutz geschuetzter Bereiche und technische Bereitstellung.",
    examples: "Supabase Auth Cookies mit sb-Prefix, Next.js/Sitzungs- und Sicherheitsmechanismen",
    legalBasis: "Erforderlich fuer die Bereitstellung des Dienstes"
  },
  {
    name: "Sicherheits- und Fehleranalyse",
    purpose: "Erkennung technischer Fehler, Missbrauchsschutz, Stabilitaet und Betriebssicherheit.",
    examples: "Sentry nur, wenn ENABLE_SENTRY aktiviert und final konfiguriert ist",
    legalBasis: "Berechtigtes Interesse an sicherem Betrieb, soweit zulaessig"
  },
  {
    name: "Analyse",
    purpose: "Produktmetriken und Nutzungsanalyse nur bei aktivierter Funktion und passender Rechtsgrundlage.",
    examples: "Derzeit als Feature Flag vorbereitet; vor Einsatz Anbieter und Einwilligungslogik ergaenzen",
    legalBasis: "Einwilligung oder andere zu pruefende Grundlage"
  }
];

const notes = [
  {
    title: "Keine Marketing-Cookies im aktuellen Grundaufbau",
    body:
      "Im sichtbaren Code sind keine klassischen Marketing- oder Tracking-Pixel wie gtag, PostHog oder Meta Pixel aktiv eingebunden. Falls solche Dienste spaeter hinzukommen, muessen Banner, Anbieterlisten und Einwilligungen angepasst werden."
  },
  {
    title: "Technisch notwendige Speicherung",
    body:
      "Fuer geschuetzte App-Bereiche werden Cookies verwendet, um Nutzer wiederzuerkennen und Sitzungen sicher zu halten. Ohne diese Cookies kann die Anwendung nicht ordnungsgemaess genutzt werden."
  },
  {
    title: "Browser-Einstellungen",
    body:
      "Nutzer koennen Cookies im Browser loeschen oder blockieren. Das kann dazu fuehren, dass Login, Upload, Export oder andere geschuetzte Funktionen nicht mehr funktionieren."
  },
  {
    title: "Aenderungen",
    body:
      "Diese Hinweise muessen aktualisiert werden, sobald neue Analyse-, Marketing-, Support- oder Zahlungsdienstleister eingebunden werden."
  }
];

const iconCards = [
  { label: "Login", value: "Sitzungen und geschuetzte Bereiche", icon: Lock },
  { label: "Sicherheit", value: "Missbrauchsschutz und Stabilitaet", icon: Shield },
  { label: "Einstellungen", value: "Browser kontrolliert lokale Speicherung", icon: Settings },
  { label: "Cookies", value: "Keine Marketing-Cookies im Grundaufbau", icon: Cookie }
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{children}</p>;
}

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-white text-foreground">
      <SiteHeader />

      <section className="carevo-container py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="max-w-xl">
            <Eyebrow>Cookie-Hinweise</Eyebrow>
            <h1 className="mt-5 carevo-h2">Cookies und lokale Speicherung</h1>
            <p className="mt-5 text-base leading-7 text-secondary-foreground">
              CAREVO nutzt im Grundaufbau vor allem technisch notwendige Cookies fuer Login und geschuetzte App-Bereiche.
              Analyse- oder Marketingdienste duerfen erst nach finaler Pruefung und passender Einwilligungslogik aktiv
              werden.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">Stand: Mai 2026</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {iconCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-border bg-[#F4F4F6] p-5">
                  <Icon className="h-4 w-4 text-foreground" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-secondary-foreground">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F4F4F6] py-16 sm:py-20">
        <div className="carevo-container grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <Eyebrow>Kategorien</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              Welche Speicherung vorgesehen ist.
            </h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-white">
            {cookieGroups.map((group) => (
              <div key={group.name} className="border-b border-border p-5 last:border-b-0">
                <h3 className="text-xl font-semibold text-foreground">{group.name}</h3>
                <dl className="mt-4 grid gap-4 text-sm leading-6 sm:grid-cols-3">
                  <div>
                    <dt className="font-semibold text-foreground">Zweck</dt>
                    <dd className="mt-1 text-secondary-foreground">{group.purpose}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Beispiele</dt>
                    <dd className="mt-1 text-secondary-foreground">{group.examples}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Grundlage</dt>
                    <dd className="mt-1 text-secondary-foreground">{group.legalBasis}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="carevo-container py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <Eyebrow>Hinweise</Eyebrow>
            <h2 className="mt-5 carevo-h2">Kontrolle bleibt transparent.</h2>
          </div>
          <div className="space-y-8">
            {notes.map((section) => (
              <section key={section.title}>
                <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
                <p className="mt-3 text-sm leading-7 text-secondary-foreground">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
