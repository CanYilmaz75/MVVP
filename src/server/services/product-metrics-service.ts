import { featureFlags } from "@/lib/feature-flags";
import { logEvent } from "@/lib/logger";

type ProductMetricName =
  | "consultation_started"
  | "export_completed"
  | "job_completed"
  | "job_failed"
  | "job_queued"
  | "note_generated"
  | "sis_extracted"
  | "transcript_ready"
  | "voice_edit_used";

type ProductMetricPayload = {
  organisationId: string;
  userId?: string;
  consultationId?: string;
  metric: ProductMetricName;
  properties?: Record<string, string | number | boolean | null>;
};

export function trackProductMetric(input: ProductMetricPayload) {
  if (!featureFlags.analytics) {
    return;
  }

  logEvent({
    level: "info",
    message: "Product metric",
    organisationId: input.organisationId,
    userId: input.userId,
    consultationId: input.consultationId,
    action: input.metric,
    metadata: {
      metric: input.metric,
      ...(input.properties ?? {})
    }
  });
}
