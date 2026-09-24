import { useState, useRef, useCallback } from 'react'
import {
  Upload, X, CheckCircle, AlertCircle, Loader2,
  ImagePlus, Zap, ChevronRight, Plus, ZoomIn, Move
} from 'lucide-react'
import useImageCompressor from '../../hooks/useImageCompressor'
import useCategories from '../../hooks/useCategories'
import { db } from '../../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { uploadToCloudinary } from '../../lib/cloudinary'
import SizeMeasurePicker from './SizeMeasurePicker'
import ImageZoomModal from '../shared/ImageZoomModal'
import toast from 'react-hot-toast'

const MAX_FILES = 20

// Initial state generator for each batch item
const makeItem = (file, previewUrl, compressedSizeKB, originalSizeKB) => ({
  id: crypto.randomUUID(),
  file,
  previewUrl,
  compressedSizeKB,
  originalSizeKB,
  // Form input values
  name: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
  price: '',
  categoryId: '',
  sizes: [],
  // Status lifecycle: idle | uploading | done | error
  status: 'idle',
  error: null,
})

const BatchUpload = ({ onSuccess }) => {
  const [items, setItems] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressProgress, setCompressProgress] = useState({ done: 0, total: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [showNewCatModal, setShowNewCatModal] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [creatingCat, setCreatingCat] = useState(false)
  const [zoomModalItemIndex, setZoomModalItemIndex] = useState(null)
  const fileInputRef = useRef(null)
  const { compressBatch } = useImageCompressor()
  const { categories } = useCategories()

  // Process selected files from picker or drop event
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

  // Drag & drop handlers
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  // Update specific field on batch item
  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  // Toggle sizing selection for a batch item
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

  // Remove a batch item and revoke blob preview URL
  const removeItem = (id) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((i) => i.id !== id)
    })
  }

  // Quick inline category creation
  const handleQuickCreateCategory = async (targetItemId) => {
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

        if (targetItemId) {
          updateItem(targetItemId, 'categoryId', docRef.id)
        }
        toast.success(`Categoría "${trimmed}" creada`)
      }
      setNewCatName('')
      setShowNewCatModal(null)
    } catch (err) {
      console.error(err)
      toast.error('Error al crear categoría')
    } finally {
      setCreatingCat(false)
    }
  }

  // Save and publish entire batch
  const handleSaveAll = async () => {
    // Validate that all items have name, price and at least one size
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
        // 1. Upload compressed WebP image to Cloudinary
        const uploadRes = await uploadToCloudinary(item.file, item.name)
        const imageUrl = uploadRes.secure_url

        // 2. Create document in Firestore
        if (!db) throw new Error('Firestore no está inicializado. Revisa tu archivo .env')

        await addDoc(collection(db, 'products'), {
          name: item.name.trim(),
          price: parseFloat(item.price),
          category_id: item.categoryId || null,
          sizes: item.sizes,
          image_url: imageUrl,
          stock_status: 'available',
          is_visible: true,
          created_at: serverTimestamp(),
        })

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
    } else {
      toast.error('No se pudo publicar ningún producto. Revisa el mensaje de error en cada tarjeta.', {
        duration: 5000,
      })
    }
  }

  const pendingItems = items.filter((i) => i.status === 'idle')
  const doneItems = items.filter((i) => i.status === 'done')
  const canSave = pendingItems.length > 0 && !isSaving

  return (
    <div className='space-y-6'>
      {/* Drag & drop dropzone area */}
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
              {/* Compression progress bar */}
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

      {/* Header counter & publish action button */}
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

      {/* Batch items list */}
      <div className='space-y-4'>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`bg-gray-800/60 border rounded-2xl overflow-hidden transition-all duration-200
              ${item.status === 'done' ? 'border-green-500/40' : ''}
              ${item.status === 'error' ? 'border-red-500/40' : ''}
              ${item.status === 'idle' || item.status === 'uploading' ? 'border-gray-700' : ''}`}
          >
            <div className='flex flex-col sm:flex-row gap-3.5 sm:gap-4 p-3.5 sm:p-4'>
              {/* Compressed image preview with interactive zoom on click */}
              <div className='flex items-start justify-between sm:block shrink-0'>
                <div
                  onClick={() => setZoomModalItemIndex(index)}
                  className='relative cursor-pointer group/thumb'
                  title='Toca para previsualizar, mover y encuadrar foto'
                >
                  <div
                    className='w-20 sm:w-24 rounded-xl overflow-hidden bg-gray-700 shadow-md border border-gray-700/60 transition-transform group-hover/thumb:scale-[1.03]'
                    style={{ aspectRatio: '4/5' }}
                  >
                    <img
                      src={item.previewUrl}
                      alt='Preview'
                      className='w-full h-full object-cover'
                    />
                    {/* Framing / preview overlay */}
                    <div className='absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-[2px]'>
                      <Move size={16} className='text-brand-300' />
                      <span className='text-[10px] font-semibold text-gray-100'>Ajustar</span>
                    </div>
                  </div>
                  {/* Compression size badge */}
                  <div className='absolute -bottom-1 -right-1 bg-gray-950/90 border border-gray-700 rounded-md px-1.5 py-0.5 text-[10px] text-green-400 font-mono'>
                    {item.compressedSizeKB}KB
                  </div>
                </div>

                {/* Mobile remove button */}
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

              {/* Product configuration form */}
              <div className='flex-1 min-w-0 space-y-3'>
                {item.status === 'done' ? (
                  // State: successfully published
                  <div className='flex items-center gap-2 py-3'>
                    <CheckCircle size={20} className='text-green-400 shrink-0' />
                    <div>
                      <p className='text-gray-100 font-medium text-sm'>{item.name}</p>
                      <p className='text-gray-500 text-xs'>Publicado en la tienda ✓</p>
                    </div>
                  </div>
                ) : item.status === 'error' ? (
                  // State: upload error
                  <div className='flex items-center gap-2 py-3'>
                    <AlertCircle size={20} className='text-red-400 shrink-0' />
                    <div>
                      <p className='text-gray-100 font-medium text-sm'>{item.name}</p>
                      <p className='text-red-400 text-xs'>{item.error}</p>
                    </div>
                  </div>
                ) : item.status === 'uploading' ? (
                  // State: actively uploading
                  <div className='flex items-center gap-2 py-3'>
                    <Loader2 size={20} className='text-brand-400 animate-spin shrink-0' />
                    <p className='text-gray-300 text-sm'>Publicando {item.name}...</p>
                  </div>
                ) : (
                  // State: editable form
                  <>
                    {/* Garment name */}
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
                      {/* Price */}
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

                      {/* Category */}
                      <div>
                        <div className='flex items-center justify-between mb-1'>
                          <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider'>
                            Categoría
                          </label>
                          {showNewCatModal !== item.id && (
                            <button
                              type='button'
                              onClick={() => {
                                setShowNewCatModal(item.id)
                                setNewCatName('')
                              }}
                              className='text-brand-400 hover:text-brand-300 text-xs font-medium flex items-center gap-0.5'
                            >
                              <Plus size={12} />
                              <span>+ Nueva</span>
                            </button>
                          )}
                        </div>

                        {showNewCatModal === item.id ? (
                          <div className='flex items-center gap-1.5 animate-fade-in'>
                            <input
                              type='text'
                              value={newCatName}
                              onChange={(e) => setNewCatName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleQuickCreateCategory(item.id)
                                }
                                if (e.key === 'Escape') setShowNewCatModal(null)
                              }}
                              placeholder='Nombre de categoría...'
                              className='form-input text-xs py-2'
                              autoFocus
                            />
                            <button
                              type='button'
                              onClick={() => handleQuickCreateCategory(item.id)}
                              disabled={creatingCat || !newCatName.trim()}
                              className='btn-primary py-2 px-3 text-xs shrink-0'
                            >
                              {creatingCat ? '...' : 'Crear'}
                            </button>
                            <button
                              type='button'
                              onClick={() => setShowNewCatModal(null)}
                              className='p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl text-xs shrink-0'
                              title='Cancelar'
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
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
                        )}
                      </div>
                    </div>

                    {/* Sizing and measurement chips */}
                    <SizeMeasurePicker
                      selected={item.sizes}
                      onChange={(newSizes) => updateItem(item.id, 'sizes', newSizes)}
                    />
                  </>
                )}
              </div>

              {/* Desktop remove button */}
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

            {/* Compression savings summary */}
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

      {/* Interactive 4:5 Photo Framing & Preview Modal */}
      <ImageZoomModal
        isOpen={zoomModalItemIndex !== null}
        onClose={() => setZoomModalItemIndex(null)}
        images={items.map((it) => ({
          url: it.previewUrl,
          name: it.name || 'Prenda en lote',
          sizeKB: it.compressedSizeKB,
          originalFile: it.file,
        }))}
        initialIndex={zoomModalItemIndex || 0}
        isAdmin={true}
        onApplyFrame={(newBlob, newPreviewUrl, newSizeKB) => {
          if (zoomModalItemIndex !== null && items[zoomModalItemIndex]) {
            const targetId = items[zoomModalItemIndex].id
            // Revoke old blob preview URL to keep browser memory clean
            if (items[zoomModalItemIndex].previewUrl) {
              URL.revokeObjectURL(items[zoomModalItemIndex].previewUrl)
            }
            setItems((prev) =>
              prev.map((it) =>
                it.id === targetId
                  ? {
                      ...it,
                      file: new File([newBlob], it.file?.name || 'prenda.webp', { type: 'image/webp' }),
                      previewUrl: newPreviewUrl,
                      compressedSizeKB: newSizeKB,
                    }
                  : it
              )
            )
            toast.success('¡Encuadre de foto guardado con éxito!', { icon: '✨' })
            setZoomModalItemIndex(null)
          }
        }}
      />
    </div>
  )
}

export default BatchUpload
