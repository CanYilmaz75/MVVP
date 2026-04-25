import { AppError } from "@/lib/errors";
import { requireApiAuthContext } from "@/server/auth/context";
import type { TemplateDefinition } from "@/features/templates/types";

export async function listTemplates(options: { includeInactive?: boolean } = {}) {
  const { organisationId, supabase } = await requireApiAuthContext();
  let query = supabase
    .from("note_templates")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });

  if (!options.includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError("TEMPLATES_FETCH_FAILED", "Vorlagen konnten nicht geladen werden.", 500);
  }

  return data;
}

export async function createTemplate(input: {
  name: string;
  specialty: string;
  templateDefinition: TemplateDefinition;
  active?: boolean;
}) {
  const { organisationId, supabase } = await requireApiAuthContext();

  await ensureUniqueTemplateName(input.name, organisationId);

  const { data, error } = await supabase
    .from("note_templates")
    .insert({
      organisation_id: organisationId,
      name: input.name,
      specialty: input.specialty,
      template_definition: input.templateDefinition,
      note_type: "SOAP",
      schema_version: "1.0",
      active: input.active ?? false
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError("TEMPLATE_CREATE_FAILED", "Vorlage konnte nicht erstellt werden.", 500);
  }

  return data;
}

export async function updateTemplate(
  id: string,
  input: {
    name: string;
    specialty: string;
    templateDefinition: TemplateDefinition;
    active: boolean;
  }
) {
  const { organisationId, supabase } = await requireApiAuthContext();

  await ensureTemplateAccess(id, organisationId);
  await ensureUniqueTemplateName(input.name, organisationId, id);

  const { data, error } = await supabase
    .from("note_templates")
    .update({
      name: input.name,
      specialty: input.specialty,
      template_definition: input.templateDefinition,
      active: input.active
    })
    .eq("id", id)
    .eq("organisation_id", organisationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError("TEMPLATE_UPDATE_FAILED", "Vorlage konnte nicht gespeichert werden.", 500);
  }

  return data;
}

async function ensureTemplateAccess(id: string, organisationId: string) {
  const { supabase } = await requireApiAuthContext();
  const { data } = await supabase
    .from("note_templates")
    .select("id")
    .eq("id", id)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (!data) {
    throw new AppError("TEMPLATE_NOT_FOUND", "Vorlage wurde nicht gefunden.", 404);
  }
}

async function ensureUniqueTemplateName(name: string, organisationId: string, excludedId?: string) {
  const { supabase } = await requireApiAuthContext();
  let query = supabase
    .from("note_templates")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("name", name)
    .limit(1);

  if (excludedId) {
    query = query.neq("id", excludedId);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError("TEMPLATE_NAME_CHECK_FAILED", "Vorlagenname konnte nicht geprüft werden.", 500);
  }

  if (data.length > 0) {
    throw new AppError("TEMPLATE_NAME_EXISTS", "Es gibt bereits eine Vorlage mit diesem Namen.", 409);
  }
}
