alter table public.profiles
add column if not exists has_onboarded boolean not null default false;
