import type { Json } from "@/types/database";
import { requireApiAuthContext } from "@/server/auth/context";

export async function getIdempotentJobResult(action: string, consultationId: string, key?: string) {
  if (!key) {
    return null;
  }

  const { organisationId, supabase } = await requireApiAuthContext();
  const { data } = await supabase
    .from("jobs")
    .select("result")
    .eq("organisation_id", organisationId)
    .eq("consultation_id", consultationId)
    .eq("job_type", `idempotency:${action}:${key}`)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.result as Json) ?? null;
}

export async function storeIdempotentJobResult(
  action: string,
  consultationId: string,
  result: Json,
  key?: string
) {
  if (!key) {
    return;
  }

  const { organisationId, supabase } = await requireApiAuthContext();
  await supabase.from("jobs").insert({
    organisation_id: organisationId,
    consultation_id: consultationId,
    job_type: `idempotency:${action}:${key}`,
    status: "completed",
    result,
    payload: {}
  });
}
