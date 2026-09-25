-- Run in the Supabase SQL editor. The app only uses these functions and tables
-- with the server-side service-role key; do not expose that key to the browser.
create table if not exists public.board_notes (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,63}$' or id ~* '^[0-9a-f-]{36}$'),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 2000),
  color text not null check (color in ('yellow', 'blue', 'pink', 'green', 'lavender')),
  status text not null check (status in ('idea', 'exploring', 'building', 'shelved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.board_comments (
  id uuid primary key,
  note_id text not null references public.board_notes(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- A marker means the seed was inserted once. Deleting all notes is therefore a
-- valid persisted state and will never cause the seed to return.
create table if not exists public.board_settings (
  id boolean primary key default true check (id),
  initialized_at timestamptz not null default now()
);

create schema if not exists private;
create table if not exists private.board_comment_rate_limits (
  client_hash text primary key,
  last_created_at timestamptz not null
);

alter table public.board_notes enable row level security;
alter table public.board_comments enable row level security;
alter table public.board_settings enable row level security;
alter table private.board_comment_rate_limits enable row level security;
-- Intentionally no public RLS policies.

-- This is a single transaction guarded by an advisory lock. It accepts the seed
-- payload from the server and does nothing once the marker exists.
create or replace function public.initialize_board(p_notes jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('board.initialize'));
  if exists (select 1 from public.board_settings where id = true) then
    return;
  end if;

  insert into public.board_notes (id, title, body, color, status, created_at, updated_at)
  select id, title, body, color, status, created_at, updated_at
  from jsonb_to_recordset(p_notes) as seed(
    id text, title text, body text, color text, status text,
    created_at timestamptz, updated_at timestamptz
  )
  on conflict (id) do nothing;

  insert into public.board_settings (id) values (true);
end;
$$;

-- Atomically enforces one accepted comment per hashed client identity per 15
-- seconds. A small probabilistic cleanup keeps the private limiter bounded.
create or replace function public.create_board_comment(
  p_id uuid,
  p_note_id text,
  p_name text,
  p_body text,
  p_client_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_client_hash, 0));
  select last_created_at into previous
  from private.board_comment_rate_limits where client_hash = p_client_hash;
  if previous is not null and previous > now() - interval '15 seconds' then
    return false;
  end if;

  insert into public.board_comments (id, note_id, name, body)
  values (p_id, p_note_id, p_name, p_body);
  insert into private.board_comment_rate_limits (client_hash, last_created_at)
  values (p_client_hash, now())
  on conflict (client_hash) do update set last_created_at = excluded.last_created_at;

  if random() < 0.01 then
    delete from private.board_comment_rate_limits
    where last_created_at < now() - interval '7 days';
  end if;
  return true;
end;
$$;

revoke all on function public.initialize_board(jsonb) from public, anon, authenticated;
revoke all on function public.create_board_comment(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.initialize_board(jsonb) to service_role;
grant execute on function public.create_board_comment(uuid, text, text, text, text) to service_role;
grant select, insert, update, delete on public.board_notes, public.board_comments to service_role;
