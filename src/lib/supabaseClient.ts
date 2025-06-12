import { createClient } from '@supabase/supabase-js';

// Obtener URL original de Supabase desde las variables de entorno
const originalSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Usar una URL proxy para evitar problemas de CORS
const supabaseUrl = '/api';

if (!originalSupabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Crear cliente con configuración para usar el proxy
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  },
}); 