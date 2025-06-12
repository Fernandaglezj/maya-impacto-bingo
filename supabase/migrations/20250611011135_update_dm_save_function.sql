-- Update save_dm_bingo_votes function to also create recognitions
-- This fixes the issue where votes were saved but not showing in results

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

-- Also update the reopen function to clean recognitions
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
