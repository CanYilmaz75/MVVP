import { Badge } from "@/components/ui/badge";

type StatusVariant = "default" | "primary" | "success" | "warning" | "destructive";

const STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  created: { label: "Created", variant: "default" },
  recording: { label: "Recording", variant: "primary" },
  audio_uploaded: { label: "Audio Uploaded", variant: "primary" },
  transcribing: { label: "Transcribing", variant: "warning" },
  transcript_ready: { label: "Transcript Ready", variant: "success" },
  note_generating: { label: "Generating Note", variant: "warning" },
  draft_ready: { label: "Draft Ready", variant: "success" },
  approved: { label: "Approved", variant: "success" },
  exported: { label: "Exported", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  draft: { label: "Draft", variant: "warning" },
  edited: { label: "Edited", variant: "primary" },
  generating: { label: "Generating", variant: "warning" },
  not_started: { label: "Not Started", variant: "default" }
};

export function StatusBadge({ status }: { status: string }) {
  const value = STATUS_MAP[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={value.variant}>{value.label}</Badge>;
}
