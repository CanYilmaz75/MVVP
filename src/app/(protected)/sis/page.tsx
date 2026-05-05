import { featureFlags } from "@/lib/feature-flags";
import { isCareFacility } from "@/lib/care-setting";
import { getAuthContext } from "@/server/auth/context";
import { SisWorkspace } from "@/features/sis/sis-workspace";
import { redirect } from "next/navigation";

export default async function SisPage() {
  const auth = await getAuthContext();

  if (!isCareFacility(auth.organisation.care_setting)) {
    redirect("/consultations/new");
  }

  return (
    <div className="space-y-8">
      <SisWorkspace
        capabilities={{
          aiTranscription: featureFlags.aiTranscription,
          sisExtraction: featureFlags.sisExtraction
        }}
      />
    </div>
  );
}
