import { createClient } from '@supabase/supabase-js';

// Agora o código vai ler as chaves que você configurou no painel da Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Faltando chaves do Supabase nas variáveis de ambiente!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');