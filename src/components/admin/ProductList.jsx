import { useState, useEffect } from 'react'
import { Circle, Pencil, Trash2, Eye, EyeOff, Check, X, Loader2, Sparkles, Flame, Star } from 'lucide-react'
import { db } from '../../lib/firebaseClient'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import StockBadge from '../shared/StockBadge'
import Spinner from '../shared/Spinner'
import EditProductModal from './EditProductModal'
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
  const [editingProduct, setEditingProduct] = useState(null) // Para el modal completo
  const [inlineEditId, setInlineEditId] = useState(null) // Para edición rápida inline
  const [inlinePrice, setInlinePrice] = useState('')
  const { settings } = useStore()
  const sym = settings?.currency_symbol || '$'

  const fetchProducts = async () => {
    setLoading(true)
    if (!db) {
      setProducts([])
      setLoading(false)
      return
    }

    try {
      const q = query(collection(db, 'products'), orderBy('created_at', 'desc'))
      const snapshot = await getDocs(q)
      const list = []
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setProducts(list)
    } catch (err) {
      console.error('Error fetching admin products from Firestore:', err)
      toast.error('Error al cargar inventario de Firestore')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [refreshKey])

  // Iniciar edición rápida inline de precio
  const startInlineEdit = (product, e) => {
    if (e) e.stopPropagation()
    setInlineEditId(product.id)
    setInlinePrice(product.price ? product.price.toString() : '')
  }

  // Guardar precio inline
  const saveInlinePrice = async (product) => {
    const numPrice = parseFloat(inlinePrice)
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error('Ingresa un precio válido')
      return
    }

    setUpdating(product.id)
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, price: numPrice } : p))
    )

    if (db) {
      try {
        await updateDoc(doc(db, 'products', product.id), {
          price: numPrice,
        })
        toast.success(`Precio actualizado a ${sym}${numPrice.toLocaleString('es-CO')}`, {
          icon: '💰',
        })
      } catch (err) {
        console.error('Error updating price in Firestore:', err)
        toast.error('Error al guardar precio en Firestore')
      }
    }

    setInlineEditId(null)
    setUpdating(null)
  }

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

    if (db) {
      try {
        await updateDoc(doc(db, 'products', product.id), {
          stock_status: nextStatus,
        })
      } catch (err) {
        console.error('Error updating stock in Firestore:', err)
        toast.error('Error al actualizar el stock en Firestore')
      }
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

    if (db) {
      try {
        await updateDoc(doc(db, 'products', product.id), {
          is_visible: newVisible,
        })
      } catch (err) {
        console.error('Error updating visibility in Firestore:', err)
        toast.error('Error al actualizar visibilidad')
      }
    }

    toast.success(
      newVisible ? `${product.name} visible en tienda` : `${product.name} oculto`,
      { duration: 2000 }
    )
    setUpdating(null)
  }

  // Toggle producto destacado (Estrella)
  const toggleFeatured = async (product) => {
    const newFeatured = !product.is_featured
    setUpdating(product.id)
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_featured: newFeatured } : p
      )
    )

    if (db) {
      try {
        await updateDoc(doc(db, 'products', product.id), {
          is_featured: newFeatured,
        })
      } catch (err) {
        console.error('Error al cambiar destacado:', err)
        toast.error('Error al actualizar en Firestore')
      }
    }

    toast.success(
      newFeatured ? `⭐ ${product.name} destacado` : `${product.name} quitado de destacados`,
      { duration: 2500 }
    )
    setUpdating(null)
  }

  // Eliminar producto
  const deleteProduct = async (product) => {
    setUpdating(product.id)
    if (db) {
      try {
        await deleteDoc(doc(db, 'products', product.id))
      } catch (err) {
        console.error('Error deleting product in Firestore:', err)
        toast.error('Error al eliminar producto')
      }
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
    <div className='space-y-4'>
      <div className='flex items-center justify-between text-xs text-gray-500'>
        <p>{products.length} productos en total</p>
        <p className='hidden sm:block text-brand-400/80'>💡 Tip: Haz clic en el precio o en el botón "Editar" para modificarlo</p>
      </div>

      {products.map((product) => (
        <div
          key={product.id}
          className={`bg-gray-800/50 hover:bg-gray-800/70 border rounded-2xl overflow-hidden transition-all duration-200
            ${!product.is_visible ? 'opacity-60 border-gray-700/50' : 'border-gray-700/80 hover:border-brand-500/30'}
            ${deleteConfirm === product.id ? 'border-red-500/50' : ''}`}
        >
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4'>
            {/* Contenedor de Imagen e Info */}
            <div className='flex items-center gap-3 sm:gap-4 min-w-0 flex-1'>
              {/* Imagen miniatura */}
              <div className='w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-700 border border-gray-700/60 shadow-md'>
                <img
                  src={product.image_url}
                  alt={product.name}
                  className='w-full h-full object-cover'
                />
              </div>

              {/* Info principal */}
              <div className='flex-1 min-w-0'>
              <p className='text-gray-100 font-medium text-sm sm:text-base leading-snug truncate'>
                {product.name}
              </p>

              {/* Edición de precio: Inline o Normal */}
              {inlineEditId === product.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    saveInlinePrice(product)
                  }}
                  className='flex items-center gap-1.5 my-1.5'
                >
                  <div className='flex items-center bg-gray-950 border border-brand-400 rounded-xl px-2.5 py-1 shadow-inner'>
                    <span className='text-brand-400 font-bold text-sm mr-1'>{sym}</span>
                    <input
                      type='number'
                      value={inlinePrice}
                      onChange={(e) => setInlinePrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setInlineEditId(null)
                      }}
                      autoFocus
                      min='0'
                      step='100'
                      className='w-24 sm:w-28 bg-transparent text-gray-100 font-semibold text-sm focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                    />
                  </div>
                  <button
                    type='submit'
                    className='p-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors active:scale-95 shadow-sm'
                    title='Guardar precio (Enter)'
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type='button'
                    onClick={() => setInlineEditId(null)}
                    className='p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors active:scale-95'
                    title='Cancelar (Esc)'
                  >
                    <X size={14} />
                  </button>
                </form>
              ) : product.is_on_sale && product.original_price > product.price ? (
                <div
                  onClick={(e) => startInlineEdit(product, e)}
                  className='group/price inline-flex items-center flex-wrap gap-2 cursor-pointer py-0.5 rounded-lg hover:bg-pink-500/10 px-2 -ml-2 transition-all'
                  title='Haz clic para editar precio de oferta rápidamente'
                >
                  <span className='text-pink-400 text-base sm:text-lg font-bold tracking-tight tabular-nums'>
                    {sym}{Number(product.price).toLocaleString('es-CO')}
                  </span>
                  <span className='text-gray-500 text-xs line-through tabular-nums font-normal'>
                    {sym}{Number(product.original_price).toLocaleString('es-CO')}
                  </span>
                  <span className='inline-flex items-center gap-0.5 text-[10px] font-bold text-pink-400 bg-pink-500/15 border border-pink-500/30 px-1.5 py-0.5 rounded-full select-none'>
                    <Flame size={10} className='fill-current' />
                    -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                  </span>
                  <Pencil
                    size={12}
                    className='text-gray-500 group-hover/price:text-pink-400 opacity-60 group-hover/price:opacity-100 transition-all'
                  />
                </div>
              ) : (
                <div
                  onClick={(e) => startInlineEdit(product, e)}
                  className='group/price inline-flex items-center gap-1.5 cursor-pointer py-0.5 rounded-lg hover:bg-brand-500/10 px-2 -ml-2 transition-all'
                  title='Haz clic para editar precio rápidamente'
                >
                  <span className='text-brand-400 text-base sm:text-lg font-semibold tracking-tight tabular-nums'>
                    {sym}{Number(product.price).toLocaleString('es-CO')}
                  </span>
                  <Pencil
                    size={12}
                    className='text-gray-500 group-hover/price:text-brand-400 opacity-60 group-hover/price:opacity-100 transition-all'
                  />
                </div>
              )}

              {/* Badges de tallas, stock y destacado */}
              <div className='flex flex-wrap items-center gap-1.5 mt-1'>
                <StockBadge status={product.stock_status} />
                {product.is_featured && (
                  <span className='inline-flex items-center gap-1 text-[11px] font-sans font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full'>
                    <Star size={10} className='fill-current' />
                    Destacado
                  </span>
                )}
                {product.sizes && product.sizes.length > 0 && (
                  <span className='text-gray-400 text-[11px] font-sans font-medium bg-gray-900/60 px-2 py-0.5 rounded-md border border-gray-700/50'>
                    {product.sizes.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

            {/* Acciones */}
            {deleteConfirm === product.id ? (
              // Confirmación de borrado
              <div className='flex items-center justify-end gap-1.5 shrink-0 bg-red-950/30 p-1.5 rounded-xl border border-red-500/30 animate-fade-in'>
                <span className='text-red-400 text-xs hidden sm:inline px-1 font-medium'>¿Eliminar?</span>
                <button
                  onClick={() => deleteProduct(product)}
                  className='p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors active:scale-95'
                  title='Confirmar eliminación'
                >
                  <Check size={15} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className='p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors active:scale-95'
                  title='Cancelar'
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className='flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-700/60'>
                {updating === product.id ? (
                  <div className='p-2 flex items-center justify-center'>
                    <Loader2 size={18} className='text-brand-400 animate-spin' />
                  </div>
                ) : (
                  <>
                    {/* Botón Destacar (Estrella) */}
                    <button
                      onClick={() => toggleFeatured(product)}
                      title={product.is_featured ? 'Quitar de destacados' : 'Destacar prenda en portada (Aparece primero)'}
                      className={`p-2.5 sm:p-2 rounded-xl transition-all active:scale-90 border ${
                        product.is_featured
                          ? 'bg-amber-400/20 border-amber-400/50 text-amber-400 shadow-sm shadow-amber-400/20'
                          : 'bg-gray-800/80 hover:bg-gray-700 text-gray-500 hover:text-amber-300 border-gray-700/60'
                      }`}
                      id={`featured-toggle-${product.id}`}
                    >
                      <Star
                        size={15}
                        className={product.is_featured ? 'fill-current text-amber-400' : ''}
                      />
                    </button>

                    {/* Botón Editar completo (Abre Modal Elegante) */}
                    <button
                      onClick={() => setEditingProduct(product)}
                      title='Editar precio, nombre, tallas y detalles'
                      className='p-2 sm:py-2 sm:px-3 bg-brand-600/15 hover:bg-brand-600/30 text-brand-300 hover:text-brand-200 rounded-xl transition-all active:scale-90 border border-brand-500/30 flex items-center gap-1.5'
                      id={`edit-product-${product.id}`}
                    >
                      <Pencil size={15} />
                      <span className='text-xs font-semibold hidden md:inline'>Editar</span>
                    </button>

                    {/* Ciclar stock */}
                    <button
                      onClick={() => cycleStock(product)}
                      title={`Stock actual: ${STOCK_LABELS[product.stock_status]} (Toca para cambiar)`}
                      className='p-2.5 sm:p-2 bg-gray-800/80 hover:bg-gray-700 rounded-xl transition-all active:scale-90 border border-gray-700/60'
                      id={`stock-toggle-${product.id}`}
                    >
                      <Circle
                        size={15}
                        className={STOCK_COLORS[product.stock_status]}
                        fill='currentColor'
                      />
                    </button>

                    {/* Toggle visibilidad */}
                    <button
                      onClick={() => toggleVisibility(product)}
                      title={product.is_visible ? 'Visible en catálogo (Click para ocultar)' : 'Oculto (Click para mostrar)'}
                      className='p-2.5 sm:p-2 bg-gray-800/80 hover:bg-gray-700 rounded-xl transition-all active:scale-90 border border-gray-700/60'
                      id={`visibility-toggle-${product.id}`}
                    >
                      {product.is_visible
                        ? <Eye size={15} className='text-gray-300' />
                        : <EyeOff size={15} className='text-gray-500' />
                      }
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      title='Eliminar producto'
                      className='p-2.5 sm:p-2 bg-gray-800/80 hover:bg-red-500/20 hover:border-red-500/30 rounded-xl transition-all active:scale-90 border border-gray-700/60'
                      id={`delete-product-${product.id}`}
                    >
                      <Trash2 size={15} className='text-gray-400 hover:text-red-400' />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Modal elegante para edición completa */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaveSuccess={(updated) => {
            setProducts((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            )
          }}
        />
      )}
    </div>
  )
}

export default ProductList
