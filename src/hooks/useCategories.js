import { useState, useEffect } from 'react'
import { db } from '../lib/firebaseClient'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { mockCategories } from '../lib/mockData'

const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      if (!db) {
        setCategories(mockCategories)
        setLoading(false)
        return
      }

      try {
        const q = query(collection(db, 'categories'), orderBy('sort_order', 'asc'))
        const querySnapshot = await getDocs(q)
        const items = []
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() })
        })

        if (items.length === 0) {
          setCategories(mockCategories)
        } else {
          setCategories(items)
        }
      } catch (err) {
        console.error('Error al cargar categorías de Firestore:', err)
        setCategories(mockCategories)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading }
}

export default useCategories
