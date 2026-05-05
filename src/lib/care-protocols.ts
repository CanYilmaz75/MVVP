export const CARE_PROTOCOLS = [
  {
    slug: "vital_signs",
    label: "Vitalzeichenprotokoll",
    guidance:
      "Erfasse Blutdruck, Puls, Temperatur, Atmung, SpO2, Bewusstsein/Allgemeinzustand, Messzeitpunkt, Anlass, Abweichungen, eingeleitete Massnahmen und offene Kontrollfragen."
  },
  {
    slug: "pain",
    label: "Schmerzprotokoll",
    guidance:
      "Orientiere dich am DNQP-Schmerzmanagement: Schmerzort, Intensitaet mit geeigneter Skala wie NRS/VAS oder Beobachtungsskala, Schmerzqualitaet, Ausloeser, Einschraenkungen, Massnahme, Wirkung, Nebenwirkungen und naechste Evaluation nachvollziehbar dokumentieren."
  },
  {
    slug: "fall",
    label: "Sturzprotokoll",
    guidance:
      "Orientiere dich am DNQP-Expertenstandard Sturzprophylaxe: Zeitpunkt, Ort, Hergang, moegliche Ursachen, Folgen, Vital-/Schmerz-/Verletzungszeichen, informierte Personen, eingeleitete Massnahmen und Anpassungsbedarf der Risikoeinschaetzung dokumentieren."
  },
  {
    slug: "pressure_ulcer_positioning",
    label: "Dekubitus-/Lagerungsprotokoll",
    guidance:
      "Orientiere dich an der DNQP-Dekubitusprophylaxe: Risiko, Hautzustand, gefaehrdete Stellen, Lagerung/Mobilisation, Hilfsmittel, Druckentlastung, Hautpflege, Ressourcen, Evaluation und offene Fragen zum individuellen Bewegungs-/Lagerungsplan aufnehmen."
  },
  {
    slug: "wound",
    label: "Wunddokumentation",
    guidance:
      "Orientiere dich am DNQP-Standard Pflege von Menschen mit chronischen Wunden: Wundart, Lokalisation, Groesse, Tiefe, Wundrand, Wundgrund/Belag, Exsudat, Geruch, Schmerz, Umgebungshaut, Verband, Verlauf, Selbstmanagement/Anleitung und ggf. Foto-Hinweis dokumentieren."
  },
  {
    slug: "medication",
    label: "Medikamentennachweis",
    guidance:
      "Dokumentiere aerztliche Anordnung, Medikament, Dosierung, Zeitpunkt, Applikationsform, Durchfuehrung, Wirkung/Besonderheiten, Nichtgabe mit Grund und erforderliche Ruecksprache nachvollziehbar."
  },
  {
    slug: "blood_glucose_insulin",
    label: "Blutzucker-/Insulinprotokoll",
    guidance:
      "Dokumentiere Messwert, Messzeitpunkt, Mahlzeitenbezug, Insulintyp, Dosis, Korrekturschema, Hypo-/Hyperglykaemiezeichen, Massnahmen und Kontrollbedarf."
  },
  {
    slug: "nutrition_hydration",
    label: "Trink-/Essprotokoll",
    guidance:
      "Orientiere dich am DNQP-Ernaehrungsmanagement: Anlass/Risiko, Trink- und Essmengen, Schluck-/Kauprobleme, Vorlieben, Gewichts-/Exsikkosehinweise, Unterstuetzung, Bilanzbedarf und offene Fragen zur Indikation dokumentieren."
  },
  {
    slug: "elimination",
    label: "Ausscheidungsprotokoll",
    guidance:
      "Orientiere dich bei Kontinenzthemen am DNQP-Standard Kontinenzfoerderung: Urin/Stuhl, Zeitpunkt, Menge/Beschaffenheit, Inkontinenz, Schmerzen, Obstipation/Diarrhoe, Katheter, Bilanzierung, Hilfsmittel und Anpassungsbedarf dokumentieren."
  },
  {
    slug: "hygiene",
    label: "Hygieneprotokolle",
    guidance:
      "Hygiene ist einrichtungsspezifisch nach Hygieneplan zu dokumentieren. Beruecksichtige IfSG-Pflichten und KRINKO/RKI-Empfehlungen: Reinigung, Desinfektion, Haendehygiene, Isolation/MRE, Medizinprodukte, Sterilgut, Kuehlung, Verantwortliche, Abweichungen und Korrekturmassnahmen."
  },
  {
    slug: "handover",
    label: "Übergabeprotokoll",
    guidance:
      "Strukturiere relevante Uebergabeinformationen, z. B. nach SBAR/ISBAR: Situation, Hintergrund, Einschaetzung, Empfehlung, Risiken, neue Anordnungen, Ereignisse und offene Aufgaben."
  },
  {
    slug: "relative_physician_communication",
    label: "Angehörigen-/Arztkommunikation",
    guidance:
      "Dokumentiere wer mit wem wann gesprochen hat, Anlass, Inhalt, Ergebnis, aerztliche Anordnung, Rueckfragen, Vereinbarungen, Informationsweitergabe und offene Klärungspunkte."
  },
  {
    slug: "incident",
    label: "Ereignisprotokoll",
    guidance:
      "Dokumentiere Ereignisse fuer QM/Risikomanagement nachvollziehbar: Art, Zeitpunkt, Ort, Beteiligte, Verlauf, Folgen, Sofortmassnahmen, informierte Personen, weitere Massnahmen und Praeventions-/Meldebedarf."
  }
] as const;

export type CareProtocolSlug = (typeof CARE_PROTOCOLS)[number]["slug"];

const careProtocolSlugs = new Set<string>(CARE_PROTOCOLS.map((protocol) => protocol.slug));

export function normalizeCareProtocols(values: unknown): CareProtocolSlug[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return [...new Set(values)].filter((value): value is CareProtocolSlug => {
    return typeof value === "string" && careProtocolSlugs.has(value);
  });
}

export function getCareProtocolLabels(slugs: string[] | null | undefined) {
  const selected = normalizeCareProtocols(slugs ?? []);
  return selected.map((slug) => CARE_PROTOCOLS.find((protocol) => protocol.slug === slug)?.label ?? slug);
}

export function buildCareProtocolPrompt(slugs: string[] | null | undefined) {
  const selected = normalizeCareProtocols(slugs ?? []);

  if (!selected.length) {
    return "Keine speziellen Pflegeprotokolle ausgewaehlt.";
  }

  return selected
    .map((slug) => {
      const protocol = CARE_PROTOCOLS.find((item) => item.slug === slug);
      return protocol ? `- ${protocol.label}: ${protocol.guidance}` : null;
    })
    .filter(Boolean)
    .join("\n");
}
