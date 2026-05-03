import { createHash, randomBytes } from "node:crypto";

import { AppError } from "@/lib/errors";
import { requireApiAuthContext } from "@/server/auth/context";
import type { TeamInviteInput, MemberRoleInput } from "@/schemas/team";
import { createAuditLog } from "@/server/services/audit-service";
import { ensureCanActivateSeat, getSubscriptionOverview, syncSeatCount } from "@/server/services/billing-service";

function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new AppError("ADMIN_REQUIRED", "Nur Admins koennen Team und Abo verwalten.", 403);
  }
}

export async function getTeamOverview() {
  const auth = await requireApiAuthContext();
  requireAdmin(auth.profile.role);

  const [membersResult, invitesResult, billing] = await Promise.all([
    auth.supabase
      .from("profiles")
      .select("id, organisation_id, full_name, role, specialty, status, created_at, updated_at")
      .eq("organisation_id", auth.organisationId)
      .order("created_at", { ascending: true }),
    auth.supabase
      .from("organisation_invites")
      .select("id, email, full_name, role, status, expires_at, created_at")
      .eq("organisation_id", auth.organisationId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    getSubscriptionOverview()
  ]);

  if (membersResult.error) {
    throw new AppError("TEAM_LIST_FAILED", "Die Teamliste konnte nicht geladen werden.", 500);
  }

  if (invitesResult.error) {
    throw new AppError("INVITES_LIST_FAILED", "Die Einladungen konnten nicht geladen werden.", 500);
  }

  return {
    members: membersResult.data ?? [],
    invites: invitesResult.data ?? [],
    billing
  };
}

export async function createTeamInvite(input: TeamInviteInput, origin?: string) {
  const auth = await requireApiAuthContext();
  requireAdmin(auth.profile.role);

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const normalizedEmail = input.email.trim().toLowerCase();

  const { data: invite, error } = await auth.supabase
    .from("organisation_invites")
    .insert({
      organisation_id: auth.organisationId,
      email: normalizedEmail,
      full_name: input.fullName ?? null,
      role: input.role,
      token_hash: tokenHash,
      invited_by: auth.userId
    })
    .select("id, email, full_name, role, status, expires_at, created_at")
    .single();

  if (error || !invite) {
    throw new AppError("INVITE_CREATE_FAILED", "Die Einladung konnte nicht erstellt werden.", 409);
  }

  await createAuditLog(auth.supabase, {
    organisationId: auth.organisationId,
    actorId: auth.userId,
    entityType: "organisation_invite",
    entityId: invite.id,
    action: "team_invite_created",
    metadata: { email: normalizedEmail, role: input.role }
  });

  const baseUrl = origin ?? "";
  return {
    invite,
    inviteUrl: `${baseUrl}/signup?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`
  };
}

export async function updateMemberRole(memberId: string, input: MemberRoleInput) {
  const auth = await requireApiAuthContext();
  requireAdmin(auth.profile.role);

  const { data: updated, error } = await auth.supabase
    .from("profiles")
    .update({ role: input.role })
    .eq("id", memberId)
    .eq("organisation_id", auth.organisationId)
    .select("id, organisation_id, full_name, role, specialty, status, created_at, updated_at")
    .single();

  if (error || !updated) {
    throw new AppError("MEMBER_ROLE_UPDATE_FAILED", "Die Rolle konnte nicht aktualisiert werden.", 500);
  }

  return updated;
}

export async function activateMember(memberId: string) {
  const auth = await requireApiAuthContext();
  requireAdmin(auth.profile.role);

  const member = await getMember(memberId);
  if (member.status === "active") {
    return member;
  }

  await ensureCanActivateSeat();

  const { data: updated, error } = await auth.supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", memberId)
    .eq("organisation_id", auth.organisationId)
    .select("id, organisation_id, full_name, role, specialty, status, created_at, updated_at")
    .single();

  if (error || !updated) {
    throw new AppError("MEMBER_ACTIVATE_FAILED", "Der Nutzer konnte nicht aktiviert werden.", 500);
  }

  await syncSeatCount({
    organisationId: auth.organisationId,
    actorId: auth.userId,
    reason: "member_activated",
    metadata: { memberId }
  });

  await createAuditLog(auth.supabase, {
    organisationId: auth.organisationId,
    actorId: auth.userId,
    entityType: "profile",
    entityId: memberId,
    action: "team_member_activated"
  });

  return updated;
}

export async function deactivateMember(memberId: string) {
  const auth = await requireApiAuthContext();
  requireAdmin(auth.profile.role);

  if (memberId === auth.userId) {
    throw new AppError("CANNOT_DEACTIVATE_SELF", "Sie koennen Ihr eigenes Admin-Konto nicht deaktivieren.", 400);
  }

  const member = await getMember(memberId);
  if (member.status === "inactive") {
    return member;
  }

  const { data: updated, error } = await auth.supabase
    .from("profiles")
    .update({ status: "inactive" })
    .eq("id", memberId)
    .eq("organisation_id", auth.organisationId)
    .select("id, organisation_id, full_name, role, specialty, status, created_at, updated_at")
    .single();

  if (error || !updated) {
    throw new AppError("MEMBER_DEACTIVATE_FAILED", "Der Nutzer konnte nicht deaktiviert werden.", 500);
  }

  await syncSeatCount({
    organisationId: auth.organisationId,
    actorId: auth.userId,
    reason: "member_deactivated",
    metadata: { memberId }
  });

  await createAuditLog(auth.supabase, {
    organisationId: auth.organisationId,
    actorId: auth.userId,
    entityType: "profile",
    entityId: memberId,
    action: "team_member_deactivated"
  });

  return updated;
}

async function getMember(memberId: string) {
  const auth = await requireApiAuthContext();
  const { data: member, error } = await auth.supabase
    .from("profiles")
    .select("id, organisation_id, full_name, role, specialty, status, created_at, updated_at")
    .eq("id", memberId)
    .eq("organisation_id", auth.organisationId)
    .single();

  if (error || !member) {
    throw new AppError("MEMBER_NOT_FOUND", "Der Nutzer wurde nicht gefunden.", 404);
  }

  return member;
}
