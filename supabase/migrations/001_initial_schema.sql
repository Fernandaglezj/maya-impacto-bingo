-- Crear tabla de usuarios/participantes
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de casillas del bingo
CREATE TABLE bingo_cells (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    points INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'team' para casillas de equipo, 'general' para las demás
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para las asignaciones de participantes a casillas
CREATE TABLE cell_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id INTEGER REFERENCES bingo_cells(id),
    participant_id UUID REFERENCES participants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cell_id, participant_id)
);

-- Crear tabla para el historial de reconocimientos
CREATE TABLE recognitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id INTEGER REFERENCES bingo_cells(id),
    participant_id UUID REFERENCES participants(id),
    recognized_by_id UUID REFERENCES participants(id),
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar las casillas predefinidas del bingo
INSERT INTO bingo_cells (text, points, category) VALUES
    ('Compartió un tip o truco que a todos nos sirvió', 5, 'team'),
    ('Hizo fácil lo que parecía chino mandarín', 5, 'team'),
    ('Se rifó ayudando aunque no era su chamba', 5, 'team'),
    ('Se aventó la ayuda sin que nadie la pidiera', 4, 'general'),
    ('Sacó la mejor actitud de servicio', 3, 'general'),
    ('Le dio crédito a alguien que lo hizo increíble', 4, 'general'),
    ('Respondió con calma y buena onda una duda', 3, 'general'),
    ('Contagió buena vibra al equipo', 2, 'general'),
    ('Dijo lo que se tenía que decir, con respeto', 3, 'general'),
    ('Escuchó con atención de verdad, no por cumplir', 3, 'general'),
    ('Se plantó por los valores cuando tocó', 4, 'general'),
    ('Le dio foco y luz a alguien más', 4, 'general');

-- Crear función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at en participants
CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Crear vista para el ranking de participantes
CREATE VIEW participant_rankings AS
SELECT 
    p.id,
    p.name,
    p.avatar_url,
    COUNT(DISTINCT r.id) as total_recognitions,
    SUM(r.points) as total_points
FROM participants p
LEFT JOIN recognitions r ON p.id = r.participant_id
GROUP BY p.id, p.name, p.avatar_url
ORDER BY total_points DESC, total_recognitions DESC;

-- Crear políticas de seguridad RLS (Row Level Security)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognitions ENABLE ROW LEVEL SECURITY;

-- Crear política para lectura pública de participantes
CREATE POLICY "Participantes visibles para todos" ON participants
    FOR SELECT USING (true);

-- Crear política para lectura pública de casillas
CREATE POLICY "Casillas visibles para todos" ON bingo_cells
    FOR SELECT USING (true);

-- Crear política para lectura pública de asignaciones
CREATE POLICY "Asignaciones visibles para todos" ON cell_assignments
    FOR SELECT USING (true);

-- Crear política para lectura pública de reconocimientos
CREATE POLICY "Reconocimientos visibles para todos" ON recognitions
    FOR SELECT USING (true);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_cell_assignments_cell_id ON cell_assignments(cell_id);
CREATE INDEX idx_cell_assignments_participant_id ON cell_assignments(participant_id);
CREATE INDEX idx_recognitions_participant_id ON recognitions(participant_id);
CREATE INDEX idx_recognitions_cell_id ON recognitions(cell_id); 