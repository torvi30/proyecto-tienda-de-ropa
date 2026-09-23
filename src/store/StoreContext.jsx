import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isDemoMode } from '../lib/supabaseClient'
import { mockSettings } from '../lib/mockData'

const StoreContext = createContext(null)

export const StoreProvider = ({ children }) => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      if (isDemoMode) {
        setSettings(mockSettings)
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single()
      if (!error && data) setSettings(data)
      setLoading(false)
    }
    fetchSettings()
  }, [])

  return (
    <StoreContext.Provider value={{ settings, loading }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}
