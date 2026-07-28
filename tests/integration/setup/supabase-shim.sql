-- Minimal stand-in for the parts of Supabase's platform (GoTrue's `auth`
-- schema) that our migrations and RLS policies depend on. A real Supabase
-- project provisions this automatically; this file exists ONLY for running
-- migrations/RLS against a plain local Postgres in tests. It must never be
-- applied to a real Supabase project (which already has a real `auth`
-- schema).

create schema if not exists auth;

-- Supabase provisions these roles on every project; PostgREST connects as
-- an "authenticator" role and issues `SET LOCAL ROLE authenticated` (or
-- `anon`) per request. We only need the target roles to exist so tests can
-- `SET ROLE authenticated` after connecting as the test superuser.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
end
$$;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- Mirrors Supabase's real auth.uid(), which reads the `sub` claim from the
-- JWT PostgREST attaches to the session via `request.jwt.claims`.
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select (nullif(current_setting('request.jwt.claims', true), '')::json->>'sub')::uuid;
$$;
