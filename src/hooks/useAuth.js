import { useState, useEffect } from 'react'
import { auth } from '../lib/firebaseClient'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'

const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    if (!auth) {
      return {
        user: null,
        error: { message: 'Firebase Auth no está inicializado. Revisa tus variables en .env' },
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
