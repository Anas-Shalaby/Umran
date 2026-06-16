create table if not exists public.fixed_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  habit_name text not null,
  prayer_anchor text not null check (
    prayer_anchor in ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha')
  ),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (user_id, habit_name)
);

alter table public.fixed_habits enable row level security;

drop policy if exists "Users can read their own fixed habits" on public.fixed_habits;
create policy "Users can read their own fixed habits"
on public.fixed_habits
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own fixed habits" on public.fixed_habits;
create policy "Users can insert their own fixed habits"
on public.fixed_habits
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own fixed habits" on public.fixed_habits;
create policy "Users can update their own fixed habits"
on public.fixed_habits
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own fixed habits" on public.fixed_habits;
create policy "Users can delete their own fixed habits"
on public.fixed_habits
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.fixed_habits to authenticated;
