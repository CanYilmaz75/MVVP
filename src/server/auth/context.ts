import { cache } from "react";
import { redirect } from "next/navigation";

import { AppError } from "@/lib/errors";
import { DEFAULT_CARE_SETTING, normalizeCareSetting, type CareSetting } from "@/lib/care-setting";
import { createServerSupabaseClient } from "@/server/supabase/server";

export type AuthContext = {
  userId: string;
  organisationId: string;
  organisationName: string;
  organisation: {
    id: string;
    name: string;
    customer_type: "self_service" | "enterprise";
    billing_mode: "automatic" | "manual_contract";
    enterprise_status: "none" | "requested" | "active";
    care_setting: CareSetting;
  };
  profile: {
    id: string;
    organisation_id: string;
    full_name: string | null;
    role: "clinician" | "admin";
    specialty: string | null;
    status: "active" | "inactive" | "invited";
  };
};

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new AppError("PROFILE_NOT_FOUND", "Ihr Benutzerprofil konnte nicht aufgeloest werden.", 403);
  }

  if (profile.status !== "active") {
    throw new AppError("ACCOUNT_INACTIVE", "Ihr Benutzerkonto ist nicht aktiv. Bitte wenden Sie sich an einen Admin.", 403);
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id, name, customer_type, billing_mode, enterprise_status, care_setting")
    .eq("id", profile.organisation_id)
    .single();
  const resolvedOrganisation = organisation
    ? { ...organisation, care_setting: normalizeCareSetting(organisation.care_setting) }
    : {
        id: profile.organisation_id,
        name: "Organisation",
        customer_type: "self_service" as const,
        billing_mode: "automatic" as const,
        enterprise_status: "none" as const,
        care_setting: DEFAULT_CARE_SETTING
      };

  return {
    userId: user.id,
    organisationId: profile.organisation_id,
    organisationName: organisation?.name ?? "Organisation",
    organisation: resolvedOrganisation,
    profile
  };
});

export async function requireApiAuthContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError("UNAUTHORIZED", "Anmeldung erforderlich.", 401);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new AppError("PROFILE_NOT_FOUND", "Ihr Benutzerprofil konnte nicht aufgeloest werden.", 403);
  }

  if (profile.status !== "active") {
    throw new AppError("ACCOUNT_INACTIVE", "Ihr Benutzerkonto ist nicht aktiv. Bitte wenden Sie sich an einen Admin.", 403);
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id, name, customer_type, billing_mode, enterprise_status, care_setting")
    .eq("id", profile.organisation_id)
    .single();
  const resolvedOrganisation = organisation
    ? { ...organisation, care_setting: normalizeCareSetting(organisation.care_setting) }
    : {
        id: profile.organisation_id,
        name: "Organisation",
        customer_type: "self_service" as const,
        billing_mode: "automatic" as const,
        enterprise_status: "none" as const,
        care_setting: DEFAULT_CARE_SETTING
      };

  return {
    userId: user.id,
    organisationId: profile.organisation_id,
    organisationName: organisation?.name ?? "Organisation",
    organisation: resolvedOrganisation,
    profile,
    supabase
  };
}
