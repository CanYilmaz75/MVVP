"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  FilePlus,
  GripVertical,
  Layers3,
  ListPlus,
  Plus,
  Save,
  Trash2
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createDefaultDefinition,
  createFixedStructureDefinition,
  parseTemplateDefinition,
  type TemplateDefinition,
  type TemplateEntry,
  type TemplateEntryType,
  type TemplateRecord,
  type TemplateStatus
} from "@/features/templates/types";

type EditorDraft = {
  id: string;
  name: string;
  specialty: string;
  active: boolean;
  definition: TemplateDefinition;
};

const professions = [
  "Allgemeinmedizin",
  "Kardiologie",
  "Psychotherapie",
  "Physiotherapie",
  "Pflege",
  "Pädiatrie",
  "Neurologie",
  "Orthopädie"
];

const entryTypes: Array<{ value: TemplateEntryType; label: string }> = [
  { value: "text", label: "Text" },
  { value: "heading", label: "Überschrift" },
  { value: "number", label: "Nummer" },
  { value: "option", label: "Option" },
  { value: "multi_option", label: "Mehrere Optionen" },
  { value: "custom", label: "Benutzerdefinierte Struktur" }
];

const accessOptions = [
  { value: "all", label: "Alle Mitarbeiter der Klinik" },
  { value: "roles", label: "Ausgewählte Berufsgruppen" },
  { value: "private", label: "Nur ich" }
] as const;

function toDraft(template: TemplateRecord): EditorDraft {
  return {
    id: template.id,
    name: template.name,
    specialty: template.specialty,
    active: template.active,
    definition: parseTemplateDefinition(template.template_definition)
  };
}

function templateStatus(template: TemplateRecord): TemplateStatus {
  return parseTemplateDefinition(template.template_definition).status;
}

function statusLabel(status: TemplateStatus) {
  if (status === "active") {
    return "Aktiviert";
  }

  if (status === "pending_changes") {
    return "Änderungen offen";
  }

  return "Entwurf";
}

function statusVariant(status: TemplateStatus) {
  if (status === "active") {
    return "success" as const;
  }

  if (status === "pending_changes") {
    return "warning" as const;
  }

  return "default" as const;
}

function uniqueName(baseName: string, templates: TemplateRecord[]) {
  const names = new Set(templates.map((template) => template.name));

  if (!names.has(baseName)) {
    return baseName;
  }

  let index = 2;
  while (names.has(`${baseName} ${index}`)) {
    index += 1;
  }

  return `${baseName} ${index}`;
}

function createEntry(type: TemplateEntryType = "text"): TemplateEntry {
  return {
    id: crypto.randomUUID(),
    name: type === "heading" ? "Neue Überschrift" : "Neuer Eintrag",
    type,
    memory: "",
    unit: type === "number" ? "" : undefined,
    options: type === "option" || type === "multi_option" ? ["Option 1", "Option 2"] : undefined,
    customInstructions: type === "custom" ? "" : undefined
  };
}

function markEdited(definition: TemplateDefinition, active: boolean): TemplateDefinition {
  if (!active) {
    return { ...definition, status: "draft" };
  }

  if (definition.status === "active") {
    return { ...definition, status: "pending_changes" };
  }

  return definition;
}

