-- MIGRACIÓN COMPLETA PARA SISTEMA DM BINGO
-- Este archivo contiene todo lo necesario para el sistema /dmbingo

-- 1. Agregar campo has_voted_dm a bingo_users si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bingo_users' 
        AND column_name = 'has_voted_dm'
    ) THEN
        ALTER TABLE public.bingo_users ADD COLUMN has_voted_dm BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_bingo_users_has_voted_dm ON public.bingo_users(has_voted_dm);
    END IF;
END $$;

-- 2. Create table for DM bingo cells with the new texts
CREATE TABLE IF NOT EXISTS public.dm_bingo_cells (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    points INTEGER NOT NULL,
    position INTEGER NOT NULL, -- Position in the 3x3 grid (0-8)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(position)
);

-- 3. Create table for DM participants (the emoji avatars)
CREATE TABLE IF NOT EXISTS public.dm_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    emoji TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    image_url TEXT,
    position INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create table for DM cell assignments (which participant is assigned to which cell)
CREATE TABLE IF NOT EXISTS public.dm_cell_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cell_id INTEGER REFERENCES public.dm_bingo_cells(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.dm_participants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.bingo_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(cell_id, user_id) -- One assignment per cell per user
);

-- 5. Create table for DM recognitions/votes
CREATE TABLE IF NOT EXISTS public.dm_recognitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cell_id INTEGER REFERENCES public.dm_bingo_cells(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.dm_participants(id) ON DELETE CASCADE,
    recognized_by_id UUID REFERENCES public.bingo_users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Insert the DM bingo cells with the new phrases and their corresponding points
INSERT INTO public.dm_bingo_cells (text, points, position) VALUES
    ('Comparte información y recursos de forma proactiva con todos', 4, 0),
    ('Identifica las causas raíz de los problemas y propone soluciones efectivas', 5, 1),
    ('Reacciona con agilidad ante imprevistos', 3, 2),
    ('Incorpora herramientas emergentes que optimizan el flujo de trabajo', 3, 3),
    ('Participa en reuniones de equipo con aportes relevantes', 2, 4),
    ('Solicita asistencia externa para resolver obstáculos complejos', 2, 5),
    ('Coopera con diferentes equipos cuando es necesario', 1, 6),
    ('Implementa soluciones tecnológicas', 1, 7),
    ('Siempre está dispuesto a escuchar', 0, 8)
ON CONFLICT (position) DO UPDATE SET
    text = EXCLUDED.text,
    points = EXCLUDED.points;

-- 7. Insert the current DM participants (emojis and names from /dmbingo)
INSERT INTO public.dm_participants (emoji, name, image_url, position) VALUES
    ('🦊', 'Diego Eduardo De La Fuente Garza', '/DM/Diego Eduardo De La Fuente Garza.png', 0),
    ('🐨', 'Gerardo Daniel Alcantara Garcia', '/DM/Gerardo Daniel Alcantara Garcia.jpeg', 1),
    ('🐼', 'Gustavo Vazquez Gutierrez', '/DM/Gustavo Vazquez Gutierrez.jpg', 2),
    ('🐸', 'Hernan Cano Leon', '/DM/Hernan Cano Leon.jpeg', 3),
    ('🦋', 'Ivan Augusto Gonzalez Avilez', '/DM/Ivan Augusto Gonzalez Avilez .jpeg', 4),
    ('🐝', 'Ivan Hernandez Olmos', '/DM/Ivan Hernandez Olmos.jpeg', 5),
    ('🌺', 'Jesus Gabriel Chavez Cavazos', '/DM/Jesus Gabriel Chavez Cavazos.jpeg', 6),
    ('🌻', 'Jorge Alberto Orenday Del Valle', '/DM/Jorge Alberto Orenday Del Valle.jpeg', 7),
    ('🌙', 'Juan David Jimenez Nieto', '/DM/Juan David Jimenez Nieto.jpeg', 8),
    ('⭐', 'Leon David Gil (frente)', '/DM/Leon David Gil (frente).jpeg', 9),
    ('🍀', 'Alvaro Munoz', '/DM/Alvaro Munoz.png', 10)
ON CONFLICT (emoji) DO UPDATE SET
    name = EXCLUDED.name,
    image_url = EXCLUDED.image_url,
    position = EXCLUDED.position;

-- 8. Enable RLS (Row Level Security) for all DM tables
ALTER TABLE public.dm_bingo_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_cell_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_recognitions ENABLE ROW LEVEL SECURITY;

-- 9. Create policies for public read access to DM cells and participants
DROP POLICY IF EXISTS "DM cells are publicly readable" ON public.dm_bingo_cells;
CREATE POLICY "DM cells are publicly readable" ON public.dm_bingo_cells
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "DM participants are publicly readable" ON public.dm_participants;
CREATE POLICY "DM participants are publicly readable" ON public.dm_participants
    FOR SELECT USING (true);

-- 10. Create policies for DM cell assignments
DROP POLICY IF EXISTS "DM assignments are publicly readable" ON public.dm_cell_assignments;
CREATE POLICY "DM assignments are publicly readable" ON public.dm_cell_assignments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own DM assignments" ON public.dm_cell_assignments;
CREATE POLICY "Users can insert their own DM assignments" ON public.dm_cell_assignments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own DM assignments" ON public.dm_cell_assignments;
CREATE POLICY "Users can update their own DM assignments" ON public.dm_cell_assignments
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete their own DM assignments" ON public.dm_cell_assignments;
CREATE POLICY "Users can delete their own DM assignments" ON public.dm_cell_assignments
    FOR DELETE USING (true);

-- 11. Create policies for DM recognitions
DROP POLICY IF EXISTS "DM recognitions are publicly readable" ON public.dm_recognitions;
CREATE POLICY "DM recognitions are publicly readable" ON public.dm_recognitions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert DM recognitions" ON public.dm_recognitions;
CREATE POLICY "Users can insert DM recognitions" ON public.dm_recognitions
    FOR INSERT WITH CHECK (true);

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dm_cell_assignments_cell_id ON public.dm_cell_assignments(cell_id);
CREATE INDEX IF NOT EXISTS idx_dm_cell_assignments_participant_id ON public.dm_cell_assignments(participant_id);
CREATE INDEX IF NOT EXISTS idx_dm_cell_assignments_user_id ON public.dm_cell_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_recognitions_participant_id ON public.dm_recognitions(participant_id);
CREATE INDEX IF NOT EXISTS idx_dm_recognitions_cell_id ON public.dm_recognitions(cell_id);
CREATE INDEX IF NOT EXISTS idx_dm_recognitions_recognized_by_id ON public.dm_recognitions(recognized_by_id);

-- 13. Create a view for DM participant rankings
CREATE OR REPLACE VIEW public.dm_participant_rankings AS
SELECT 
    p.id,
    p.emoji,
    p.name,
    p.image_url,
    COUNT(DISTINCT r.id) as total_recognitions,
    COALESCE(SUM(r.points), 0) as total_points
FROM public.dm_participants p
LEFT JOIN public.dm_recognitions r ON p.id = r.participant_id
GROUP BY p.id, p.emoji, p.name, p.image_url, p.position
ORDER BY total_points DESC, total_recognitions DESC, p.position ASC;

-- 14. Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 15. Create trigger for DM participants
DROP TRIGGER IF EXISTS update_dm_participants_updated_at ON public.dm_participants;
CREATE TRIGGER update_dm_participants_updated_at
    BEFORE UPDATE ON public.dm_participants
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 16. Function to save DM bingo votes (actualizada para crear reconocimientos)
CREATE OR REPLACE FUNCTION save_dm_bingo_votes(
    p_user_id UUID,
    p_assignments JSONB
)
RETURNS json AS $$
DECLARE
    assignment JSONB;
    participant_uuid UUID;
    cell_points INTEGER;
BEGIN
    -- Clear existing assignments and recognitions for this user
    DELETE FROM public.dm_cell_assignments WHERE user_id = p_user_id;
    DELETE FROM public.dm_recognitions WHERE recognized_by_id = p_user_id;
    
    -- Insert new assignments and create recognitions
    FOR assignment IN SELECT * FROM jsonb_array_elements(p_assignments)
    LOOP
        -- Convert participant_id string to UUID if needed
        BEGIN
            participant_uuid := (assignment->>'participant_id')::UUID;
        EXCEPTION
            WHEN invalid_text_representation THEN
                -- If it's not a UUID, try to find by emoji
                SELECT id INTO participant_uuid 
                FROM public.dm_participants 
                WHERE emoji = (assignment->>'participant_id');
        END;
        
        -- Get the points for this cell
        SELECT points INTO cell_points 
        FROM public.dm_bingo_cells 
        WHERE id = (assignment->>'cell_id')::INTEGER;
        
        -- Insert assignment
        INSERT INTO public.dm_cell_assignments (cell_id, participant_id, user_id)
        VALUES (
            (assignment->>'cell_id')::INTEGER,
            participant_uuid,
            p_user_id
        );
        
        -- Insert recognition (this is what generates the ranking)
        INSERT INTO public.dm_recognitions (cell_id, participant_id, recognized_by_id, points)
        VALUES (
            (assignment->>'cell_id')::INTEGER,
            participant_uuid,
            p_user_id,
            COALESCE(cell_points, 0)
        );
    END LOOP;
    
    -- Mark user as voted for DM
    UPDATE public.bingo_users 
    SET has_voted_dm = true 
    WHERE id = p_user_id;
    
    RETURN json_build_object('success', true, 'message', 'Votación DM guardada exitosamente');
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error al guardar: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Function to get DM bingo data for a user
CREATE OR REPLACE FUNCTION get_dm_bingo_data(p_user_id UUID)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'cells', (
            SELECT json_agg(
                json_build_object(
                    'id', id,
                    'text', text,
                    'points', points,
                    'position', position
                ) ORDER BY position
            )
            FROM public.dm_bingo_cells
        ),
        'participants', (
            SELECT json_agg(
                json_build_object(
                    'id', id,
                    'emoji', emoji,
                    'name', name,
                    'image_url', image_url,
                    'position', position
                ) ORDER BY position
            )
            FROM public.dm_participants
        ),
        'assignments', (
            SELECT json_agg(
                json_build_object(
                    'cell_id', cell_id,
                    'participant_id', participant_id
                )
            )
            FROM public.dm_cell_assignments
            WHERE user_id = p_user_id
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Function to mark DM user as voted (para compatibilidad)
CREATE OR REPLACE FUNCTION mark_dm_user_voted(p_user_id UUID)
RETURNS boolean AS $$
BEGIN
    UPDATE public.bingo_users
    SET has_voted_dm = true
    WHERE id = p_user_id;
    
    RETURN true;
EXCEPTION
    WHEN others THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. Function to reopen DM voting (actualizada para limpiar reconocimientos)
CREATE OR REPLACE FUNCTION reopen_dm_user_voting(p_user_id UUID)
RETURNS boolean AS $$
BEGIN
    -- Delete assignments and recognitions
    DELETE FROM public.dm_cell_assignments WHERE user_id = p_user_id;
    DELETE FROM public.dm_recognitions WHERE recognized_by_id = p_user_id;
    
    -- Mark as not voted
    UPDATE public.bingo_users
    SET has_voted_dm = false
    WHERE id = p_user_id;
    
    RETURN true;
EXCEPTION
    WHEN others THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que el usuario específico del error ahora existe
SELECT id, username, display_name, has_voted_dm 
FROM public.bingo_users 
WHERE id = 'db8a5cd2-8c6d-4b02-9d9e-123456789012'
LIMIT 1;

-- Verificar que las tablas DM existen y tienen datos
SELECT 'dm_bingo_cells' as tabla, COUNT(*) as registros FROM public.dm_bingo_cells
UNION ALL
SELECT 'dm_participants' as tabla, COUNT(*) as registros FROM public.dm_participants
UNION ALL
SELECT 'dm_cell_assignments' as tabla, COUNT(*) as registros FROM public.dm_cell_assignments
UNION ALL
SELECT 'dm_recognitions' as tabla, COUNT(*) as registros FROM public.dm_recognitions;

-- Verificar que la vista del ranking funciona
SELECT emoji, name, total_recognitions, total_points 
FROM public.dm_participant_rankings 
ORDER BY total_points DESC 
LIMIT 5;

-- ✅ MIGRACIÓN COMPLETA DM - TODO LISTO PARA /dmbingo y /resultadosdm 