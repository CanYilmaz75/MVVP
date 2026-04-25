import type { Json } from "@/types/database";

export async function createAuditLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  input: {
    organisationId: string;
    actorId?: string | null;
    entityType: string;
    entityId?: string | null;
    action: string;
    metadata?: Json;
  }
) {
  await supabase.from("audit_logs").insert({
    organisation_id: input.organisationId,
    actor_id: input.actorId ?? null,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    metadata: input.metadata ?? {}
  });
}
