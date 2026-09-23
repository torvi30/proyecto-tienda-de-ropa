import { useState, useEffect } from 'react'
import { supabase, isDemoMode } from '../lib/supabaseClient'
import { mockProducts } from '../lib/mockData'

const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      if (isDemoMode) {
        // Simular un pequeño delay para que se vea el skeleton
        await new Promise((r) => setTimeout(r, 600))
        setProducts(mockProducts.filter((p) => p.is_visible && p.stock_status !== 'sold_out'))
        setLoading(false)
        return
      }

      const { data, error: err } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_visible', true)
        .neq('stock_status', 'sold_out')
        .order('created_at', { ascending: false })

      if (err) {
        setError(err.message)
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  return { products, loading, error }
}

export default useProducts
