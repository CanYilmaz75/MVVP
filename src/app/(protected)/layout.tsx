import { ProtectedShell } from "@/components/layout/protected-shell";
import { getAuthContext } from "@/server/auth/context";
import { listPausedConsultations } from "@/server/services/consultation-service";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();
  const pausedConsultations = await listPausedConsultations();

  return (
    <ProtectedShell
      careSetting={auth.organisation.care_setting}
      organisationName={auth.organisationName}
      pausedConsultations={pausedConsultations}
      userName={auth.profile.full_name || "Behandelnde Person"}
    >
      {children}
    </ProtectedShell>
  );
}
