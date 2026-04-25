import { PageHeader } from "@/components/shared/page-header";
import { getAuthContext } from "@/server/auth/context";
import { SisWorkspace } from "@/features/sis/sis-workspace";

export default async function SisPage() {
  await getAuthContext();

  return (
    <div className="space-y-8">
      <PageHeader
        title="SIS"
        description="Erfasse die individuelle Situation, relevante Risiken und den Massnahmenfokus fuer den Pflegeprozess."
      />
      <SisWorkspace />
    </div>
  );
}
