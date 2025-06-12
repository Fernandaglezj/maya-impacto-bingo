-- Add source field to recognitions table to separate bingo from dm data
ALTER TABLE public.recognitions 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'bingo' CHECK (source IN ('bingo', 'dm'));

-- Add has_voted_dm field to bingo_users table
ALTER TABLE public.bingo_users 
ADD COLUMN IF NOT EXISTS has_voted_dm boolean DEFAULT false;

-- Create index for source field to improve query performance
CREATE INDEX IF NOT EXISTS idx_recognitions_source ON public.recognitions(source);

-- Update existing recognitions to have 'bingo' as default source
UPDATE public.recognitions 
SET source = 'bingo' 
WHERE source IS NULL;

-- Create function to check login with source support
CREATE OR REPLACE FUNCTION check_user_login_with_source(p_username text, p_password text, p_source text DEFAULT 'bingo')
RETURNS json AS $$
DECLARE
  user_record record;
  has_voted_field boolean;
BEGIN
  SELECT * INTO user_record
  FROM public.bingo_users
  WHERE username = p_username
    AND password = p_password;

  IF user_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuario o contraseña incorrectos'
    );
  END IF;

  -- Check if user has voted for the specific source
  IF p_source = 'dm' THEN
    has_voted_field := user_record.has_voted_dm;
  ELSE
    has_voted_field := user_record.has_voted;
  END IF;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_record.id,
      'username', user_record.username,
      'display_name', user_record.display_name,
      'has_voted', has_voted_field
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark user as voted with source support
CREATE OR REPLACE FUNCTION mark_user_voted_with_source(p_user_id uuid, p_source text DEFAULT 'bingo')
RETURNS boolean AS $$
BEGIN
  IF p_source = 'dm' THEN
    UPDATE public.bingo_users
    SET has_voted_dm = true
    WHERE id = p_user_id;
  ELSE
    UPDATE public.bingo_users
    SET has_voted = true
    WHERE id = p_user_id;
  END IF;
  
  RETURN true;
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user voted with source support
CREATE OR REPLACE FUNCTION check_user_voted_with_source(p_user_id uuid, p_source text DEFAULT 'bingo')
RETURNS boolean AS $$
DECLARE
  has_voted_field boolean;
BEGIN
  IF p_source = 'dm' THEN
    SELECT has_voted_dm INTO has_voted_field
    FROM public.bingo_users
    WHERE id = p_user_id;
  ELSE
    SELECT has_voted INTO has_voted_field
    FROM public.bingo_users
    WHERE id = p_user_id;
  END IF;
  
  RETURN COALESCE(has_voted_field, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 