import { Badge } from "@/components/ui/badge";

type StatusVariant = "default" | "primary" | "success" | "warning" | "destructive";

const STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  created: { label: "Angelegt", variant: "default" },
  recording: { label: "Aufnahme laeuft", variant: "primary" },
  paused: { label: "Pausiert", variant: "warning" },
  audio_uploaded: { label: "Audio hochgeladen", variant: "primary" },
  transcribing: { label: "Transkription laeuft", variant: "warning" },
  transcript_ready: { label: "Transkript bereit", variant: "success" },
  note_generating: { label: "Notiz wird erstellt", variant: "warning" },
  draft_ready: { label: "Entwurf bereit", variant: "success" },
  approved: { label: "Freigegeben", variant: "success" },
  exported: { label: "Exportiert", variant: "success" },
  failed: { label: "Fehlgeschlagen", variant: "destructive" },
  draft: { label: "Entwurf", variant: "warning" },
  edited: { label: "Bearbeitet", variant: "primary" },
  generating: { label: "Wird erstellt", variant: "warning" },
  not_started: { label: "Nicht gestartet", variant: "default" }
};

export function StatusBadge({ status }: { status: string }) {
  const value = STATUS_MAP[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={value.variant}>{value.label}</Badge>;
}
