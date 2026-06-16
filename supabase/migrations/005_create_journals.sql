create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  proud_accomplishment text not null,
  biggest_distraction text not null,
  tomorrow_note text not null,
  journal_date date not null default current_date,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (user_id, journal_date)
);

alter table public.journals enable row level security;

drop policy if exists "Users can read their own journals" on public.journals;
create policy "Users can read their own journals"
on public.journals
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own journals" on public.journals;
create policy "Users can insert their own journals"
on public.journals
for insert
to authenticated
with check (auth.uid() = user_id);

grant select, insert on public.journals to authenticated;
