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

function formatSisError(error: unknown, fallback = "Aktion fehlgeschlagen.") {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      message?: unknown;
      error?: { message?: unknown } | null;
      target?: { error?: { message?: unknown } | null } | null;
      currentTarget?: { error?: { message?: unknown } | null } | null;
    };

    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message;
    }

    if (candidate.error && typeof candidate.error.message === "string" && candidate.error.message.trim()) {
      return candidate.error.message;
    }

    if (
      candidate.target?.error &&
      typeof candidate.target.error.message === "string" &&
      candidate.target.error.message.trim()
    ) {
      return candidate.target.error.message;
    }

    if (
      candidate.currentTarget?.error &&
      typeof candidate.currentTarget.error.message === "string" &&
      candidate.currentTarget.error.message.trim()
    ) {
      return candidate.currentTarget.error.message;
    }
  }

  return fallback;
}

export function SisWorkspace() {
  const introStepIndex = 0;
  const recordingStepIndex = 1;
  const topicStepStart = 2;
  const riskStepStart = topicStepStart + topicDefinitions.length;
  const reviewStepIndex = riskStepStart + riskDefinitions.length;
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
  const [currentStepIndex, setCurrentStepIndex] = useState(introStepIndex);
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
  const reviewedRiskCount = useMemo(
    () => riskDefinitions.filter((risk) => risks[risk.key].relevant || risks[risk.key].notes.trim() || risks[risk.key].level !== "none").length,
    [risks]
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

  const currentTopicIndex =
    currentStepIndex >= topicStepStart && currentStepIndex < riskStepStart ? currentStepIndex - topicStepStart : -1;
  const currentRiskIndex =
    currentStepIndex >= riskStepStart && currentStepIndex < reviewStepIndex ? currentStepIndex - riskStepStart : -1;
  const currentTopicDefinition = currentTopicIndex >= 0 ? topicDefinitions[currentTopicIndex] : null;
  const currentRiskDefinition = currentRiskIndex >= 0 ? riskDefinitions[currentRiskIndex] : null;
  const currentRiskState = currentRiskDefinition ? risks[currentRiskDefinition.key] : null;
  const totalSteps = reviewStepIndex + 1;

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
      setError(formatSisError(actionError));
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

      throw new Error(payload.error?.message ?? "SIS-Sitzung konnte nicht erstellt werden.");
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
      throw new Error(initiatePayload.error?.message ?? "Audio-Upload konnte nicht gestartet werden.");
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
      throw new Error(completePayload.error?.message ?? "Audio-Upload konnte nicht abgeschlossen werden.");
    }

    setLatestAudioAssetId(completePayload.data.id);
    setSessionStatus("audio_uploaded");
    setSuccessMessage("SIS-Audio hochgeladen. Transkription kann gestartet werden.");
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
      recorder.onerror = (event) => {
        setError(formatSisError(event, "Die Aufnahme konnte nicht gestartet oder fortgesetzt werden."));
        setBusyAction(null);
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
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
          setError(formatSisError(recordingError, "Aufnahme-Upload fehlgeschlagen."));
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
      throw new Error("Fuer die Transkription ist kein SIS-Audio verfuegbar.");
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
      throw new Error(transcribePayload.error?.message ?? "SIS-Transkription fehlgeschlagen.");
    }

    const workspaceResponse = await fetch(`/api/consultations/${session}`, {
      cache: "no-store"
    });
    const workspacePayload = await workspaceResponse.json();
    if (!workspaceResponse.ok) {
      throw new Error(workspacePayload.error?.message ?? "SIS-Transkript konnte nicht geladen werden.");
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
      throw new Error(extractPayload.error?.message ?? "SIS-Extraktion fehlgeschlagen.");
    }

    applyExtractedSis(extractPayload.data);
    setSessionStatus("sis_ready");
    goToStep(topicStepStart);
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
    setCurrentStepIndex(introStepIndex);
    setCopied(false);
    setError(null);
    setSuccessMessage(null);
  }

  function goToStep(stepIndex: number) {
    const bounded = Math.max(introStepIndex, Math.min(stepIndex, totalSteps - 1));
    setCurrentStepIndex(bounded);

    if (bounded >= topicStepStart && bounded < riskStepStart) {
      setActiveTopicKey(topicDefinitions[bounded - topicStepStart]!.key);
    }
  }

  function goToNextStep() {
    goToStep(currentStepIndex + 1);
  }

  function goToPreviousStep() {
    goToStep(currentStepIndex - 1);
  }

  const flowItems = [
    {
      stepIndex: introStepIndex,
      label: "1. Einstieg",
      description: "Person und Zielbild",
      done: Boolean(patientReference.trim() || whatMatters.trim())
    },
    {
      stepIndex: recordingStepIndex,
      label: "2. Gespräch",
      description: "Aufnahme und Transkript",
      done: Boolean(transcriptText.trim())
    },
    ...topicDefinitions.map((topic, index) => ({
      stepIndex: topicStepStart + index,
      label: `${topicStepStart + index + 1}. ${topic.title}`,
      description: "Themenfeld",
      done: hasTopicContent(topics[topic.key])
    })),
    ...riskDefinitions.map((risk, index) => ({
      stepIndex: riskStepStart + index,
      label: `${riskStepStart + index + 1}. ${risk.label}`,
      description: "Risiko",
      done: Boolean(risks[risk.key].relevant || risks[risk.key].notes.trim() || risks[risk.key].level !== "none")
    })),
    {
      stepIndex: reviewStepIndex,
      label: `${reviewStepIndex + 1}. Abschluss`,
      description: "Review und Export",
      done: Boolean(evaluationFocus.trim() || copied)
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold">SIS Schritt für Schritt</h2>
              <StatusBadge status={sessionStatus} />
              <Badge variant="primary">
                Schritt {currentStepIndex + 1} von {totalSteps}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span>Themenfelder: {completedTopicCount}/{topicDefinitions.length}</span>
              <span>Risikoprüfungen: {reviewedRiskCount}/{riskDefinitions.length}</span>
              <span>Maßnahmenfokus: {measurePlan.length}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={resetSis} disabled={busyAction !== null || isRecording}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Zurücksetzen
            </Button>
            {currentStepIndex > introStepIndex ? (
              <Button variant="outline" onClick={goToPreviousStep} disabled={busyAction !== null}>
                Zurück
              </Button>
            ) : null}
            {currentStepIndex < reviewStepIndex ? (
              <Button onClick={goToNextStep} disabled={busyAction !== null}>
                Weiter
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {successMessage ? (
        <div className="rounded-2xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">{successMessage}</div>
      ) : null}

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Sprachdokumentation</p>
            <h3 className="text-xl font-semibold">SIS per Aufnahme starten</h3>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Der wichtigste Einstieg ist die Spracheingabe: Gespräch aufnehmen, automatisch transkribieren und daraus
              die SIS-Struktur vorfüllen. Die manuelle Bearbeitung kommt danach.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={busyAction !== null || isRecording}>
              <FileAudio className="mr-2 h-4 w-4" />
              Audio hochladen
            </Button>
            <Button
              size="lg"
              onClick={() => void (isRecording ? stopGuidedRecording() : startGuidedRecording())}
              disabled={busyAction !== null && busyAction !== "record"}
            >
              {busyAction === "record" || busyAction === "upload" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <PauseCircle className="mr-2 h-4 w-4" />
              ) : (
                <Mic className="mr-2 h-4 w-4" />
              )}
              {isRecording ? "Aufnahme stoppen" : "Aufnahme starten"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[150px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="space-y-5">
            <div className="relative">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border/80" />
              <div className="space-y-1">
                {flowItems.map((item) => {
                  const isCurrent = item.stepIndex === currentStepIndex;

                  return (
                    <button
                      key={item.stepIndex}
                      type="button"
                      title={`${item.label} - ${item.description}`}
                      onClick={() => goToStep(item.stepIndex)}
                      className={`group relative flex w-full items-start gap-2 py-1 text-left transition-colors ${
                        isCurrent ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div
                        className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border ${
                          item.done
                            ? "border-success bg-success"
                            : isCurrent
                              ? "border-primary bg-primary"
                              : "border-border bg-background"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[13px] leading-5 ${isCurrent ? "font-medium" : ""}`}>
                          {item.label.replace(/^\d+\.\s/, "")}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-muted-foreground">
              <p>{patientReference || "Offen"}</p>
              <p>{transcriptText ? "Transkript da" : "Kein Transkript"}</p>
              <p>{openQuestions.length} Fragen offen</p>
            </div>

            {sessionId ? (
              <Button asChild variant="ghost" className="h-auto w-full justify-start px-0 py-1 text-xs font-normal">
                <Link href={`/consultations/${sessionId}` as Route}>Session öffnen</Link>
              </Button>
            ) : null}
          </div>
        </aside>

        <div className="space-y-6">
          {currentStepIndex === introStepIndex ? (
            <Card>
              <CardHeader>
                <CardTitle>Einstieg</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
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
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    onClick={() => void (isRecording ? stopGuidedRecording() : startGuidedRecording())}
                    disabled={busyAction !== null && busyAction !== "record"}
                  >
                    {busyAction === "record" || busyAction === "upload" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isRecording ? (
                      <PauseCircle className="mr-2 h-4 w-4" />
                    ) : (
                      <Mic className="mr-2 h-4 w-4" />
                    )}
                    {isRecording ? "Aufnahme stoppen" : "Aufnahme starten"}
                  </Button>
                  <Button variant="outline" onClick={() => goToStep(recordingStepIndex)} disabled={busyAction !== null}>
                    Zum Aufnahme-Schritt
                  </Button>
                </div>
                <div className="rounded-xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
                  Starte mit einem kurzen Bild der Person. Danach führst du das Gespräch, lässt die SIS strukturieren und
                  arbeitest die Themenfelder nacheinander durch.
                </div>
              </CardContent>
            </Card>
          ) : null}

          {currentStepIndex === recordingStepIndex ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Gespräch führen</CardTitle>
                  {isRecording ? <Badge variant="destructive">Aufnahme läuft</Badge> : <Badge>Bereit</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={busyAction !== null || isRecording}>
                    <FileAudio className="mr-2 h-4 w-4" />
                    Audio hochladen
                  </Button>
                  <input ref={fileInputRef} className="hidden" type="file" accept="audio/*" onChange={onFileUpload} />
                  <Button
                    onClick={() => void (isRecording ? stopGuidedRecording() : startGuidedRecording())}
                    disabled={busyAction !== null && busyAction !== "record"}
                  >
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

                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div className="rounded-xl border bg-background p-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">Jetzt passende Fragen</p>
                      </div>
                      <div className="mt-3 space-y-2">
                        {guidedQuestions.map((question) => (
                          <button
                            key={question}
                            type="button"
                            className="w-full rounded-xl border bg-card p-3 text-left text-sm transition-colors hover:bg-secondary/70"
                            onClick={() => setLiveNotes((current) => `${current}${current ? "\n" : ""}Gefragt: ${question}`)}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="live-notes">
                        Live-Notizen während des Gesprächs
                      </label>
                      <Textarea
                        id="live-notes"
                        className="min-h-[220px]"
                        value={liveNotes}
                        onChange={(event) => setLiveNotes(event.target.value)}
                        placeholder="Kurze Stichworte während der Aufnahme. Diese fließen in die SIS-Auswertung ein."
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border bg-background p-4">
                      <p className="text-sm font-medium">Transkript</p>
                      {busyAction === "transcribe" || busyAction === "extract" ? (
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {busyAction === "transcribe" ? "Transkription läuft..." : "SIS wird strukturiert..."}
                        </div>
                      ) : transcriptText ? (
                        <div className="mt-3 max-h-[420px] overflow-auto rounded-xl bg-secondary/60 p-4">
                          <p className="whitespace-pre-wrap text-sm leading-6">{transcriptText}</p>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">
                          Nach der Aufnahme erscheint hier das transkribierte Gespräch.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {currentTopicDefinition ? (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>{currentTopicDefinition.title}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Arbeite dieses Themenfeld jetzt fertig durch. Danach geht es direkt zum nächsten Abschnitt.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentTopicDefinition.prompts.map((prompt) => (
                      <Badge key={prompt}>{prompt}</Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border bg-secondary/40 p-4">
                  <p className="text-sm font-medium">Leitfragen</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {currentTopicDefinition.guideQuestions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor={`${currentTopicDefinition.key}-person`}>
                      Individuelle Sichtweise
                    </label>
                    <Textarea
                      id={`${currentTopicDefinition.key}-person`}
                      value={topics[currentTopicDefinition.key].personView}
                      onChange={(event) => updateTopic(currentTopicDefinition.key, "personView", event.target.value)}
                      placeholder="Was schildert die Person selbst? Was ist ihr wichtig?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor={`${currentTopicDefinition.key}-observation`}>
                      Fachliche Einschätzung
                    </label>
                    <Textarea
                      id={`${currentTopicDefinition.key}-observation`}
                      value={topics[currentTopicDefinition.key].observation}
                      onChange={(event) => updateTopic(currentTopicDefinition.key, "observation", event.target.value)}
                      placeholder="Beobachtungen, Pflegeanlass, relevante Belastungen"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor={`${currentTopicDefinition.key}-resources`}>
                      Ressourcen
                    </label>
                    <Textarea
                      id={`${currentTopicDefinition.key}-resources`}
                      value={topics[currentTopicDefinition.key].resources}
                      onChange={(event) => updateTopic(currentTopicDefinition.key, "resources", event.target.value)}
                      placeholder="Was gelingt selbstständig? Welche Hilfen funktionieren?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor={`${currentTopicDefinition.key}-support`}>
                      Unterstützungsbedarf / Maßnahmenhinweis
                    </label>
                    <Textarea
                      id={`${currentTopicDefinition.key}-support`}
                      value={topics[currentTopicDefinition.key].supportNeeds}
                      onChange={(event) => updateTopic(currentTopicDefinition.key, "supportNeeds", event.target.value)}
                      placeholder="Konkrete Unterstützung, je Zeile ein Fokus für die Maßnahmenplanung"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {currentRiskDefinition && currentRiskState ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-warning" />
                  <CardTitle>{currentRiskDefinition.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Leitfrage</p>
                  <p className="mt-2">{currentRiskDefinition.guideQuestion}</p>
                </div>

                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input accent-primary"
                    checked={currentRiskState.relevant}
                    onChange={(event) =>
                      updateRisk(currentRiskDefinition.key, {
                        relevant: event.target.checked,
                        level: event.target.checked ? "monitor" : "none"
                      })
                    }
                  />
                  Risiko im Gespräch relevant
                </label>

                <div className="grid gap-2 rounded-xl border bg-background p-4">
                  {(["monitor", "action"] as SisRiskLevel[]).map((level) => (
                    <label key={level} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="radio"
                        className="h-4 w-4 accent-primary"
                        checked={currentRiskState.level === level}
                        disabled={!currentRiskState.relevant}
                        onChange={() => updateRisk(currentRiskDefinition.key, { level })}
                      />
                      {riskLevelLabels[level]}
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`${currentRiskDefinition.key}-notes`}>
                    Einschätzung / Maßnahmenhinweis
                  </label>
                  <Textarea
                    id={`${currentRiskDefinition.key}-notes`}
                    className="min-h-[120px]"
                    value={currentRiskState.notes}
                    disabled={!currentRiskState.relevant}
                    onChange={(event) => updateRisk(currentRiskDefinition.key, { notes: event.target.value })}
                    placeholder={currentRiskDefinition.actionHint}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {currentStepIndex === reviewStepIndex ? (
            <Card>
              <CardHeader>
                <CardTitle>Abschluss</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="evaluation-focus">
                        Berichteblatt & Evaluation
                      </label>
                      <Textarea
                        id="evaluation-focus"
                        value={evaluationFocus}
                        onChange={(event) => setEvaluationFocus(event.target.value)}
                        placeholder="Welche Abweichungen, Veränderungen oder Evaluationspunkte sollen gezielt beobachtet werden?"
                      />
                    </div>

                    <div className="rounded-xl bg-secondary/60 p-4">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{sisText}</pre>
                    </div>

                    <Button onClick={copySisText}>
                      {copied ? <Check className="mr-2 h-4 w-4" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}
                      {copied ? "Kopiert" : "SIS kopieren"}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border bg-background p-4">
                      <p className="text-sm font-medium">Maßnahmenplanung</p>
                      {measurePlan.length ? (
                        <div className="mt-3 space-y-3">
                          {measurePlan.map((measure, index) => (
                            <div key={`${measure.source}-${index}`} className="rounded-xl border bg-card p-3">
                              <p className="text-xs font-medium text-muted-foreground">{measure.source}</p>
                              <p className="mt-1 text-sm">{measure.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">Noch keine Maßnahmen abgeleitet.</p>
                      )}
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <p className="text-sm font-medium">Offene Fragen</p>
                      {openQuestions.length ? (
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {openQuestions.map((question) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">Keine offenen Fragen mehr.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
