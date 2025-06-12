-- Update RLS policies to be more permissive
drop policy if exists "Users can view their own data" on public.bingo_users;
drop policy if exists "Users can update their own data" on public.bingo_users;

create policy "Enable read access for all users" on public.bingo_users
  for select using (true);

create policy "Enable write access for all users" on public.bingo_users
  for all using (true);

-- Ensure anonymous access is enabled
grant usage on schema public to anon;
grant all on public.bingo_users to anon;
grant all on public.recognitions to anon;

-- Grant execute permissions on functions
grant execute on function check_user_login(text, text) to anon;
grant execute on function mark_user_voted(uuid) to anon; 