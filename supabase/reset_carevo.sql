-- CAREVO reset script
-- WARNING:
-- This removes the database objects created for this project:
-- tables, policies, triggers, helper functions, and private storage buckets.
-- Run this only if you want to reset the CAREVO schema in this Supabase project.

begin;

-- Remove auth trigger first
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Remove storage policies tied to CAREVO buckets
drop policy if exists storage_objects_org_read_audio on storage.objects;
drop policy if exists storage_objects_org_insert_audio on storage.objects;
drop policy if exists storage_objects_org_update_audio on storage.objects;

-- Note:
-- Supabase Storage metadata tables are read-only for destructive operations.
-- Remove the CAREVO buckets in the Supabase Dashboard after this SQL reset:
-- Storage -> consultation-audio -> empty/delete
-- Storage -> exported-pdfs -> empty/delete
--
-- If the buckets are already empty, you may also try:
-- delete from storage.buckets where id in ('consultation-audio', 'exported-pdfs');
-- But the dashboard is the safer supported path.

-- Drop app tables
drop table if exists public.feature_flags cascade;
drop table if exists public.jobs cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.exports cascade;
drop table if exists public.note_edits cascade;
drop table if exists public.clinical_note_versions cascade;
drop table if exists public.clinical_notes cascade;
drop table if exists public.transcript_segments cascade;
drop table if exists public.consultation_additional_texts cascade;
drop table if exists public.transcripts cascade;
drop table if exists public.audio_assets cascade;
drop table if exists public.consultations cascade;
drop table if exists public.note_templates cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organisations cascade;

-- Drop helper functions
drop function if exists public.current_user_organisation_id();
drop function if exists public.set_updated_at();

commit;
