import { NextResponse } from "next/server";

import { AppError, isAppError } from "@/lib/errors";
import { logEvent } from "@/lib/logger";
import { transcribeInstructionAudio } from "@/server/services/transcription-service";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("INVALID_VOICE_EDIT_FILE", "Audio fuer die Sprachbearbeitung ist erforderlich.", 400);
    }

    const instructionText = await transcribeInstructionAudio(file, file.type);

    return NextResponse.json({
      data: {
        instructionText
      },
      requestId
    });
  } catch (error) {
    const appError = isAppError(error)
      ? error
      : new AppError("VOICE_EDIT_PREVIEW_FAILED", "Vorschau der Sprachbearbeitung konnte nicht erstellt werden.", 500);

    logEvent({
      level: "error",
      message: appError.message,
      requestId,
      route: "/api/consultations/[id]/voice-edit/preview",
      errorCode: appError.code
    });

    return NextResponse.json(
      {
        error: {
          code: appError.code,
          message: appError.message,
          requestId
        }
      },
      { status: appError.status }
    );
  }
}
