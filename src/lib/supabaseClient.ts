import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project credentials.',
  )
}

// Not using the generic Database type here: we don't have real generated
// types yet (`supabase gen types`). Domain shapes live in ./database.types
// and call sites cast query results to them explicitly.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
