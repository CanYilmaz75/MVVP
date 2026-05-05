import { NewConsultationForm } from "@/features/consultations/new-consultation-form";
import { getAuthContext } from "@/server/auth/context";
import { listTemplates } from "@/server/services/template-service";

export default async function NewConsultationPage() {
  const auth = await getAuthContext();
  const templates = await listTemplates();

  return (
    <div className="mx-auto max-w-3xl">
      <NewConsultationForm
        careSetting={auth.organisation.care_setting}
        templates={templates.map((template: { id: string; name: string; specialty: string }) => ({
          id: template.id,
          name: template.name,
          specialty: template.specialty
        }))}
      />
    </div>
  );
}
