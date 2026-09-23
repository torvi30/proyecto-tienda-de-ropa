// =============================================================
// CLIENTE SUPABASE — INSTANCIA UNICA
// No crear otras instancias en otros archivos.
// Las claves se leen de las variables de entorno VITE_*
// =============================================================
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// En modo demo, las claves pueden ser strings vacios
// La app usara mockData.js en su lugar
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

let supabase = null

if (!isDemoMode) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[Supabase] Faltan variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY.\n' +
      'Copia .env.example a .env.local y agrega tus claves, o activa VITE_DEMO_MODE=true'
    )
  } else {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
}

export { supabase, isDemoMode }
