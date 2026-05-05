export function buildSelfServiceSignupMetadata(input: {
  fullName: string;
  organisationName: string;
  careSetting?: "care_facility" | "medical_practice";
  specialty?: string;
}) {
  return {
    full_name: input.fullName,
    organisation_name: input.organisationName,
    care_setting: input.careSetting ?? "care_facility",
    specialty: input.specialty ?? "",
    role: "admin"
  };
}

export function buildInviteSignupMetadata(input: {
  fullName: string;
  inviteToken: string;
  specialty?: string;
}) {
  return {
    full_name: input.fullName,
    invite_token: input.inviteToken,
    specialty: input.specialty ?? ""
  };
}
