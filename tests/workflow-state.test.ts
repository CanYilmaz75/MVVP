import test from "node:test";
import assert from "node:assert/strict";

import { assertConsultationTransition, assertNoteTransition } from "../src/lib/workflow-state";
import { AppError } from "../src/lib/errors";

test("consultation workflow allows the happy path to approval and export", () => {
  assert.doesNotThrow(() => assertConsultationTransition("created", "recording"));
  assert.doesNotThrow(() => assertConsultationTransition("recording", "audio_uploaded"));
  assert.doesNotThrow(() => assertConsultationTransition("audio_uploaded", "transcribing"));
  assert.doesNotThrow(() => assertConsultationTransition("transcribing", "transcript_ready"));
  assert.doesNotThrow(() => assertConsultationTransition("transcript_ready", "note_generating"));
  assert.doesNotThrow(() => assertConsultationTransition("note_generating", "draft_ready"));
  assert.doesNotThrow(() => assertConsultationTransition("draft_ready", "approved"));
  assert.doesNotThrow(() => assertConsultationTransition("approved", "exported"));
});

test("consultation workflow rejects unsafe jumps", () => {
  assert.throws(
    () => assertConsultationTransition("created", "approved"),
    (error) => error instanceof AppError && error.code === "INVALID_CONSULTATION_TRANSITION"
  );
});

test("note workflow keeps approval explicit", () => {
  assert.doesNotThrow(() => assertNoteTransition("draft", "approved"));
  assert.doesNotThrow(() => assertNoteTransition("approved", "edited"));
  assert.throws(
    () => assertNoteTransition("not_started", "approved"),
    (error) => error instanceof AppError && error.code === "INVALID_NOTE_TRANSITION"
  );
});
