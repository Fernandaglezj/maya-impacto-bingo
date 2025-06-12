-- Create table for emoji configuration
CREATE TABLE IF NOT EXISTS public.emoji_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    emoji TEXT NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add unique constraint to prevent duplicate emojis
ALTER TABLE public.emoji_config
ADD CONSTRAINT unique_emoji UNIQUE (emoji);

-- Add unique constraint to prevent duplicate positions
ALTER TABLE public.emoji_config
ADD CONSTRAINT unique_position UNIQUE (position);

-- Create storage bucket for emoji images if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('emoji-images', 'emoji-images', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Storage API is not enabled. Skipping bucket creation.';
END $$;

-- Set up storage policies
DO $$
BEGIN
    -- Allow public access to read emoji images
    CREATE POLICY "Emoji images are publicly accessible"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'emoji-images' );
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Emoji images are publicly accessible" already exists.';
    WHEN undefined_table THEN
        RAISE NOTICE 'Storage API is not enabled. Skipping policy creation.';
END $$;

-- Only allow admin to manage emoji images
DO $$
BEGIN
    CREATE POLICY "Only admin can manage emoji images"
    ON storage.objects
    FOR ALL
    USING ( bucket_id = 'emoji-images' AND auth.role() = 'authenticated' )
    WITH CHECK ( bucket_id = 'emoji-images' AND auth.role() = 'authenticated' );
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Only admin can manage emoji images" already exists.';
    WHEN undefined_table THEN
        RAISE NOTICE 'Storage API is not enabled. Skipping policy creation.';
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_emoji_config_updated_at
    BEFORE UPDATE ON emoji_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default emojis
INSERT INTO emoji_config (emoji, name, position) VALUES
    ('🐰', 'Conejito', 1),
    ('🦊', 'Zorro', 2),
    ('🐨', 'Koala', 3),
    ('🐼', 'Panda', 4),
    ('🐸', 'Ranita', 5),
    ('🦋', 'Mariposa', 6),
    ('🐝', 'Abejita', 7),
    ('🌺', 'Flor de Hibisco', 8),
    ('🌻', 'Girasol', 9),
    ('🌙', 'Luna', 10),
    ('⭐', 'Estrella', 11),
    ('🍀', 'Trébol', 12),
    ('🌿', 'Hoja Verde', 13),
    ('🦜', 'Perico', 14),
    ('🐢', 'Tortuga', 15),
    ('🦁', 'León', 16),
    ('🐯', 'Tigre', 17),
    ('🦒', 'Jirafa', 18),
    ('🦉', 'Búho', 19),
    ('🦚', 'Pavo Real', 20)
ON CONFLICT (emoji) DO UPDATE
SET name = EXCLUDED.name; 