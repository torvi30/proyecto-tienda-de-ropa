import { useState, useRef } from 'react'
import {
  ImagePlus, Sparkles, Check, Loader2, X, Plus,
  Flame, Star, ZoomIn, Undo2, ArrowRight, PackageCheck, Eye
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

const STOCK_OPTIONS = [
  { value: 'available', label: 'Disponible', color: 'text-green-400', border: 'border-green-500/40', bg: 'bg-green-500/10' },
  { value: 'low_stock', label: 'Pocas unidades', color: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10' },
  { value: 'sold_out', label: 'Agotado (Oculto)', color: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-500/10' },
]

const SingleProductUpload = ({ onSuccess, onNavigateInventory }) => {
  const fileInputRef = useRef(null)
  const { compress } = useImageCompressor()
  const { categories } = useCategories()
  const { settings } = useStore()
  const sym = settings?.currency_symbol || '$'

  // Image state
  const [imageFile, setImageFile] = useState(null) // Raw original File
  const [imageBlob, setImageBlob] = useState(null) // WebP compressed Blob
  const [previewUrl, setPreviewUrl] = useState(null)
  const [imageSizeKB, setImageSizeKB] = useState(0)
  const [isCompressing, setIsCompressing] = useState(false)
  const [showZoomModal, setShowZoomModal] = useState(false)

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
  const [lastCreatedProduct, setLastCreatedProduct] = useState(null)

  // Process selected image file
  const handleSelectImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type || !file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen válida (JPG, PNG, WebP)')
      return
    }

    setIsCompressing(true)
    const toastId = toast.loading('Comprimiendo foto a WebP 4:5...')
    try {
      const res = await compress(file)
      if (previewUrl) URL.revokeObjectURL(previewUrl)

      setImageFile(file)
      setImageBlob(res.blob)
      setPreviewUrl(res.previewUrl)
      setImageSizeKB(res.compressedSizeKB)

      // Si el nombre está vacío y el archivo tiene nombre descriptivo, sugerirlo
      const rawName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      const isGeneric = /^(image|img|photo|foto|dsc|p)[0-9_-]*$/i.test(rawName.trim())
      if (!name && !isGeneric && rawName.length > 2) {
        setName(rawName)
      }

      toast.success('¡Foto lista y optimizada!', { id: toastId, icon: '✨' })
    } catch (err) {
      console.error(err)
      toast.error('Error al procesar la foto', { id: toastId })
    } finally {
      setIsCompressing(false)
      e.target.value = ''
    }
  }

  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(null)
    setImageBlob(null)
    setPreviewUrl(null)
    setImageSizeKB(0)
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

    if (!imageBlob && !imageFile) {
      toast.error('Debes seleccionar una foto para la prenda 📷', { icon: '⚠️' })
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
    const toastId = toast.loading('Subiendo imagen a la nube y publicando prenda...')

    try {
      // 1. Subir a Cloudinary el blob WebP comprimido (ultra ligero < 150KB)
      const uploadRes = await uploadToCloudinary(imageBlob || imageFile, trimmedName)
      const imageUrl = uploadRes.secure_url

      // 2. Calcular precio de oferta si aplica
      const origPriceNum = parseFloat(originalPrice)
      const validOrigPrice = isOnSale && !isNaN(origPriceNum) && origPriceNum > parsedPrice ? origPriceNum : null

      // 3. Crear documento en Firestore
      if (!db) throw new Error('Firestore no está inicializado')

      const newProductData = {
        name: trimmedName,
        price: parsedPrice,
        original_price: validOrigPrice,
        is_on_sale: Boolean(isOnSale && validOrigPrice),
        is_featured: Boolean(isFeatured),
        category_id: categoryId || null,
        sizes,
        image_url: imageUrl,
        stock_status: stockStatus,
        is_visible: isVisible,
        created_at: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'products'), newProductData)

      toast.success('¡Prenda publicada con éxito en la tienda! 🎉', { id: toastId, duration: 4000 })

      setLastCreatedProduct({
        id: docRef.id,
        ...newProductData,
        image_url: imageUrl,
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
    handleRemoveImage()
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
            Los clientes ya pueden verla y pedirla por WhatsApp.
          </p>
        </div>

        {/* Card preview of the published product */}
        <div className='bg-gray-950/70 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 text-left max-w-md mx-auto'>
          <div className='w-16 h-20 rounded-xl overflow-hidden bg-gray-800 border border-gray-700/60 shrink-0 shadow-md aspect-[4/5]'>
            <img
              src={lastCreatedProduct.image_url}
              alt={lastCreatedProduct.name}
              className='w-full h-full object-cover'
            />
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

  return (
    <div className='max-w-xl mx-auto'>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleSelectImage}
      />

      <form onSubmit={handleSubmit} className='bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl'>
        {/* STEP 1: PHOTO SELECTION */}
        <div>
          <div className='flex items-center justify-between mb-2'>
            <label className='text-gray-300 font-bold text-sm uppercase tracking-wider flex items-center gap-2'>
              <span className='w-6 h-6 rounded-full bg-brand-600/30 text-brand-300 text-xs flex items-center justify-center font-bold'>1</span>
              <span>Foto de la prenda *</span>
            </label>
            {previewUrl && (
              <button
                type='button'
                onClick={() => setShowZoomModal(true)}
                className='text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium'
              >
                <ZoomIn size={13} />
                <span>Ver en grande</span>
              </button>
            )}
          </div>

          {!previewUrl ? (
            /* Empty State: Big comfortable touch dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
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
                      Toca aquí para seleccionar la foto
                    </p>
                    <p className='text-gray-400 text-xs sm:text-sm mt-1'>
                      Abre la cámara o elige una foto de tu galería
                    </p>
                  </div>
                  <span className='inline-block text-[11px] text-gray-500 bg-gray-900 border border-gray-800 px-3 py-1 rounded-full font-mono'>
                    Formato vertical 4:5 · Automático
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Selected Photo Preview Card */
            <div className='bg-gray-950/70 border border-gray-800 rounded-2xl p-4 flex flex-col items-center animate-fade-in'>
              <div
                onClick={() => setShowZoomModal(true)}
                className='relative w-44 sm:w-52 aspect-[4/5] rounded-2xl overflow-hidden bg-gray-800 border-2 border-gray-700 shadow-2xl cursor-pointer group/photo select-none'
                title='Toca para ver en pantalla completa'
              >
                <img
                  src={previewUrl}
                  alt='Previsualización'
                  className='w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-105'
                />
                <div className='absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1'>
                  <ZoomIn size={22} className='text-brand-300' />
                  <span className='text-xs font-semibold'>Zoom HD</span>
                </div>
                <div className='absolute bottom-2 right-2 bg-gray-950/90 border border-gray-700 text-green-400 text-[10px] font-mono px-2 py-0.5 rounded-md'>
                  {imageSizeKB} KB (WebP)
                </div>
              </div>

              {/* Replace / Remove buttons */}
              <div className='flex items-center gap-2 mt-4'>
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='py-2 px-4 bg-brand-600/30 hover:bg-brand-600/40 border border-brand-500/40 text-brand-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer'
                >
                  <ImagePlus size={14} />
                  <span>Cambiar foto</span>
                </button>
                <button
                  type='button'
                  onClick={handleRemoveImage}
                  className='py-2 px-3 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 border border-gray-700 rounded-xl text-xs font-medium transition-all active:scale-95 cursor-pointer'
                  title='Quitar foto'
                >
                  <X size={14} />
                  <span>Quitar</span>
                </button>
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
                {categories.map((cat) => (
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
                <span>Publicando prenda en la tienda...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Publicar Prenda en la Tienda</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Full screen HD Zoom modal */}
      {showZoomModal && previewUrl && (
        <ImageZoomModal
          isOpen={showZoomModal}
          onClose={() => setShowZoomModal(false)}
          images={[{ url: previewUrl, name: name || 'Prenda nueva' }]}
          isAdmin={false}
        />
      )}
    </div>
  )
}

export default SingleProductUpload
