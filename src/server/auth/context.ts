import { cache } from "react";
import { redirect } from "next/navigation";

import { AppError } from "@/lib/errors";
import { createServerSupabaseClient } from "@/server/supabase/server";

export type AuthContext = {
  userId: string;
  organisationId: string;
  organisationName: string;
  profile: {
    id: string;
    organisation_id: string;
    full_name: string | null;
    role: "clinician" | "admin";
    specialty: string | null;
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

  const { data: organisation } = await supabase
    .from("organisations")
    .select("name")
    .eq("id", profile.organisation_id)
    .single();

  return {
    userId: user.id,
    organisationId: profile.organisation_id,
    organisationName: organisation?.name ?? "Organisation",
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

  const { data: organisation } = await supabase
    .from("organisations")
    .select("name")
    .eq("id", profile.organisation_id)
    .single();

  return {
    userId: user.id,
    organisationId: profile.organisation_id,
    organisationName: organisation?.name ?? "Organisation",
    profile,
    supabase
  };
}
