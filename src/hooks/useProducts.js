import { useState, useEffect } from 'react'
import { db } from '../lib/firebaseClient'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { mockProducts } from '../lib/mockData'

const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      if (!db) {
        setProducts(mockProducts.filter((p) => p.is_visible && p.stock_status !== 'sold_out'))
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
          const fallbackSnapshot = await getDocs(collection(db, 'products'))
          fallbackSnapshot.forEach((doc) => {
            const data = doc.data()
            if (data.is_visible !== false && data.stock_status !== 'sold_out') {
              items.push({ id: doc.id, ...data })
            }
          })
        }

        // Si la base de datos aún no tiene prendas creadas, mostrar prendas de demostración
        if (items.length === 0) {
          setProducts(mockProducts.filter((p) => p.is_visible && p.stock_status !== 'sold_out'))
        } else {
          setProducts(items)
        }
      } catch (err) {
        console.error('Error al cargar productos de Firestore:', err)
        setError(err.message)
        setProducts(mockProducts.filter((p) => p.is_visible && p.stock_status !== 'sold_out'))
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { products, loading, error }
}

export default useProducts
