"use client";

import { useMemo, useRef, useState } from "react";
import { Download, FileAudio, Loader2, Mic, ShieldCheck, WandSparkles } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { SoapNote } from "@/schemas/note";
import { createClient } from "@/server/supabase/browser";
import type { ConsultationWorkspaceData } from "@/server/services/consultation-service";

type Props = {
  workspace: ConsultationWorkspaceData;
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

export function ConsultationWorkspace({ workspace: initialWorkspace }: Props) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [noteDraft, setNoteDraft] = useState<SoapNote | null>(initialWorkspace.note?.structured_json ?? null);
  const [voiceInstruction, setVoiceInstruction] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const voiceInputRef = useRef<HTMLInputElement | null>(null);

  const canGenerateNote = Boolean(workspace.latestTranscript);
  const canApprove = Boolean(workspace.note && workspace.note.status !== "approved");
  const canExport = Boolean(workspace.note && workspace.note.status === "approved");
  const currentVersion = workspace.note?.current_version ?? 0;

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
      assessmentIcdCodes: arraysToText(noteDraft.sections.assessment.possibleIcdCodes),
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
      throw new Error(payload.error?.message ?? "Workspace refresh failed.");
    }

    setWorkspace(payload.data);
    setNoteDraft(payload.data.note?.structured_json ?? null);
  }

  async function runAction(action: string, callback: () => Promise<void>) {
    setBusyAction(action);
    setError(null);
    setSuccessMessage(null);

    try {
      await callback();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setBusyAction(null);
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
      throw new Error(initiatePayload.error?.message ?? "Audio upload could not be initiated.");
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
      throw new Error(completePayload.error?.message ?? "Audio upload could not be completed.");
    }

    await refreshWorkspace();
    setSuccessMessage("Audio uploaded successfully.");
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
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const file = new File([blob], `consultation-${Date.now()}.webm`, { type: "audio/webm" });
          await uploadAudio(file, "browser_recording");
        } catch (recordingError) {
          setError(recordingError instanceof Error ? recordingError.message : "Recording upload failed.");
        } finally {
          stream.getTracks().forEach((track) => track.stop());
          setBusyAction(null);
          setIsRecording(false);
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setSuccessMessage("Recording in progress.");
    });
  }

  async function stopRecording() {
    recorderRef.current?.stop();
    setBusyAction("upload");
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
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Transcription failed.");
      }

      await refreshWorkspace();
      setSuccessMessage("Transcript ready.");
    });
  }

  async function generateNote() {
    const transcript = workspace.latestTranscript;
    if (!transcript) {
      return;
    }

    await runAction("generate", async () => {
      const response = await fetch(`/api/consultations/${workspace.consultation.id}/generate-note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transcriptId: transcript.id,
          idempotencyKey: `${workspace.consultation.id}-${transcript.id}-${Date.now()}`
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Draft note generation failed.");
      }

      await refreshWorkspace();
      setSuccessMessage("Draft note generated.");
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
        throw new Error(payload.error?.message ?? "Manual note update failed.");
      }

      await refreshWorkspace();
      setSuccessMessage("Draft note updated.");
    });
  }

  async function previewVoiceEdit() {
    const file = voiceInputRef.current?.files?.[0];
    if (!file) {
      throw new Error("Select a voice instruction audio clip first.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/consultations/${workspace.consultation.id}/voice-edit/preview`, {
      method: "POST",
      body: formData
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message ?? "Voice edit could not be transcribed.");
    }

    setVoiceInstruction(payload.data.instructionText);
    setSuccessMessage("Voice instruction preview ready.");
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
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Voice edit failed.");
      }

      await refreshWorkspace();
      setVoiceInstruction("");
      if (voiceInputRef.current) {
        voiceInputRef.current.value = "";
      }
      setSuccessMessage("Voice edit applied.");
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
        throw new Error(payload.error?.message ?? "Approval failed.");
      }

      await refreshWorkspace();
      setSuccessMessage("Note approved.");
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
          exportType: "clipboard"
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Clipboard export failed.");
      }

      await navigator.clipboard.writeText(payload.data.content);
      setSuccessMessage("Approved note copied to clipboard.");
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
          exportType: "pdf"
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "PDF export failed.");
      }

      window.open(payload.data.downloadUrl, "_blank", "noopener,noreferrer");
      setSuccessMessage("PDF export ready.");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold">{workspace.consultation.patient_reference}</h2>
              <StatusBadge status={workspace.consultation.status} />
              <Badge variant={workspace.note?.status === "approved" ? "success" : "warning"}>
                {workspace.note?.status === "approved" ? "Approved Note" : "AI Draft"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span>Specialty: {workspace.consultation.specialty}</span>
              <span>Language: {workspace.consultation.spoken_language}</span>
              <span>Started: {new Date(workspace.consultation.created_at).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={isRecording ? stopRecording : startRecording} disabled={busyAction !== null && busyAction !== "record"}>
              <Mic className="mr-2 h-4 w-4" />
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={busyAction !== null}>
              <FileAudio className="mr-2 h-4 w-4" />
              Upload Audio
            </Button>
            <input ref={fileInputRef} className="hidden" type="file" accept="audio/*" onChange={onFileUpload} />
            <Button variant="outline" onClick={transcribeAudio} disabled={!workspace.latestAudioAsset || busyAction !== null}>
              {busyAction === "transcribe" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Transcribe
            </Button>
            <Button onClick={generateNote} disabled={!canGenerateNote || busyAction !== null}>
              {busyAction === "generate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
              {workspace.note ? "Regenerate Draft" : "Generate Draft Note"}
            </Button>
            <Button variant="outline" onClick={approveNote} disabled={!canApprove || busyAction !== null}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button variant="outline" onClick={exportPdf} disabled={!canExport || busyAction !== null}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {successMessage ? (
        <div className="rounded-2xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">{successMessage}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <div>
              <p className="font-medium">Latest Audio Asset</p>
              {workspace.latestAudioAsset ? (
                <div className="mt-2 rounded-xl bg-secondary/60 p-3">
                  <p>{workspace.latestAudioAsset.source.replace("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{workspace.latestAudioAsset.mime_type}</p>
                </div>
              ) : (
                <p className="mt-2 text-muted-foreground">No audio uploaded yet.</p>
              )}
            </div>

            <div>
              <p className="font-medium">Validation Warnings</p>
              {workspace.warnings.length ? (
                <ul className="mt-2 space-y-2">
                  {workspace.warnings.map((warning) => (
                    <li key={warning.code} className="rounded-xl bg-warning/10 p-3">
                      <p className="font-medium">{warning.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {warning.section} · {warning.severity}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-muted-foreground">No validation warnings at the moment.</p>
              )}
            </div>

            <div className="space-y-3">
              <p className="font-medium">Voice Edit</p>
              <input ref={voiceInputRef} type="file" accept="audio/*" className="block w-full text-xs" />
              <Button variant="outline" className="w-full" onClick={() => runAction("voice-preview", previewVoiceEdit)} disabled={busyAction !== null}>
                Preview Voice Instruction
              </Button>
              <Textarea
                placeholder="Voice instruction preview will appear here. You can also refine it before applying."
                value={voiceInstruction}
                onChange={(event) => setVoiceInstruction(event.target.value)}
              />
              <Button className="w-full" onClick={applyVoiceEdit} disabled={!workspace.note || !voiceInstruction.trim() || busyAction !== null}>
                Apply Voice Edit
              </Button>
            </div>

            <div className="space-y-3">
              <p className="font-medium">Approved Export</p>
              <Button variant="outline" className="w-full" onClick={exportClipboard} disabled={!canExport || busyAction !== null}>
                Copy Approved Text
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[640px]">
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workspace.latestTranscript ? (
              <>
                <div className="flex items-center gap-3">
                  <StatusBadge status={workspace.latestTranscript.status} />
                  <span className="text-sm text-muted-foreground">
                    Provider: {workspace.latestTranscript.provider}
                  </span>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6">{workspace.latestTranscript.raw_text}</p>
                </div>
              </>
            ) : (
              <div className="flex h-[520px] items-center justify-center rounded-2xl border border-dashed px-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Record or upload consultation audio, then transcribe it to populate the transcript panel.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[640px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Note Panel</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="warning">{workspace.warnings.length} warnings</Badge>
              <StatusBadge status={workspace.note?.status ?? "not_started"} />
            </div>
          </CardHeader>
          <CardContent>
            {workspace.note && noteDraft && noteSectionFields ? (
              <div className="space-y-5">
                <div className="rounded-2xl border bg-background p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{workspace.note.rendered_text}</pre>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <p className="font-medium">Subjective: Chief Complaint</p>
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
                    <p className="font-medium">History of Present Illness</p>
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
                    <p className="font-medium">Reported Symptoms</p>
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
                    <p className="font-medium">Assessment Summary</p>
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
                    <p className="font-medium">Objective Findings</p>
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
                    <p className="font-medium">Observations</p>
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
                    <p className="font-medium">Vitals</p>
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
                    <p className="font-medium">Possible Diagnoses</p>
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
                    <p className="font-medium">ICD-10-GM Candidates</p>
                    <Textarea
                      value={noteSectionFields.assessmentIcdCodes}
                      onChange={(event) =>
                        setNoteDraft((current) =>
                          current
                            ? {
                                ...current,
                                sections: {
                                  ...current.sections,
                                  assessment: {
                                    ...current.sections.assessment,
                                    possibleIcdCodes: textToArray(event.target.value)
                                  }
                                }
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Medications</p>
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
                    <p className="font-medium">Plan Instructions</p>
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
                    <p className="font-medium">Follow Up</p>
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
                    <p className="font-medium">Referrals</p>
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
                    <p className="font-medium">Tests Ordered</p>
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
                    <p className="font-medium">Open Questions</p>
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
                    <p className="font-medium">Risk Flags</p>
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
                  Save Note Changes
                </Button>
              </div>
            ) : (
              <div className="flex h-[520px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Generate a draft note once the transcript is ready. The deterministic SOAP renderer and structured editor will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
