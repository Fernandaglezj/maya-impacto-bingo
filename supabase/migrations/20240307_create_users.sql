-- Create a table for managing user access
create table if not exists public.bingo_users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  display_name text not null,
  has_voted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key to recognitions table
alter table public.recognitions
add column if not exists user_id uuid references public.bingo_users(id);

-- Enable RLS
alter table public.bingo_users enable row level security;

-- Create policies
create policy "Users can view their own data" on public.bingo_users
  for select using (true); -- Permitir lectura a todos los usuarios autenticados

create policy "Users can update their own data" on public.bingo_users
  for update using (auth.uid() = id);

-- Create function to check login
create or replace function check_user_login(p_username text, p_password text)
returns json as $$
declare
  user_record record;
begin
  select * into user_record
  from public.bingo_users
  where username = p_username
    and password = p_password;

  if user_record.id is null then
    return json_build_object(
      'success', false,
      'message', 'Usuario o contraseña incorrectos'
    );
  end if;

  -- Removed the has_voted check to allow users to participate multiple times

  return json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_record.id,
      'username', user_record.username,
      'display_name', user_record.display_name,
      'has_voted', user_record.has_voted
    )
  );
end;
$$ language plpgsql security definer;

-- Create function to mark user as voted
create or replace function mark_user_voted(p_user_id uuid)
returns boolean as $$
begin
  update public.bingo_users
  set has_voted = true
  where id = p_user_id;
  
  return true;
exception
  when others then
    return false;
end;
$$ language plpgsql security definer; 