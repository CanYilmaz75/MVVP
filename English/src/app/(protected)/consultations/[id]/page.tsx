import { notFound } from "next/navigation";

import { ConsultationWorkspace } from "@/features/consultations/consultation-workspace";
import { featureFlags } from "@/lib/feature-flags";
import { getConsultationWorkspace } from "@/server/services/consultation-service";

export default async function ConsultationPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getConsultationWorkspace(id);

  if (!workspace) {
    notFound();
  }

  return (
    <ConsultationWorkspace
      workspace={workspace}
      capabilities={{
        voiceEdit: featureFlags.voiceEdit,
        aiTranscription: featureFlags.aiTranscription,
        aiNoteGeneration: featureFlags.aiNoteGeneration
      }}
    />
  );
}
