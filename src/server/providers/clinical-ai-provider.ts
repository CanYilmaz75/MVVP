import { File } from "node:buffer";

import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";

import { normalizedTranscriptSchema, type NormalizedTranscript } from "@/schemas/transcript";
import { openai } from "@/server/providers/openai";

type JsonSchema = NonNullable<
  Extract<ChatCompletionCreateParamsNonStreaming["response_format"], { type: "json_schema" }>["json_schema"]
>["schema"];

export type JsonModelInput = {
  schemaName: string;
  schema: JsonSchema;
  systemPrompt: string;
  userPrompt: string;
};

export type TranscriptionInput = {
  bytes: Uint8Array;
  fileName: string;
  mimeType: string;
  language?: string | null;
  verbose?: boolean;
};

export interface ClinicalAiProvider {
  generateJson(input: JsonModelInput): Promise<string>;
  transcribeAudio(input: TranscriptionInput): Promise<NormalizedTranscript>;
  transcribeInstruction(input: Omit<TranscriptionInput, "verbose">): Promise<string>;
}

type ProviderTranscriptSegment = {
  start?: number;
  end?: number;
  text: string;
};

export const openAiClinicalProvider: ClinicalAiProvider = {
  async generateJson(input) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: input.schemaName,
          strict: true,
          schema: input.schema
        }
      },
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt }
      ]
    });

    return completion.choices[0]?.message?.content ?? "";
  },

  async transcribeAudio(input) {
    const response = await openai.audio.transcriptions.create({
      file: new File([input.bytes], input.fileName, { type: input.mimeType }),
      model: "gpt-4o-mini-transcribe",
      response_format: input.verbose ? "verbose_json" : "json",
      ...(input.language ? { language: input.language } : {})
    });

    const segments =
      "segments" in response && Array.isArray(response.segments)
        ? (response.segments as ProviderTranscriptSegment[]).map((segment) => ({
            speakerLabel: undefined,
            startMs: segment.start ? Math.round(segment.start * 1000) : undefined,
            endMs: segment.end ? Math.round(segment.end * 1000) : undefined,
            text: segment.text
          }))
        : [];

    return normalizedTranscriptSchema.parse({
      rawText: response.text,
      detectedLanguage: "language" in response ? response.language ?? undefined : undefined,
      confidence: "duration" in response && typeof response.duration === "number" ? 1 : undefined,
      segments
    });
  },

  async transcribeInstruction(input) {
    const response = await openai.audio.transcriptions.create({
      file: new File([input.bytes], input.fileName, { type: input.mimeType }),
      model: "gpt-4o-mini-transcribe"
    });

    return response.text?.trim() ?? "";
  }
};

export const clinicalAiProvider: ClinicalAiProvider = openAiClinicalProvider;
