import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Tipos para las tablas
export type Participant = Database['public']['Tables']['participants']['Row'];
export type BingoCell = Database['public']['Tables']['bingo_cells']['Row'];
export type CellAssignment = Database['public']['Tables']['cell_assignments']['Row'];
export type Recognition = Database['public']['Tables']['recognitions']['Row'];
export type ParticipantRanking = Database['public']['Views']['participant_rankings']['Row']; 