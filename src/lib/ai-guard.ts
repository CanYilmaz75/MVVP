import { AppError } from "@/lib/errors";
import { assertFeatureEnabled, type ServerFeatureFlag } from "@/lib/feature-flags";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function enforceAiRouteSafety(input: {
  organisationId: string;
  userId: string;
  action: string;
  limit: number;
  consultationId?: string;
  featureFlag: ServerFeatureFlag;
  disabledMessage: string;
}) {
  assertFeatureEnabled(input.featureFlag, input.disabledMessage);

  await enforceRateLimit({
    identifier: [input.organisationId, input.userId, input.consultationId].filter(Boolean).join(":"),
    action: input.action,
    limit: input.limit
  });
}

export function assertVoiceEditEnabled() {
  assertFeatureEnabled("voiceEdit", "Sprachbearbeitung ist derzeit deaktiviert.");
}

export function assertTranscriptionEnabled() {
  assertFeatureEnabled("aiTranscription", "KI-Transkription ist derzeit deaktiviert.");
}

export function assertNoteGenerationEnabled() {
  assertFeatureEnabled("aiNoteGeneration", "KI-Notizerstellung ist derzeit deaktiviert.");
}

export function assertSisExtractionEnabled() {
  assertFeatureEnabled("sisExtraction", "KI-gestuetzte SIS-Extraktion ist derzeit deaktiviert.");
}

export function assertApprovedForExport(isApproved: boolean) {
  if (!isApproved) {
    throw new AppError("EXPORT_REQUIRES_APPROVAL", "Nur fachlich freigegebene Inhalte koennen exportiert werden.", 400);
  }
}
