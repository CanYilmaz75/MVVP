"use client";

import { useMemo, useRef, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import {
  Check,
  ClipboardCopy,
  FileAudio,
  Loader2,
  Mic,
  PauseCircle,
  RotateCcw,
  ShieldAlert,
  Sparkles
} from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/server/supabase/browser";
import type { SisAssessment, SisRiskKey, SisRiskLevel, SisTopicKey } from "@/schemas/sis";

type TopicState = {
  personView: string;
  observation: string;
  resources: string;
  supportNeeds: string;
};
type RiskState = {
  relevant: boolean;
  level: SisRiskLevel;
  notes: string;
};
type TopicMap = Record<SisTopicKey, TopicState>;
type RiskMap = Record<SisRiskKey, RiskState>;
type BusyAction = "create-session" | "record" | "upload" | "transcribe" | "extract" | null;
type RecordingMimeType = "audio/webm" | "audio/mp4" | "audio/wav";

const topicDefinitions: Array<{
  key: SisTopicKey;
  title: string;
  prompts: string[];
  guideQuestions: string[];
}> = [
  {
    key: "cognition",
    title: "Kognitive und kommunikative Faehigkeiten",
    prompts: ["Orientierung", "Kommunikation", "Gedaechtnis"],
    guideQuestions: [
      "Wie gut finden Sie sich zeitlich, oertlich und in Situationen zurecht?",
      "Gibt es Momente, in denen Verstehen oder Mitteilen schwerfaellt?",
      "Wer oder was hilft Ihnen, wenn Sie etwas vergessen oder unsicher sind?"
    ]
  },
  {
    key: "mobility",
    title: "Mobilitaet und Beweglichkeit",
    prompts: ["Gehen", "Transfers", "Hilfsmittel"],
    guideQuestions: [
      "Wie kommen Sie aus dem Bett, vom Stuhl hoch oder zur Toilette?",
      "Gab es in letzter Zeit Stuerze oder Situationen, in denen Sie sich unsicher gefuehlt haben?",
      "Welche Hilfsmittel nutzen Sie und funktionieren diese fuer Sie gut?"
    ]
  },
  {
    key: "medical",
    title: "Krankheitsbezogene Anforderungen und Belastungen",
    prompts: ["Diagnosen", "Medikation", "Schmerzen"],
    guideQuestions: [
      "Welche Erkrankungen, Therapien oder Medikamente belasten Sie im Alltag besonders?",
      "Haben Sie Schmerzen, Atemnot, Schwindel oder andere Beschwerden?",
      "Wobei brauchen Sie Unterstuetzung, damit Behandlungen sicher gelingen?"
    ]
  },
  {
    key: "selfCare",
    title: "Selbstversorgung",
    prompts: ["Koerperpflege", "Ernaehrung", "Ausscheidung"],
    guideQuestions: [
      "Was gelingt Ihnen bei Koerperpflege, Ankleiden und Essen selbststaendig?",
      "Wo brauchen Sie Hilfe, Erinnerung oder Vorbereitung?",
      "Gibt es Probleme beim Trinken, Essen, Toilettengang oder bei der Ausscheidung?"
    ]
  },
  {
    key: "social",
    title: "Leben in sozialen Beziehungen",
    prompts: ["Angehoerige", "Aktivitaeten", "Wohlbefinden"],
    guideQuestions: [
      "Welche Menschen sind Ihnen wichtig und wer unterstuetzt Sie?",
      "Welche Gewohnheiten, Aktivitaeten oder Kontakte moechten Sie beibehalten?",
      "Wie geht es Ihnen psychisch, und was gibt Ihnen Sicherheit oder Freude?"
    ]
  },
  {
    key: "housing",
    title: "Wohnen / Haeuslichkeit",
    prompts: ["Wohnsituation", "Sicherheit", "Umfeld"],
    guideQuestions: [
      "Wie ist Ihre Wohnsituation, und wo fuehlen Sie sich sicher oder unsicher?",
      "Gibt es Stolperstellen, fehlende Hilfsmittel oder andere Risiken im Umfeld?",
      "Was muss organisiert sein, damit Versorgung zuhause oder im Zimmer gut funktioniert?"
    ]
  }
];

const riskDefinitions: Array<{ key: SisRiskKey; label: string; guideQuestion: string; actionHint: string }> = [
  {
    key: "fall",
    label: "Sturzrisiko",
    guideQuestion: "Gab es Stuerze, Beinahe-Stuerze oder Angst vor dem Fallen?",
    actionHint: "Transferwege pruefen, Hilfsmittel sichern und Beobachtung bei Lagewechseln festhalten."
  },
  {
    key: "pressureUlcer",
    label: "Dekubitusrisiko",
    guideQuestion: "Liegen oder sitzen Sie lange in gleicher Position, oder gibt es empfindliche Hautstellen?",
    actionHint: "Hautzustand beobachten, Druckentlastung planen und Lagerungsbedarf konkretisieren."
  },
  {
    key: "malnutrition",
    label: "Mangelernaehrung",
    guideQuestion: "Haben Sie weniger Appetit, Gewicht verloren oder trinken Sie weniger als sonst?",
    actionHint: "Ess- und Trinkmenge beobachten, Vorlieben erfassen und Gewichtsverlauf bewerten."
  },
  {
    key: "incontinence",
    label: "Inkontinenz",
    guideQuestion: "Gibt es ungewollten Urin- oder Stuhlverlust oder Probleme, rechtzeitig zur Toilette zu kommen?",
    actionHint: "Ausscheidungsmuster erfassen, Hilfsmittel abstimmen und Hautschutz planen."
  },
  {
    key: "pain",
    label: "Schmerzen",
    guideQuestion: "Wo haben Sie Schmerzen, wie stark sind sie und was hilft dagegen?",
    actionHint: "Schmerzort, Intensitaet, Ausloeser und Wirkung von Massnahmen dokumentieren."
  }
];

const riskLevelLabels: Record<SisRiskLevel, string> = {
  none: "Nicht relevant",
  monitor: "Beobachten",
  action: "Massnahme erforderlich"
};

const emptyTopic: TopicState = {
  personView: "",
  observation: "",
  resources: "",
  supportNeeds: ""
};

function createInitialTopics(): TopicMap {
  return Object.fromEntries(topicDefinitions.map((topic) => [topic.key, { ...emptyTopic }])) as TopicMap;
}

function createInitialRisks(): RiskMap {
  return Object.fromEntries(
    riskDefinitions.map((risk) => [
      risk.key,
      {
        relevant: false,
        level: "none" as SisRiskLevel,
        notes: ""
      }
    ])
  ) as RiskMap;
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function hasTopicContent(topic: TopicState) {
  return Boolean(topic.personView || topic.observation || topic.resources || topic.supportNeeds);
}

function buildTopicSummary(title: string, topic: TopicState) {
  const parts = [
    topic.personView ? `Perspektive: ${topic.personView}` : null,
    topic.observation ? `Einschaetzung: ${topic.observation}` : null,
    topic.resources ? `Ressourcen: ${topic.resources}` : null,
    topic.supportNeeds ? `Unterstuetzung: ${topic.supportNeeds}` : null
  ].filter(Boolean);

  return parts.length ? `${title}: ${parts.join(" | ")}` : null;
}

function mergeTopic(current: TopicState, incoming: TopicState) {
  return {
    personView: incoming.personView || current.personView,
    observation: incoming.observation || current.observation,
    resources: incoming.resources || current.resources,
    supportNeeds: incoming.supportNeeds || current.supportNeeds
  };
}

function mergeRisk(current: RiskState, incoming: RiskState) {
  return {
    relevant: incoming.relevant || current.relevant,
    level: incoming.level !== "none" ? incoming.level : current.level,
    notes: incoming.notes || current.notes
  };
}

function getSupportedRecordingMimeType(): RecordingMimeType {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Audioaufnahme wird in diesem Browser nicht unterstuetzt.");
  }

  const candidates: RecordingMimeType[] = ["audio/webm", "audio/mp4", "audio/wav"];
  const supported = candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));

  if (!supported) {
    throw new Error("Dieser Browser unterstuetzt kein kompatibles Audioformat fuer die SIS-Aufnahme.");
  }

  return supported;
}

