-- Fix auth helper functions used by RLS policies.
--
-- These helpers are referenced by policies on public.profiles itself. Without
-- security definer, Postgres evaluates profile visibility through a helper that
-- also needs profile visibility, which can hide an otherwise valid profile.

begin;

create or replace function public.current_user_organisation_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisation_id
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

grant execute on function public.current_user_organisation_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

commit;
