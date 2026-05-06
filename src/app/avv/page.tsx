import type { Metadata } from "next";
import { ClipboardCheck, Database, KeyRound, ServerCog } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "AVV und TOM | CAREVO",
  description: "Hinweise zu Auftragsverarbeitung und technischen und organisatorischen Massnahmen bei CAREVO."
};

const avvFacts = [
  { label: "Rolle", value: "CAREVO als Auftragsverarbeiter, Kunde als Verantwortlicher", icon: ClipboardCheck },
  { label: "Datenarten", value: "Account-, Organisations-, Audio-, Transkript-, Dokumentations- und Auditdaten", icon: Database },
  { label: "Technik", value: "Mandantentrennung, Zugriffsschutz, Protokollierung, private Speicherwege", icon: ServerCog },
  { label: "Zugriff", value: "Rollen, Organisationen und geschuetzte App-Bereiche", icon: KeyRound }
];

const avvSections = [
  {
    title: "1. Zweck der Auftragsverarbeitung",
    body:
      "CAREVO verarbeitet personenbezogene Daten, um Kunden Dokumentationsablaeufe, Teamverwaltung, KI-gestuetzte Entwurfserstellung, Speicherung, Freigabe, Export und Support bereitzustellen."
  },
  {
    title: "2. Rollenverteilung",
    body:
      "Der Kunde ist in der Regel Verantwortlicher fuer die Daten seiner Betroffenen, Mitarbeitenden und Organisation. CAREVO handelt hinsichtlich der verarbeiteten Kundendaten als Auftragsverarbeiter, soweit keine eigene Verantwortlichkeit besteht."
  },
  {
    title: "3. Kategorien betroffener Personen",
    body:
      "Betroffen sein koennen Nutzer, Mitarbeitende des Kunden, Pflegebeduerftige, Angehoerige, Kontaktpersonen und weitere Personen, die in Dokumentationsablaeufen genannt werden."
  },
  {
    title: "4. Kategorien personenbezogener Daten",
    body:
      "Verarbeitet werden koennen Identifikations- und Kontaktdaten, Accountdaten, Rollen, Audioinhalte, Transkripte, Freitexte, Pflege- und Gesundheitsinformationen, SIS-nahe Inhalte, Metadaten, Auditlogs und Exportdaten."
  },
  {
    title: "5. Weisungen",
    body:
      "CAREVO verarbeitet Kundendaten grundsaetzlich nur auf dokumentierte Weisung des Kunden, soweit keine gesetzliche Pflicht entgegensteht. Produktkonfiguration, Nutzung der Anwendung und Supportanfragen koennen Weisungen konkretisieren."
  },
  {
    title: "6. Unterauftragsverarbeiter",
    body:
      "Unterauftragsverarbeiter muessen vor Go-live final gelistet werden. Erwartete Kategorien sind Hosting, Datenbank, Storage, Authentifizierung, KI-Verarbeitung, Fehleranalyse und gegebenenfalls Abrechnung."
  },
  {
    title: "7. Technische und organisatorische Massnahmen",
    body:
      "Zu den vorgesehenen Massnahmen gehoeren Zugriffskontrolle, rollenbasierte Berechtigungen, Organisationsgrenzen, geschuetzte Speicherbereiche, Auditlogs, Transportverschluesselung, kontrollierte Admin-Zugriffe, Backup- und Wiederherstellungsprozesse sowie Incident-Prozesse."
  },
  {
    title: "8. Loeschung und Rueckgabe",
    body:
      "Nach Vertragsende werden Kundendaten nach Weisung geloescht oder in geeigneter Form bereitgestellt, soweit keine gesetzlichen Pflichten oder berechtigten Nachweiszwecke entgegenstehen. Konkrete Fristen muessen vertraglich festgelegt werden."
  },
  {
    title: "9. Unterstuetzung des Kunden",
    body:
      "CAREVO unterstuetzt Kunden im erforderlichen Umfang bei Betroffenenrechten, Sicherheitsvorfaellen, Datenschutz-Folgenabschaetzungen und Nachweisen, soweit die Informationen im Verantwortungsbereich von CAREVO liegen."
  },
  {
    title: "10. Audit und Nachweise",
    body:
      "Kunden erhalten angemessene Nachweise zur Einhaltung der vereinbarten Massnahmen. Umfang, Form und Frequenz von Audits muessen im finalen AVV geregelt werden."
  }
];

const tomRows = [
  ["Zugriffskontrolle", "Login, Supabase Auth, geschuetzte Routen, Rollen und Organisationskontext"],
  ["Zugangskontrolle", "Private Storage-Pfade, service role nur serverseitig, RLS-Policies und API-Kontext"],
  ["Weitergabekontrolle", "Kontrollierte Exporte, Auditlogs, keine oeffentlichen Audio- oder PDF-Pfade"],
  ["Eingabekontrolle", "Protokollierung von Erstellung, Bearbeitung, Freigabe, Export und Teamaktionen"],
  ["Mandantentrennung", "Organisation-ID in Datenmodell, RLS und serverseitiger Auth-Kontext"],
  ["Verfuegbarkeit", "Backup-, Restore-, Monitoring- und Incident-Prozesse laut Compliance-Dokumentation finalisieren"],
  ["Datenschutz by Design", "Freigabe vor Export, Entwuerfe statt automatische Enddokumentation, klare Nutzerverantwortung"]
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{children}</p>;
}

export default function AvvPage() {
  return (
    <main className="min-h-screen bg-white text-foreground">
      <SiteHeader />

      <section className="carevo-container py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="max-w-xl">
            <Eyebrow>Auftragsverarbeitung</Eyebrow>
            <h1 className="mt-5 carevo-h2">AVV und TOM</h1>
            <p className="mt-5 text-base leading-7 text-secondary-foreground">
              Uebersicht fuer Kunden, die CAREVO mit personenbezogenen oder gesundheitsbezogenen Daten einsetzen. Der
              finale AVV muss als Vertrag mit konkreten Parteien, Unterauftragsverarbeitern und Fristen abgeschlossen
              werden.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">Stand: Mai 2026</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {avvFacts.map((item) => {
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
            <Eyebrow>AVV-Struktur</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              Was vertraglich geregelt wird.
            </h2>
          </div>
          <div className="space-y-8">
            {avvSections.map((section) => (
              <section key={section.title}>
                <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
                <p className="mt-3 text-sm leading-7 text-secondary-foreground">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="carevo-container py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <Eyebrow>TOM</Eyebrow>
            <h2 className="mt-5 carevo-h2">Technische und organisatorische Massnahmen.</h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            {tomRows.map((row) => (
              <div key={row[0]} className="grid gap-2 border-b border-border px-5 py-5 last:border-b-0 sm:grid-cols-[0.35fr_0.65fr]">
                <p className="text-sm font-semibold text-foreground">{row[0]}</p>
                <p className="text-sm leading-6 text-secondary-foreground">{row[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
