import { serverEnv } from "@/lib/env/server";

export const featureFlags = {
  voiceEdit: serverEnv.ENABLE_VOICE_EDIT,
  analytics: serverEnv.ENABLE_ANALYTICS,
  sentry: serverEnv.ENABLE_SENTRY
} as const;
