import type { SoapNote } from "@/schemas/note";

export type ValidationWarning = {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
  section: string;
};

const criticalAmbiguityTerms = ["unklar", "zu bestaetigen", "moeglich", "ausschliessen"];

export function validateNoteAgainstTranscript(note: SoapNote, transcriptText: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const normalizedTranscript = transcriptText.toLowerCase();

  if (!note.sections.plan.followUp && (normalizedTranscript.includes("nachsorge") || normalizedTranscript.includes("kontrolle"))) {
    warnings.push({
      code: "MISSING_FOLLOW_UP",
      severity: "medium",
      message: "Nachsorge scheint besprochen worden zu sein, ist aber nicht im Plan dokumentiert.",
      section: "plan"
    });
  }

  if (note.sections.subjective.chiefComplaint === "" && normalizedTranscript.length > 120) {
    warnings.push({
      code: "EMPTY_SUBJECTIVE",
      severity: "medium",
      message: "Der subjektive Abschnitt ist fuer die Transkriptlaenge unerwartet knapp.",
      section: "subjective"
    });
  }

  if (!note.sections.assessment.clinicalSummary && hasAnySectionContent(note)) {
    warnings.push({
      code: "EMPTY_ASSESSMENT",
      severity: "medium",
      message: "Die Einschaetzung ist leer, obwohl andere Abschnitte Inhalt enthalten.",
      section: "assessment"
    });
  }

  if (!sectionHasContent(note.sections.plan)) {
    warnings.push({
      code: "EMPTY_PLAN",
      severity: "medium",
      message: "Der Plan-Abschnitt ist leer.",
      section: "plan"
    });
  }

  for (const medication of note.sections.plan.medications) {
    if (!normalizedTranscript.includes(medication.toLowerCase())) {
      warnings.push({
        code: "MEDICATION_NOT_IN_TRANSCRIPT",
        severity: "high",
        message: `Medikation "${medication}" kommt im Transkript nicht vor.`,
        section: "plan"
      });
    }
  }

  const assessmentText = `${note.sections.assessment.clinicalSummary} ${note.sections.assessment.possibleDiagnoses.join(" ")}`.toLowerCase();
  if (
    criticalAmbiguityTerms.some((term) => assessmentText.includes(term))
    && note.openQuestions.length === 0
  ) {
    warnings.push({
      code: "MISSING_OPEN_QUESTION",
      severity: "medium",
      message: "Uneindeutige Formulierungen in der Einschaetzung liegen ohne offene Frage vor.",
      section: "assessment"
    });
  }

  return warnings;
}

function sectionHasContent(section: Record<string, string | string[]>) {
  return Object.values(section).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value.trim().length > 0;
  });
}

function hasAnySectionContent(note: SoapNote) {
  return (
    sectionHasContent(note.sections.subjective)
    || sectionHasContent(note.sections.objective)
    || sectionHasContent(note.sections.assessment)
    || sectionHasContent(note.sections.plan)
  );
}
