import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { AppError } from "@/lib/errors";
import { serverEnv } from "@/lib/env/server";

const redis =
  serverEnv.UPSTASH_REDIS_REST_URL && serverEnv.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: serverEnv.UPSTASH_REDIS_REST_URL,
        token: serverEnv.UPSTASH_REDIS_REST_TOKEN
      })
    : null;

export async function enforceRateLimit({
  identifier,
  action,
  limit = 10,
  window = "1 m"
}: {
  identifier: string;
  action: string;
  limit?: number;
  window?: `${number} ${"s" | "m" | "h" | "d"}`;
}) {
  if (!redis) {
    return;
  }

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: false,
    prefix: `carevo:${action}`
  });

  const result = await ratelimit.limit(identifier);

  if (!result.success) {
    throw new AppError("RATE_LIMITED", "Too many requests. Please try again shortly.", 429);
  }
}
