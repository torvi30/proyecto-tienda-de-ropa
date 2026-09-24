import { useState, useEffect } from 'react'
import { auth } from '../lib/firebaseClient'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

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

  const signInWithGoogle = async () => {
    if (!auth) {
      return {
        user: null,
        error: { message: 'Firebase Auth no está inicializado. Revisa tus variables en .env' },
      }
    }

    try {
      const result = await signInWithPopup(auth, googleProvider)
      return { user: result.user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }

  const signUp = async (email, password, displayName = '') => {
    if (!auth) {
      return {
        user: null,
        error: { message: 'Firebase Auth no está inicializado. Revisa tus variables en .env' },
      }
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName && userCredential.user) {
        try {
          await updateProfile(userCredential.user, { displayName })
        } catch (e) {
          console.warn('Could not update profile display name:', e)
        }
      }

      // Send Firebase email verification token
      try {
        await sendEmailVerification(userCredential.user)
      } catch (e) {
        console.warn('Could not send verification email:', e)
      }

      return { user: userCredential.user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }

  const sendVerification = async () => {
    if (!auth?.currentUser) {
      return { error: { message: 'No hay usuario autenticado actualmente.' } }
    }
    try {
      await sendEmailVerification(auth.currentUser)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const resetPassword = async (email) => {
    if (!auth) {
      return { error: { message: 'Firebase Auth no está inicializado.' } }
    }
    try {
      await sendPasswordResetEmail(auth, email)
      return { error: null }
    } catch (error) {
      return { error }
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

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    sendVerification,
    resetPassword,
    signOut,
  }
}

export default useAuth
