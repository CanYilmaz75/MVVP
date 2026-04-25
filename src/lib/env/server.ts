import { z } from "zod";

import { booleanFlag, formatEnvErrors } from "@/lib/env/shared";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  ENABLE_VOICE_EDIT: booleanFlag,
  ENABLE_ANALYTICS: booleanFlag,
  ENABLE_SENTRY: booleanFlag,
  PDF_SIGNING_SECRET: z.string().optional()
});

export const serverEnv = (() => {
  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    ENABLE_VOICE_EDIT: process.env.ENABLE_VOICE_EDIT,
    ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS,
    ENABLE_SENTRY: process.env.ENABLE_SENTRY,
    PDF_SIGNING_SECRET: process.env.PDF_SIGNING_SECRET
  });

  if (!parsed.success) {
    throw new Error(`Ungueltige Server-Umgebungsvariablen:\n${formatEnvErrors(parsed.error)}`);
  }

  return parsed.data;
})();
