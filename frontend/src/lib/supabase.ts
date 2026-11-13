import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y complétalo.')
}

export const supabase = createClient(url, anonKey)

/** Columnas de items que se pueden mostrar públicamente, con sus relaciones. */
export const ITEM_SELECT = '*, category:categories(id,name,slug), location:locations(id,name), owner:profiles!user_id(id,first_name,last_name)'
