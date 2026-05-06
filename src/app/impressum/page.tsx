import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Impressum | CAREVO",
  description: "Anbieterkennzeichnung, Kontaktangaben und rechtliche Hinweise fuer CAREVO."
};

const companyDetails = [
  { label: "Anbieter", value: "CAREVO [Rechtsform vor Go-live eintragen]" },
  { label: "Anschrift", value: "[Strasse und Hausnummer], [PLZ Ort], Deutschland" },
  { label: "Vertreten durch", value: "[Vertretungsberechtigte Person eintragen]" },
  { label: "Registereintrag", value: "[Registergericht und Registernummer eintragen, falls vorhanden]" },
  { label: "Umsatzsteuer-ID", value: "[USt-ID gemaess § 27a UStG eintragen, falls vorhanden]" }
];

const contactDetails = [
  { label: "E-Mail", value: "[kontakt@carevo.example]", icon: Mail },
  { label: "Telefon", value: "[Telefonnummer eintragen]", icon: Phone },
  { label: "Sitz", value: "[Ort eintragen]", icon: MapPin }
];

const legalSections = [
  {
    title: "Verantwortlich fuer den Inhalt",
    body: "[Name und Anschrift der inhaltlich verantwortlichen Person eintragen, falls abweichend vom Anbieter.]"
  },
  {
    title: "Zustaendige Aufsichtsbehoerde",
    body:
      "Sollte CAREVO im Rahmen einer erlaubnis- oder aufsichtsbeduerftigen Taetigkeit angeboten werden, muessen hier die zustaendige Behoerde und die relevanten Angaben ergaenzt werden."
  },
  {
    title: "Berufsrechtliche Angaben",
    body:
      "Falls fuer den Anbieter besondere berufsrechtliche Regelungen gelten, muessen Berufsbezeichnung, Kammer, Staat der Verleihung und die einschlaegigen Regelungen aufgenommen werden."
  },
  {
    title: "Verbraucherstreitbeilegung",
    body:
      "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Bitte vor Go-live pruefen, ob diese Angabe fuer eure konkrete Organisation zutrifft."
  },
  {
    title: "Haftung fuer Inhalte",
    body:
      "Die Inhalte dieser Website werden mit Sorgfalt erstellt. Fuer Richtigkeit, Vollstaendigkeit und Aktualitaet der Inhalte kann jedoch keine Gewaehr uebernommen werden. Gesetzliche Verpflichtungen zur Entfernung oder Sperrung von Informationen bleiben unberuehrt."
  },
  {
    title: "Haftung fuer Links",
    body:
      "Diese Website kann Links zu externen Websites enthalten. Fuer deren Inhalte sind ausschliesslich die jeweiligen Anbieter verantwortlich. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar."
  },
  {
    title: "Urheberrecht",
    body:
      "Die auf dieser Website erstellten Inhalte, Texte, Markenbestandteile und Gestaltungen unterliegen dem deutschen Urheberrecht. Nutzung, Vervielfaeltigung oder Bearbeitung ausserhalb gesetzlicher Grenzen beduerfen einer vorherigen Zustimmung."
  },
  {
    title: "Medizinischer und pflegerischer Hinweis",
    body:
      "CAREVO stellt technische Werkzeuge fuer Dokumentationsablaeufe bereit. Inhalte auf dieser Website ersetzen keine medizinische, pflegerische, rechtliche oder organisatorische Einzelfallpruefung."
  }
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{children}</p>;
}

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-white text-foreground">
      <SiteHeader />

      <section className="carevo-container py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="max-w-xl">
            <Eyebrow>Anbieterkennzeichnung</Eyebrow>
            <h1 className="mt-5 carevo-h2">Impressum</h1>
            <p className="mt-5 text-base leading-7 text-secondary-foreground">
              Angaben gemaess den Informationspflichten fuer digitale Dienste. Die markierten Felder muessen vor dem
              produktiven Einsatz mit den tatsaechlichen Unternehmensdaten abgeglichen und ersetzt werden.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">Stand: Mai 2026</p>
          </div>

          <div className="rounded-lg border border-border bg-[#F4F4F6] p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {contactDetails.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="min-w-0">
                    <Icon className="h-4 w-4 text-foreground" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-secondary-foreground">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F4F6] py-16 sm:py-20">
        <div className="carevo-container grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <Eyebrow>Angaben</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              Rechtliche Basisdaten.
            </h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-white">
            {companyDetails.map((item) => (
              <div key={item.label} className="grid gap-2 border-b border-border px-5 py-5 last:border-b-0 sm:grid-cols-[0.38fr_0.62fr]">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-sm leading-6 text-secondary-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="carevo-container py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <Eyebrow>Hinweise</Eyebrow>
            <h2 className="mt-5 carevo-h2">Transparenz und Verantwortlichkeit.</h2>
            <p className="mt-5 text-base leading-7 text-secondary-foreground">
              Diese Inhalte bilden eine belastbare Struktur fuer den Webauftritt. Die finale Fassung sollte vor
              Veroeffentlichung juristisch geprueft werden.
            </p>
          </div>

          <div className="space-y-8">
            {legalSections.map((section) => (
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