function reorderEntries(entries: TemplateEntry[], fromIndex: number, toIndex: number) {
  const next = [...entries];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function TemplateManager({ initialTemplates }: { initialTemplates: TemplateRecord[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState(initialTemplates[0]?.id ?? "");
  const [draft, setDraft] = useState<EditorDraft | null>(() => (initialTemplates[0] ? toDraft(initialTemplates[0]) : null));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggedEntryId = useRef<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [selectedId, templates]
  );

  const persistDraft = async (nextDraft: EditorDraft) => {
    setSaveState("saving");
    setError(null);

    const response = await fetch(`/api/templates/${nextDraft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nextDraft.name,
        specialty: nextDraft.specialty,
        templateDefinition: nextDraft.definition,
        active: nextDraft.active
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setSaveState("error");
      setError(payload.error?.message ?? "Vorlage konnte nicht gespeichert werden.");
      return null;
    }

    setTemplates((current) =>
      current.map((template) => (template.id === payload.data.id ? payload.data : template))
    );
    setSaveState("saved");
    router.refresh();
    return payload.data as TemplateRecord;
  };

  const scheduleSave = (nextDraft: EditorDraft) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      void persistDraft(nextDraft);
    }, 650);
  };

  const updateDraft = (updater: (current: EditorDraft) => EditorDraft) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const next = updater(current);
      scheduleSave(next);
      return next;
    });
  };

  const selectTemplate = (template: TemplateRecord) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    setSelectedId(template.id);
    setDraft(toDraft(template));
    setSaveState("idle");
    setError(null);
  };

  const createTemplate = async (definition: TemplateDefinition, name: string) => {
    setSaveState("saving");
    setError(null);

    const response = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        specialty: definition.primaryProfession,
        templateDefinition: definition,
        active: false
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setSaveState("error");
      setError(payload.error?.message ?? "Vorlage konnte nicht erstellt werden.");
      return;
    }

    setTemplates((current) => [payload.data, ...current]);
    setSelectedId(payload.data.id);
    setDraft(toDraft(payload.data));
    setSaveState("saved");
    router.refresh();
  };

  const activateTemplate = async () => {
    if (!draft) {
      return;
    }

    if (!draft.name.trim() || draft.definition.entries.length === 0) {
      setError("Name und mindestens ein Eintrag sind erforderlich.");
      return;
    }

    const activatedDefinition: TemplateDefinition = {
      ...draft.definition,
      status: "active",
      activeSnapshot: {
        primaryProfession: draft.definition.primaryProfession,
        access: draft.definition.access,
        entries: draft.definition.entries,
        memory: draft.definition.memory,
        activatedAt: new Date().toISOString()
      }
    };
    const nextDraft = {
      ...draft,
      active: true,
      specialty: draft.definition.primaryProfession,
      definition: activatedDefinition
    };

    setDraft(nextDraft);
    await persistDraft(nextDraft);
  };

  const updateDefinition = (updater: (definition: TemplateDefinition) => TemplateDefinition) => {
    updateDraft((current) => ({
      ...current,
      specialty: current.definition.primaryProfession,
      definition: markEdited(updater(current.definition), current.active)
    }));
  };

  const updateEntry = (entryId: string, updater: (entry: TemplateEntry) => TemplateEntry) => {
    updateDefinition((definition) => ({
      ...definition,
      entries: definition.entries.map((entry) => (entry.id === entryId ? updater(entry) : entry))
    }));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle>Vorlagen</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Erstellung und Bearbeitung sind fortlaufend in Entwicklung. Entwürfe werden automatisch gespeichert.
              </p>
            </div>
            <div className="grid gap-2">
              <Button
                type="button"
                className="justify-start gap-2"
                onClick={() =>
                  void createTemplate(
                    createDefaultDefinition("Allgemeinmedizin", "empty"),
                    uniqueName("Neue Vorlage", templates)
                  )
                }
              >
                <FilePlus className="h-4 w-4" />
                Leere Vorlage
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-start gap-2"
                disabled={!selectedTemplate}
                onClick={() => {
                  if (!selectedTemplate) {
                    return;
                  }

                  const sourceDefinition = parseTemplateDefinition(selectedTemplate.template_definition);
                  void createTemplate(
                    {
                      ...sourceDefinition,
                      creationMode: "duplicate",
                      status: "draft",
                      activeSnapshot: undefined
                    },
                    uniqueName(`Kopie von ${selectedTemplate.name}`, templates)
                  );
                }}
              >
                <Copy className="h-4 w-4" />
                Vorlage duplizieren
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-start gap-2"
                onClick={() =>
                  void createTemplate(
                    createFixedStructureDefinition("Allgemeinmedizin"),
                    uniqueName("Strukturierte Vorlage", templates)
                  )
                }
              >
                <Layers3 className="h-4 w-4" />
                Feste Struktur
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.length ? (
              templates.map((template) => {
                const status = templateStatus(template);
                const definition = parseTemplateDefinition(template.template_definition);
                return (
                  <button
                    key={template.id}
                    type="button"
                    className={cn(
                      "w-full rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:bg-accent",
                      template.id === selectedId && "border-primary bg-primary/5"
                    )}
                    onClick={() => selectTemplate(template)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{template.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {definition.primaryProfession} · {definition.entries.length} Einträge
                        </p>
                      </div>
                      <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Es wurden noch keine Vorlagen konfiguriert.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {draft ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0 gap-4">
              <div>
                <CardTitle>Vorlage bearbeiten</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Entwürfe sind nur für Administratoren sichtbar, bis sie aktiviert werden.
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Badge variant={statusVariant(draft.definition.status)}>{statusLabel(draft.definition.status)}</Badge>
                <Button type="button" className="gap-2" onClick={() => void activateTemplate()}>
                  {draft.definition.status === "pending_changes" ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {draft.definition.status === "pending_changes" ? "Änderungen übernehmen" : "Vorlage aktivieren"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="template-name">
                    Name
                  </label>
                  <Input
                    id="template-name"
                    value={draft.name}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        name: event.target.value,
                        definition: markEdited(current.definition, current.active)
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="template-profession">
                    Primärer Beruf
                  </label>
                  <select
                    id="template-profession"
                    className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
                    value={draft.definition.primaryProfession}
                    onChange={(event) =>
                      updateDefinition((definition) => ({
                        ...definition,
                        primaryProfession: event.target.value
                      }))
                    }
                  >
                    {professions.map((profession) => (
                      <option key={profession} value={profession}>
                        {profession}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="template-access">
                    Zugriff
                  </label>
                  <select
                    id="template-access"
                    className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
                    value={draft.definition.access.type}
                    onChange={(event) =>
                      updateDefinition((definition) => ({
                        ...definition,
                        access: {
                          type: event.target.value as TemplateDefinition["access"]["type"],
                          roles: definition.access.roles
                        }
                      }))
                    }
                  >
                    {accessOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="template-memory">
                    Memory für diese Vorlage
                  </label>
                  <Input
                    id="template-memory"
                    value={draft.definition.memory ?? ""}
                    placeholder="z. B. knapp, neutral und in vollständigen Sätzen schreiben"
                    onChange={(event) =>
                      updateDefinition((definition) => ({
                        ...definition,
                        memory: event.target.value
                      }))
                    }
                  />
                </div>
              </div>

              {draft.definition.access.type === "roles" ? (
                <div className="flex flex-wrap gap-2">
                  {professions.map((profession) => {
                    const isSelected = draft.definition.access.roles.includes(profession);
                    return (
                      <button
                        key={profession}
                        type="button"
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition-colors",
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
                        )}
                        onClick={() =>
                          updateDefinition((definition) => ({
                            ...definition,
                            access: {
                              ...definition.access,
                              roles: isSelected
                                ? definition.access.roles.filter((role) => role !== profession)
                                : [...definition.access.roles, profession]
                            }
                          }))
                        }
                      >
                        {profession}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="rounded-xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
                {saveState === "saving"
                  ? "Autosave läuft..."
                  : saveState === "saved"
                    ? "Automatisch gespeichert."
                    : saveState === "error"
                      ? "Speichern fehlgeschlagen."
                      : "Änderungen werden automatisch gespeichert."}
                {error ? <p className="mt-2 text-destructive">{error}</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Einträge</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Namen beschreiben, welche Informationen Tandem unter dem Eintrag schreiben soll.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="gap-2" onClick={() => updateDefinition((definition) => ({ ...definition, entries: [...definition.entries, createEntry("heading")] }))}>
                  <ListPlus className="h-4 w-4" />
                  Überschrift
                </Button>
                <Button type="button" className="gap-2" onClick={() => updateDefinition((definition) => ({ ...definition, entries: [...definition.entries, createEntry("text")] }))}>
                  <Plus className="h-4 w-4" />
                  Eintrag
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {draft.definition.entries.length ? (
                draft.definition.entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    draggable
                    onDragStart={() => {
                      draggedEntryId.current = entry.id;
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      const draggedId = draggedEntryId.current;
                      const fromIndex = draft.definition.entries.findIndex((item) => item.id === draggedId);

                      if (fromIndex < 0 || fromIndex === index) {
                        return;
                      }

                      updateDefinition((definition) => ({
                        ...definition,
                        entries: reorderEntries(definition.entries, fromIndex, index)
                      }));
                    }}
                    className={cn(
                      "rounded-xl border bg-card p-4",
                      entry.type === "heading" && "border-primary/35 bg-primary/5"
                    )}
                  >
                    <div className="grid gap-3 lg:grid-cols-[32px_minmax(180px,1fr)_220px_112px]">
                      <div className="flex items-center justify-center text-muted-foreground" title="Ziehen zum Sortieren">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <Input
                        value={entry.name}
                        aria-label="Eintragsname"
                        onChange={(event) => updateEntry(entry.id, (current) => ({ ...current, name: event.target.value }))}
                      />
                      <select
                        className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
                        value={entry.type}
                        aria-label="Datentyp"
                        onChange={(event) =>
                          updateEntry(entry.id, (current) => ({
                            ...current,
                            type: event.target.value as TemplateEntryType
                          }))
                        }
                      >
                        {entryTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          title="Nach oben"
                          onClick={() =>
                            updateDefinition((definition) => ({
                              ...definition,
                              entries: reorderEntries(definition.entries, index, index - 1)
                            }))
                          }
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === draft.definition.entries.length - 1}
                          title="Nach unten"
                          onClick={() =>
                            updateDefinition((definition) => ({
                              ...definition,
                              entries: reorderEntries(definition.entries, index, index + 1)
                            }))
                          }
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Eintrag löschen"
                          onClick={() =>
                            updateDefinition((definition) => ({
                              ...definition,
                              entries: definition.entries.filter((item) => item.id !== entry.id)
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {entry.type === "number" ? (
                      <div className="mt-3 max-w-xs space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Einheit</label>
                        <Input
                          value={entry.unit ?? ""}
                          placeholder="z. B. mmHg, kg, /min"
                          onChange={(event) => updateEntry(entry.id, (current) => ({ ...current, unit: event.target.value }))}
                        />
                      </div>
                    ) : null}

                    {entry.type === "option" || entry.type === "multi_option" ? (
                      <div className="mt-3 space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Optionen</label>
                        {(entry.options ?? []).map((option, optionIndex) => (
                          <div key={`${entry.id}-${optionIndex}`} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(event) =>
                                updateEntry(entry.id, (current) => ({
                                  ...current,
                                  options: (current.options ?? []).map((item, itemIndex) =>
                                    itemIndex === optionIndex ? event.target.value : item
                                  )
                                }))
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title="Option löschen"
                              onClick={() =>
                                updateEntry(entry.id, (current) => ({
                                  ...current,
                                  options: (current.options ?? []).filter((_, itemIndex) => itemIndex !== optionIndex)
                                }))
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateEntry(entry.id, (current) => ({
                              ...current,
                              options: [...(current.options ?? []), `Option ${(current.options?.length ?? 0) + 1}`]
                            }))
                          }
                        >
                          Option hinzufügen
                        </Button>
                      </div>
                    ) : null}

                    {entry.type === "custom" ? (
                      <div className="mt-3 space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Strukturanweisung</label>
                        <Textarea
                          value={entry.customInstructions ?? ""}
                          placeholder="Beschreiben Sie, wie Tandem diesen Abschnitt strukturieren soll."
                          onChange={(event) =>
                            updateEntry(entry.id, (current) => ({ ...current, customInstructions: event.target.value }))
                          }
                        />
                      </div>
                    ) : null}

                    {entry.type !== "heading" ? (
                      <div className="mt-3 space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Memory</label>
                        <Textarea
                          value={entry.memory ?? ""}
                          placeholder="Optionale Stil- oder Inhaltsanweisung für diesen Eintrag."
                          onChange={(event) => updateEntry(entry.id, (current) => ({ ...current, memory: event.target.value }))}
                        />
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Fügen Sie den ersten Eintrag hinzu, um die Vorlage aufzubauen.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Erstellen Sie eine leere Vorlage, duplizieren Sie eine vorhandene Vorlage oder starten Sie mit einer festen
            Struktur.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
