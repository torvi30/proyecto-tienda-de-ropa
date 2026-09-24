import { useState } from 'react'
import { X, Check, Loader2, Sparkles, Tag, DollarSign, Layers, Plus, Flame, Percent, Star } from 'lucide-react'
import { db } from '../../lib/firebaseClient'
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { useStore } from '../../store/StoreContext'
import useCategories from '../../hooks/useCategories'
import SizeMeasurePicker from './SizeMeasurePicker'

const EditProductModal = ({ product, onClose, onSaveSuccess }) => {
  const { settings } = useStore()
  const { categories } = useCategories()
  const sym = settings?.currency_symbol || '$'

  const [name, setName] = useState(product?.name || '')
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : '')
  const [originalPrice, setOriginalPrice] = useState(
    product?.original_price != null ? String(product.original_price) : ''
  )
  const [isOnSale, setIsOnSale] = useState(product?.is_on_sale || false)
  const [isFeatured, setIsFeatured] = useState(product?.is_featured || false)
  const [categoryId, setCategoryId] = useState(product?.category_id || '')
  const [sizes, setSizes] = useState(product?.sizes || [])
  const [stockStatus, setStockStatus] = useState(product?.stock_status || 'available')
  const [isVisible, setIsVisible] = useState(product?.is_visible ?? true)
  const [saving, setSaving] = useState(false)

  // Real-time discount calculation
  const numPrice = parseFloat(price) || 0
  const numOrigPrice = parseFloat(originalPrice) || 0
  const hasDiscount = isOnSale && numOrigPrice > numPrice && numPrice > 0
  const discountPercent = hasDiscount
    ? Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100)
    : 0
  const savings = hasDiscount ? numOrigPrice - numPrice : 0

  // Quick inline category creation state
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [creatingCat, setCreatingCat] = useState(false)

  if (!product) return null

  const toggleSize = (size) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error('Ingresa un precio válido mayor o igual a 0')
      return
    }

    if (!name.trim()) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    setSaving(true)

    const origPriceNum = parseFloat(originalPrice)
    const validOrigPrice = isOnSale && !isNaN(origPriceNum) && origPriceNum > 0 ? origPriceNum : null

    try {
      if (db) {
        await updateDoc(doc(db, 'products', product.id), {
          name: name.trim(),
          price: numPrice,
          original_price: validOrigPrice,
          is_on_sale: Boolean(isOnSale && validOrigPrice && validOrigPrice > numPrice),
          is_featured: Boolean(isFeatured),
          category_id: categoryId || null,
          sizes,
          stock_status: stockStatus,
          is_visible: isVisible,
        })
      }

      toast.success('Producto actualizado con éxito', { icon: '✓' })
      if (onSaveSuccess) {
        onSaveSuccess({
          ...product,
          name: name.trim(),
          price: numPrice,
          original_price: validOrigPrice,
          is_on_sale: Boolean(isOnSale && validOrigPrice && validOrigPrice > numPrice),
          is_featured: Boolean(isFeatured),
          category_id: categoryId || null,
          sizes,
          stock_status: stockStatus,
          is_visible: isVisible,
        })
      }
      onClose()
    } catch (err) {
      console.error('Error al actualizar producto:', err)
      toast.error('Error al guardar los cambios en Firestore')
    } finally {
      setSaving(false)
    }
  }

  // Quick inline category creation handler
  const handleQuickCreateCategory = async (e) => {
    if (e) e.preventDefault()
    const trimmed = newCatName.trim()
    if (!trimmed) return

    setCreatingCat(true)
    try {
      if (db) {
        const slug = trimmed
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')

        const docRef = await addDoc(collection(db, 'categories'), {
          name: trimmed,
          slug,
          sort_order: categories.length + 1,
          is_active: true,
          created_at: serverTimestamp(),
        })

        setCategoryId(docRef.id)
        toast.success(`Categoría "${trimmed}" creada`)
      }
      setShowNewCat(false)
      setNewCatName('')
    } catch (err) {
      console.error(err)
      toast.error('Error al crear categoría')
    } finally {
      setCreatingCat(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-950/80 backdrop-blur-md animate-fade-in'>
      <div
        className='relative w-full max-w-lg max-h-[92vh] flex flex-col bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden font-sans'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glow */}
        <div className='absolute -top-24 -right-24 w-60 h-60 bg-brand-600/10 rounded-full blur-3xl pointer-events-none' />

        {/* Modal header */}
        <div className='relative flex items-center justify-between pb-4 sm:pb-5 border-b border-gray-800/80 mb-4 sm:mb-5 shrink-0'>
          <div className='flex items-center gap-3.5 min-w-0'>
            <div className='w-12 h-14 rounded-xl overflow-hidden bg-gray-800 border border-gray-700/60 shrink-0 shadow-sm'>
              <img
                src={product.image_url}
                alt={product.name}
                className='w-full h-full object-cover'
              />
            </div>
            <div className='min-w-0'>
              <div className='flex items-center gap-1.5 text-brand-400 text-xs font-semibold tracking-wider uppercase mb-0.5'>
                <Sparkles size={12} />
                <span>Edición de Prenda</span>
              </div>
              <h2 className='text-gray-100 font-semibold text-base truncate'>
                {product.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-xl transition-colors shrink-0 ml-2'
            title='Cerrar'
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable modal form container */}
        <form onSubmit={handleSubmit} className='relative space-y-4 overflow-y-auto pr-1'>
          {/* Promotional discount configuration toggle */}
          <div className='bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent border border-pink-500/25 rounded-2xl p-3.5 space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <div className='w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0'>
                  <Flame size={16} />
                </div>
                <div>
                  <p className='text-gray-100 font-semibold text-xs'>
                    ¿Activar Precio de Oferta / Promoción?
                  </p>
                  <p className='text-gray-500 text-[11px]'>
                    Muestra el precio anterior tachado y badge de descuento
                  </p>
                </div>
              </div>

              <button
                type='button'
                onClick={() => setIsOnSale(!isOnSale)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                  isOnSale ? 'bg-pink-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                    isOnSale ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Price inputs: Regular vs Promotional Price */}
            {isOnSale ? (
              <div className='pt-2 border-t border-pink-500/20 space-y-3 animate-fade-in'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {/* Strikethrough original price */}
                  <div>
                    <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1'>
                      Precio Normal (Antes)
                    </label>
                    <div className='relative rounded-xl bg-gray-950/80 border border-gray-700 focus-within:border-gray-500 px-3.5 py-2 flex items-center'>
                      <span className='text-gray-500 font-semibold text-lg mr-1 select-none'>
                        {sym}
                      </span>
                      <input
                        type='number'
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder='Ej: 80000'
                        min='0'
                        step='100'
                        className='w-full bg-transparent text-gray-400 line-through font-semibold text-lg tracking-tight focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                      />
                    </div>
                  </div>

                  {/* Current discounted price */}
                  <div>
                    <label className='text-pink-400 text-xs font-semibold uppercase tracking-wider block mb-1'>
                      Precio Oferta (Ahora) *
                    </label>
                    <div className='relative rounded-xl bg-gray-950/80 border border-pink-500/60 focus-within:border-pink-400 focus-within:ring-2 focus-within:ring-pink-500/25 px-3.5 py-2 flex items-center'>
                      <span className='text-pink-400 font-semibold text-lg mr-1 select-none'>
                        {sym}
                      </span>
                      <input
                        type='number'
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder='Ej: 50000'
                        min='0'
                        step='100'
                        autoFocus
                        required
                        className='w-full bg-transparent text-white font-bold text-lg tracking-tight focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                      />
                    </div>
                  </div>
                </div>

                {/* Live discount calculation banner */}
                {hasDiscount && (
                  <div className='flex items-center justify-between bg-pink-500/15 border border-pink-500/30 rounded-xl px-3.5 py-2 text-xs'>
                    <span className='text-pink-300 font-bold flex items-center gap-1.5'>
                      <Flame size={14} className='text-pink-400 fill-current' />
                      Descuento: -{discountPercent}% OFF
                    </span>
                    <span className='text-gray-300 font-medium tabular-nums'>
                      Ahorro del cliente: {sym}{savings.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Single standard price */
              <div className='pt-1'>
                <div className='relative rounded-2xl bg-gray-950/70 border border-gray-700 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all px-4 py-2 flex items-center'>
                  <span className='text-brand-400 font-semibold text-2xl mr-2 select-none'>
                    {sym}
                  </span>
                  <input
                    type='number'
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder='0'
                    min='0'
                    step='100'
                    autoFocus
                    required
                    className='w-full bg-transparent text-white font-semibold text-2xl tracking-tight focus:outline-none placeholder-gray-600 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                  />
                  {price && !isNaN(price) && (
                    <span className='text-gray-400 text-xs font-medium tabular-nums ml-2 select-none'>
                      COP {Number(price).toLocaleString('es-CO')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Garment name */}
          <div>
            <label className='text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5'>
              <Tag size={13} className='text-gray-400' />
              Nombre de la Prenda
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ej: Vestido Gala Seda'
              required
              className='form-input text-sm py-2.5 font-sans'
            />
          </div>

          {/* Category select & quick-add */}
          <div>
            <div className='flex items-center justify-between mb-1.5'>
              <label className='text-gray-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5'>
                <Layers size={13} className='text-gray-400' />
                Categoría
              </label>
              {!showNewCat && (
                <button
                  type='button'
                  onClick={() => setShowNewCat(true)}
                  className='text-brand-400 hover:text-brand-300 text-xs font-medium flex items-center gap-1 transition-colors'
                >
                  <Plus size={13} />
                  <span>+ Nueva categoría</span>
                </button>
              )}
            </div>

            {showNewCat ? (
              <div className='flex items-center gap-2 mb-1 animate-fade-in'>
                <input
                  type='text'
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickCreateCategory(e)
                    if (e.key === 'Escape') {
                      setShowNewCat(false)
                      setNewCatName('')
                    }
                  }}
                  placeholder='Nombre de la categoría (ej: Calzado)'
                  className='form-input text-xs py-2 font-sans'
                  autoFocus
                />
                <button
                  type='button'
                  onClick={handleQuickCreateCategory}
                  disabled={creatingCat || !newCatName.trim()}
                  className='btn-primary py-2 px-3 text-xs font-sans shrink-0'
                >
                  {creatingCat ? '...' : 'Crear'}
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowNewCat(false)
                    setNewCatName('')
                  }}
                  className='p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded-xl text-xs shrink-0'
                  title='Cancelar'
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className='form-input text-sm py-2.5 bg-gray-800 font-sans'
              >
                <option value=''>Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sizing and measurement chips */}
          <SizeMeasurePicker selected={sizes} onChange={setSizes} label='Tallas / Medidas / Tamaños' />

          {/* Featured garment highlight toggle */}
          <div className='flex items-center justify-between p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/25'>
            <div className='flex items-center gap-2.5'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0'>
                <Star size={16} className={isFeatured ? 'fill-current' : ''} />
              </div>
              <div>
                <p className='text-gray-100 font-semibold text-xs'>
                  Destacar Prenda (Recomendada)
                </p>
                <p className='text-gray-400 text-[11px]'>
                  Aparece de primero en el catálogo con insignia dorada ⭐
                </p>
              </div>
            </div>

            <button
              type='button'
              onClick={() => setIsFeatured(!isFeatured)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                isFeatured ? 'bg-amber-400' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                  isFeatured ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Stock status and catalog visibility */}
          <div className='grid grid-cols-2 gap-3 pt-1'>
            <div>
              <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5'>
                Estado de Stock
              </label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className='form-input text-xs py-2.5 bg-gray-800 font-sans'
              >
                <option value='available'>🟢 Disponible</option>
                <option value='low_stock'>🟡 Últimas unidades</option>
                <option value='sold_out'>🔴 Agotado (Oculto)</option>
              </select>
            </div>

            <div>
              <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5'>
                Visibilidad
              </label>
              <button
                type='button'
                onClick={() => setIsVisible(!isVisible)}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-medium transition-colors text-center font-sans ${
                  isVisible
                    ? 'bg-gray-800 border-gray-700 text-green-400'
                    : 'bg-gray-800/40 border-gray-700/50 text-gray-500'
                }`}
              >
                {isVisible ? 'Visible en catálogo' : 'Oculto en catálogo'}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-800/80 mt-2'>
            <button
              type='button'
              onClick={onClose}
              className='btn-secondary py-2.5 px-5 text-sm font-sans'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={saving}
              className='btn-primary py-2.5 px-6 text-sm flex items-center gap-2 font-sans'
            >
              {saving ? (
                <>
                  <Loader2 size={16} className='animate-spin' />
                  Guardando...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProductModal
