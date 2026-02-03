
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL ou Anon Key não configurados. Verifique o arquivo .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verificador de Conexão (Conector Supabase)
export const checkSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('devices').select('id').limit(1);
        if (error) throw error;
        return { connected: true, error: null };
    } catch (err: any) {
        console.error('Erro de conexão com Supabase:', err.message);
        return { connected: false, error: err.message };
    }
};
