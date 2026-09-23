import { useState, useEffect } from 'react'
import { supabase, isDemoMode } from '../lib/supabaseClient'

const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // En modo demo: simular admin autenticado
    if (isDemoMode) {
      setUser({ email: 'demo@boutique.com', id: 'demo-admin' })
      setLoading(false)
      return
    }

    // Leer sesion actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escuchar cambios de sesion
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, loading, signIn, signOut }
}

export default useAuth
