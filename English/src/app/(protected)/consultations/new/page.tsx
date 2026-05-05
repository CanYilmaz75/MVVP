import { NewConsultationForm } from "@/features/consultations/new-consultation-form";
import { getAuthContext } from "@/server/auth/context";

export default async function NewConsultationPage() {
  const auth = await getAuthContext();

  return (
    <div className="mx-auto max-w-3xl">
      <NewConsultationForm careSetting={auth.organisation.care_setting} />
    </div>
  );
}
