import * as Sentry from "@sentry/nextjs";

import { serverEnv } from "@/lib/env/server";

if (serverEnv.ENABLE_SENTRY && serverEnv.SENTRY_DSN) {
  Sentry.init({
    dsn: serverEnv.SENTRY_DSN,
    tracesSampleRate: 0.1
  });
}
