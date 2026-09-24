import { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../lib/firebaseClient'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { mockSettings } from '../lib/mockData'

const StoreContext = createContext(null)

export const StoreProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => ({
    ...mockSettings,
    whatsapp_number: import.meta.env.VITE_WHATSAPP_NUMBER || mockSettings.whatsapp_number,
  }))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    const docRef = doc(db, 'store_settings', 'general')
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setSettings((prev) => ({
            ...prev,
            ...data,
            // El valor guardado en Firestore tiene máxima prioridad sobre .env o mock
            whatsapp_number: data.whatsapp_number || import.meta.env.VITE_WHATSAPP_NUMBER || mockSettings.whatsapp_number,
          }))
        }
        setLoading(false)
      },
      (err) => {
        console.warn('Error escuchando configuración de tienda en Firestore:', err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Guardar configuración en Firestore
  const updateSettings = async (newSettings) => {
    if (!db) throw new Error('Firestore no está inicializado')
    const docRef = doc(db, 'store_settings', 'general')
    await setDoc(
      docRef,
      {
        ...newSettings,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    )
  }

  return (
    <StoreContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}

