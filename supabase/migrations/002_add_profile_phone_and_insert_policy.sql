alter table public.profiles
add column if not exists phone text;

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

grant insert on public.profiles to authenticated;
