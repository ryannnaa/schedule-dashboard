import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are not set. Saved mappings will not be available.')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  db: { schema: 'public' },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      apikey: supabaseKey ?? '',
    },
  },
})
