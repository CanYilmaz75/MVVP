begin;

alter table public.consultations
drop constraint if exists consultations_status_check;

alter table public.consultations
add constraint consultations_status_check check (
  status in (
    'created',
    'recording',
    'paused',
    'audio_uploaded',
    'transcribing',
    'transcript_ready',
    'note_generating',
    'draft_ready',
    'approved',
    'exported',
    'failed'
  )
);

commit;
