import type { SoapNote } from "@/schemas/note";

function renderList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "-";
}

export function renderSoapNote(note: SoapNote) {
  return [
    "Subjective",
    `Chief Complaint: ${note.sections.subjective.chiefComplaint || "-"}`,
    `History of Present Illness: ${note.sections.subjective.historyOfPresentIllness || "-"}`,
    `Reported Symptoms:\n${renderList(note.sections.subjective.reportedSymptoms)}`,
    "",
    "Objective",
    `Exam Findings:\n${renderList(note.sections.objective.examFindings)}`,
    `Observations:\n${renderList(note.sections.objective.observations)}`,
    `Vitals:\n${renderList(note.sections.objective.vitals)}`,
    "",
    "Assessment",
    `Clinical Summary: ${note.sections.assessment.clinicalSummary || "-"}`,
    `Possible Diagnoses:\n${renderList(note.sections.assessment.possibleDiagnoses)}`,
    `ICD-10-GM Candidates for clinician review:\n${renderList(note.sections.assessment.possibleIcdCodes)}`,
    "",
    "Plan",
    `Medications:\n${renderList(note.sections.plan.medications)}`,
    `Follow Up: ${note.sections.plan.followUp || "-"}`,
    `Referrals:\n${renderList(note.sections.plan.referrals)}`,
    `Tests Ordered:\n${renderList(note.sections.plan.testsOrdered)}`,
    `Instructions:\n${renderList(note.sections.plan.instructions)}`,
    "",
    `Open Questions:\n${renderList(note.openQuestions)}`,
    `Risk Flags:\n${renderList(note.riskFlags)}`
  ].join("\n");
}
