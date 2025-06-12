-- Crear tabla bingo_users si no existe
CREATE TABLE IF NOT EXISTS bingo_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    has_voted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eliminar el constraint existente de recognized_by_id
ALTER TABLE recognitions 
DROP CONSTRAINT IF EXISTS recognitions_recognized_by_id_fkey;

-- Agregar nuevo constraint que referencia bingo_users
ALTER TABLE recognitions 
ADD CONSTRAINT recognitions_recognized_by_id_fkey 
FOREIGN KEY (recognized_by_id) REFERENCES bingo_users(id);

-- Crear políticas de seguridad para bingo_users
ALTER TABLE bingo_users ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan leer su propia información
CREATE POLICY "Usuarios pueden ver su propia información" ON bingo_users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Política para insertar nuevos usuarios (registro)
CREATE POLICY "Permitir inserción de nuevos usuarios" ON bingo_users
    FOR INSERT WITH CHECK (true);

-- Política para actualizar su propia información
CREATE POLICY "Usuarios pueden actualizar su propia información" ON bingo_users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Crear trigger para actualizar updated_at en bingo_users
CREATE TRIGGER update_bingo_users_updated_at
    BEFORE UPDATE ON bingo_users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column(); 