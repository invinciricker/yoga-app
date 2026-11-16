-- Yoga with Maria: the whole database, used from Phase 4.
-- Written by Claude chat on 16 Nov 2026 and tested against Postgres (see docs/ARCHITECTURE.md, "Backend").
-- PROTECTED FILE (see CLAUDE.md). Never edit it: the owner has already run it on the live database.
-- A change is always a NEW migration file next to this one, listed in the pull request, and the
-- owner must run it by hand in the Supabase SQL editor.
--
-- What lives here, and nothing else:
--   reactions    one row per person per lesson: how the lesson felt
--   push_tokens  where to send notifications (Phase 5)
--   teachers     who may see the totals (Maria). Rows are added by hand in the Supabase dashboard.
--   sent_notifications  which new lessons were already announced, so nobody is notified twice (Phase 5)
-- Lessons, tips and photos are NOT in the database: they are static files (docs/CONTENT.md).
--
-- People never create an account. The app signs each install in anonymously, which gives it a
-- stable user id (auth.uid()) with the "authenticated" role. Every rule below hangs on that id.

-- ---------------------------------------------------------------- teachers
create table public.teachers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.teachers enable row level security;

-- A signed-in user may see whether THEY are a teacher. Nobody can add or remove rows from the app.
create policy "teachers: read own row" on public.teachers
  for select to authenticated
  using (user_id = (select auth.uid()));

create function public.is_teacher() returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.teachers t where t.user_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------- reactions
create table public.reactions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- The lesson's slug, exactly as in content.json. The database cannot check that the lesson
  -- exists (content is static), so the format is checked and the app ignores unknown slugs.
  lesson_slug text not null
    check (lesson_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(lesson_slug) <= 80),
  difficulty text not null check (difficulty in ('gentle', 'right', 'much')),
  feeling text check (feeling in ('calmer', 'energised', 'stronger', 'tired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);
alter table public.reactions enable row level security;

create policy "reactions: read own" on public.reactions
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "reactions: add own" on public.reactions
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "reactions: change own" on public.reactions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "reactions: delete own" on public.reactions
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Keeps the dates honest, stops a row being moved to another user or lesson,
-- and caps one user at 300 reactions so nobody can fill the free database.
create function public.reactions_guard() returns trigger
  language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.reactions r where r.user_id = new.user_id) >= 300 then
      raise exception 'too many reactions for one user' using errcode = 'P0001';
    end if;
    new.created_at := now();
  else
    new.user_id := old.user_id;
    new.lesson_slug := old.lesson_slug;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger reactions_guard
  before insert or update on public.reactions
  for each row execute function public.reactions_guard();

-- What Maria sees: totals per lesson, never who answered. Teachers only.
-- Call from the app: supabase.rpc('reaction_stats', { since: null }) or with an ISO date.
create function public.reaction_stats(since timestamptz default null)
  returns table (
    lesson_slug text,
    total bigint,
    gentle bigint,
    just_right bigint,
    too_much bigint,
    calmer bigint,
    energised bigint,
    stronger bigint,
    tired bigint,
    last_at timestamptz
  )
  language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_teacher() then
    raise exception 'teachers only' using errcode = '42501';
  end if;
  return query
    select
      r.lesson_slug,
      count(*),
      count(*) filter (where r.difficulty = 'gentle'),
      count(*) filter (where r.difficulty = 'right'),
      count(*) filter (where r.difficulty = 'much'),
      count(*) filter (where r.feeling = 'calmer'),
      count(*) filter (where r.feeling = 'energised'),
      count(*) filter (where r.feeling = 'stronger'),
      count(*) filter (where r.feeling = 'tired'),
      max(r.updated_at)
    from public.reactions r
    where since is null or r.updated_at >= since
    group by r.lesson_slug
    order by count(*) desc, r.lesson_slug;
end;
$$;

-- ---------------------------------------------------------------- push tokens (Phase 5)
create table public.push_tokens (
  token text primary key check (char_length(token) between 20 and 200),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('android', 'ios')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security;

create policy "push_tokens: read own" on public.push_tokens
  for select to authenticated
  using (user_id = (select auth.uid()));

-- The only way to write a token. A phone keeps its token across reinstalls while the anonymous
-- user changes, so the row has to move to the new user: a plain upsert under RLS could not do that.
-- Call from the app: supabase.rpc('register_push_token', { p_token, p_platform, p_enabled })
create function public.register_push_token(p_token text, p_platform text, p_enabled boolean default true)
  returns void
  language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  insert into public.push_tokens (token, user_id, platform, enabled)
  values (p_token, me, p_platform, p_enabled)
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        enabled = excluded.enabled,
        updated_at = now();
  -- One person, at most 5 devices: drop the oldest beyond that.
  delete from public.push_tokens p
  where p.user_id = me
    and p.token not in (
      select p2.token from public.push_tokens p2
      where p2.user_id = me
      order by p2.updated_at desc
      limit 5
    );
end;
$$;

-- "Delete my data" in Settings (Google Play asks for it). Removes everything this install sent.
create function public.delete_my_data() returns void
  language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  delete from public.reactions where user_id = me;
  delete from public.push_tokens where user_id = me;
end;
$$;

-- ---------------------------------------------------------------- sent notifications (Phase 5)
-- Written and read only by the "notify" GitHub Action, with the secret key. The app never touches it:
-- row level security is on and there is no policy, so every request from the app is refused.
create table public.sent_notifications (
  item_key text primary key check (item_key ~ '^(lesson|journal)/[a-z0-9]+(-[a-z0-9]+)*$'),
  sent_at timestamptz not null default now(),
  recipients integer not null default 0
);
alter table public.sent_notifications enable row level security;

-- ---------------------------------------------------------------- staying awake
-- A free Supabase project is paused after 7 days without a request. The "keepalive" GitHub Action
-- calls this twice a week with the public key. It reveals nothing and changes nothing.
create function public.ping() returns boolean
  language sql stable set search_path = ''
as $$ select true; $$;

-- ---------------------------------------------------------------- who may do what
-- Supabase grants a lot by default. Take it all back, then give exactly what the app needs.
-- "anon" (the key alone, nobody signed in) gets nothing at all.
revoke all on table public.teachers, public.reactions, public.push_tokens, public.sent_notifications
  from anon, authenticated;
grant select on table public.teachers to authenticated;
grant select, insert, update, delete on table public.reactions to authenticated;
grant select on table public.push_tokens to authenticated;

revoke all on function public.is_teacher() from public, anon;
revoke all on function public.reactions_guard() from public, anon, authenticated;
revoke all on function public.reaction_stats(timestamptz) from public, anon;
revoke all on function public.register_push_token(text, text, boolean) from public, anon;
revoke all on function public.delete_my_data() from public, anon;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
grant execute on function public.is_teacher() to authenticated;
grant execute on function public.reaction_stats(timestamptz) to authenticated;
grant execute on function public.register_push_token(text, text, boolean) to authenticated;
grant execute on function public.delete_my_data() to authenticated;
