import { useState, useEffect } from 'react'
import { db } from '../lib/firebaseClient'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { mockProducts } from '../lib/mockData'

let cachedProducts = null

const useProducts = () => {
  const [products, setProducts] = useState(() => cachedProducts || [])
  const [loading, setLoading] = useState(() => !cachedProducts)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      if (!db) {
        const fallback = mockProducts.filter((p) => p.is_visible && p.stock_status !== 'sold_out')
        cachedProducts = fallback
        setProducts(fallback)
        setLoading(false)
        return
      }

      try {
        let items = []
        try {
          const q = query(collection(db, 'products'), orderBy('created_at', 'desc'))
          const querySnapshot = await getDocs(q)
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            if (data.is_visible !== false && data.stock_status !== 'sold_out') {
              items.push({ id: doc.id, ...data })
            }
          })
        } catch {
          // Fallback query without orderBy if index or created_at field is missing
          const fallbackSnapshot = await getDocs(collection(db, 'products'))
          fallbackSnapshot.forEach((doc) => {
            const data = doc.data()
            if (data.is_visible !== false && data.stock_status !== 'sold_out') {
              items.push({ id: doc.id, ...data })
            }
          })
        }

        // If database does not have products yet, load fallback sample products
        const finalItems =
          items.length === 0
            ? mockProducts.filter((p) => p.is_visible && p.stock_status !== 'sold_out')
            : items

        cachedProducts = finalItems
        setProducts(finalItems)
      } catch (err) {
        console.error('Error loading Firestore products:', err)
        setError(err.message)
        const fallback = mockProducts.filter((p) => p.is_visible && p.stock_status !== 'sold_out')
        cachedProducts = fallback
        setProducts(fallback)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { products, loading, error }
}

export default useProducts
