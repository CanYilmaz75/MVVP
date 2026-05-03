import { AppError } from "@/lib/errors";
import { requireApiAuthContext } from "@/server/auth/context";
import type { Json } from "@/types/database";
import type { EnterpriseRequestInput } from "@/schemas/team";
import { createAuditLog } from "@/server/services/audit-service";

export const SELF_SERVICE_SEAT_LIMIT = 20;

type BillingAdapter = {
  provider: string;
  createCustomer(input: { organisationId: string; organisationName: string }): Promise<{ customerId: string }>;
  createSubscription(input: { organisationId: string; planId: string; activeSeats: number }): Promise<{ subscriptionId: string }>;
  syncSeatCount(input: { subscriptionId: string; activeSeats: number }): Promise<void>;
  createPortalSession(input: { organisationId: string }): Promise<{ url: string | null }>;
};

const internalBillingAdapter: BillingAdapter = {
  provider: "internal",
  async createCustomer(input) {
    return { customerId: `internal_customer_${input.organisationId}` };
  },
  async createSubscription(input) {
    return { subscriptionId: `internal_subscription_${input.organisationId}_${input.planId}` };
  },
  async syncSeatCount() {
    return undefined;
  },
  async createPortalSession() {
    return { url: null };
  }
};

export function getBillingAdapter() {
  return internalBillingAdapter;
}

export async function getSubscriptionOverview() {
  const auth = await requireApiAuthContext();
  const subscription = await ensureOrganisationSubscription();
  const plan = await getPlan(subscription.plan_id);
  const activeSeats = await countActiveSeats(auth.organisationId);

  if (subscription.active_seats !== activeSeats) {
    await syncSeatCount({
      organisationId: auth.organisationId,
      actorId: auth.userId,
      reason: "sync",
      metadata: { source: "subscription_overview" }
    });
  }

  return {
    organisation: auth.organisation,
    subscription: {
      ...subscription,
      active_seats: activeSeats
    },
    plan,
    activeSeats,
    selfServiceSeatLimit: plan.self_service_seat_limit ?? null,
    billableSeats: activeSeats,
    monthlyTotalCents: calculateMonthlyTotalCents(plan, activeSeats)
  };
}

export async function ensureOrganisationSubscription() {
  const auth = await requireApiAuthContext();
  const { data: subscription, error } = await auth.supabase
    .from("subscriptions")
    .select("*")
    .eq("organisation_id", auth.organisationId)
    .single();

  if (subscription && !error) {
    return subscription;
  }

  if (auth.profile.role !== "admin") {
    throw new AppError("SUBSCRIPTION_NOT_FOUND", "Das Abo konnte nicht aufgeloest werden.", 403);
  }

  const activeSeats = await countActiveSeats(auth.organisationId);
  const adapter = getBillingAdapter();
  const customer = await adapter.createCustomer({
    organisationId: auth.organisationId,
    organisationName: auth.organisationName
  });
  const providerSubscription = await adapter.createSubscription({
    organisationId: auth.organisationId,
    planId: "self_service",
    activeSeats
  });

  const { data: created, error: insertError } = await auth.supabase
    .from("subscriptions")
    .insert({
      organisation_id: auth.organisationId,
      plan_id: "self_service",
      status: "active",
      billing_provider: adapter.provider,
      provider_customer_id: customer.customerId,
      provider_subscription_id: providerSubscription.subscriptionId,
      active_seats: activeSeats
    })
    .select("*")
    .single();

  if (insertError || !created) {
    throw new AppError("SUBSCRIPTION_CREATE_FAILED", "Das Abo konnte nicht angelegt werden.", 500);
  }

  return created;
}

export async function syncSeatCount(input: {
  organisationId: string;
  actorId: string;
  reason: "signup" | "member_activated" | "member_deactivated" | "sync";
  metadata?: Json;
}) {
  const auth = await requireApiAuthContext();
  const subscription = await ensureOrganisationSubscription();
  const activeSeats = await countActiveSeats(input.organisationId);
  const previousSeats = subscription.active_seats;

  const { data: updated, error } = await auth.supabase
    .from("subscriptions")
    .update({ active_seats: activeSeats })
    .eq("id", subscription.id)
    .select("*")
    .single();

  if (error || !updated) {
    throw new AppError("SEAT_SYNC_FAILED", "Die Nutzeranzahl konnte nicht synchronisiert werden.", 500);
  }

  await getBillingAdapter().syncSeatCount({
    subscriptionId: updated.id,
    activeSeats
  });

  if (previousSeats !== activeSeats || input.reason !== "sync") {
    await auth.supabase.from("billing_seat_events").insert({
      organisation_id: input.organisationId,
      subscription_id: updated.id,
      actor_id: input.actorId,
      previous_active_seats: previousSeats,
      new_active_seats: activeSeats,
      reason: input.reason,
      metadata: input.metadata ?? {}
    });
  }

  return updated;
}

