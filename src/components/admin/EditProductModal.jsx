import { useState, useRef } from 'react'
import {
  X, Check, Loader2, Sparkles, Plus, Flame, Star,
  ImagePlus, Undo2, ZoomIn, Eye, EyeOff, CheckCircle2,
  Trash2, Images
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

const MAX_PHOTOS = 5

const STOCK_OPTIONS = [
  { value: 'available', label: 'Disponible', color: 'text-green-400', border: 'border-green-500/40', bg: 'bg-green-500/10' },
  { value: 'low_stock', label: 'Pocas unidades', color: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10' },
  { value: 'sold_out', label: 'Agotado (Oculto)', color: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-500/10' },
]

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const EditProductModal = ({ product, onClose, onSaveSuccess }) => {
  const fileInputRef = useRef(null)
  const replaceCoverRef = useRef(null)
  const { settings } = useStore()
  const { categories = [] } = useCategories()
  const { compress } = useImageCompressor()
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
  const [zoomInitialIndex, setZoomInitialIndex] = useState(0)

  // Multi-image state: array of { id, url, blob, previewUrl, isNew: boolean }
  const [photoList, setPhotoList] = useState(() => {
    const initialUrls = Array.isArray(product?.images) && product.images.length > 0
      ? product.images.filter(Boolean)
      : (product?.image_url ? [product.image_url] : [])

    return initialUrls.map((url, i) => ({
      id: `existing_${i}_${Date.now()}`,
      url,
      blob: null,
      previewUrl: url,
      isNew: false,
    }))
  })

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

  // Add a new photo to the garment gallery
  const handleAddPhoto = async (e, replaceCover = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type || !file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen válida (JPG, PNG, WebP)')
      return
    }

    if (photoList.length >= MAX_PHOTOS && !replaceCover) {
      toast.error(`Máximo ${MAX_PHOTOS} fotos por prenda`)
      return
    }

    const toastId = toast.loading('Comprimiendo nueva foto a WebP 4:5...')
    try {
      const res = await compress(file)
      const newItem = {
        id: generateId(),
        url: null,
        blob: res.blob,
        previewUrl: res.previewUrl,
        isNew: true,
      }

      if (replaceCover && photoList.length > 0) {
        if (photoList[0].isNew && photoList[0].previewUrl) {
          URL.revokeObjectURL(photoList[0].previewUrl)
        }
        setPhotoList((prev) => [newItem, ...prev.slice(1)])
        toast.success('¡Foto de portada actualizada!', { id: toastId, icon: '⭐' })
      } else {
        setPhotoList((prev) => [...prev, newItem])
        toast.success(`¡Foto ${photoList.length + 1} agregada a la prenda!`, { id: toastId, icon: '✨' })
      }
    } catch (err) {
      console.error(err)
      toast.error('Error al procesar la foto', { id: toastId })
    } finally {
      e.target.value = ''
    }
  }

  // Set any photo as the main cover photo (moves it to position 0)
  const handleSetAsCover = (index) => {
    if (index === 0) return
    setPhotoList((prev) => {
      const copy = [...prev]
      const [target] = copy.splice(index, 1)
      copy.unshift(target)
      return copy
    })
    toast.success('⭐ ¡Esta foto ahora es la Portada Principal!', { icon: '⭐' })
  }

  // Remove a photo from the gallery
  const handleRemovePhoto = (index) => {
    if (photoList.length <= 1) {
      toast.error('La prenda debe tener al menos una foto')
      return
    }
    setPhotoList((prev) => {
      const target = prev[index]
      if (target?.isNew && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((_, i) => i !== index)
    })
    toast('Foto eliminada de la prenda', { icon: '🗑️' })
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

    if (photoList.length === 0) {
      toast.error('La prenda debe tener al menos una foto')
      return
    }

    setSaving(true)
    const toastId = toast.loading('Guardando cambios y subiendo fotos nuevas...')

    try {
      // 1. Subir fotos nuevas a Cloudinary y recopilar URLs finales en orden estricto
      const finalUrls = []
      for (let i = 0; i < photoList.length; i++) {
        const item = photoList[i]
        if (!item.isNew && item.url) {
          finalUrls.push(item.url)
        } else if (item.isNew && item.blob) {
          const role = i === 0 ? 'portada' : `angulo-${i + 1}`
          const uploadRes = await uploadToCloudinary(item.blob, `${name.trim()}-${role}`)
          finalUrls.push(uploadRes.secure_url)
        }
      }

      const origPriceNum = parseFloat(originalPrice)
      const validOrigPrice = isOnSale && !isNaN(origPriceNum) && origPriceNum > 0 ? origPriceNum : null

      const updatedPayload = {
        name: name.trim(),
        price: parsedPrice,
        original_price: validOrigPrice,
        is_on_sale: Boolean(isOnSale && validOrigPrice && validOrigPrice > parsedPrice),
        is_featured: Boolean(isFeatured),
        category_id: categoryId || null,
        sizes,
        image_url: finalUrls[0], // Foto principal / portada
        images: finalUrls,       // Todas las fotos de la galería
        stock_status: stockStatus,
        is_visible: isVisible,
      }

      if (db) {
        await updateDoc(doc(db, 'products', product.id), updatedPayload)
      }

      toast.success('¡Prenda actualizada con éxito! 🎉', { id: toastId })
      if (onSaveSuccess) {
        onSaveSuccess({
          ...product,
          ...updatedPayload,
        })
      }
      onClose()
    } catch (err) {
      console.error('Error al actualizar producto:', err)
      toast.error('Error al guardar los cambios', { id: toastId })
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

  const mainPhoto = photoList[0] || null
  const additionalPhotos = photoList.slice(1)

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-gray-950/85 backdrop-blur-md animate-fade-in'>
      {/* Hidden file inputs */}
      <input
        ref={replaceCoverRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => handleAddPhoto(e, true)}
      />
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => handleAddPhoto(e, false)}
      />

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
            className='p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-xl transition-colors shrink-0 cursor-pointer'
            title='Cerrar'
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto p-4 sm:p-6 space-y-5'>
          {/* SECTION 1: MULTI-PHOTO GALLERY & COVER MANAGER */}
          <div className='bg-gray-950/70 p-4 sm:p-5 rounded-2xl border border-gray-800/80 space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5'>
                <Images size={14} className='text-brand-400' />
                <span>Fotos de la prenda ({photoList.length}/{MAX_PHOTOS})</span>
              </span>
              <button
                type='button'
                onClick={() => {
                  setZoomInitialIndex(0)
                  setShowZoomModal(true)
                }}
                className='text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium cursor-pointer'
              >
                <ZoomIn size={13} />
                <span>Ver en grande</span>
              </button>
            </div>

            {/* Main Cover Photo Showcase */}
            {mainPhoto && (
              <div className='flex flex-col items-center'>
                <div className='relative w-40 sm:w-48 aspect-[4/5] rounded-2xl overflow-hidden bg-gray-800 border-2 border-amber-400 shadow-2xl group/photo select-none'>
                  <img
                    src={mainPhoto.previewUrl}
                    alt='Portada'
                    className='w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-105'
                  />

                  {/* Golden Cover Badge */}
                  <div className='absolute top-2.5 inset-x-2 flex items-center justify-between pointer-events-none'>
                    <span className='inline-flex items-center gap-1 bg-amber-400 text-gray-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-lg shadow-amber-400/30 uppercase tracking-wider'>
                      <Star size={11} className='fill-current' />
                      <span>Portada Principal</span>
                    </span>
                    {mainPhoto.isNew && (
                      <span className='bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow'>
                        Nueva ✓
                      </span>
                    )}
                  </div>

                  {/* Zoom Overlay */}
                  <div
                    onClick={() => {
                      setZoomInitialIndex(0)
                      setShowZoomModal(true)
                    }}
                    className='absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 cursor-pointer'
                  >
                    <ZoomIn size={22} className='text-brand-300' />
                    <span className='text-xs font-semibold'>Zoom HD</span>
                  </div>
                </div>

                <div className='flex items-center gap-2 mt-3'>
                  <button
                    type='button'
                    onClick={() => replaceCoverRef.current?.click()}
                    className='py-2 px-3.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer'
                  >
                    <ImagePlus size={14} />
                    <span>Cambiar portada</span>
                  </button>
                </div>
              </div>
            )}

            {/* Additional Angles Strip */}
            <div className='border-t border-gray-800/80 pt-3.5'>
              <div className='flex items-center justify-between mb-2.5'>
                <span className='text-gray-400 text-xs font-medium'>
                  Ángulos adicionales ({additionalPhotos.length} / {MAX_PHOTOS - 1})
                </span>
                <span className='text-[11px] text-gray-500'>
                  Espalda, detalle o puesta
                </span>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5'>
                {additionalPhotos.map((item, idx) => {
                  const actualIndex = idx + 1
                  return (
                    <div
                      key={item.id}
                      className='bg-gray-900 border border-gray-800 rounded-xl p-2 flex flex-col items-center text-center space-y-1.5 relative group/thumb'
                    >
                      <div
                        onClick={() => {
                          setZoomInitialIndex(actualIndex)
                          setShowZoomModal(true)
                        }}
                        className='w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-800 cursor-pointer relative shadow-sm'
                      >
                        <img
                          src={item.previewUrl}
                          alt={`Foto ${actualIndex + 1}`}
                          className='w-full h-full object-cover'
                        />
                        {item.isNew && (
                          <span className='absolute bottom-1 right-1 bg-emerald-600 text-white text-[8px] px-1 rounded font-bold'>
                            Nueva
                          </span>
                        )}
                      </div>

                      {/* Make Cover / Delete buttons */}
                      <div className='w-full flex items-center justify-between gap-1'>
                        <button
                          type='button'
                          onClick={() => handleSetAsCover(actualIndex)}
                          className='flex-1 py-1 px-1 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer'
                          title='Poner de portada'
                        >
                          <Star size={9} className='fill-current' />
                          <span>Portada</span>
                        </button>
                        <button
                          type='button'
                          onClick={() => handleRemovePhoto(actualIndex)}
                          className='p-1 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 border border-gray-700 rounded-lg text-xs transition-all active:scale-95 cursor-pointer'
                          title='Eliminar foto'
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Add Photo Button */}
                {photoList.length < MAX_PHOTOS && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className='border-2 border-dashed border-gray-700 hover:border-brand-500 bg-gray-900/50 hover:bg-brand-500/5 rounded-xl aspect-[4/5] flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-all active:scale-95 group/add'
                    title='Agregar otra foto a la prenda'
                  >
                    <div className='w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/30 text-brand-300 flex items-center justify-center mb-1 group-hover/add:scale-110 transition-transform'>
                      <Plus size={16} />
                    </div>
                    <span className='text-[11px] font-semibold text-gray-200 leading-tight'>
                      + Otra foto
                    </span>
                    <span className='text-[9px] text-gray-500 mt-0.5'>
                      Espalda / Detalle
                    </span>
                  </div>
                )}
              </div>
            </div>
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
                  className='text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium cursor-pointer'
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
                  className='btn-primary py-2 px-3 text-xs font-sans shrink-0 cursor-pointer'
                >
                  {creatingCat ? '...' : 'Crear'}
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowNewCat(false)
                    setNewCatName('')
                  }}
                  className='p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-xs shrink-0 cursor-pointer'
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
            className='btn-secondary py-2.5 sm:py-3 px-5 text-sm font-sans cursor-pointer'
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
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Guardar cambios {photoList.length > 1 ? `(${photoList.length} fotos)` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full screen HD Zoom modal */}
      {showZoomModal && photoList.length > 0 && (
        <ImageZoomModal
          isOpen={showZoomModal}
          onClose={() => setShowZoomModal(false)}
          images={photoList.map((item) => ({ url: item.previewUrl, name: name || product.name, product }))}
          initialIndex={zoomInitialIndex}
          isAdmin={false}
        />
      )}
    </div>
  )
}

export default EditProductModal
