import { useState, useEffect } from 'react'
import { auth, isDemoMode } from '../lib/firebaseClient'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'

const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode) {
      setUser({ email: 'admin@demo.com', uid: 'demo-admin-uid' })
      setLoading(false)
      return
    }

    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    if (isDemoMode) {
      const demoUser = { email, uid: 'demo-admin-uid' }
      setUser(demoUser)
      return { user: demoUser, error: null }
    }

    if (!auth) {
      return {
        user: null,
        error: { message: 'Firebase Auth no está configurado. Revisa tu archivo .env.local' },
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return { user: userCredential.user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }

  const signOut = async () => {
    if (isDemoMode) {
      setUser(null)
      return { error: null }
    }

    if (!auth) {
      setUser(null)
      return { error: null }
    }

    try {
      await firebaseSignOut(auth)
      setUser(null)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return { user, loading, signIn, signOut }
}

export default useAuth
