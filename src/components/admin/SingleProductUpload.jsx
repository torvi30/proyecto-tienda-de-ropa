import { useState, useRef } from 'react'
import {
  ImagePlus, Sparkles, Check, Loader2, X, Plus,
  Flame, Star, ZoomIn, ArrowRight, PackageCheck,
  Images, Trash2, ArrowUp
} from 'lucide-react'
import useImageCompressor from '../../hooks/useImageCompressor'
import useCategories from '../../hooks/useCategories'
import { db } from '../../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { uploadToCloudinary } from '../../lib/cloudinary'
import SizeMeasurePicker from './SizeMeasurePicker'
import ImageZoomModal from '../shared/ImageZoomModal'
import { useStore } from '../../store/StoreContext'
import toast from 'react-hot-toast'

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

const SingleProductUpload = ({ onSuccess, onNavigateInventory }) => {
  const mainInputRef = useRef(null)
  const additionalInputRef = useRef(null)
  const { compress } = useImageCompressor()
  const { categories } = useCategories()
  const { settings } = useStore()
  const sym = settings?.currency_symbol || '$'

  // Multi-image state: array of { id, file, blob, previewUrl, sizeKB }
  // images[0] is ALWAYS the Main / Cover photo
  const [images, setImages] = useState([])
  const [isCompressing, setIsCompressing] = useState(false)
  const [showZoomModal, setShowZoomModal] = useState(false)
  const [zoomInitialIndex, setZoomInitialIndex] = useState(0)

  // Form fields
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [isOnSale, setIsOnSale] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [sizes, setSizes] = useState([])
  const [stockStatus, setStockStatus] = useState('available')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Quick inline category creation
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [creatingCat, setCreatingCat] = useState(false)

  // Submit and success state
  const [isSaving, setIsSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0 })
  const [lastCreatedProduct, setLastCreatedProduct] = useState(null)

  // Handle selecting the main photo or adding an additional photo
  const handleAddPhoto = async (e, isMainSlot = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type || !file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen válida (JPG, PNG, WebP)')
      return
    }

    if (images.length >= MAX_PHOTOS && !isMainSlot) {
      toast.error(`Máximo ${MAX_PHOTOS} fotos por prenda`)
      return
    }

    setIsCompressing(true)
    const toastId = toast.loading('Comprimiendo foto a WebP 4:5...')
    try {
      const res = await compress(file)
      const newPhotoObj = {
        id: generateId(),
        file,
        blob: res.blob,
        previewUrl: res.previewUrl,
        sizeKB: res.compressedSizeKB,
      }

      if (isMainSlot && images.length > 0) {
        // Replace main photo (slot 0)
        URL.revokeObjectURL(images[0].previewUrl)
        setImages((prev) => [newPhotoObj, ...prev.slice(1)])
        toast.success('¡Foto de portada actualizada!', { id: toastId, icon: '⭐' })
      } else {
        // Append new photo to the garment gallery
        setImages((prev) => [...prev, newPhotoObj])
        toast.success(
          images.length === 0
            ? '¡Foto principal lista!'
            : `¡Foto ${images.length + 1} agregada a la prenda!`,
          { id: toastId, icon: '✨' }
        )
      }

      // Sugerir nombre si está vacío y el archivo tiene nombre descriptivo
      const rawName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      const isGeneric = /^(image|img|photo|foto|dsc|p)[0-9_-]*$/i.test(rawName.trim())
      if (!name && !isGeneric && rawName.length > 2) {
        setName(rawName)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error al procesar la foto', { id: toastId })
    } finally {
      setIsCompressing(false)
      e.target.value = ''
    }
  }

  // Set any photo as the main cover photo (moves it to index 0)
  const handleSetAsCover = (index) => {
    if (index === 0) return
    setImages((prev) => {
      const copy = [...prev]
      const [target] = copy.splice(index, 1)
      copy.unshift(target)
      return copy
    })
    toast.success('⭐ ¡Esta foto ahora es la Portada Principal!', { icon: '⭐' })
  }

  // Remove a photo from the gallery
  const handleRemovePhoto = (index) => {
    setImages((prev) => {
      const target = prev[index]
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
    toast('Foto eliminada de la prenda', { icon: '🗑️' })
  }

  // Quick category creation
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (images.length === 0) {
      toast.error('Debes seleccionar al menos una foto para la prenda 📷', { icon: '⚠️' })
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Escribe el nombre de la prenda', { icon: '⚠️' })
      return
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error('Ingresa un precio de venta válido', { icon: '⚠️' })
      return
    }

    if (sizes.length === 0) {
      toast.error('Selecciona al menos una talla o medida', { icon: '⚠️' })
      return
    }

    setIsSaving(true)
    setSaveProgress({ done: 0, total: images.length })
    const toastId = toast.loading(`Subiendo 1 de ${images.length} fotos a la nube...`)

    try {
      // 1. Subir a Cloudinary todas las fotos de la prenda en orden estricto
      const uploadedUrls = []
      for (let i = 0; i < images.length; i++) {
        const item = images[i]
        const roleName = i === 0 ? 'principal' : `angulo-${i + 1}`
        const uploadRes = await uploadToCloudinary(item.blob || item.file, `${trimmedName}-${roleName}`)
        uploadedUrls.push(uploadRes.secure_url)
        setSaveProgress({ done: i + 1, total: images.length })
        toast.loading(`Subiendo foto ${i + 1} de ${images.length}...`, { id: toastId })
      }

      // 2. Calcular precio de oferta si aplica
      const origPriceNum = parseFloat(originalPrice)
      const validOrigPrice = isOnSale && !isNaN(origPriceNum) && origPriceNum > parsedPrice ? origPriceNum : null

      // 3. Crear documento en Firestore con array 'images' y 'image_url' (portada)
      if (!db) throw new Error('Firestore no está inicializado')

      const newProductData = {
        name: trimmedName,
        price: parsedPrice,
        original_price: validOrigPrice,
        is_on_sale: Boolean(isOnSale && validOrigPrice),
        is_featured: Boolean(isFeatured),
        category_id: categoryId || null,
        sizes,
        image_url: uploadedUrls[0], // Foto principal de portada
        images: uploadedUrls,       // Todas las fotos de la galería (espalda, detalle, etc.)
        stock_status: stockStatus,
        is_visible: isVisible,
        created_at: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'products'), newProductData)

      toast.success(`¡Prenda con ${uploadedUrls.length} foto(s) publicada con éxito! 🎉`, { id: toastId, duration: 4000 })

      setLastCreatedProduct({
        id: docRef.id,
        ...newProductData,
      })

      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Error al publicar producto:', err)
      toast.error(err.message || 'Error al publicar producto', { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  // Reset form to upload another garment
  const handleUploadAnother = () => {
    images.forEach((img) => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl)
    })
    setImages([])
    setName('')
    setPrice('')
    setOriginalPrice('')
    setIsOnSale(false)
    setSizes([])
    setStockStatus('available')
    setIsFeatured(false)
    setIsVisible(true)
    setLastCreatedProduct(null)
  }

  // SUCCESS STATE SCREEN
  if (lastCreatedProduct) {
    return (
      <div className='max-w-xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-fade-in'>
        <div className='w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20'>
          <Check size={32} className='stroke-[3]' />
        </div>

        <div>
          <span className='inline-block text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider mb-2'>
            Publicada con éxito
          </span>
          <h2 className='text-gray-100 font-bold text-xl sm:text-2xl'>
            ¡Prenda lista en la tienda!
          </h2>
          <p className='text-gray-400 text-sm mt-1'>
            {lastCreatedProduct.images?.length || 1} foto(s) publicadas. Los clientes ya pueden deslizar entre ellas y pedirla por WhatsApp.
          </p>
        </div>

        {/* Card preview of the published product */}
        <div className='bg-gray-950/70 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 text-left max-w-md mx-auto'>
          <div className='w-16 h-20 rounded-xl overflow-hidden bg-gray-800 border border-gray-700/60 shrink-0 shadow-md aspect-[4/5] relative'>
            <img
              src={lastCreatedProduct.image_url}
              alt={lastCreatedProduct.name}
              className='w-full h-full object-cover'
            />
            {lastCreatedProduct.images?.length > 1 && (
              <span className='absolute bottom-1 right-1 bg-black/80 text-[9px] text-white px-1.5 py-0.5 rounded font-bold'>
                {lastCreatedProduct.images.length} fotos
              </span>
            )}
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-gray-100 font-semibold text-sm truncate'>
              {lastCreatedProduct.name}
            </p>
            <p className='text-brand-400 font-bold text-base mt-0.5'>
              {sym}{Number(lastCreatedProduct.price).toLocaleString('es-CO')}
            </p>
            <div className='flex items-center gap-1.5 mt-1 flex-wrap'>
              <span className='text-[10px] text-green-400 bg-green-500/15 border border-green-500/30 px-1.5 py-0.5 rounded'>
                Disponible
              </span>
              {lastCreatedProduct.sizes?.length > 0 && (
                <span className='text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded'>
                  {lastCreatedProduct.sizes.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className='flex flex-col sm:flex-row items-center justify-center gap-3 pt-2'>
          <button
            type='button'
            onClick={handleUploadAnother}
            className='w-full sm:w-auto py-3 px-6 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all active:scale-95 cursor-pointer'
          >
            <Plus size={18} />
            <span>Subir otra prenda</span>
          </button>

          {onNavigateInventory && (
            <button
              type='button'
              onClick={onNavigateInventory}
              className='w-full sm:w-auto py-3 px-5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer'
            >
              <PackageCheck size={18} />
              <span>Ir al Inventario</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Discount calculations
  const numPrice = parseFloat(price) || 0
  const numOrigPrice = parseFloat(originalPrice) || 0
  const hasDiscount = isOnSale && numOrigPrice > numPrice && numPrice > 0
  const discountPercent = hasDiscount ? Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100) : 0
  const savings = hasDiscount ? numOrigPrice - numPrice : 0

  const mainPhoto = images[0] || null
  const additionalPhotos = images.slice(1)

  return (
    <div className='max-w-xl mx-auto'>
      {/* Hidden file inputs */}
      <input
        ref={mainInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => handleAddPhoto(e, images.length > 0)}
      />
      <input
        ref={additionalInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => handleAddPhoto(e, false)}
      />

      <form onSubmit={handleSubmit} className='bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl'>
        {/* STEP 1: MULTI-PHOTO GALLERY MANAGER */}
        <div>
          <div className='flex items-center justify-between mb-2'>
            <label className='text-gray-300 font-bold text-sm uppercase tracking-wider flex items-center gap-2'>
              <span className='w-6 h-6 rounded-full bg-brand-600/30 text-brand-300 text-xs flex items-center justify-center font-bold'>1</span>
              <span>Fotos de la prenda ({images.length}/{MAX_PHOTOS}) *</span>
            </label>
            {images.length > 0 && (
              <button
                type='button'
                onClick={() => {
                  setZoomInitialIndex(0)
                  setShowZoomModal(true)
                }}
                className='text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium'
              >
                <ZoomIn size={13} />
                <span>Ver en grande</span>
              </button>
            )}
          </div>

          {!mainPhoto ? (
            /* Empty State: Select 1st / Main Photo */
            <div
              onClick={() => mainInputRef.current?.click()}
              className='relative border-2 border-dashed border-gray-700 hover:border-brand-500 bg-gray-950/60 hover:bg-brand-500/5 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all active:scale-[0.99] group'
              title='Toca para abrir cámara o galería'
            >
              {isCompressing ? (
                <div className='space-y-3 py-4'>
                  <Loader2 size={36} className='text-brand-400 animate-spin mx-auto' />
                  <p className='text-gray-200 font-semibold text-sm'>Optimizando foto en WebP 4:5...</p>
                  <p className='text-gray-500 text-xs'>Preparando imagen de alta calidad</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  <div className='w-16 h-16 rounded-2xl bg-brand-600/15 border border-brand-500/25 flex items-center justify-center text-brand-400 mx-auto group-hover:scale-110 transition-transform'>
                    <ImagePlus size={30} />
                  </div>
                  <div>
                    <p className='text-gray-200 font-bold text-base sm:text-lg'>
                      Toca para seleccionar la Foto Principal
                    </p>
                    <p className='text-gray-400 text-xs sm:text-sm mt-1'>
                      Esta será la foto de portada. Luego podrás agregar más ángulos (espalda, detalle).
                    </p>
                  </div>
                  <span className='inline-block text-[11px] text-gray-500 bg-gray-900 border border-gray-800 px-3 py-1 rounded-full font-mono'>
                    Formato vertical 4:5 · Automático
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Photo Showcase: Main Photo + Additional Angles Strip */
            <div className='bg-gray-950/70 border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in'>
              {/* Main Cover Photo Showcase */}
              <div className='flex flex-col items-center'>
                <div className='relative w-44 sm:w-52 aspect-[4/5] rounded-2xl overflow-hidden bg-gray-800 border-2 border-amber-400/80 shadow-2xl group/photo select-none'>
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
                    <span className='bg-gray-950/80 text-green-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-gray-700'>
                      {mainPhoto.sizeKB}KB
                    </span>
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
                    onClick={() => mainInputRef.current?.click()}
                    className='py-2 px-3.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer'
                  >
                    <ImagePlus size={14} />
                    <span>Cambiar portada</span>
                  </button>
                  {images.length === 1 && (
                    <button
                      type='button'
                      onClick={() => handleRemovePhoto(0)}
                      className='py-2 px-3 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 border border-gray-700 rounded-xl text-xs font-medium transition-all active:scale-95 cursor-pointer'
                      title='Quitar foto'
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Additional Photos Section */}
              <div className='border-t border-gray-800/80 pt-4'>
                <div className='flex items-center justify-between mb-2.5'>
                  <span className='text-gray-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5'>
                    <Images size={13} className='text-brand-400' />
                    <span>Fotos adicionales ({additionalPhotos.length} / {MAX_PHOTOS - 1})</span>
                  </span>
                  <span className='text-[11px] text-gray-500'>
                    Espalda, detalles o puesta
                  </span>
                </div>

                {/* Thumbnails row / grid */}
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5'>
                  {additionalPhotos.map((item, idx) => {
                    const actualIndex = idx + 1
                    return (
                      <div
                        key={item.id}
                        className='bg-gray-900 border border-gray-800 rounded-xl p-2 flex flex-col items-center text-center space-y-2 relative group/thumb'
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
                          <span className='absolute bottom-1 right-1 bg-black/80 text-gray-300 text-[9px] px-1 rounded font-mono'>
                            {item.sizeKB}KB
                          </span>
                        </div>

                        {/* Actions for this additional angle */}
                        <div className='w-full flex items-center justify-between gap-1 pt-0.5'>
                          <button
                            type='button'
                            onClick={() => handleSetAsCover(actualIndex)}
                            className='flex-1 py-1 px-1.5 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer'
                            title='Poner esta foto como la portada principal'
                          >
                            <Star size={10} className='fill-current' />
                            <span>Hacer portada</span>
                          </button>
                          <button
                            type='button'
                            onClick={() => handleRemovePhoto(actualIndex)}
                            className='p-1 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 border border-gray-700 rounded-lg text-xs transition-all active:scale-95 cursor-pointer'
                            title='Eliminar esta foto'
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {/* Add More Photo Button Box */}
                  {images.length < MAX_PHOTOS && (
                    <div
                      onClick={() => additionalInputRef.current?.click()}
                      className='border-2 border-dashed border-gray-700 hover:border-brand-500 bg-gray-900/50 hover:bg-brand-500/5 rounded-xl aspect-[4/5] flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-all active:scale-95 group/add'
                      title='Agregar otra foto a la prenda'
                    >
                      <div className='w-9 h-9 rounded-full bg-brand-600/20 border border-brand-500/30 text-brand-300 flex items-center justify-center mb-1.5 group-hover/add:scale-110 transition-transform'>
                        <Plus size={18} />
                      </div>
                      <span className='text-[11px] font-semibold text-gray-200 leading-tight'>
                        + Agregar foto
                      </span>
                      <span className='text-[9px] text-gray-500 mt-0.5'>
                        Espalda / Detalle
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: GARMENT NAME */}
        <div>
          <label className='text-gray-300 font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-2'>
            <span className='w-6 h-6 rounded-full bg-brand-600/30 text-brand-300 text-xs flex items-center justify-center font-bold'>2</span>
            <span>Nombre de la prenda *</span>
          </label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Ej: Jean Palazzo Dama Rígido'
            required
            className='form-input text-base py-3 bg-gray-950/60 font-sans'
          />
        </div>

        {/* STEP 3: PRICE & DISCOUNT */}
        <div>
          <label className='text-gray-300 font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-2'>
            <span className='w-6 h-6 rounded-full bg-brand-600/30 text-brand-300 text-xs flex items-center justify-center font-bold'>3</span>
            <span>Precio de venta *</span>
          </label>

          <div className='bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent border border-pink-500/25 rounded-2xl p-4 space-y-3.5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <div className='w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0'>
                  <Flame size={16} />
                </div>
                <div>
                  <p className='text-gray-100 font-semibold text-xs sm:text-sm'>
                    ¿Es un precio de oferta o promoción?
                  </p>
                  <p className='text-gray-400 text-[11px]'>
                    Muestra precio tachado y badge de descuento
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
                    Precio de Oferta (Lo que paga el cliente) *
                  </label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 font-bold text-sm'>{sym}</span>
                    <input
                      type='number'
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder='80000'
                      min='0'
                      step='100'
                      required
                      className='form-input pl-8 py-2.5 text-base font-sans bg-gray-950/80 border-pink-500/40 text-pink-200'
                    />
                  </div>
                </div>

                <div>
                  <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1'>
                    Precio Original (Tachado) *
                  </label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm'>{sym}</span>
                    <input
                      type='number'
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder='100000'
                      min='0'
                      step='100'
                      className='form-input pl-8 py-2.5 text-base font-sans bg-gray-950/80 text-gray-300'
                    />
                  </div>
                </div>

                {hasDiscount && (
                  <div className='sm:col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-pink-500/15 border border-pink-500/30 text-xs'>
                    <span className='text-pink-300 font-medium'>
                      Ahorro del cliente: {sym}{savings.toLocaleString('es-CO')} COP
                    </span>
                    <span className='bg-pink-500 text-white font-bold px-2 py-0.5 rounded-full'>
                      -{discountPercent}% OFF
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className='relative'>
                  <span className='absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400 font-bold text-base'>{sym}</span>
                  <input
                    type='number'
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder='Ej: 85000'
                    min='0'
                    step='100'
                    required
                    className='form-input pl-9 py-3 text-base sm:text-lg font-sans bg-gray-950/60 font-semibold'
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 4: SIZES & MEASUREMENTS */}
        <div>
          <label className='text-gray-300 font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-2'>
            <span className='w-6 h-6 rounded-full bg-brand-600/30 text-brand-300 text-xs flex items-center justify-center font-bold'>4</span>
            <span>Tallas o Medidas Disponibles *</span>
          </label>
          <div className='bg-gray-950/50 p-4 rounded-2xl border border-gray-800/80'>
            <SizeMeasurePicker
              selected={sizes}
              onChange={setSizes}
              label='Toca las tallas disponibles para esta prenda'
            />
          </div>
        </div>

        {/* STEP 5: CATEGORY */}
        <div>
          <div className='flex items-center justify-between mb-2'>
            <label className='text-gray-300 font-bold text-sm uppercase tracking-wider flex items-center gap-2'>
              <span className='w-6 h-6 rounded-full bg-brand-600/30 text-brand-300 text-xs flex items-center justify-center font-bold'>5</span>
              <span>Categoría (Opcional)</span>
            </label>
            {!showNewCat && (
              <button
                type='button'
                onClick={() => setShowNewCat(true)}
                className='text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium'
              >
                <Plus size={13} />
                <span>Nueva categoría</span>
              </button>
            )}
          </div>

          <div className='bg-gray-950/50 p-3.5 rounded-2xl border border-gray-800/80'>
            {showNewCat ? (
              <div className='flex items-center gap-2 animate-fade-in'>
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
                  placeholder='Nombre de categoría (ej: Jeans, Vestidos)'
                  className='form-input text-sm py-2 font-sans bg-gray-900'
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
                className='form-input text-sm py-3 bg-gray-900 font-sans'
              >
                <option value=''>Sin categoría específica</option>
                {(categories || []).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* STEP 6: FEATURED & STOCK (OPCIONALES) */}
        <div className='space-y-3 pt-2'>
          {/* Featured toggle */}
          <div className='flex items-center justify-between p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/25'>
            <div className='flex items-center gap-2.5'>
              <div className='w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0'>
                <Star size={16} className={isFeatured ? 'fill-current' : ''} />
              </div>
              <div>
                <p className='text-gray-100 font-semibold text-xs sm:text-sm'>
                  Destacar Prenda en Portada ⭐
                </p>
                <p className='text-gray-400 text-[11px]'>
                  Aparece de primera en la tienda con insignia dorada Top
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

          {/* Stock status buttons */}
          <div className='space-y-1.5'>
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
                    {isSelected && <Check size={14} className={opt.color} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className='pt-2'>
          <button
            type='submit'
            disabled={isSaving}
            className='w-full py-4 px-6 bg-gradient-to-r from-brand-600 via-purple-600 to-brand-500 hover:from-brand-500 hover:to-purple-500 text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-xl shadow-brand-500/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSaving ? (
              <>
                <Loader2 size={20} className='animate-spin' />
                <span>
                  Publicando foto {saveProgress.done} de {saveProgress.total}...
                </span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>
                  Publicar Prenda en la Tienda {images.length > 1 ? `(${images.length} fotos)` : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Full screen HD Zoom modal */}
      {showZoomModal && images.length > 0 && (
        <ImageZoomModal
          isOpen={showZoomModal}
          onClose={() => setShowZoomModal(false)}
          images={images.map((img) => ({ url: img.previewUrl, name: name || 'Prenda' }))}
          initialIndex={zoomInitialIndex}
          isAdmin={false}
        />
      )}
    </div>
  )
}

export default SingleProductUpload
