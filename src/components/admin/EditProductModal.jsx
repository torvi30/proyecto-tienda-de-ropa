import { useState } from 'react'
import {
  X, Check, Loader2, Sparkles, Tag, DollarSign,
  Layers, Plus, Flame, Percent, Star, ImagePlus, Undo2,
  ZoomIn, Eye, EyeOff, CheckCircle2
} from 'lucide-react'
import { db } from '../../lib/firebaseClient'
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { useStore } from '../../store/StoreContext'
import useCategories from '../../hooks/useCategories'
import useImageCompressor from '../../hooks/useImageCompressor'
import { uploadToCloudinary } from '../../lib/cloudinary'
import SizeMeasurePicker from './SizeMeasurePicker'
import ImageZoomModal from '../shared/ImageZoomModal'

const STOCK_OPTIONS = [
  { value: 'available', label: 'Disponible', color: 'text-green-400', border: 'border-green-500/40', bg: 'bg-green-500/10' },
  { value: 'low_stock', label: 'Pocas unidades', color: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10' },
  { value: 'sold_out', label: 'Agotado (Oculto)', color: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-500/10' },
]

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
  const [showZoomModal, setShowZoomModal] = useState(false)

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

  // Cambio de foto para el producto existente
  const [newImageFile, setNewImageFile] = useState(null)
  const [newImagePreview, setNewImagePreview] = useState(null)
  const [compressingImage, setCompressingImage] = useState(false)
  const { compress } = useImageCompressor()

  const handleSelectNewImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type || !file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen válida (JPG, PNG, WebP)')
      return
    }

    setCompressingImage(true)
    const toastId = toast.loading('Comprimiendo nueva foto a WebP...')
    try {
      const res = await compress(file)
      if (newImagePreview) URL.revokeObjectURL(newImagePreview)
      setNewImageFile(res.blob || file)
      setNewImagePreview(res.previewUrl)
      toast.success('Nueva foto lista para guardar', { id: toastId, icon: '✨' })
    } catch (err) {
      console.error(err)
      toast.error('Error al procesar la foto', { id: toastId })
    } finally {
      setCompressingImage(false)
      e.target.value = ''
    }
  }

  const handleRevertImage = () => {
    if (newImagePreview) URL.revokeObjectURL(newImagePreview)
    setNewImageFile(null)
    setNewImagePreview(null)
    toast('Se restauró la foto original', { icon: '↩️' })
  }

  if (!product) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
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

    // Subir nueva foto a Cloudinary si se seleccionó una
    let finalImageUrl = product.image_url
    if (newImageFile) {
      try {
        const uploadRes = await uploadToCloudinary(newImageFile, name.trim())
        finalImageUrl = uploadRes.secure_url
      } catch (err) {
        console.error('Error subiendo nueva imagen:', err)
        toast.error('Error al subir la nueva imagen a la nube')
        setSaving(false)
        return
      }
    }

    try {
      if (db) {
        await updateDoc(doc(db, 'products', product.id), {
          name: name.trim(),
          price: parsedPrice,
          original_price: validOrigPrice,
          is_on_sale: Boolean(isOnSale && validOrigPrice && validOrigPrice > parsedPrice),
          is_featured: Boolean(isFeatured),
          category_id: categoryId || null,
          sizes,
          image_url: finalImageUrl,
          stock_status: stockStatus,
          is_visible: isVisible,
        })
      }

      toast.success('Producto actualizado con éxito', { icon: '✓' })
      if (onSaveSuccess) {
        onSaveSuccess({
          ...product,
          name: name.trim(),
          price: parsedPrice,
          original_price: validOrigPrice,
          is_on_sale: Boolean(isOnSale && validOrigPrice && validOrigPrice > parsedPrice),
          is_featured: Boolean(isFeatured),
          category_id: categoryId || null,
          sizes,
          image_url: finalImageUrl,
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

  const currentDisplayImage = newImagePreview || product.image_url

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-gray-950/85 backdrop-blur-md animate-fade-in'>
      <div
        className='relative w-full max-w-lg max-h-[94vh] flex flex-col bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden font-sans'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glow */}
        <div className='absolute -top-24 -right-24 w-60 h-60 bg-brand-600/10 rounded-full blur-3xl pointer-events-none' />

        {/* Modal header */}
        <div className='relative flex items-center justify-between p-4 sm:p-5 border-b border-gray-800/80 shrink-0 bg-gray-900/90 backdrop-blur-md'>
          <div className='flex items-center gap-2.5 min-w-0'>
            <div className='w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0'>
              <Sparkles size={18} />
            </div>
            <div className='min-w-0'>
              <h2 className='text-gray-100 font-bold text-base sm:text-lg leading-tight truncate'>
                Configurar Prenda
              </h2>
              <p className='text-gray-500 text-xs truncate'>
                {product.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-xl transition-colors shrink-0'
            title='Cerrar'
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto p-4 sm:p-6 space-y-5'>
          {/* SECTION 1: PROMINENT VISUAL PHOTO CARD */}
          <div className='bg-gray-950/70 p-4 rounded-2xl border border-gray-800/80 flex flex-col items-center'>
            <div className='flex items-center justify-between w-full mb-3'>
              <span className='text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5'>
                <ImagePlus size={14} className='text-brand-400' />
                <span>Foto de la prenda</span>
              </span>
              <button
                type='button'
                onClick={() => setShowZoomModal(true)}
                className='text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium'
              >
                <ZoomIn size={13} />
                <span>Ver en pantalla completa</span>
              </button>
            </div>

            {/* 4:5 Vertical photo card */}
            <div
              onClick={() => setShowZoomModal(true)}
              className='relative w-40 sm:w-48 aspect-[4/5] rounded-2xl overflow-hidden bg-gray-800 border-2 border-gray-700/80 shadow-2xl cursor-pointer group/photo select-none'
              title='Toca para ampliar'
            >
              <img
                src={currentDisplayImage}
                alt={name || product.name}
                className='w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-105'
              />

              {/* Hover overlay hint */}
              <div className='absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1'>
                <ZoomIn size={22} className='text-brand-300' />
                <span className='text-xs font-semibold'>Zoom HD</span>
              </div>

              {/* Badge for new image */}
              {newImagePreview && (
                <div className='absolute bottom-2 inset-x-2 bg-emerald-600 text-white text-[10px] font-bold py-1 px-2 rounded-lg text-center shadow-lg animate-scale-in'>
                  ✨ Nueva foto lista
                </div>
              )}
            </div>

            {/* Photo action buttons */}
            <div className='flex flex-wrap items-center justify-center gap-2 mt-3.5 w-full'>
              <label className='flex-1 max-w-xs py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md shadow-brand-600/25'>
                <ImagePlus size={15} />
                <span>{newImagePreview ? 'Elegir otra foto' : 'Cambiar foto de prenda'}</span>
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleSelectNewImage}
                />
              </label>

              {newImagePreview && (
                <button
                  type='button'
                  onClick={handleRevertImage}
                  className='py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 border border-gray-700'
                  title='Restaurar foto original'
                >
                  <Undo2 size={14} />
                  <span>Deshacer</span>
                </button>
              )}
            </div>
            <p className='text-gray-500 text-[11px] mt-2 text-center'>
              Acepta fotos directas de la cámara o galería. Se optimizan automáticamente a WebP 4:5.
            </p>
          </div>

          {/* SECTION 2: GARMENT NAME */}
          <div>
            <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5'>
              Nombre de la Prenda *
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ej: Jean Palazzo Dama'
              required
              className='form-input text-sm sm:text-base py-2.5 sm:py-3 font-sans bg-gray-950/60'
            />
          </div>

          {/* SECTION 3: PRICING & PROMOTION */}
          <div className='bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent border border-pink-500/25 rounded-2xl p-4 space-y-3.5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <div className='w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0'>
                  <Flame size={16} />
                </div>
                <div>
                  <p className='text-gray-100 font-semibold text-xs sm:text-sm'>
                    ¿Activar Precio de Oferta / Promoción?
                  </p>
                  <p className='text-gray-400 text-[11px]'>
                    Muestra precio anterior tachado y badge de descuento
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

            {isOnSale ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fade-in'>
                <div>
                  <label className='text-pink-400 text-xs font-semibold uppercase tracking-wider block mb-1'>
                    Precio de Oferta (Venta Final) *
                  </label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 font-bold text-sm'>
                      {sym}
                    </span>
                    <input
                      type='number'
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder='80000'
                      min='0'
                      step='100'
                      required
                      className='form-input pl-8 py-2.5 text-sm font-sans bg-gray-950/80 border-pink-500/40 text-pink-200'
                    />
                  </div>
                </div>

                <div>
                  <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1'>
                    Precio Normal (Antes) *
                  </label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm'>
                      {sym}
                    </span>
                    <input
                      type='number'
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder='100000'
                      min='0'
                      step='100'
                      className='form-input pl-8 py-2.5 text-sm font-sans bg-gray-950/80 text-gray-300'
                    />
                  </div>
                </div>

                {hasDiscount && (
                  <div className='sm:col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-pink-500/15 border border-pink-500/30 text-xs'>
                    <span className='text-pink-300 font-medium'>
                      Ahorro cliente: {sym}{savings.toLocaleString('es-CO')} COP
                    </span>
                    <span className='bg-pink-500 text-white font-bold px-2 py-0.5 rounded-full'>
                      -{discountPercent}% OFF
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1'>
                  Precio Normal *
                </label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 font-bold text-sm'>
                    {sym}
                  </span>
                  <input
                    type='number'
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder='85000'
                    min='0'
                    step='100'
                    required
                    className='form-input pl-8 py-2.5 text-sm sm:text-base font-sans bg-gray-950/60'
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: SIZES & MEASUREMENTS */}
          <div className='bg-gray-950/50 p-3.5 rounded-2xl border border-gray-800/80'>
            <SizeMeasurePicker
              selected={sizes}
              onChange={setSizes}
              label='Tallas / Medidas Disponibles'
            />
          </div>

          {/* SECTION 5: CATEGORY */}
          <div className='bg-gray-950/50 p-3.5 rounded-2xl border border-gray-800/80'>
            <div className='flex items-center justify-between mb-1.5'>
              <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider'>
                Categoría
              </label>
              {!showNewCat && (
                <button
                  type='button'
                  onClick={() => setShowNewCat(true)}
                  className='text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium'
                >
                  <Plus size={13} />
                  <span>Crear nueva categoría</span>
                </button>
              )}
            </div>

            {showNewCat ? (
              <div className='flex items-center gap-2 pt-1 animate-fade-in'>
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
                  placeholder='Nombre de categoría (ej: Vestidos)'
                  className='form-input text-xs py-2 font-sans bg-gray-900'
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
                  className='p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-xs shrink-0'
                  title='Cancelar'
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className='form-input text-sm py-2.5 bg-gray-900 font-sans'
              >
                <option value=''>Sin categoría específica</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* SECTION 6: FEATURED TOGGLE */}
          <div className='flex items-center justify-between p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/25'>
            <div className='flex items-center gap-2.5'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0'>
                <Star size={16} className={isFeatured ? 'fill-current' : ''} />
              </div>
              <div>
                <p className='text-gray-100 font-semibold text-xs'>
                  Destacar Prenda en Portada ⭐
                </p>
                <p className='text-gray-400 text-[11px]'>
                  Aparece primero en el catálogo con insignia dorada Top
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

          {/* SECTION 7: STOCK STATUS WITH 3 LARGE TOUCH BUTTONS */}
          <div className='space-y-2'>
            <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block'>
              Disponibilidad de Stock
            </label>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
              {STOCK_OPTIONS.map((opt) => {
                const isSelected = stockStatus === opt.value
                return (
                  <button
                    key={opt.value}
                    type='button'
                    onClick={() => setStockStatus(opt.value)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? `${opt.bg} ${opt.border} ${opt.color} ring-1 ring-white/20 shadow-md`
                        : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <CheckCircle2 size={14} className={opt.color} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* SECTION 8: VISIBILITY */}
          <div className='flex items-center justify-between p-3.5 rounded-2xl bg-gray-950/60 border border-gray-800'>
            <div className='flex items-center gap-2.5'>
              <div className='w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-300 shrink-0'>
                {isVisible ? <Eye size={16} className='text-green-400' /> : <EyeOff size={16} className='text-gray-500' />}
              </div>
              <div>
                <p className='text-gray-100 font-semibold text-xs'>
                  {isVisible ? 'Prenda Visible en Catálogo' : 'Prenda Oculta del Catálogo'}
                </p>
                <p className='text-gray-500 text-[11px]'>
                  {isVisible ? 'Los clientes pueden verla y comprarla' : 'Nadie en la tienda la podrá ver'}
                </p>
              </div>
            </div>

            <button
              type='button'
              onClick={() => setIsVisible(!isVisible)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                isVisible ? 'bg-green-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                  isVisible ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </form>

        {/* Modal sticky footer */}
        <div className='p-4 sm:p-5 border-t border-gray-800/80 bg-gray-900/95 backdrop-blur-md flex items-center justify-end gap-2.5 shrink-0'>
          <button
            type='button'
            onClick={onClose}
            className='btn-secondary py-2.5 sm:py-3 px-5 text-sm font-sans'
          >
            Cancelar
          </button>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={saving}
            className='btn-primary py-2.5 sm:py-3 px-6 text-sm font-semibold flex items-center justify-center gap-2 font-sans shadow-lg shadow-brand-600/30 cursor-pointer active:scale-95 disabled:opacity-50'
          >
            {saving ? (
              <>
                <Loader2 size={16} className='animate-spin' />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Guardar cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full screen HD Zoom modal */}
      {showZoomModal && (
        <ImageZoomModal
          isOpen={showZoomModal}
          onClose={() => setShowZoomModal(false)}
          images={[{ url: currentDisplayImage, name: name || product.name, product }]}
          isAdmin={false}
        />
      )}
    </div>
  )
}

export default EditProductModal
