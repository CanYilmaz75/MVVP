import { featureFlags } from "@/lib/feature-flags";
import { getAuthContext } from "@/server/auth/context";
import { SisWorkspace } from "@/features/sis/sis-workspace";

export default async function SisPage() {
  await getAuthContext();

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