export function SisWorkspace() {
  const [patientReference, setPatientReference] = useState("");
  const [whatMatters, setWhatMatters] = useState("");
  const [topics, setTopics] = useState<TopicMap>(createInitialTopics);
  const [risks, setRisks] = useState<RiskMap>(createInitialRisks);
  const [evaluationFocus, setEvaluationFocus] = useState("");
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);
  const [liveNotes, setLiveNotes] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [latestAudioAssetId, setLatestAudioAssetId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState("not_started");
  const [activeTopicKey, setActiveTopicKey] = useState<SisTopicKey>("cognition");
  const [isRecording, setIsRecording] = useState(false);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const completedTopicCount = useMemo(
    () => topicDefinitions.filter((topic) => hasTopicContent(topics[topic.key])).length,
    [topics]
  );

  const relevantRisks = useMemo(
    () =>
      riskDefinitions
        .map((definition) => ({
          ...definition,
          state: risks[definition.key]
        }))
        .filter((risk) => risk.state.relevant),
    [risks]
  );

  const measurePlan = useMemo(() => {
    const topicMeasures = topicDefinitions.flatMap((topic) =>
      splitLines(topics[topic.key].supportNeeds).map((line) => ({
        source: topic.title,
        text: line
      }))
    );

    const riskMeasures = relevantRisks
      .filter((risk) => risk.state.level !== "none")
      .map((risk) => ({
        source: risk.label,
        text: risk.state.notes || risk.actionHint
      }));

    return [...topicMeasures, ...riskMeasures];
  }, [relevantRisks, topics]);

  const activeTopic = topicDefinitions.find((topic) => topic.key === activeTopicKey) ?? topicDefinitions[0]!;
  const activeTopicState = topics[activeTopic.key];

  const guidedQuestions = useMemo(() => {
    const questions: string[] = [];

    if (!whatMatters.trim()) {
      questions.push("Was ist Ihnen im Alltag besonders wichtig, und was soll unbedingt erhalten bleiben?");
    }

    if (!activeTopicState.personView.trim()) {
      questions.push(activeTopic.guideQuestions[0]);
    }

    if (!activeTopicState.observation.trim()) {
      questions.push(activeTopic.guideQuestions[1]);
    }

    if (!activeTopicState.supportNeeds.trim()) {
      questions.push(activeTopic.guideQuestions[2]);
    }

    const missingRiskQuestion = riskDefinitions.find((risk) => !risks[risk.key].relevant && !risks[risk.key].notes.trim());
    if (missingRiskQuestion) {
      questions.push(missingRiskQuestion.guideQuestion);
    }

    return questions.slice(0, 4);
  }, [activeTopic, activeTopicState, risks, whatMatters]);

  const nextTopicKey = useMemo(() => {
    return topicDefinitions.find((topic) => !hasTopicContent(topics[topic.key]))?.key ?? activeTopicKey;
  }, [activeTopicKey, topics]);

  const sisText = useMemo(() => {
    const topicText = topicDefinitions
      .map((topic) => buildTopicSummary(topic.title, topics[topic.key]))
      .filter(Boolean)
      .join("\n");

    const riskText = relevantRisks.length
      ? relevantRisks
          .map((risk) => `- ${risk.label}: ${riskLevelLabels[risk.state.level]}${risk.state.notes ? ` - ${risk.state.notes}` : ""}`)
          .join("\n")
      : "- Keine vertiefte Risikobetrachtung erforderlich.";

    const measureText = measurePlan.length
      ? measurePlan.map((measure) => `- ${measure.source}: ${measure.text}`).join("\n")
      : "- Noch keine Massnahmen abgeleitet.";

    const questionText = openQuestions.length ? openQuestions.map((question) => `- ${question}`).join("\n") : "- Keine offenen Fragen.";

    return [
      "SIS - Strukturierte Informationssammlung",
      patientReference ? `Patientenreferenz: ${patientReference}` : null,
      "",
      "Was ist der Person wichtig?",
      whatMatters || "Noch nicht erfasst.",
      "",
      "Themenfelder",
      topicText || "Noch keine Themenfelder erfasst.",
      "",
      "Risikoeinschaetzung",
      riskText,
      "",
      "Massnahmenplanung",
      measureText,
      "",
      "Evaluation / Berichteblatt-Fokus",
      evaluationFocus || "Nur Abweichungen und relevante Veraenderungen dokumentieren.",
      "",
      "Offene Fragen",
      questionText
    ]
      .filter((line) => line !== null)
      .join("\n");
  }, [evaluationFocus, measurePlan, openQuestions, patientReference, relevantRisks, topics, whatMatters]);

  async function runAction(action: Exclude<BusyAction, null>, callback: () => Promise<void>) {
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

  async function ensureSisSession() {
    if (sessionId) {
      return sessionId;
    }

    const response = await fetch("/api/consultations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        patientReference: patientReference || `SIS-${new Date().toISOString().slice(0, 10)}`,
        specialty: "Pflege / SIS",
        spokenLanguage: "de",
        consultationType: "sis"
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/login";
        throw new Error("Bitte erneut anmelden, um die SIS per Sprache zu starten.");
      }

      throw new Error(payload.error?.message ?? "SIS session could not be created.");
    }

    setSessionId(payload.data.id);
    setSessionStatus(payload.data.status);
    return payload.data.id as string;
  }

  async function uploadAudio(session: string, file: File, source: "browser_recording" | "upload") {
    const initiate = await fetch(`/api/consultations/${session}/audio/initiate`, {
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

    const complete = await fetch(`/api/consultations/${session}/audio/complete`, {
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

    setLatestAudioAssetId(completePayload.data.id);
    setSessionStatus("audio_uploaded");
    setSuccessMessage("SIS audio uploaded. Transkription kann gestartet werden.");
    return completePayload.data.id as string;
  }

  async function startGuidedRecording() {
    await runAction("record", async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Mikrofonzugriff ist in diesem Browser nicht verfuegbar.");
      }

      const mimeType = getSupportedRecordingMimeType();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let session: string;

      try {
        session = await ensureSisSession();
      } catch (sessionError) {
        stream.getTracks().forEach((track) => track.stop());
        throw sessionError;
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        try {
          setBusyAction("upload");
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const extension = mimeType === "audio/mp4" ? "mp4" : mimeType === "audio/wav" ? "wav" : "webm";
          const file = new File([blob], `sis-${Date.now()}.${extension}`, { type: mimeType });
          const audioAssetId = await uploadAudio(session, file, "browser_recording");
          await transcribeAndExtract(session, audioAssetId);
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
      setSessionStatus("recording");
      setActiveTopicKey(nextTopicKey);
      setSuccessMessage("SIS Aufnahme laeuft. Nutze die Fragenvorschlaege als Gespraechsleitfaden.");
    });
  }

  async function stopGuidedRecording() {
    recorderRef.current?.stop();
    setBusyAction("upload");
  }

  async function onFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await runAction("upload", async () => {
      const session = await ensureSisSession();
      const audioAssetId = await uploadAudio(session, file, "upload");
      await transcribeAndExtract(session, audioAssetId);
    });
  }

  async function transcribeAndExtract(session = sessionId, audioAssetId = latestAudioAssetId) {
    if (!session || !audioAssetId) {
      throw new Error("No SIS audio is available for transcription.");
    }

    setBusyAction("transcribe");
    const transcribe = await fetch(`/api/consultations/${session}/transcribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        audioAssetId
      })
    });

    const transcribePayload = await transcribe.json();
    if (!transcribe.ok) {
      throw new Error(transcribePayload.error?.message ?? "SIS transcription failed.");
    }

    const workspaceResponse = await fetch(`/api/consultations/${session}`, {
      cache: "no-store"
    });
    const workspacePayload = await workspaceResponse.json();
    if (!workspaceResponse.ok) {
      throw new Error(workspacePayload.error?.message ?? "SIS transcript could not be loaded.");
    }

    const rawText = workspacePayload.data.latestTranscript?.raw_text ?? "";
    setTranscriptText(rawText);
    setSessionStatus("transcript_ready");

    setBusyAction("extract");
    const extract = await fetch("/api/sis/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        transcriptText: rawText,
        patientReference,
        liveNotes
      })
    });

    const extractPayload = await extract.json();
    if (!extract.ok) {
      throw new Error(extractPayload.error?.message ?? "SIS extraction failed.");
    }

    applyExtractedSis(extractPayload.data);
    setSessionStatus("sis_ready");
    setSuccessMessage("SIS wurde aus dem Gespraech strukturiert.");
  }

  function applyExtractedSis(assessment: SisAssessment) {
    setPatientReference((current) => assessment.patientReference || current);
    setWhatMatters((current) => assessment.whatMatters || current);
    setTopics((current) =>
      Object.fromEntries(
        topicDefinitions.map((topic) => [topic.key, mergeTopic(current[topic.key], assessment.topics[topic.key] ?? emptyTopic)])
      ) as TopicMap
    );
    setRisks((current) =>
      Object.fromEntries(
        riskDefinitions.map((risk) => [
          risk.key,
          mergeRisk(current[risk.key], assessment.risks[risk.key] ?? { relevant: false, level: "none", notes: "" })
        ])
      ) as RiskMap
    );
    setEvaluationFocus((current) => assessment.evaluationFocus || current);
    setOpenQuestions(assessment.openQuestions);
  }

  function updateTopic(topicKey: SisTopicKey, field: keyof TopicState, value: string) {
    setTopics((current) => ({
      ...current,
      [topicKey]: {
        ...current[topicKey],
        [field]: value
      }
    }));
  }

  function updateRisk(riskKey: SisRiskKey, patch: Partial<RiskState>) {
    setRisks((current) => ({
      ...current,
      [riskKey]: {
        ...current[riskKey],
        ...patch
      }
    }));
  }

  async function copySisText() {
    await navigator.clipboard.writeText(sisText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function resetSis() {
    setPatientReference("");
    setWhatMatters("");
    setTopics(createInitialTopics());
    setRisks(createInitialRisks());
    setEvaluationFocus("");
    setOpenQuestions([]);
    setLiveNotes("");
    setTranscriptText("");
    setSessionId(null);
    setLatestAudioAssetId(null);
    setSessionStatus("not_started");
    setActiveTopicKey("cognition");
    setCopied(false);
    setError(null);
    setSuccessMessage(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
          <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="patient-reference">
                Patientenreferenz
              </label>
              <Input
                id="patient-reference"
                value={patientReference}
                onChange={(event) => setPatientReference(event.target.value)}
                placeholder="z. B. Bewohner-104"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="what-matters">
                Was ist der Person wichtig?
              </label>
              <Input
                id="what-matters"
                value={whatMatters}
                onChange={(event) => setWhatMatters(event.target.value)}
                placeholder="Perspektive, Ziele, Gewohnheiten oder Sorgen der Person"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 xl:justify-end">
            <Button variant="outline" onClick={resetSis} disabled={busyAction !== null || isRecording}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Zuruecksetzen
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={busyAction !== null || isRecording}>
              <FileAudio className="mr-2 h-4 w-4" />
              Audio hochladen
            </Button>
            <input ref={fileInputRef} className="hidden" type="file" accept="audio/*" onChange={onFileUpload} />
            <Button onClick={isRecording ? stopGuidedRecording : startGuidedRecording} disabled={busyAction !== null && busyAction !== "record"}>
              {busyAction === "record" || busyAction === "upload" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <PauseCircle className="mr-2 h-4 w-4" />
              ) : (
                <Mic className="mr-2 h-4 w-4" />
              )}
              {isRecording ? "Aufnahme stoppen" : "SIS per Sprache starten"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {successMessage ? (
        <div className="rounded-2xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">{successMessage}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">SIS Session</p>
          <div className="mt-3 flex items-center gap-2">
            <StatusBadge status={sessionStatus} />
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Themenfelder erfasst</p>
          <p className="mt-2 text-3xl font-semibold">
            {completedTopicCount}/{topicDefinitions.length}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Relevante Risiken</p>
          <p className="mt-2 text-3xl font-semibold">{relevantRisks.length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Massnahmenfokus</p>
          <p className="mt-2 text-3xl font-semibold">{measurePlan.length}</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_380px]">
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Gesprächsführung</CardTitle>
                {isRecording ? <Badge variant="destructive">Aufnahme laeuft</Badge> : <Badge>Bereit</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="active-topic">
                  Aktuelles Themenfeld
                </label>
                <select
                  id="active-topic"
                  className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
                  value={activeTopicKey}
                  onChange={(event) => setActiveTopicKey(event.target.value as SisTopicKey)}
                >
                  {topicDefinitions.map((topic) => (
                    <option key={topic.key} value={topic.key}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Jetzt passende Fragen</p>
                </div>
                {guidedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className="w-full rounded-2xl border bg-background p-3 text-left text-sm transition-colors hover:bg-secondary/70"
                    onClick={() => setLiveNotes((current) => `${current}${current ? "\n" : ""}Gefragt: ${question}`)}
                  >
                    {question}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="live-notes">
                  Live-Notizen waehrend des Gespraechs
                </label>
                <Textarea
                  id="live-notes"
                  className="min-h-[160px]"
                  value={liveNotes}
                  onChange={(event) => setLiveNotes(event.target.value)}
                  placeholder="Kurze Stichworte waehrend der Aufnahme. Diese werden bei der SIS-Auswertung mitberuecksichtigt."
                />
              </div>

              {sessionId ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/consultations/${sessionId}` as Route}>SIS Audio-Session oeffnen</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transkript</CardTitle>
            </CardHeader>
            <CardContent>
              {busyAction === "transcribe" || busyAction === "extract" ? (
                <div className="flex items-center gap-2 rounded-2xl border p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {busyAction === "transcribe" ? "Transkription laeuft..." : "SIS wird strukturiert..."}
                </div>
              ) : transcriptText ? (
                <div className="max-h-[360px] overflow-auto rounded-2xl bg-secondary/60 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6">{transcriptText}</p>
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Nach der Aufnahme erscheint hier das transkribierte SIS-Gespraech.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          {topicDefinitions.map((topic) => (
            <Card key={topic.key} className={topic.key === activeTopicKey ? "ring-2 ring-primary/35" : undefined}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <CardTitle>{topic.title}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {topic.prompts.map((prompt) => (
                      <Badge key={prompt}>{prompt}</Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`${topic.key}-person`}>
                    Individuelle Sichtweise
                  </label>
                  <Textarea
                    id={`${topic.key}-person`}
                    value={topics[topic.key].personView}
                    onChange={(event) => updateTopic(topic.key, "personView", event.target.value)}
                    placeholder="Was schildert die Person selbst? Was ist ihr wichtig?"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`${topic.key}-observation`}>
                    Fachliche Einschaetzung
                  </label>
                  <Textarea
                    id={`${topic.key}-observation`}
                    value={topics[topic.key].observation}
                    onChange={(event) => updateTopic(topic.key, "observation", event.target.value)}
                    placeholder="Beobachtungen, Pflegeanlass, relevante Belastungen"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`${topic.key}-resources`}>
                    Ressourcen
                  </label>
                  <Textarea
                    id={`${topic.key}-resources`}
                    value={topics[topic.key].resources}
                    onChange={(event) => updateTopic(topic.key, "resources", event.target.value)}
                    placeholder="Was gelingt selbststaendig? Welche Hilfen funktionieren?"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`${topic.key}-support`}>
                    Unterstuetzungsbedarf / Massnahmenhinweis
                  </label>
                  <Textarea
                    id={`${topic.key}-support`}
                    value={topics[topic.key].supportNeeds}
                    onChange={(event) => updateTopic(topic.key, "supportNeeds", event.target.value)}
                    placeholder="Konkrete Unterstuetzung, je Zeile ein Fokus fuer die Massnahmenplanung"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-warning" />
                <CardTitle>Risikoeinschaetzung</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {riskDefinitions.map((risk) => {
                const state = risks[risk.key];

                return (
                  <div key={risk.key} className="space-y-3 rounded-2xl border p-4">
                    <label className="flex items-center gap-3 text-sm font-medium">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input accent-primary"
                        checked={state.relevant}
                        onChange={(event) =>
                          updateRisk(risk.key, {
                            relevant: event.target.checked,
                            level: event.target.checked ? "monitor" : "none"
                          })
                        }
                      />
                      {risk.label}
                    </label>
                    <div className="grid gap-2">
                      {(["monitor", "action"] as SisRiskLevel[]).map((level) => (
                        <label key={level} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="radio"
                            className="h-4 w-4 accent-primary"
                            checked={state.level === level}
                            disabled={!state.relevant}
                            onChange={() => updateRisk(risk.key, { level })}
                          />
                          {riskLevelLabels[level]}
                        </label>
                      ))}
                    </div>
                    <Textarea
                      className="min-h-[84px]"
                      value={state.notes}
                      disabled={!state.relevant}
                      onChange={(event) => updateRisk(risk.key, { notes: event.target.value })}
                      placeholder={risk.actionHint}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Massnahmenplanung</CardTitle>
            </CardHeader>
            <CardContent>
              {measurePlan.length ? (
                <div className="space-y-3">
                  {measurePlan.map((measure, index) => (
                    <div key={`${measure.source}-${index}`} className="rounded-2xl border bg-background p-3">
                      <p className="text-xs font-medium text-muted-foreground">{measure.source}</p>
                      <p className="mt-1 text-sm">{measure.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Die Massnahmenplanung fuellt sich aus Unterstuetzungsbedarfen und relevanten Risiken.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Berichteblatt & Evaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={evaluationFocus}
                onChange={(event) => setEvaluationFocus(event.target.value)}
                placeholder="Welche Abweichungen, Veraenderungen oder Evaluationspunkte sollen gezielt beobachtet werden?"
              />
              {openQuestions.length ? (
                <div className="rounded-2xl border bg-background p-4">
                  <p className="text-sm font-medium">Offene Fragen</p>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {openQuestions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="rounded-2xl bg-secondary/60 p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{sisText}</pre>
              </div>
              <Button onClick={copySisText} className="w-full">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}
                {copied ? "Kopiert" : "SIS kopieren"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
