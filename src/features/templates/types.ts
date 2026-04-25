import type { Json } from "@/types/database";

export type TemplateEntryType = "text" | "heading" | "number" | "option" | "multi_option" | "custom";

export type TemplateAccessType = "all" | "roles" | "private";

export type TemplateStatus = "draft" | "active" | "pending_changes";

export type TemplateEntry = {
  id: string;
  name: string;
  type: TemplateEntryType;
  memory?: string;
  unit?: string;
  options?: string[];
  customInstructions?: string;
};

export type TemplateAccess = {
  type: TemplateAccessType;
  roles: string[];
};

export type TemplateActiveSnapshot = {
  primaryProfession: string;
  access: TemplateAccess;
  entries: TemplateEntry[];
  memory?: string;
  activatedAt: string;
  activatedBy?: string;
};

export type TemplateDefinition = {
  version: 1;
  creationMode: "empty" | "duplicate" | "fixed";
  status: TemplateStatus;
  primaryProfession: string;
  access: TemplateAccess;
  entries: TemplateEntry[];
  memory?: string;
  activeSnapshot?: TemplateActiveSnapshot;
};

export type TemplateRecord = {
  id: string;
  organisation_id: string;
  name: string;
  specialty: string;
  note_type: string;
  schema_version: string;
  template_definition: Json;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const defaultAccess: TemplateAccess = {
  type: "all",
  roles: []
};

export function createDefaultDefinition(
  primaryProfession = "Allgemeinmedizin",
  creationMode: TemplateDefinition["creationMode"] = "empty"
): TemplateDefinition {
  return {
    version: 1,
    creationMode,
    status: "draft",
    primaryProfession,
    access: defaultAccess,
    entries: [],
    memory: ""
  };
}

export function createFixedStructureDefinition(primaryProfession = "Allgemeinmedizin"): TemplateDefinition {
  return {
    ...createDefaultDefinition(primaryProfession, "fixed"),
    entries: [
      { id: "fixed-subjective", name: "Subjektiv", type: "heading" },
      { id: "fixed-anamnese", name: "Anamnese und Anliegen", type: "text" },
      { id: "fixed-objective", name: "Objektiv", type: "heading" },
      { id: "fixed-befunde", name: "Befunde", type: "text" },
      { id: "fixed-assessment", name: "Beurteilung", type: "heading" },
      { id: "fixed-einschaetzung", name: "Klinische Einschätzung", type: "text" },
      { id: "fixed-plan", name: "Plan", type: "heading" },
      { id: "fixed-massnahmen", name: "Maßnahmen und Follow-up", type: "text" }
    ]
  };
}

function isTemplateEntry(value: unknown): value is TemplateEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<TemplateEntry>;
  return typeof entry.id === "string" && typeof entry.name === "string" && typeof entry.type === "string";
}

function isAccess(value: unknown): value is TemplateAccess {
  if (!value || typeof value !== "object") {
    return false;
  }

  const access = value as Partial<TemplateAccess>;
  return (
    (access.type === "all" || access.type === "roles" || access.type === "private") &&
    Array.isArray(access.roles)
  );
}

export function parseTemplateDefinition(value: Json | null | undefined): TemplateDefinition {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return createDefaultDefinition();
  }

  const raw = value as Record<string, unknown>;
  const entries = Array.isArray(raw.entries) ? raw.entries.filter(isTemplateEntry) : [];
  const access = isAccess(raw.access) ? raw.access : defaultAccess;

  return {
    version: 1,
    creationMode:
      raw.creationMode === "duplicate" || raw.creationMode === "fixed" || raw.creationMode === "empty"
        ? raw.creationMode
        : "empty",
    status:
      raw.status === "active" || raw.status === "pending_changes" || raw.status === "draft"
        ? raw.status
        : "draft",
    primaryProfession: typeof raw.primaryProfession === "string" ? raw.primaryProfession : "Allgemeinmedizin",
    access,
    entries,
    memory: typeof raw.memory === "string" ? raw.memory : "",
    activeSnapshot:
      raw.activeSnapshot && typeof raw.activeSnapshot === "object" && !Array.isArray(raw.activeSnapshot)
        ? (raw.activeSnapshot as TemplateActiveSnapshot)
        : undefined
  };
}

export function getTemplateStatus(template: TemplateRecord): TemplateStatus {
  return parseTemplateDefinition(template.template_definition).status;
}

export function getTemplateDefinitionForGeneration(value: Json | null | undefined) {
  const definition = parseTemplateDefinition(value);

  if (definition.activeSnapshot) {
    return {
      primaryProfession: definition.activeSnapshot.primaryProfession,
      access: definition.activeSnapshot.access,
      memory: definition.activeSnapshot.memory,
      entries: definition.activeSnapshot.entries
    };
  }

  return {
    primaryProfession: definition.primaryProfession,
    access: definition.access,
    memory: definition.memory,
    entries: definition.entries
  };
}
