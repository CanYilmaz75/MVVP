import { AppError } from "@/lib/errors";
import { requireApiAuthContext } from "@/server/auth/context";

export async function listTemplates() {
  const { organisationId, supabase } = await requireApiAuthContext();
  const { data, error } = await supabase
    .from("note_templates")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("TEMPLATES_FETCH_FAILED", "Templates could not be loaded.", 500);
  }

  return data;
}

export async function createTemplate(input: {
  name: string;
  specialty: string;
  templateDefinition: Record<string, unknown>;
}) {
  const { organisationId, supabase } = await requireApiAuthContext();
  const { data, error } = await supabase
    .from("note_templates")
    .insert({
      organisation_id: organisationId,
      name: input.name,
      specialty: input.specialty,
      template_definition: input.templateDefinition,
      note_type: "SOAP",
      schema_version: "1.0"
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError("TEMPLATE_CREATE_FAILED", "Template could not be created.", 500);
  }

  return data;
}
