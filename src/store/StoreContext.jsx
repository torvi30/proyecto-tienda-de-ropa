import { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../lib/firebaseClient'
import { doc, getDoc } from 'firebase/firestore'
import { mockSettings } from '../lib/mockData'

const StoreContext = createContext(null)

export const StoreProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => ({
    ...mockSettings,
    whatsapp_number: import.meta.env.VITE_WHATSAPP_NUMBER || mockSettings.whatsapp_number,
  }))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      if (!db) {
        setLoading(false)
        return
      }

      try {
        const docRef = doc(db, 'store_settings', 'general')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setSettings({
            ...mockSettings,
            ...docSnap.data(),
            whatsapp_number: import.meta.env.VITE_WHATSAPP_NUMBER || docSnap.data().whatsapp_number || mockSettings.whatsapp_number,
          })
        }
      } catch (err) {
        console.warn('Usando configuración de tienda por defecto:', err.message)
      } finally {
        setLoading(false)
      }
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
