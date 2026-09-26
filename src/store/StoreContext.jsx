import { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../lib/firebaseClient'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { mockSettings } from '../lib/mockData'

import { sanitizeWhatsAppNumber } from '../lib/whatsapp'

const LOCAL_STORAGE_KEY = 'boutique_store_settings'

const StoreContext = createContext(null)

export const StoreProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // 1. Intentar leer desde localStorage para disponibilidad instantánea y offline
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        return {
          ...mockSettings,
          ...parsed,
          whatsapp_number: sanitizeWhatsAppNumber(parsed.whatsapp_number) || import.meta.env.VITE_WHATSAPP_NUMBER || mockSettings.whatsapp_number,
        }
      }
    } catch (e) {
      console.warn('Error leyendo store_settings desde localStorage:', e)
    }

    return {
      ...mockSettings,
      whatsapp_number: sanitizeWhatsAppNumber(import.meta.env.VITE_WHATSAPP_NUMBER) || mockSettings.whatsapp_number,
    }
  })
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
          const sanitizedWhatsApp = sanitizeWhatsAppNumber(data.whatsapp_number) || import.meta.env.VITE_WHATSAPP_NUMBER || mockSettings.whatsapp_number
          const merged = {
            ...data,
            whatsapp_number: sanitizedWhatsApp,
          }

          setSettings((prev) => ({
            ...prev,
            ...merged,
          }))

          // Actualizar caché de localStorage
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged))
          } catch (e) {
            console.warn('Error guardando en localStorage:', e)
          }
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

  // Guardar configuración tanto en Firestore como en localStorage de inmediato
  const updateSettings = async (newSettings) => {
    const sanitized = { ...newSettings }
    if (sanitized.whatsapp_number) {
      sanitized.whatsapp_number = sanitizeWhatsAppNumber(sanitized.whatsapp_number)
    }

    // 1. Actualización optimista inmediata en estado de React
    setSettings((prev) => ({
      ...prev,
      ...sanitized,
    }))

    // 2. Persistir de inmediato en localStorage para que nunca se pierda en recargas
    try {
      const merged = { ...settings, ...sanitized }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged))
    } catch (e) {
      console.warn('Error escribiendo en localStorage:', e)
    }

    // 3. Persistir en Firestore para sincronización multi-dispositivo
    if (db) {
      const docRef = doc(db, 'store_settings', 'general')
      await setDoc(
        docRef,
        {
          ...sanitized,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      )
    }
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

