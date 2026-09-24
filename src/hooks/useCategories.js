import { useState, useEffect } from 'react'
import { db } from '../lib/firebaseClient'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { mockCategories } from '../lib/mockData'

const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) {
      setCategories(mockCategories)
      setLoading(false)
      return
    }

    try {
      const q = query(collection(db, 'categories'), orderBy('sort_order', 'asc'))
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const items = []
          querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() })
          })

          if (items.length === 0) {
            setCategories(mockCategories)
          } else {
            setCategories(items)
          }
          setLoading(false)
        },
        (err) => {
          console.error('Error listening to Firestore categories:', err)
          setCategories(mockCategories)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Error initializing categories query:', err)
      setCategories(mockCategories)
      setLoading(false)
    }
  }, [])

  return { categories, loading }
}

export default useCategories
