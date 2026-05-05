import type { SoapNote } from "@/schemas/note";

function renderList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "-";
}

export function renderSoapNote(note: SoapNote) {
  return [
    "Subjektiv",
    `Hauptanliegen: ${note.sections.subjective.chiefComplaint || "-"}`,
    `Aktuelle Krankengeschichte: ${note.sections.subjective.historyOfPresentIllness || "-"}`,
    `Berichtete Symptome:\n${renderList(note.sections.subjective.reportedSymptoms)}`,
    "",
    "Objektiv",
    `Untersuchungsbefunde:\n${renderList(note.sections.objective.examFindings)}`,
    `Beobachtungen:\n${renderList(note.sections.objective.observations)}`,
    `Vitalwerte:\n${renderList(note.sections.objective.vitals)}`,
    "",
    "Einschaetzung",
    `Klinische Zusammenfassung: ${note.sections.assessment.clinicalSummary || "-"}`,
    `Moegliche Diagnosen:\n${renderList(note.sections.assessment.possibleDiagnoses)}`,
    `ICD-10-GM Kandidaten zur aerztlichen Pruefung:\n${renderList(note.sections.assessment.possibleIcdCodes)}`,
    "",
    "Plan",
    `Medikation:\n${renderList(note.sections.plan.medications)}`,
    `Nachsorge: ${note.sections.plan.followUp || "-"}`,
    `Ueberweisungen:\n${renderList(note.sections.plan.referrals)}`,
    `Angeforderte Tests:\n${renderList(note.sections.plan.testsOrdered)}`,
    `Anweisungen:\n${renderList(note.sections.plan.instructions)}`,
    "",
    `Offene Fragen:\n${renderList(note.openQuestions)}`,
    `Risikohinweise:\n${renderList(note.riskFlags)}`
  ].join("\n");
}
