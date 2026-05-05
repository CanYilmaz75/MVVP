"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Download,
  FileAudio,
  FileText,
  Loader2,
  Mic,
  Pause,
  Pencil,
  Play,
  ShieldCheck,
  Trash2,
  WandSparkles
} from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SoapNote } from "@/schemas/note";
import { createClient } from "@/server/supabase/browser";
import type { ConsultationWorkspaceData } from "@/server/services/consultation-service";
import { getCareProtocolLabels } from "@/lib/care-protocols";
import { LANGUAGE_DETECT_VALUE, languageLabel } from "@/lib/language-settings";

type Props = {
  workspace: ConsultationWorkspaceData;
  capabilities: {
    voiceEdit: boolean;
    aiTranscription: boolean;
    aiNoteGeneration: boolean;
  };
};

function arraysToText(values: string[]) {
  return values.join("\n");
}

function textToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

const audioSourceLabels: Record<string, string> = {
  browser_recording: "Browser-Aufnahme",
  upload: "Upload",
  voice_edit: "Sprachbearbeitung"
};

const additionalTextSourceLabels: Record<string, string> = {
  additional_text: "Zusätzlicher Text",
  previous_note: "Frühere Notiz",
  intake_form: "Digitale Aufnahme",
  chat: "Chat"
};

