-- Tabla para usuarios del sistema DM (Digital Marketing)
-- Estructura similar a bingo_users pero independiente

CREATE TABLE IF NOT EXISTS dm_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT NOT NULL,
    has_voted BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_dm_users_username ON dm_users(username);
CREATE INDEX IF NOT EXISTS idx_dm_users_has_voted ON dm_users(has_voted);
CREATE INDEX IF NOT EXISTS idx_dm_users_created_at ON dm_users(created_at);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_dm_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y crear nuevo
DROP TRIGGER IF EXISTS trigger_update_dm_users_updated_at ON dm_users;
CREATE TRIGGER trigger_update_dm_users_updated_at
    BEFORE UPDATE ON dm_users
    FOR EACH ROW
    EXECUTE FUNCTION update_dm_users_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE dm_users ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si existen y crear nuevas
DROP POLICY IF EXISTS "DM Users can view data" ON dm_users;
DROP POLICY IF EXISTS "DM Users can update their own data" ON dm_users;

-- Políticas de seguridad (similar a bingo_users)
CREATE POLICY "DM Users can view data" ON dm_users
    FOR SELECT USING (true); -- Permitir lectura a todos los usuarios autenticados

CREATE POLICY "DM Users can update their own data" ON dm_users
    FOR UPDATE USING (auth.uid() = id);

-- Función para verificar login de usuarios DM
CREATE OR REPLACE FUNCTION check_dm_user_login(p_username text, p_password text)
RETURNS json AS $$
DECLARE
  user_record record;
BEGIN
  SELECT * INTO user_record
  FROM public.dm_users
  WHERE username = p_username
    AND password = p_password;

  IF user_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuario o contraseña incorrectos'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_record.id,
      'username', user_record.username,
      'display_name', user_record.display_name,
      'has_voted', user_record.has_voted
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar usuario DM como votado
CREATE OR REPLACE FUNCTION mark_dm_user_voted(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE public.dm_users
  SET has_voted = true
  WHERE id = p_user_id;
  
  RETURN true;
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para reabrir votación de usuario DM
CREATE OR REPLACE FUNCTION reopen_dm_user_voting(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE public.dm_users
  SET has_voted = false
  WHERE id = p_user_id;
  
  RETURN true;
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para reabrir votación por username (para compatibilidad)
CREATE OR REPLACE FUNCTION reopen_dm_user_voting_by_username(p_username text)
RETURNS boolean AS $$
BEGIN
  UPDATE public.dm_users
  SET has_voted = false
  WHERE username = p_username;
  
  RETURN found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de votación DM
CREATE OR REPLACE FUNCTION get_dm_voting_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_users', COUNT(*),
    'voted_users', COUNT(*) FILTER (WHERE has_voted = true),
    'pending_users', COUNT(*) FILTER (WHERE has_voted = false),
    'completion_rate', 
      CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE has_voted = true)::FLOAT / COUNT(*)::FLOAT) * 100, 2)
        ELSE 0 
      END
  ) INTO stats
  FROM dm_users;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Datos de ejemplo para usuarios DM (cambiar contraseñas en producción)
INSERT INTO dm_users (username, password, display_name, avatar_url) VALUES
    ('maria.garcia', 'dm2024', 'María García López', NULL),
    ('carlos.ruiz', 'dm2024', 'Carlos Ruiz Mendoza', NULL),
    ('ana.lopez', 'dm2024', 'Ana López Silva', NULL),
    ('luis.martinez', 'dm2024', 'Luis Martínez Pérez', NULL),
    ('sofia.torres', 'dm2024', 'Sofía Torres Ramírez', NULL),
    ('pedro.sanchez', 'dm2024', 'Pedro Sánchez Vega', NULL),
    ('laura.jimenez', 'dm2024', 'Laura Jiménez Castro', NULL),
    ('diego.morales', 'dm2024', 'Diego Morales Ruiz', NULL),
    ('carmen.rivera', 'dm2024', 'Carmen Rivera López', NULL),
    ('javier.herrera', 'dm2024', 'Javier Herrera Díaz', NULL)
ON CONFLICT (username) DO NOTHING;

-- Comentarios sobre uso:
/*
-- Verificar login de usuario DM:
SELECT check_dm_user_login('maria.garcia', 'dm2024');

-- Marcar usuario como votado:
SELECT mark_dm_user_voted('uuid-del-usuario');

-- Reabrir votación:
SELECT reopen_dm_user_voting('uuid-del-usuario');
-- O por username:
SELECT reopen_dm_user_voting_by_username('maria.garcia');

-- Obtener estadísticas:
SELECT get_dm_voting_stats();

-- Consultar todos los usuarios DM:
SELECT * FROM dm_users ORDER BY created_at;

-- Consultar usuarios que han votado:
SELECT * FROM dm_users WHERE has_voted = true ORDER BY username;

-- Consultar usuarios pendientes:
SELECT * FROM dm_users WHERE has_voted = false ORDER BY username;

-- Cambiar contraseña de usuario:
UPDATE dm_users SET password = 'nueva_contraseña' WHERE username = 'usuario';

-- Agregar nuevo usuario DM:
INSERT INTO dm_users (username, password, display_name) 
VALUES ('nuevo.usuario', 'contraseña123', 'Nuevo Usuario');
*/ 