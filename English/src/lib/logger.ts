type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  message: string;
  level?: LogLevel;
  requestId?: string;
  userId?: string;
  organisationId?: string;
  consultationId?: string;
  route?: string;
  action?: string;
  durationMs?: number;
  errorCode?: string;
  metadata?: Record<string, unknown>;
};

export function logEvent({
  level = "info",
  message,
  metadata,
  ...rest
}: LogPayload) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...rest,
    ...(metadata ? { metadata } : {})
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}
