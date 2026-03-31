import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yvyrzqoyxpqmacajwst.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2eXJ6cW95eHBxbWFxY2Fqd3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTcxOTcsImV4cCI6MjA5MDUzMzE5N30.U5fqfAPbSlmzCHxhtxuRI5pOe4M9V2N_Ca0Ws7PLxiA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
