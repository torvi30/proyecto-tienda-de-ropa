import { useState, useEffect } from 'react'
import { Circle, Pencil, Trash2, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react'
import { supabase, isDemoMode } from '../../lib/supabaseClient'
import { mockProducts } from '../../lib/mockData'
import StockBadge from '../shared/StockBadge'
import Spinner from '../shared/Spinner'
import toast from 'react-hot-toast'
import { useStore } from '../../store/StoreContext'

const STOCK_CYCLE = ['available', 'low_stock', 'sold_out']
const STOCK_LABELS = {
  available: 'Disponible',
  low_stock: 'Últimas unidades',
  sold_out: 'Agotado',
}
const STOCK_COLORS = {
  available: 'text-green-400',
  low_stock: 'text-yellow-400',
  sold_out: 'text-red-400',
}

const ProductList = ({ refreshKey }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null) // id del producto en proceso
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { settings } = useStore()
  const sym = settings?.currency_symbol || '$'

  const fetchProducts = async () => {
    setLoading(true)
    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 400))
      setProducts(mockProducts)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [refreshKey])

  // Ciclar estado de stock: available -> low_stock -> sold_out -> available
  const cycleStock = async (product) => {
    const currentIdx = STOCK_CYCLE.indexOf(product.stock_status)
    const nextStatus = STOCK_CYCLE[(currentIdx + 1) % STOCK_CYCLE.length]

    setUpdating(product.id)
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, stock_status: nextStatus } : p
      )
    )

    if (!isDemoMode) {
      const { error } = await supabase
        .from('products')
        .update({ stock_status: nextStatus })
        .eq('id', product.id)
      if (error) toast.error('Error al actualizar el stock')
    }

    toast.success(`${product.name}: ${STOCK_LABELS[nextStatus]}`, { duration: 2000 })
    setUpdating(null)
  }

  // Toggle visibilidad
  const toggleVisibility = async (product) => {
    const newVisible = !product.is_visible
    setUpdating(product.id)
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_visible: newVisible } : p
      )
    )

    if (!isDemoMode) {
      await supabase
        .from('products')
        .update({ is_visible: newVisible })
        .eq('id', product.id)
    }

    toast.success(
      newVisible ? `${product.name} visible en tienda` : `${product.name} oculto`,
      { duration: 2000 }
    )
    setUpdating(null)
  }

  // Eliminar producto
  const deleteProduct = async (product) => {
    setUpdating(product.id)
    if (!isDemoMode) {
      await supabase.from('products').delete().eq('id', product.id)
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id))
    setDeleteConfirm(null)
    setUpdating(null)
    toast.success(`${product.name} eliminado`)
  }

  if (loading) {
    return (
      <div className='flex justify-center py-16'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className='text-center py-16'>
        <div className='text-5xl mb-4'>👗</div>
        <p className='text-gray-400 font-medium'>No hay productos todavía</p>
        <p className='text-gray-600 text-sm mt-1'>Sube el primer lote desde la pestaña anterior</p>
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      <p className='text-gray-500 text-sm'>{products.length} productos en total</p>

      {products.map((product) => (
        <div
          key={product.id}
          className={`bg-gray-800/50 border rounded-2xl overflow-hidden transition-all duration-200
            ${!product.is_visible ? 'opacity-60 border-gray-700/50' : 'border-gray-700'}
            ${deleteConfirm === product.id ? 'border-red-500/50' : ''}`}
        >
          <div className='flex items-center gap-3 p-3'>
            {/* Imagen miniatura */}
            <div className='w-14 h-[70px] rounded-lg overflow-hidden shrink-0 bg-gray-700'>
              <img
                src={product.image_url}
                alt={product.name}
                className='w-full h-full object-cover'
              />
            </div>

            {/* Info */}
            <div className='flex-1 min-w-0'>
              <p className='text-gray-100 font-medium text-sm leading-tight truncate'>
                {product.name}
              </p>
              <p className='text-brand-400 text-sm font-bold'>
                {sym}{Number(product.price).toLocaleString('es-CO')}
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <StockBadge status={product.stock_status} />
                {product.categories?.name && (
                  <span className='text-gray-600 text-xs'>{product.categories.name}</span>
                )}
              </div>
            </div>

            {/* Acciones */}
            {deleteConfirm === product.id ? (
              // Confirmacion de borrado
              <div className='flex items-center gap-2 shrink-0'>
                <span className='text-red-400 text-xs hidden sm:block'>¿Eliminar?</span>
                <button
                  onClick={() => deleteProduct(product)}
                  className='p-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 rounded-lg transition-colors'
                  title='Confirmar eliminación'
                >
                  <Check size={14} className='text-red-400' />
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className='p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors'
                  title='Cancelar'
                >
                  <X size={14} className='text-gray-400' />
                </button>
              </div>
            ) : (
              <div className='flex items-center gap-1.5 shrink-0'>
                {updating === product.id ? (
                  <Loader2 size={16} className='text-brand-400 animate-spin' />
                ) : (
                  <>
                    {/* Ciclar stock */}
                    <button
                      onClick={() => cycleStock(product)}
                      title={`Stock: ${STOCK_LABELS[product.stock_status]} → Click para cambiar`}
                      className='p-2 hover:bg-gray-700 rounded-lg transition-colors'
                      id={`stock-toggle-${product.id}`}
                    >
                      <Circle
                        size={14}
                        className={STOCK_COLORS[product.stock_status]}
                        fill='currentColor'
                      />
                    </button>

                    {/* Toggle visibilidad */}
                    <button
                      onClick={() => toggleVisibility(product)}
                      title={product.is_visible ? 'Ocultar del catálogo' : 'Mostrar en catálogo'}
                      className='p-2 hover:bg-gray-700 rounded-lg transition-colors'
                      id={`visibility-toggle-${product.id}`}
                    >
                      {product.is_visible
                        ? <Eye size={14} className='text-gray-400' />
                        : <EyeOff size={14} className='text-gray-600' />
                      }
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      title='Eliminar producto'
                      className='p-2 hover:bg-gray-700 rounded-lg transition-colors'
                      id={`delete-product-${product.id}`}
                    >
                      <Trash2 size={14} className='text-gray-600 hover:text-red-400' />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProductList
