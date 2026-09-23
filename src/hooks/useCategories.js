import { useState, useEffect } from 'react'
import { supabase, isDemoMode } from '../lib/supabaseClient'
import { mockCategories } from '../lib/mockData'

const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      if (isDemoMode) {
        setCategories(mockCategories)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      setCategories(data || [])
      setLoading(false)
    }

    fetchCategories()
  }, [])

  return { categories, loading }
}

export default useCategories
