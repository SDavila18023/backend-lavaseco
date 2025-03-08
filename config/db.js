import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL; // Usa variables de entorno para seguridad
const supabaseKey = process.env.SUPABASE_KEY; // Usa variables de entorno para seguridad
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
