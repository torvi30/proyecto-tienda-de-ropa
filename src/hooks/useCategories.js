import { useState, useEffect } from 'react'
import { db } from '../lib/firebaseClient'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { mockCategories } from '../lib/mockData'

let cachedCategories = null

const useCategories = () => {
  const [categories, setCategories] = useState(() => cachedCategories || [])
  const [loading, setLoading] = useState(() => !cachedCategories)

  useEffect(() => {
    if (!db) {
      cachedCategories = mockCategories
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

          const finalCats = items.length === 0 ? mockCategories : items
          cachedCategories = finalCats
          setCategories(finalCats)
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
