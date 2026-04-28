import { serverEnv } from "@/lib/env/server";
import { AppError } from "@/lib/errors";

export const featureFlags = {
  voiceEdit: serverEnv.ENABLE_VOICE_EDIT,
  aiTranscription: true,
  aiNoteGeneration: true,
  sisExtraction: true,
  analytics: serverEnv.ENABLE_ANALYTICS,
  sentry: serverEnv.ENABLE_SENTRY
} as const;

export type ServerFeatureFlag = keyof typeof featureFlags;

export function assertFeatureEnabled(flag: ServerFeatureFlag, message: string) {
  if (!featureFlags[flag]) {
    throw new AppError("FEATURE_DISABLED", message, 503, { flag });
  }
}
