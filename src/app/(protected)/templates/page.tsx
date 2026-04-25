import { TemplateManager } from "@/features/templates/template-manager";
import { getAuthContext } from "@/server/auth/context";
import { listTemplates } from "@/server/services/template-service";

export default async function TemplatesPage() {
  await getAuthContext();
  const templates = await listTemplates({ includeInactive: true });

  return <TemplateManager initialTemplates={templates} />;
}
