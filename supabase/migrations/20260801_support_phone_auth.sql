-- Allows Supabase Auth users who sign in with a phone number and no email.
alter table public.profiles alter column email drop not null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.phone, new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;

-- The existing unique constraint safely allows multiple NULL emails in Postgres.
-- Run this migration in the Supabase SQL Editor before enabling phone OTP login.
