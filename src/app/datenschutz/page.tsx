import type { Metadata } from "next";
import { Database, FileText, LockKeyhole, UserCheck } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Datenschutz | CAREVO",
  description: "Datenschutzhinweise zu CAREVO, verarbeiteten Daten, Rechtsgrundlagen und Betroffenenrechten."
};

const quickFacts = [
  {
    label: "Verantwortlicher",
    value: "[CAREVO Rechtstraeger, Anschrift und Kontakt vor Go-live eintragen]",
    icon: UserCheck
  },
  {
    label: "Datenschutzkontakt",
    value: "[datenschutz@carevo.example oder Datenschutzbeauftragte Person eintragen]",
    icon: LockKeyhole
  },
  {
    label: "Hosting und Auth",
    value: "Supabase, serverseitige Anwendung, geschuetzte Organisationsbereiche",
    icon: Database
  },
  {
    label: "KI-Verarbeitung",
    value: "OpenAI API fuer Transkription, Strukturierung und Entwurfsunterstuetzung",
    icon: FileText
  }
];

const privacySections = [
  {
    title: "1. Verantwortlicher",
    body:
      "Verantwortlich fuer diese Website und die CAREVO-Anwendung ist [vollstaendige Firmierung, Rechtsform, Anschrift, Vertretungsberechtigte und Kontakt eintragen]."
  },
  {
    title: "2. Datenschutzkontakt",
    body:
      "Bei Fragen zum Datenschutz erreichen Sie uns unter [E-Mail eintragen]. Falls ein Datenschutzbeauftragter benannt ist, muessen Name oder Kontaktweg hier ergaenzt werden."
  },
  {
    title: "3. Verarbeitete Daten",
    body:
      "Wir verarbeiten insbesondere Accountdaten, Organisationsdaten, Rollen, Teammitgliedschaften, Protokoll- und Sicherheitsdaten, Abrechnungsinformationen sowie Inhalte, die Nutzer in Beratungs-, Pflege- oder Versorgungsablaeufen erfassen. Dazu koennen Audio, Transkripte, Freitext, Dokumentationsentwuerfe, SIS-nahe Inhalte und Exportdaten gehoeren."
  },
  {
    title: "4. Besondere Kategorien personenbezogener Daten",
    body:
      "CAREVO kann im Kundeneinsatz Gesundheitsdaten und pflegebezogene Informationen verarbeiten. Diese Verarbeitung setzt eine passende Rechtsgrundlage, klare Rollenverteilung und vertragliche Regelungen zwischen Kunde und Anbieter voraus."
  },
  {
    title: "5. Zwecke der Verarbeitung",
    body:
      "Die Daten werden verarbeitet, um Nutzer zu authentifizieren, Organisationen zu verwalten, Dokumentationsablaeufe bereitzustellen, Audio und Texte in pruefbare Entwuerfe zu ueberfuehren, Freigaben und Exporte nachvollziehbar zu protokollieren, Support zu leisten, Sicherheit zu ueberwachen und Abrechnung zu ermoeglichen."
  },
  {
    title: "6. Rechtsgrundlagen",
    body:
      "Je nach Nutzung erfolgt die Verarbeitung auf Grundlage von Vertragserfuellung, berechtigten Interessen, gesetzlichen Pflichten, Einwilligungen oder, bei Gesundheitsdaten, einer gesondert zu pruefenden Grundlage nach Art. 9 DSGVO. Kunden bleiben fuer ihre eigene fachliche und rechtliche Nutzung verantwortlich."
  },
  {
    title: "7. Dienstleister und Empfaenger",
    body:
      "Wir setzen technische Dienstleister ein, insbesondere Hosting, Authentifizierung, Speicherung, Fehleranalyse, KI-Verarbeitung und gegebenenfalls Abrechnung. Die konkrete Liste der Unterauftragsverarbeiter muss vor Go-live mit Anbieter, Sitz, Zweck und Transfergrundlage ergaenzt werden."
  },
  {
    title: "8. Drittlanduebermittlungen",
    body:
      "Soweit Dienstleister ausserhalb der EU/des EWR eingesetzt werden oder Fernzugriffe aus Drittlaendern moeglich sind, werden geeignete Garantien wie EU-Standardvertragsklauseln, Angemessenheitsbeschluesse oder zusaetzliche Schutzmassnahmen geprueft und dokumentiert."
  },
  {
    title: "9. Speicherdauer und Loeschung",
    body:
      "Daten werden nur so lange gespeichert, wie dies fuer Vertrag, Betrieb, Nachweis, Sicherheit, Abrechnung oder gesetzliche Pflichten erforderlich ist. Fachliche Aufbewahrungs- und Loeschfristen muessen je Kunde und Versorgungskontext festgelegt werden."
  },
  {
    title: "10. Cookies und lokale Speicherung",
    body:
      "CAREVO verwendet technisch notwendige Cookies und vergleichbare Speichertechnologien, insbesondere fuer Login-Sitzungen und Schutz geschuetzter Bereiche. Weitere Details stehen in den Cookie-Hinweisen."
  },
  {
    title: "11. Sicherheit",
    body:
      "CAREVO nutzt technische und organisatorische Schutzmassnahmen wie geschuetzte Bereiche, rollenbasierte Zugriffe, Protokollierung, getrennte Organisationsdaten und kontrollierte Speicherwege. Die konkreten TOM werden im AVV/TOM-Bereich beschrieben."
  },
  {
    title: "12. Betroffenenrechte",
    body:
      "Betroffene Personen haben nach Massgabe der DSGVO Rechte auf Auskunft, Berichtigung, Loeschung, Einschraenkung der Verarbeitung, Datenuebertragbarkeit, Widerspruch und Beschwerde bei einer Aufsichtsbehoerde."
  },
  {
    title: "13. Aenderungen",
    body:
      "Diese Datenschutzhinweise koennen angepasst werden, wenn sich Produkt, Dienstleister, Rechtslage oder Verarbeitungsvorgaenge aendern."
  }
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{children}</p>;
}

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-white text-foreground">
      <SiteHeader />

      <section className="carevo-container py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="max-w-xl">
            <Eyebrow>Datenschutz</Eyebrow>
            <h1 className="mt-5 carevo-h2">Datenschutzhinweise</h1>
            <p className="mt-5 text-base leading-7 text-secondary-foreground">
              Diese Hinweise beschreiben die vorgesehenen Datenverarbeitungen fuer Website und CAREVO-Anwendung. Vor
              dem Go-live muessen Verantwortlicher, Dienstleister, Transfergrundlagen und Aufbewahrungsfristen final
              geprueft und ergaenzt werden.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">Stand: Mai 2026</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {quickFacts.map((item) => {
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
            <Eyebrow>Pflichtinformationen</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              Verarbeitung nachvollziehbar erklaert.
            </h2>
          </div>
          <div className="space-y-8">
            {privacySections.map((section) => (
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
