-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add avatar_url column to bingo_users table
DO $$ 
BEGIN 
    ALTER TABLE public.bingo_users
    ADD COLUMN avatar_url text;
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'Column avatar_url already exists in bingo_users.';
END $$;

-- Create storage bucket for avatars if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Storage API is not enabled. Skipping bucket creation.';
END $$;

-- Set up storage policies if storage API is enabled
DO $$
BEGIN
    -- Allow public access to read avatar images
    CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'avatars' );
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Avatar images are publicly accessible" already exists.';
    WHEN undefined_table THEN
        RAISE NOTICE 'Storage API is not enabled. Skipping policy creation.';
END $$;

DO $$
BEGIN
    -- Only allow admin to upload avatars
    CREATE POLICY "Only admin can upload avatar images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.email() = 'admin@example.com' -- Reemplazar con el email del admin
    );
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Only admin can upload avatar images" already exists.';
    WHEN undefined_table THEN
        RAISE NOTICE 'Storage API is not enabled. Skipping policy creation.';
END $$;

DO $$
BEGIN
    -- Only allow admin to update avatars
    CREATE POLICY "Only admin can update avatar images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.email() = 'admin@example.com' -- Reemplazar con el email del admin
    );
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Only admin can update avatar images" already exists.';
    WHEN undefined_table THEN
        RAISE NOTICE 'Storage API is not enabled. Skipping policy creation.';
END $$;

DO $$
BEGIN
    -- Only allow admin to delete avatars
    CREATE POLICY "Only admin can delete avatar images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.email() = 'admin@example.com' -- Reemplazar con el email del admin
    );
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Only admin can delete avatar images" already exists.';
    WHEN undefined_table THEN
        RAISE NOTICE 'Storage API is not enabled. Skipping policy creation.';
END $$; 