export async function ensureCanActivateSeat() {
  const auth = await requireApiAuthContext();
  const subscription = await ensureOrganisationSubscription();
  const plan = await getPlan(subscription.plan_id);
  const activeSeats = await countActiveSeats(auth.organisationId);

  if (auth.organisation.customer_type === "enterprise" || auth.organisation.billing_mode === "manual_contract") {
    return { allowed: true, activeSeats, limit: null };
  }

  const limit = plan.self_service_seat_limit ?? SELF_SERVICE_SEAT_LIMIT;
  if (activeSeats + 1 > limit) {
    throw new AppError(
      "ENTERPRISE_REQUIRED",
      "Das Self-Service-Limit ist erreicht. Bitte stellen Sie eine Enterprise-Anfrage, bevor Sie weitere Nutzer aktivieren.",
      409,
      { activeSeats, limit }
    );
  }

  return { allowed: true, activeSeats, limit };
}

export async function recordEnterpriseRequest(input: EnterpriseRequestInput) {
  const auth = await requireApiAuthContext();

  if (auth.profile.role !== "admin") {
    throw new AppError("ADMIN_REQUIRED", "Nur Admins koennen Enterprise-Anfragen erstellen.", 403);
  }

  const { data: existing } = await auth.supabase
    .from("enterprise_requests")
    .select("*")
    .eq("organisation_id", auth.organisationId)
    .eq("status", "open")
    .maybeSingle();

  const payload = {
    organisation_id: auth.organisationId,
    requested_by: auth.userId,
    desired_seats: input.desiredSeats,
    contact_name: input.contactName,
    contact_email: input.contactEmail,
    message: input.message ?? null,
    status: "open" as const
  };

  const query = existing
    ? auth.supabase.from("enterprise_requests").update(payload).eq("id", existing.id)
    : auth.supabase.from("enterprise_requests").insert(payload);

  const { data: request, error } = await query.select("*").single();

  if (error || !request) {
    throw new AppError("ENTERPRISE_REQUEST_FAILED", "Die Enterprise-Anfrage konnte nicht gespeichert werden.", 500);
  }

  await auth.supabase
    .from("organisations")
    .update({ enterprise_status: "requested" })
    .eq("id", auth.organisationId);

  await auth.supabase
    .from("subscriptions")
    .update({ status: "enterprise_pending" })
    .eq("organisation_id", auth.organisationId);

  await createAuditLog(auth.supabase, {
    organisationId: auth.organisationId,
    actorId: auth.userId,
    entityType: "enterprise_request",
    entityId: request.id,
    action: "enterprise_requested",
    metadata: { desiredSeats: input.desiredSeats }
  });

  return request;
}

async function getPlan(planId: string) {
  const auth = await requireApiAuthContext();
  const { data: plan, error } = await auth.supabase.from("plans").select("*").eq("id", planId).single();

  if (error || !plan) {
    throw new AppError("PLAN_NOT_FOUND", "Der Abo-Plan konnte nicht aufgeloest werden.", 500);
  }

  return plan;
}

async function countActiveSeats(organisationId: string) {
  const auth = await requireApiAuthContext();
  const { count, error } = await auth.supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organisation_id", organisationId)
    .eq("status", "active");

  if (error || count === null) {
    throw new AppError("SEAT_COUNT_FAILED", "Die aktiven Nutzer konnten nicht gezaehlt werden.", 500);
  }

  return count;
}

function calculateMonthlyTotalCents(
  plan: { base_price_cents: number; included_seats: number; seat_price_cents: number },
  activeSeats: number
) {
  const paidExtraSeats = Math.max(0, activeSeats - plan.included_seats);
  return plan.base_price_cents + paidExtraSeats * plan.seat_price_cents;
}
