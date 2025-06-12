-- Drop the existing function
drop function if exists check_user_login(text, text);

-- Create the updated function
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