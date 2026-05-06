import type { Metadata } from "next";
import { Building2, CreditCard, FileCheck, ShieldCheck } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "AGB | CAREVO",
  description: "Allgemeine Geschaeftsbedingungen und Nutzungsbedingungen fuer CAREVO."
};

const highlights = [
  { label: "Zielgruppe", value: "B2B SaaS fuer Pflege- und Versorgungsteams", icon: Building2 },
  { label: "Leistungsbild", value: "Dokumentationsworkflow, KI-Entwurf, Review, Export", icon: FileCheck },
  { label: "Abrechnung", value: "Self-Service oder Enterprise-Vertrag nach Teamgroesse", icon: CreditCard },
  { label: "Verantwortung", value: "Menschliche Pruefung vor fachlicher Nutzung", icon: ShieldCheck }
];

const terms = [
  {
    title: "1. Geltungsbereich",
    body:
      "Diese AGB gelten fuer die Nutzung von CAREVO durch Unternehmen, Pflegeeinrichtungen, ambulante Dienste, Traeger und sonstige berufliche Nutzer. Verbraucherangebote sind nicht vorgesehen, sofern nicht ausdruecklich anders vereinbart."
  },
  {
    title: "2. Vertragspartner",
    body:
      "Vertragspartner ist [CAREVO Rechtstraeger mit Anschrift eintragen]. Kunden handeln durch ihre vertretungsberechtigten Personen oder autorisierte Administratoren."
  },
  {
    title: "3. Leistungsgegenstand",
    body:
      "CAREVO stellt eine webbasierte Anwendung fuer Dokumentationsablaeufe bereit. Funktionen koennen insbesondere Audioaufnahme oder Upload, Transkription, KI-gestuetzte Entwurfserstellung, SIS-nahe Strukturierung, Review, Freigabe, Teamverwaltung und Export umfassen."
  },
  {
    title: "4. Kein Ersatz fachlicher Verantwortung",
    body:
      "CAREVO erzeugt technische Vorschlaege und Dokumentationsentwuerfe. Die fachliche, pflegerische, medizinische, organisatorische und rechtliche Pruefung sowie die finale Freigabe liegen ausschliesslich beim Kunden und seinen Nutzern."
  },
  {
    title: "5. Registrierung und Nutzerkonten",
    body:
      "Nutzer muessen zutreffende Angaben machen, Zugangsdaten geheim halten und Konten nur im Rahmen ihrer Berechtigung verwenden. Administratoren sind fuer Einladungen, Rollen, Aktivierung und Deaktivierung von Nutzern verantwortlich."
  },
  {
    title: "6. Preise und Zahlung",
    body:
      "Es gelten die zum Vertragsschluss angezeigten Preise oder individuell vereinbarte Enterprise-Konditionen. Self-Service-Preise koennen aktive Nutzer, Grundpreise und Zusatznutzer beruecksichtigen. Zahlungsfristen, Rechnungsstellung und Steuern muessen vor Go-live final ergaenzt werden."
  },
  {
    title: "7. Laufzeit und Kuendigung",
    body:
      "Laufzeit, Verlaengerung und Kuendigung richten sich nach dem gewaehlten Tarif oder dem individuellen Vertrag. Fuer Enterprise-Kunden gelten vorrangig die schriftlich vereinbarten Regelungen."
  },
  {
    title: "8. Verfuegbarkeit und Wartung",
    body:
      "CAREVO wird mit angemessener Sorgfalt betrieben. Geplante Wartung, Sicherheitsupdates oder Stoerungen koennen die Verfuegbarkeit zeitweise beeinflussen. Konkrete Service Level muessen fuer Enterprise-Kunden gesondert vereinbart werden."
  },
  {
    title: "9. Pflichten des Kunden",
    body:
      "Der Kunde ist fuer rechtmaessige Datenerhebung, Informationspflichten gegenueber Betroffenen, Einwilligungen, interne Berechtigungen, fachliche Freigaben und die Einhaltung berufs- oder einrichtungsbezogener Vorgaben verantwortlich."
  },
  {
    title: "10. Datenschutz und Auftragsverarbeitung",
    body:
      "Soweit CAREVO personenbezogene Daten im Auftrag verarbeitet, ist ein Vertrag zur Auftragsverarbeitung abzuschliessen. Details ergeben sich aus Datenschutzhinweisen, AVV und TOM."
  },
  {
    title: "11. Nutzungsrechte",
    body:
      "Kunden erhalten fuer die Vertragslaufzeit ein einfaches, nicht uebertragbares Recht zur Nutzung der Anwendung im vereinbarten Umfang. Rechte an Software, Marken, Designs und Dokumentation verbleiben beim Anbieter."
  },
  {
    title: "12. Unzulaessige Nutzung",
    body:
      "Unzulaessig sind insbesondere missbraeuchliche Zugriffe, Umgehung von Sicherheitsfunktionen, Verarbeitung rechtswidriger Inhalte, Weitergabe von Zugangsdaten und Nutzung ausserhalb vereinbarter Organisationsgrenzen."
  },
  {
    title: "13. Haftung",
    body:
      "Die Haftung richtet sich nach den gesetzlichen Vorschriften, soweit nicht wirksam abweichend vereinbart. Fuer einfache Fahrlaessigkeit kann die Haftung im unternehmerischen Verkehr auf vertragstypische, vorhersehbare Schaeden begrenzt werden. Zwingende Haftung bleibt unberuehrt."
  },
  {
    title: "14. Aenderungen",
    body:
      "Aenderungen dieser Bedingungen werden Kunden in geeigneter Weise mitgeteilt. Wesentliche Aenderungen gelten nur, soweit sie rechtlich zulaessig sind oder vereinbart werden."
  },
  {
    title: "15. Schlussbestimmungen",
    body:
      "Es gilt deutsches Recht. Gerichtsstand und salvatorische Regelungen muessen passend zur finalen Gesellschaftsform und Kundenstruktur ergaenzt werden."
  }
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{children}</p>;
}

export default function AgbPage() {
  return (
    <main className="min-h-screen bg-white text-foreground">
      <SiteHeader />

      <section className="carevo-container py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="max-w-xl">
            <Eyebrow>Nutzungsbedingungen</Eyebrow>
            <h1 className="mt-5 carevo-h2">Allgemeine Geschaeftsbedingungen</h1>
            <p className="mt-5 text-base leading-7 text-secondary-foreground">
              Grundlage fuer die Nutzung von CAREVO durch berufliche Kunden. Diese Vorlage muss vor produktiver Nutzung
              an Rechtsform, Zahlungsmodell, Laufzeiten und Enterprise-Vertraege angepasst werden.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">Stand: Mai 2026</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => {
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
            <Eyebrow>Bedingungen</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              Vertraglich klar gerahmt.
            </h2>
          </div>
          <div className="space-y-8">
            {terms.map((section) => (
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
