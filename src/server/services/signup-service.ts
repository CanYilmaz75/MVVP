export function buildSelfServiceSignupMetadata(input: {
  fullName: string;
  organisationName: string;
  specialty?: string;
}) {
  return {
    full_name: input.fullName,
    organisation_name: input.organisationName,
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
