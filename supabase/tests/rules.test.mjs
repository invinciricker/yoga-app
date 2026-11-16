// Checks the database rules without a Supabase project.
// It runs the migration on a real Postgres engine (PGlite, from npm) with a small stand-in for
// Supabase's auth schema, then tries what a student, a stranger and Maria could try.
// Run: npm i -D @electric-sql/pglite && node supabase/tests/rules.test.mjs
// Written by Claude chat. If you add a migration, load it here too and add its checks.
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

const db = new PGlite();
const sql = fs.readFileSync(new URL('../migrations/20261116000000_init.sql', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
const as = async (role, uid, fn) => {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
};
const fails = async (fn) => { try { await fn(); return null; } catch (e) { return e.message; } };

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  -- what Supabase does by default, so the migration's revokes are really tested:
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`);
await db.exec(sql);
ok('migration applies', true);

const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222', M = '33333333-3333-3333-3333-333333333333';
await db.exec(`insert into auth.users values ('${A}'), ('${B}'), ('${M}'); insert into public.teachers (user_id) values ('${M}');`);

// reactions
await as('authenticated', A, () => db.query(`insert into public.reactions (lesson_slug, difficulty, feeling) values ('evening-wind-down', 'right', 'calmer')`));
await as('authenticated', B, () => db.query(`insert into public.reactions (lesson_slug, difficulty) values ('evening-wind-down', 'much')`));
await as('authenticated', B, () => db.query(`insert into public.reactions (lesson_slug, difficulty) values ('slow-morning-flow', 'gentle')`));
let r = await as('authenticated', A, () => db.query(`select * from public.reactions`));
ok('A sees only own reactions', r.rows.length === 1 && r.rows[0].user_id === A, `rows=${r.rows.length}`);
ok('A cannot insert for B', !!(await fails(() => as('authenticated', A, () => db.query(`insert into public.reactions (user_id, lesson_slug, difficulty) values ('${B}', 'x-y', 'right')`)))));
ok('bad difficulty refused', !!(await fails(() => as('authenticated', A, () => db.query(`insert into public.reactions (lesson_slug, difficulty) values ('abc', 'easy')`)))));
ok('bad slug refused', !!(await fails(() => as('authenticated', A, () => db.query(`insert into public.reactions (lesson_slug, difficulty) values ('Bad Slug!', 'right')`)))));
// upsert the way supabase-js does it
await as('authenticated', A, () => db.query(`insert into public.reactions (lesson_slug, difficulty, feeling) values ('evening-wind-down', 'gentle', null) on conflict (user_id, lesson_slug) do update set difficulty = excluded.difficulty, feeling = excluded.feeling`));
r = await as('authenticated', A, () => db.query(`select difficulty, feeling, created_at <= updated_at as dates_ok from public.reactions`));
ok('upsert replaces own reaction', r.rows.length === 1 && r.rows[0].difficulty === 'gentle' && r.rows[0].feeling === null && r.rows[0].dates_ok);
r = await as('authenticated', A, () => db.query(`update public.reactions set difficulty = 'much' where user_id = '${B}' returning *`));
ok("A cannot change B's reaction", r.rows.length === 0);
r = await as('authenticated', A, () => db.query(`update public.reactions set lesson_slug = 'other-lesson' returning lesson_slug`));
ok('slug cannot be changed by update', r.rows[0].lesson_slug === 'evening-wind-down');
ok('anon (not signed in) cannot read reactions', !!(await fails(() => as('anon', null, () => db.query(`select * from public.reactions`)))));
ok('anon cannot insert', !!(await fails(() => as('anon', null, () => db.query(`insert into public.reactions (user_id, lesson_slug, difficulty) values ('${A}', 'abc', 'right')`)))));

// stats
ok('student cannot call reaction_stats', !!(await fails(() => as('authenticated', A, () => db.query(`select * from public.reaction_stats()`)))));
ok('anon cannot call reaction_stats', !!(await fails(() => as('anon', null, () => db.query(`select * from public.reaction_stats()`)))));
r = await as('authenticated', M, () => db.query(`select * from public.reaction_stats()`));
const ev = r.rows.find((x) => x.lesson_slug === 'evening-wind-down');
ok('teacher sees totals', r.rows.length === 2 && Number(ev.total) === 2 && Number(ev.gentle) === 1 && Number(ev.too_much) === 1 && Number(ev.just_right) === 0, JSON.stringify(ev, (k, v) => typeof v === 'bigint' ? Number(v) : v));
r = await as('authenticated', M, () => db.query(`select * from public.reactions`));
ok('teacher cannot read raw rows of others', r.rows.length === 0);
r = await as('authenticated', M, () => db.query(`select public.is_teacher() as t`));
const r2 = await as('authenticated', A, () => db.query(`select public.is_teacher() as t`));
ok('is_teacher true for Maria, false for A', r.rows[0].t === true && r2.rows[0].t === false);
ok('A cannot make themselves a teacher', !!(await fails(() => as('authenticated', A, () => db.query(`insert into public.teachers (user_id) values ('${A}')`)))));
r = await as('authenticated', A, () => db.query(`select * from public.teachers`));
ok('A cannot see who the teachers are', r.rows.length === 0);

// cap
const many = Array.from({ length: 299 }, (_, i) => `('lesson-${i}', 'right')`).join(',');
await as('authenticated', A, () => db.query(`insert into public.reactions (lesson_slug, difficulty) values ${many}`));
ok('301st reaction refused', !!(await fails(() => as('authenticated', A, () => db.query(`insert into public.reactions (lesson_slug, difficulty) values ('one-too-many', 'right')`)))));

// push tokens
const T = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';
await as('authenticated', A, () => db.query(`select public.register_push_token($1, 'android', true)`, [T]));
ok('direct insert into push_tokens refused', !!(await fails(() => as('authenticated', A, () => db.query(`insert into public.push_tokens (token, user_id, platform) values ('ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]', '${A}', 'android')`)))));
await as('authenticated', B, () => db.query(`select public.register_push_token($1, 'android', true)`, [T]));
r = await db.query(`select user_id from public.push_tokens where token = $1`, [T]);
ok('token moves to the newest user (reinstall)', r.rows.length === 1 && r.rows[0].user_id === B);
r = await as('authenticated', A, () => db.query(`select * from public.push_tokens`));
ok("A no longer sees B's token", r.rows.length === 0);
for (let i = 0; i < 7; i++) await as('authenticated', B, () => db.query(`select public.register_push_token($1, 'android', true)`, [`ExponentPushToken[device-number-${i}-xxxxxxxx]`]));
r = await db.query(`select count(*)::int as n from public.push_tokens where user_id = '${B}'`);
ok('at most 5 tokens per user', r.rows[0].n === 5, `n=${r.rows[0].n}`);
ok('anon cannot register a token', !!(await fails(() => as('anon', null, () => db.query(`select public.register_push_token($1, 'android', true)`, [T])))));
ok('bad platform refused', !!(await fails(() => as('authenticated', A, () => db.query(`select public.register_push_token($1, 'windows', true)`, [T])))));
r = await as('service_role', null, () => db.query(`select count(*)::int as n from public.push_tokens where enabled`));
ok('service role (the GitHub Action) reads all tokens', r.rows[0].n === 5);

// sent_notifications: the app can never touch it, the GitHub Action (service role) can
ok('app cannot read sent_notifications', !!(await fails(() => as('authenticated', A, () => db.query(`select * from public.sent_notifications`)))));
await as('service_role', null, () => db.query(`insert into public.sent_notifications (item_key, recipients) values ('lesson/evening-wind-down', 5)`));
ok('a lesson is announced only once', !!(await fails(() => as('service_role', null, () => db.query(`insert into public.sent_notifications (item_key) values ('lesson/evening-wind-down')`)))));
ok('bad notification key refused', !!(await fails(() => as('service_role', null, () => db.query(`insert into public.sent_notifications (item_key) values ('whatever')`)))));

// keepalive
r = await as('anon', null, () => db.query(`select public.ping() as p`));
ok('anyone can ping (keepalive)', r.rows[0].p === true);

// delete my data
await as('authenticated', B, () => db.query(`select public.delete_my_data()`));
r = await db.query(`select (select count(*) from public.reactions where user_id = '${B}')::int as a, (select count(*) from public.push_tokens where user_id = '${B}')::int as b, (select count(*) from public.reactions where user_id = '${A}')::int as c`);
ok("delete_my_data removes B's rows only", r.rows[0].a === 0 && r.rows[0].b === 0 && r.rows[0].c === 300, JSON.stringify(r.rows[0]));
await db.exec(`delete from auth.users where id = '${A}'`);
r = await db.query(`select count(*)::int as n from public.reactions`);
ok('deleting the auth user cascades', r.rows[0].n === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