export function ConsultationWorkspace({ workspace: initialWorkspace, capabilities }: Props) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [noteDraft, setNoteDraft] = useState<SoapNote | null>(initialWorkspace.note?.structured_json ?? null);
  const [voiceInstruction, setVoiceInstruction] = useState("");
  const [conversationTitle, setConversationTitle] = useState(initialWorkspace.consultation.patient_reference);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showAdditionalTextForm, setShowAdditionalTextForm] = useState(false);
  const [additionalTextTitle, setAdditionalTextTitle] = useState("");
  const [additionalTextContent, setAdditionalTextContent] = useState("");
  const [additionalTextSourceType, setAdditionalTextSourceType] = useState<"additional_text" | "previous_note" | "intake_form" | "chat">(
    "additional_text"
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(initialWorkspace.consultation.status === "paused");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [clipboardExportText, setClipboardExportText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pauseAfterStopRef = useRef(false);
  const voiceInputRef = useRef<HTMLInputElement | null>(null);

  const canGenerateNote = Boolean(workspace.latestTranscript?.status === "ready" || workspace.additionalTexts.length);
  const canApprove = Boolean(workspace.note && workspace.note.status !== "approved");
  const canExport = Boolean(workspace.note && workspace.note.status === "approved");
  const currentVersion = workspace.note?.current_version ?? 0;
  const isLanguageDetectionEnabled = workspace.consultation.spoken_language === LANGUAGE_DETECT_VALUE;
  const careProtocolLabels = getCareProtocolLabels(workspace.consultation.care_protocols);

  const noteSectionFields = useMemo(() => {
    if (!noteDraft) {
      return null;
    }

    return {
      subjectiveChiefComplaint: noteDraft.sections.subjective.chiefComplaint,
      subjectiveHpi: noteDraft.sections.subjective.historyOfPresentIllness,
      subjectiveSymptoms: arraysToText(noteDraft.sections.subjective.reportedSymptoms),
      objectiveExam: arraysToText(noteDraft.sections.objective.examFindings),
      objectiveObservations: arraysToText(noteDraft.sections.objective.observations),
      objectiveVitals: arraysToText(noteDraft.sections.objective.vitals),
      assessmentSummary: noteDraft.sections.assessment.clinicalSummary,
      assessmentDiagnoses: arraysToText(noteDraft.sections.assessment.possibleDiagnoses),
      planMeds: arraysToText(noteDraft.sections.plan.medications),
      planFollowUp: noteDraft.sections.plan.followUp,
      planReferrals: arraysToText(noteDraft.sections.plan.referrals),
      planTests: arraysToText(noteDraft.sections.plan.testsOrdered),
      planInstructions: arraysToText(noteDraft.sections.plan.instructions),
      openQuestions: arraysToText(noteDraft.openQuestions),
      riskFlags: arraysToText(noteDraft.riskFlags)
    };
  }, [noteDraft]);

  async function refreshWorkspace() {
    const response = await fetch(`/api/consultations/${workspace.consultation.id}`, {
      cache: "no-store"
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error?.message ?? "Arbeitsbereich konnte nicht aktualisiert werden.");
    }

    setWorkspace(payload.data);
    setNoteDraft(payload.data.note?.structured_json ?? null);
    setConversationTitle(payload.data.consultation.patient_reference);
    setIsPaused(payload.data.consultation.status === "paused");
  }

  async function runAction(action: string, callback: () => Promise<void>) {
    setBusyAction(action);
    setError(null);
    setSuccessMessage(null);

    try {
      await callback();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Aktion fehlgeschlagen.");
    } finally {
      setBusyAction(null);
    }
  }

  async function waitForJob<T>(job: {
    id: string;
    status: "queued" | "processing" | "completed" | "failed";
    result?: unknown;
    errorMessage?: string | null;
  }): Promise<T> {
    let currentJob = job;

    for (let attempt = 0; attempt < 120; attempt += 1) {
      if (currentJob.status === "completed") {
        return currentJob.result as T;
      }

      if (currentJob.status === "failed") {
        throw new Error(currentJob.errorMessage ?? "Job fehlgeschlagen.");
      }

      await new Promise((resolve) => setTimeout(resolve, attempt < 5 ? 500 : 1500));
      const response = await fetch(`/api/jobs/${currentJob.id}`, {
        cache: "no-store"
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Job-Status konnte nicht geladen werden.");
      }

      currentJob = payload.data.job;
    }

    throw new Error("Job laeuft laenger als erwartet. Bitte Arbeitsbereich aktualisieren.");
  }

  async function startAsyncJob<T>(response: Response, fallbackMessage: string) {
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message ?? fallbackMessage);
    }

    return waitForJob<T>(payload.data.job);
  }

  async function copyTextToClipboard(text: string) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall back to a temporary selection for browsers that lose clipboard permission after async work.
      }
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "true");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.select();

    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textArea);
    }
  }

  async function uploadAudio(file: File, source: "browser_recording" | "upload") {
    const initiate = await fetch(`/api/consultations/${workspace.consultation.id}/audio/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        source
      })
    });

    const initiatePayload = await initiate.json();
    if (!initiate.ok) {
      throw new Error(initiatePayload.error?.message ?? "Audio-Upload konnte nicht gestartet werden.");
    }

    const supabase = createClient();
    const upload = await supabase.storage
      .from(initiatePayload.data.bucket)
      .uploadToSignedUrl(initiatePayload.data.storagePath, initiatePayload.data.token, file);

    if (upload.error) {
      throw new Error(upload.error.message);
    }

    const complete = await fetch(`/api/consultations/${workspace.consultation.id}/audio/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        storagePath: initiatePayload.data.storagePath,
        mimeType: file.type,
        fileSizeBytes: file.size,
        source
      })
    });

    const completePayload = await complete.json();
    if (!complete.ok) {
      throw new Error(completePayload.error?.message ?? "Audio-Upload konnte nicht abgeschlossen werden.");
    }

    await refreshWorkspace();
    setSuccessMessage("Audio erfolgreich hochgeladen.");
  }

  async function updateConsultationFields(input: { patientReference?: string; status?: string }) {
    const response = await fetch(`/api/consultations/${workspace.consultation.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error?.message ?? "Gespräch konnte nicht aktualisiert werden.");
    }

    setWorkspace((current) => ({
      ...current,
      consultation: {
        ...current.consultation,
        ...payload.data
      }
    }));
    router.refresh();

    return payload.data;
  }

  async function saveConversationTitle() {
    const nextTitle = conversationTitle.trim();

    if (!nextTitle) {
      setError("Der Gesprächstitel darf nicht leer sein.");
      return;
    }

    await runAction("save-title", async () => {
      await updateConsultationFields({ patientReference: nextTitle });
      setIsEditingTitle(false);
      setSuccessMessage("Gesprächstitel aktualisiert.");
    });
  }

  async function onFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await runAction("upload", async () => {
      await uploadAudio(file, "upload");
    });
  }

  async function startRecording() {
    await runAction("record", async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        const shouldPauseAfterUpload = pauseAfterStopRef.current;
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const file = new File([blob], `consultation-${Date.now()}.webm`, { type: "audio/webm" });
          await uploadAudio(file, "browser_recording");
          if (shouldPauseAfterUpload) {
            await updateConsultationFields({ status: "paused" });
            setSuccessMessage("Gespräch pausiert.");
          }
        } catch (recordingError) {
          setError(recordingError instanceof Error ? recordingError.message : "Aufnahme-Upload fehlgeschlagen.");
        } finally {
          pauseAfterStopRef.current = false;
          stream.getTracks().forEach((track) => track.stop());
          setBusyAction(null);
          setIsRecording(false);
          setIsPaused(shouldPauseAfterUpload);
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      await updateConsultationFields({ status: "recording" });
      setIsRecording(true);
      setIsPaused(false);
      setSuccessMessage("Aufnahme laeuft.");
    });
  }

  async function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    setBusyAction("upload");
  }

  async function pauseRecording() {
    const recorder = recorderRef.current;

    if (recorder?.state === "recording") {
      pauseAfterStopRef.current = true;
      recorder.stop();
      setBusyAction("upload");
      setIsRecording(false);
      setIsPaused(true);
      return;
    }

    await runAction("pause", async () => {
      await updateConsultationFields({ status: "paused" });
      setIsRecording(false);
      setIsPaused(true);
      setSuccessMessage("Gespräch pausiert.");
    });
  }

  async function resumeRecording() {
    const recorder = recorderRef.current;

    if (recorder?.state === "paused") {
      await runAction("resume", async () => {
        recorder.resume();
        await updateConsultationFields({ status: "recording" });
        setIsRecording(true);
        setIsPaused(false);
        setSuccessMessage("Aufnahme fortgesetzt.");
      });
      return;
    }

    await startRecording();
  }

  async function transcribeAudio() {
    if (!workspace.latestAudioAsset) {
      return;
    }

    await runAction("transcribe", async () => {
      const response = await fetch(`/api/consultations/${workspace.consultation.id}/transcribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          audioAssetId: workspace.latestAudioAsset?.id
        })
      });
      await startAsyncJob(response, "Transkription fehlgeschlagen.");

      await refreshWorkspace();
      setSuccessMessage("Transkript bereit.");
    });
  }

  async function addAdditionalText() {
    if (!additionalTextTitle.trim() || !additionalTextContent.trim()) {
      setError("Titel und Text sind erforderlich.");
      return;
    }

    await runAction("additional-text", async () => {
      const response = await fetch(`/api/consultations/${workspace.consultation.id}/additional-texts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: additionalTextTitle,
          content: additionalTextContent,
          sourceType: additionalTextSourceType
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Zusätzlicher Text konnte nicht gespeichert werden.");
      }

      await refreshWorkspace();
      setAdditionalTextTitle("");
      setAdditionalTextContent("");
      setAdditionalTextSourceType("additional_text");
      setShowAdditionalTextForm(false);
      setSuccessMessage("Zusätzlicher Text hinzugefügt.");
    });
  }

  async function deleteAdditionalText(additionalTextId: string) {
    await runAction("delete-additional-text", async () => {
      const response = await fetch(
        `/api/consultations/${workspace.consultation.id}/additional-texts/${additionalTextId}`,
        {
          method: "DELETE"
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Zusätzlicher Text konnte nicht gelöscht werden.");
      }

      await refreshWorkspace();
      setSuccessMessage("Zusätzlicher Text entfernt.");
    });
  }

  async function generateNote() {
    const transcript = workspace.latestTranscript;
    if (!transcript && !workspace.additionalTexts.length) {
      return;
    }

    await runAction("generate", async () => {
      const response = await fetch(`/api/consultations/${workspace.consultation.id}/generate-note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transcriptId: undefined,
          idempotencyKey: `${workspace.consultation.id}:${transcript?.id ?? "additional-text"}:${workspace.additionalTexts.map((item) => item.id).join(",")}:${workspace.note?.current_version ?? 0}`
        })
      });
      await startAsyncJob(response, "Notizentwurf konnte nicht erstellt werden.");

      await refreshWorkspace();
      setSuccessMessage("Notizentwurf erstellt.");
    });
  }

  async function saveManualEdits() {
    const note = workspace.note;
    if (!note || !noteDraft) {
      return;
    }

    await runAction("save-note", async () => {
      const response = await fetch(`/api/consultations/${workspace.consultation.id}/edit-note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          noteId: note.id,
          editMode: "manual",
          patch: {
            sections: noteDraft.sections,
            openQuestions: noteDraft.openQuestions,
            riskFlags: noteDraft.riskFlags
          }
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Manuelle Notizaktualisierung fehlgeschlagen.");
      }

      await refreshWorkspace();
      setSuccessMessage("Notizentwurf aktualisiert.");
    });
  }

  async function previewVoiceEdit() {
    const file = voiceInputRef.current?.files?.[0];
    if (!file) {
      throw new Error("Bitte zuerst eine Audiodatei mit Sprachbefehl auswaehlen.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/consultations/${workspace.consultation.id}/voice-edit/preview`, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message ?? "Sprachbearbeitung konnte nicht transkribiert werden.");
    }

    setVoiceInstruction(payload.data.instructionText);
    setSuccessMessage("Vorschau des Sprachbefehls bereit.");
  }

  async function applyVoiceEdit() {
    const note = workspace.note;
    if (!note || !voiceInstruction.trim()) {
      return;
    }

    await runAction("voice-edit", async () => {
      const response = await fetch(`/api/consultations/${workspace.consultation.id}/voice-edit/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          noteId: note.id,
          instructionText: voiceInstruction
        })
      });
      await startAsyncJob(response, "Sprachbearbeitung fehlgeschlagen.");

      await refreshWorkspace();
      setVoiceInstruction("");
      if (voiceInputRef.current) {
        voiceInputRef.current.value = "";
      }
      setSuccessMessage("Sprachbearbeitung angewendet.");
    });
  }

  async function approveNote() {
    const note = workspace.note;
    if (!note) {
      return;
    }

    await runAction("approve", async () => {
      const response = await fetch(`/api/consultations/${workspace.consultation.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          noteId: note.id,
          expectedVersion: currentVersion
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Freigabe fehlgeschlagen.");
      }

      await refreshWorkspace();
      setSuccessMessage("Notiz freigegeben.");
    });
  }

  async function exportClipboard() {
    const note = workspace.note;
    if (!note) {
      return;
    }

    await runAction("export-clipboard", async () => {
      const response = await fetch(`/api/consultations/${workspace.consultation.id}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          noteId: note.id,
          exportType: "clipboard",
          idempotencyKey: `${note.id}:${note.current_version}:clipboard`
        })
      });
      const result = await startAsyncJob<{ content: string }>(
        response,
        "Export in die Zwischenablage fehlgeschlagen."
      );

      setClipboardExportText(result.content);
      const copied = await copyTextToClipboard(result.content);
      setSuccessMessage(
        copied
          ? "Freigegebene Notiz in die Zwischenablage kopiert."
          : "Freigegebene Notiz erstellt. Text kann unten manuell kopiert werden."
      );
    });
  }

  async function exportPdf() {
    const note = workspace.note;
    if (!note) {
      return;
    }

    await runAction("export-pdf", async () => {
      const response = await fetch(`/api/consultations/${workspace.consultation.id}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          noteId: note.id,
          exportType: "pdf",
          idempotencyKey: `${note.id}:${note.current_version}:pdf`
        })
      });
      const result = await startAsyncJob<{ downloadUrl: string }>(response, "PDF-Export fehlgeschlagen.");

      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
      setSuccessMessage("PDF-Export bereit.");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {isEditingTitle ? (
                <div className="flex min-w-[260px] items-center gap-2">
                  <Input
                    className="h-11 text-lg font-semibold"
                    value={conversationTitle}
                    onChange={(event) => setConversationTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void saveConversationTitle();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    title="Titel speichern"
                    disabled={busyAction !== null}
                    onClick={() => void saveConversationTitle()}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold">{workspace.consultation.patient_reference}</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Gesprächstitel bearbeiten"
                    disabled={busyAction !== null}
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <StatusBadge status={workspace.consultation.status} />
              <Badge variant={workspace.note?.status === "approved" ? "success" : "warning"}>
                {workspace.note?.status === "approved" ? "Freigegebene Notiz" : "KI-Entwurf"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span>Fachbereich: {workspace.consultation.specialty}</span>
              <span>Sprache: {languageLabel(workspace.consultation.spoken_language)}</span>
              {workspace.latestTranscript?.detected_language ? (
                <span>Erkannt: {languageLabel(workspace.latestTranscript.detected_language)}</span>
              ) : null}
              <span>Gestartet: {new Date(workspace.consultation.created_at).toLocaleString()}</span>
            </div>
            {careProtocolLabels.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {careProtocolLabels.map((label) => (
                  <Badge key={label}>{label}</Badge>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {!isPaused ? (
              <Button
                variant="outline"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={busyAction !== null && busyAction !== "record"}
              >
                <Mic className="mr-2 h-4 w-4" />
                {isRecording ? "Aufnahme beenden" : "Aufnahme starten"}
              </Button>
            ) : null}
            {isRecording ? (
              <Button variant="outline" onClick={pauseRecording} disabled={busyAction !== null}>
                <Pause className="mr-2 h-4 w-4" />
                Gespräch pausieren
              </Button>
            ) : null}
            {isPaused ? (
              <Button variant="outline" onClick={resumeRecording} disabled={busyAction !== null}>
                <Play className="mr-2 h-4 w-4" />
                Gespräch fortsetzen
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setShowAdditionalTextForm((current) => !current)} disabled={busyAction !== null}>
              <FileText className="mr-2 h-4 w-4" />
              Zusätzlichen Text hinzufügen
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={busyAction !== null}>
              <FileAudio className="mr-2 h-4 w-4" />
              Audio hochladen
            </Button>
            <input ref={fileInputRef} className="hidden" type="file" accept="audio/*" onChange={onFileUpload} />
            <Button
              variant="outline"
              onClick={transcribeAudio}
              disabled={!workspace.latestAudioAsset || busyAction !== null || !capabilities.aiTranscription}
            >
              {busyAction === "transcribe" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Transkribieren
            </Button>
            <Button onClick={generateNote} disabled={!canGenerateNote || busyAction !== null || !capabilities.aiNoteGeneration}>
              {busyAction === "generate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
              {workspace.note ? "Entwurf neu erstellen" : "Notizentwurf erstellen"}
            </Button>
            <Button variant="outline" onClick={approveNote} disabled={!canApprove || busyAction !== null}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Freigeben
            </Button>
            <Button variant="outline" onClick={exportPdf} disabled={!canExport || busyAction !== null}>
              <Download className="mr-2 h-4 w-4" />
              PDF exportieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {successMessage ? (
        <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">{successMessage}</div>
      ) : null}
      {isLanguageDetectionEnabled ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <p className="font-medium">Sprache erkennen ist aktiv.</p>
          <p className="mt-1 text-muted-foreground">
            Die gesprochene Sprache wird automatisch erkannt und die Notiz auf Deutsch erstellt. Prüfen Sie Übersetzung,
            Medikamente, Allergien, Dosierungen und Verfahren sorgfältig.
          </p>
        </div>
      ) : null}
      {!capabilities.aiTranscription ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          KI-Transkription ist aktuell deaktiviert. Audio kann weiter erfasst werden, die automatische Verarbeitung ist aber gesperrt.
        </div>
      ) : null}
      {!capabilities.aiNoteGeneration ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          KI-Notizerstellung ist aktuell deaktiviert. Entwürfe lassen sich erst nach erneuter Freigabe dieser Funktion erzeugen.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Steuerung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <div>
              <p className="font-medium">Aktuelle Audiodatei</p>
              {workspace.latestAudioAsset ? (
                <div className="mt-2 rounded-lg bg-secondary/60 p-3">
                  <p>{audioSourceLabels[workspace.latestAudioAsset.source] ?? workspace.latestAudioAsset.source}</p>
                  <p className="text-xs text-muted-foreground">{workspace.latestAudioAsset.mime_type}</p>
                </div>
              ) : (
                <p className="mt-2 text-muted-foreground">Noch kein Audio hochgeladen.</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">Zusätzlicher Text</p>
                <Badge>{workspace.additionalTexts.length}</Badge>
              </div>

              {showAdditionalTextForm ? (
                <div className="space-y-3 rounded-lg border bg-background p-3">
                  <Input
                    placeholder="Titel, z. B. Frühere Arztnotiz"
                    value={additionalTextTitle}
                    onChange={(event) => setAdditionalTextTitle(event.target.value)}
                  />
                  <select
                    className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                    value={additionalTextSourceType}
                    onChange={(event) =>
                      setAdditionalTextSourceType(
                        event.target.value as "additional_text" | "previous_note" | "intake_form" | "chat"
                      )
                    }
                  >
                    <option value="additional_text">Zusätzlicher Text</option>
                    <option value="previous_note">Frühere Notiz</option>
                    <option value="intake_form">Digitale Aufnahme</option>
                    <option value="chat">Chat</option>
                  </select>
                  <Textarea
                    className="min-h-[180px]"
                    placeholder="Fügen Sie relevante Informationen ein, z. B. Vorbefunde, frühere Notizen oder Chatverlauf."
                    value={additionalTextContent}
                    onChange={(event) => setAdditionalTextContent(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={addAdditionalText}
                      disabled={busyAction !== null || !additionalTextTitle.trim() || !additionalTextContent.trim()}
                    >
                      {busyAction === "additional-text" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Hinzufügen
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAdditionalTextForm(false)}>
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : null}

              {workspace.additionalTexts.length ? (
                <div className="space-y-2">
                  {workspace.additionalTexts.map((additionalText) => (
                    <div key={additionalText.id} className="rounded-lg bg-secondary/60 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{additionalText.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {additionalTextSourceLabels[additionalText.source_type]} ·{" "}
                            {new Date(additionalText.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Zusätzlichen Text löschen"
                          disabled={busyAction !== null}
                          onClick={() => deleteAdditionalText(additionalText.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">
                        {additionalText.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Frühere Notizen, digitale Aufnahmen oder Chatverläufe können die Notizerstellung ergänzen.
                </p>
              )}
            </div>

            <div>
              <p className="font-medium">Validierungshinweise</p>
              {workspace.warnings.length ? (
                <ul className="mt-2 space-y-2">
                  {workspace.warnings.map((warning) => (
                    <li key={warning.code} className="rounded-lg bg-warning/10 p-3">
                      <p className="font-medium">{warning.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {warning.section} · {warning.severity}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-muted-foreground">Aktuell keine Validierungshinweise.</p>
              )}
            </div>

            {capabilities.voiceEdit ? (
              <div className="space-y-3">
                <p className="font-medium">Sprachbearbeitung</p>
                <input ref={voiceInputRef} type="file" accept="audio/*" className="block w-full text-xs" />
                <Button variant="outline" className="w-full" onClick={() => runAction("voice-preview", previewVoiceEdit)} disabled={busyAction !== null}>
                  Sprachbefehl voranzeigen
                </Button>
                <Textarea
                  placeholder="Die Vorschau des Sprachbefehls erscheint hier. Sie koennen den Text vor dem Anwenden noch verfeinern."
                  value={voiceInstruction}
                  onChange={(event) => setVoiceInstruction(event.target.value)}
                />
                <Button className="w-full" onClick={applyVoiceEdit} disabled={!workspace.note || !voiceInstruction.trim() || busyAction !== null}>
                  Sprachbearbeitung anwenden
                </Button>
              </div>
            ) : null}

            <div className="space-y-3">
              <p className="font-medium">Freigegebener Export</p>
              <Button variant="outline" className="w-full" onClick={exportClipboard} disabled={!canExport || busyAction !== null}>
                Freigegebenen Text kopieren
              </Button>
              {clipboardExportText ? (
                <Textarea
                  readOnly
                  value={clipboardExportText}
                  className="min-h-[220px] text-xs leading-5"
                  onFocus={(event) => event.currentTarget.select()}
                />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[420px] lg:min-h-[640px]">
          <CardHeader>
            <CardTitle>Transkript</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workspace.latestTranscript ? (
              <>
                <div className="flex items-center gap-3">
                  <StatusBadge status={workspace.latestTranscript.status} />
                  <span className="text-sm text-muted-foreground">
                    Anbieter: {workspace.latestTranscript.provider}
                  </span>
                  {workspace.latestTranscript.detected_language ? (
                    <span className="text-sm text-muted-foreground">
                      Erkannt: {languageLabel(workspace.latestTranscript.detected_language)}
                    </span>
                  ) : null}
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6">{workspace.latestTranscript.raw_text}</p>
                </div>
              </>
            ) : (
              <div className="flex min-h-[320px] lg:h-[520px] items-center justify-center rounded-lg border border-dashed px-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Beratungs-Audio aufnehmen oder hochladen und anschliessend transkribieren. Alternativ kann eine Notiz
                  ausschließlich aus zusätzlichem Text erstellt werden.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[420px] lg:min-h-[640px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Notizbereich</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="warning">{workspace.warnings.length} Hinweise</Badge>
              <StatusBadge status={workspace.note?.status ?? "not_started"} />
            </div>
          </CardHeader>
          <CardContent>
            {workspace.note && noteDraft && noteSectionFields ? (
              <div className="space-y-5">
                <div className="rounded-lg border bg-background p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{workspace.note.rendered_text}</pre>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <p className="font-medium">Subjektiv: Hauptanliegen</p>
                    <Textarea
                      value={noteSectionFields.subjectiveChiefComplaint}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  subjective: {
                                    ...current.sections.subjective,
                                    chiefComplaint: event.target.value
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Aktuelle Krankengeschichte</p>
                    <Textarea
                      value={noteSectionFields.subjectiveHpi}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  subjective: {
                                    ...current.sections.subjective,
                                    historyOfPresentIllness: event.target.value
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Berichtete Symptome</p>
                    <Textarea
                      value={noteSectionFields.subjectiveSymptoms}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  subjective: {
                                    ...current.sections.subjective,
                                    reportedSymptoms: textToArray(event.target.value)
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Einschaetzung</p>
                    <Textarea
                      value={noteSectionFields.assessmentSummary}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  assessment: {
                                    ...current.sections.assessment,
                                    clinicalSummary: event.target.value
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Objektive Befunde</p>
                    <Textarea
                      value={noteSectionFields.objectiveExam}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  objective: {
                                    ...current.sections.objective,
                                    examFindings: textToArray(event.target.value)
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Beobachtungen</p>
                    <Textarea
                      value={noteSectionFields.objectiveObservations}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  objective: {
                                    ...current.sections.objective,
                                    observations: textToArray(event.target.value)
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Vitalwerte</p>
                    <Textarea
                      value={noteSectionFields.objectiveVitals}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  objective: {
                                    ...current.sections.objective,
                                    vitals: textToArray(event.target.value)
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Moegliche Diagnosen</p>
                    <Textarea
                      value={noteSectionFields.assessmentDiagnoses}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  assessment: {
                                    ...current.sections.assessment,
                                    possibleDiagnoses: textToArray(event.target.value)
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Medikation</p>
                    <Textarea
                      value={noteSectionFields.planMeds}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  plan: {
                                    ...current.sections.plan,
                                    medications: textToArray(event.target.value)
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Anweisungen im Plan</p>
                    <Textarea
                      value={noteSectionFields.planInstructions}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  plan: {
                                    ...current.sections.plan,
                                    instructions: textToArray(event.target.value)
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Nachsorge</p>
                    <Textarea
                      value={noteSectionFields.planFollowUp}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  plan: {
                                    ...current.sections.plan,
                                    followUp: event.target.value
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Ueberweisungen</p>
                    <Textarea
                      value={noteSectionFields.planReferrals}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  plan: {
                                    ...current.sections.plan,
                                    referrals: textToArray(event.target.value)
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Angeforderte Tests</p>
                    <Textarea
                      value={noteSectionFields.planTests}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  plan: {
                                    ...current.sections.plan,
                                    testsOrdered: textToArray(event.target.value)
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Offene Fragen</p>
                    <Textarea
                      value={noteSectionFields.openQuestions}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                openQuestions: textToArray(event.target.value)
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Risikohinweise</p>
                    <Textarea
                      value={noteSectionFields.riskFlags}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                riskFlags: textToArray(event.target.value)
                              }
                            : current
                        )
                      }
                    />
                  </div>
                </div>

                <Button onClick={saveManualEdits} disabled={busyAction !== null}>
                  Notizaenderungen speichern
                </Button>
              </div>
            ) : (
              <div className="flex min-h-[320px] lg:h-[520px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Erstellen Sie einen Notizentwurf, sobald das Transkript bereit ist. Der strukturierte SOAP-Editor erscheint dann hier.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
