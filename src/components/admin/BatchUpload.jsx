import { useState, useRef, useCallback } from 'react'
import {
  Upload, X, CheckCircle, AlertCircle, Loader2,
  ImagePlus, Zap, ChevronRight
} from 'lucide-react'
import useImageCompressor from '../../hooks/useImageCompressor'
import useCategories from '../../hooks/useCategories'
import { supabase, isDemoMode } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'

const MAX_FILES = 20
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única']

// Estado inicial de cada item del lote
const makeItem = (file, previewUrl, compressedSizeKB, originalSizeKB) => ({
  id: crypto.randomUUID(),
  file,
  previewUrl,
  compressedSizeKB,
  originalSizeKB,
  // Campos del formulario
  name: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
  price: '',
  categoryId: '',
  sizes: [],
  // Estado
  status: 'idle', // idle | uploading | done | error
  error: null,
})

const BatchUpload = ({ onSuccess }) => {
  const [items, setItems] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressProgress, setCompressProgress] = useState({ done: 0, total: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef(null)
  const { compressBatch } = useImageCompressor()
  const { categories } = useCategories()

  // Procesar archivos seleccionados
  const processFiles = useCallback(async (files) => {
    const validFiles = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, MAX_FILES - items.length)

    if (validFiles.length === 0) {
      toast.error('Selecciona archivos de imagen válidos (JPG, PNG, WebP)')
      return
    }

    setIsCompressing(true)
    setCompressProgress({ done: 0, total: validFiles.length })

    const { results, errors } = await compressBatch(validFiles, (done, total) => {
      setCompressProgress({ done, total })
    })

    if (errors.length > 0) {
      toast.error(`${errors.length} imagen(es) no pudieron comprimirse`)
    }

    const newItems = results.map(({ file, previewUrl, compressedSizeKB, originalSizeKB }) =>
      makeItem(file, previewUrl, compressedSizeKB, originalSizeKB)
    )

    setItems((prev) => [...prev, ...newItems])
    setIsCompressing(false)

    toast.success(`${results.length} foto(s) listas para configurar`, { icon: '✅' })
  }, [items.length, compressBatch])

  // Drag & Drop handlers
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  // Actualizar campo de un item
  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  // Toggle de talla en un item
  const toggleSize = (id, size) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const sizes = item.sizes.includes(size)
          ? item.sizes.filter((s) => s !== size)
          : [...item.sizes, size]
        return { ...item, sizes }
      })
    )
  }

  // Eliminar un item del lote
  const removeItem = (id) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((i) => i.id !== id)
    })
  }

  // Guardar todo el lote
  const handleSaveAll = async () => {
    // Validar que todos los items tengan nombre y precio
    const invalid = items.filter(
      (i) => i.status === 'idle' && (!i.name.trim() || !i.price || i.sizes.length === 0)
    )
    if (invalid.length > 0) {
      toast.error(`Completa nombre, precio y al menos 1 talla en todas las fotos`, {
        duration: 4000,
      })
      return
    }

    setIsSaving(true)
    let savedCount = 0

    for (const item of items.filter((i) => i.status === 'idle')) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i))
      )

      try {
        let imageUrl = item.previewUrl

        if (!isDemoMode) {
          // Subir imagen a Supabase Storage
          const fileName = `products/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, item.file, {
              contentType: 'image/webp',
              upsert: false,
            })

          if (uploadError) throw new Error(uploadError.message)

          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName)

          imageUrl = urlData.publicUrl

          // Crear registro en BD
          const { error: dbError } = await supabase.from('products').insert({
            name: item.name.trim(),
            price: parseFloat(item.price),
            category_id: item.categoryId || null,
            sizes: item.sizes,
            image_url: imageUrl,
            stock_status: 'available',
            is_visible: true,
          })

          if (dbError) throw new Error(dbError.message)
        }

        savedCount++
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'done' } : i))
        )
      } catch (err) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'error', error: err.message } : i
          )
        )
      }
    }

    setIsSaving(false)

    if (savedCount > 0) {
      toast.success(`¡${savedCount} producto(s) publicados en la tienda! 🎉`, {
        duration: 5000,
      })
      if (onSuccess) onSuccess()
    }
  }

  const pendingItems = items.filter((i) => i.status === 'idle')
  const doneItems = items.filter((i) => i.status === 'done')
  const canSave = pendingItems.length > 0 && !isSaving

  return (
    <div className='space-y-6'>
      {/* Zona de Drag & Drop */}
      {items.length < MAX_FILES && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-brand-400 bg-brand-500/10 scale-[1.02]'
              : 'border-gray-700 hover:border-brand-600 hover:bg-gray-800/50'
            }`}
          id='batch-upload-dropzone'
        >
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            multiple
            className='hidden'
            onChange={(e) => processFiles(e.target.files)}
          />

          {isCompressing ? (
            <div className='space-y-3'>
              <Loader2 size={36} className='text-brand-400 animate-spin mx-auto' />
              <p className='text-gray-300 font-medium'>
                Comprimiendo {compressProgress.done}/{compressProgress.total} fotos...
              </p>
              <p className='text-gray-500 text-sm'>
                Convirtiendo a WebP (max 150KB) · Ratio 4:5
              </p>
              {/* Barra de progreso */}
              <div className='w-full bg-gray-700 rounded-full h-2 max-w-xs mx-auto'>
                <div
                  className='bg-brand-500 h-2 rounded-full transition-all duration-300'
                  style={{
                    width: `${compressProgress.total > 0
                      ? (compressProgress.done / compressProgress.total) * 100
                      : 0}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className='space-y-3'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-brand-600/15 rounded-2xl border border-brand-500/20'>
                <ImagePlus size={28} className='text-brand-400' />
              </div>
              <div>
                <p className='text-gray-200 font-semibold text-lg'>
                  Arrastra las fotos aquí
                </p>
                <p className='text-gray-500 text-sm mt-1'>
                  o toca para seleccionar · Máximo {MAX_FILES} fotos por lote
                </p>
              </div>
              <div className='flex items-center justify-center gap-4 text-xs text-gray-600'>
                <span className='flex items-center gap-1'>
                  <Zap size={12} className='text-brand-500' />
                  Compresión automática WebP
                </span>
                <span className='flex items-center gap-1'>
                  <Zap size={12} className='text-brand-500' />
                  Ratio 4:5 (1080×1350)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contador y botón guardar */}
      {items.length > 0 && (
        <div className='flex items-center justify-between'>
          <p className='text-gray-400 text-sm'>
            <span className='text-brand-400 font-bold'>{pendingItems.length}</span> pendientes ·{' '}
            <span className='text-green-400 font-bold'>{doneItems.length}</span> guardadas
          </p>
          <button
            onClick={handleSaveAll}
            disabled={!canSave}
            id='batch-save-all'
            className='btn-primary flex items-center gap-2 py-2.5 px-5'
          >
            {isSaving ? (
              <Loader2 size={16} className='animate-spin' />
            ) : (
              <Upload size={16} />
            )}
            {isSaving
              ? 'Publicando...'
              : `Publicar ${pendingItems.length} producto${pendingItems.length !== 1 ? 's' : ''}`}
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Lista de items del lote */}
      <div className='space-y-4'>
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-gray-800/60 border rounded-2xl overflow-hidden transition-all duration-200
              ${item.status === 'done' ? 'border-green-500/40' : ''}
              ${item.status === 'error' ? 'border-red-500/40' : ''}
              ${item.status === 'idle' || item.status === 'uploading' ? 'border-gray-700' : ''}`}
          >
            <div className='flex flex-col sm:flex-row gap-3.5 sm:gap-4 p-3.5 sm:p-4'>
              {/* Preview de la imagen comprimida y delete en movil */}
              <div className='flex items-start justify-between sm:block shrink-0'>
                <div className='relative'>
                  <div
                    className='w-20 sm:w-24 rounded-xl overflow-hidden bg-gray-700 shadow-md border border-gray-700/60'
                    style={{ aspectRatio: '4/5' }}
                  >
                    <img
                      src={item.previewUrl}
                      alt='Preview'
                      className='w-full h-full object-cover'
                    />
                  </div>
                  {/* Badge de compresion */}
                  <div className='absolute -bottom-1 -right-1 bg-gray-950/90 border border-gray-700 rounded-md px-1.5 py-0.5 text-[10px] text-green-400 font-mono'>
                    {item.compressedSizeKB}KB
                  </div>
                </div>

                {/* Boton eliminar visible en móvil */}
                {item.status === 'idle' && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className='text-gray-500 hover:text-red-400 p-1.5 sm:hidden transition-colors rounded-lg bg-gray-750/30'
                    title='Eliminar de la lista'
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Formulario del producto */}
              <div className='flex-1 min-w-0 space-y-3'>
                {item.status === 'done' ? (
                  // Estado: guardado
                  <div className='flex items-center gap-2 py-3'>
                    <CheckCircle size={20} className='text-green-400 shrink-0' />
                    <div>
                      <p className='text-gray-100 font-medium text-sm'>{item.name}</p>
                      <p className='text-gray-500 text-xs'>Publicado en la tienda ✓</p>
                    </div>
                  </div>
                ) : item.status === 'error' ? (
                  // Estado: error
                  <div className='flex items-center gap-2 py-3'>
                    <AlertCircle size={20} className='text-red-400 shrink-0' />
                    <div>
                      <p className='text-gray-100 font-medium text-sm'>{item.name}</p>
                      <p className='text-red-400 text-xs'>{item.error}</p>
                    </div>
                  </div>
                ) : item.status === 'uploading' ? (
                  // Estado: subiendo
                  <div className='flex items-center gap-2 py-3'>
                    <Loader2 size={20} className='text-brand-400 animate-spin shrink-0' />
                    <p className='text-gray-300 text-sm'>Publicando {item.name}...</p>
                  </div>
                ) : (
                  // Estado: formulario editable
                  <>
                    {/* Nombre */}
                    <div>
                      <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1'>
                        Nombre de la prenda
                      </label>
                      <input
                        type='text'
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder='Ej: Vestido Estampado Seda'
                        className='form-input text-sm py-2 sm:py-2.5'
                      />
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3'>
                      {/* Precio */}
                      <div>
                        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1'>
                          Precio (COP)
                        </label>
                        <input
                          type='number'
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                          placeholder='Ej: 85000'
                          min='0'
                          step='100'
                          className='form-input text-sm py-2 sm:py-2.5'
                        />
                      </div>

                      {/* Categoria */}
                      <div>
                        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1'>
                          Categoría
                        </label>
                        <select
                          value={item.categoryId}
                          onChange={(e) => updateItem(item.id, 'categoryId', e.target.value)}
                          className='form-input text-sm py-2 sm:py-2.5 bg-gray-800'
                        >
                          <option value=''>Sin categoría</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Tallas */}
                    <div>
                      <p className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5'>
                        Tallas disponibles *
                      </p>
                      <div className='flex flex-wrap gap-1.5'>
                        {ALL_SIZES.map((size) => (
                          <button
                            key={size}
                            type='button'
                            onClick={() => toggleSize(item.id, size)}
                            className={`size-chip !py-1 !px-2.5 ${
                              item.sizes.includes(size)
                                ? 'size-chip-active'
                                : 'size-chip-inactive'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      {item.sizes.length === 0 && (
                        <p className='text-red-400/80 text-xs mt-1'>
                          * Selecciona al menos una talla para publicar
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Boton eliminar en desktop */}
              {item.status === 'idle' && (
                <button
                  onClick={() => removeItem(item.id)}
                  className='text-gray-500 hover:text-red-400 transition-colors self-start p-1.5 shrink-0 hidden sm:block rounded-lg hover:bg-gray-700/50'
                  title='Eliminar de la lista'
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Info de compresion */}
            {item.status === 'idle' && (
              <div className='bg-gray-900/50 border-t border-gray-700/50 px-4 py-2 flex items-center gap-3 text-xs text-gray-600'>
                <span>Original: {item.originalSizeKB}KB</span>
                <span>→</span>
                <span className='text-green-400'>
                  Comprimida: {item.compressedSizeKB}KB (WebP 4:5)
                </span>
                <span className='ml-auto text-gray-700'>
                  Ahorro: {Math.round((1 - item.compressedSizeKB / item.originalSizeKB) * 100)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BatchUpload
