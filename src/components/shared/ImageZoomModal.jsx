import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight,
  Sparkles, ShoppingBag, MessageCircle, Check, Move
} from 'lucide-react'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import { openWhatsAppCheckout, formatPrice } from '../../lib/whatsapp'
import toast from 'react-hot-toast'

const ImageZoomModal = ({
  isOpen,
  onClose,
  images = [], // Array of objects { url, name, sizeKB, product, originalFile } or strings
  initialIndex = 0,
  isAdmin = false,
  onApplyFrame = null, // Callback (blob, previewUrl, sizeKB) when admin saves framing
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedSize, setSelectedSize] = useState(null)
  const [justAdded, setJustAdded] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  // Mobile pinch-to-zoom tracking
  const touchStartDistRef = useRef(0)
  const touchStartZoomRef = useRef(1)

  const { addItem, setIsOpen: setCartOpen } = useCart()
  const { settings } = useStore()
  const sym = settings?.currency_symbol || '$'

  const frameRef = useRef(null)
  const imgRef = useRef(null)

  // Sync initial state on open
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setSelectedSize(null)
      setJustAdded(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, initialIndex])

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(3.5, Math.round((prev + 0.25) * 100) / 100))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.8, Math.round((prev - 0.25) * 100) / 100))
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handlePrev = useCallback(() => {
    resetView()
    setJustAdded(false)
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length, resetView])

  const handleNext = useCallback(() => {
    resetView()
    setJustAdded(false)
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length, resetView])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && images.length > 1) handlePrev()
      if (e.key === 'ArrowRight' && images.length > 1) handleNext()
      if (e.key === '+' || e.key === '=') handleZoomIn()
      if (e.key === '-') handleZoomOut()
      if (e.key === '0') resetView()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length, handlePrev, handleNext, handleZoomIn, handleZoomOut, resetView, onClose])

  if (!isOpen || images.length === 0) return null

  const currentItem = images[currentIndex] || images[0]
  const currentUrl = typeof currentItem === 'string' ? currentItem : currentItem.url
  const currentName = typeof currentItem === 'string' ? '' : currentItem.name || ''
  const product = typeof currentItem === 'object' && currentItem.product ? currentItem.product : null

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.15 : -0.15
    setZoom((prev) => Math.min(3.5, Math.max(0.8, Math.round((prev + delta) * 100) / 100)))
  }

  // Touch gesture support: pan and pinch-to-zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      touchStartDistRef.current = dist
      touchStartZoomRef.current = zoom
    } else if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDistRef.current > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const ratio = dist / touchStartDistRef.current
      const nextZoom = Math.min(3.5, Math.max(0.8, touchStartZoomRef.current * ratio))
      setZoom(Math.round(nextZoom * 100) / 100)
    } else if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    touchStartDistRef.current = 0
  }

  // Double click / tap to toggle zoom
  const handleDoubleClick = () => {
    if (zoom === 1) {
      setZoom(1.8)
    } else {
      resetView()
    }
  }

  // Export current visual framing to a new 1080x1350 WebP Blob
  const handleSaveFraming = async () => {
    if (!onApplyFrame) return
    setIsApplying(true)
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = currentUrl

      await new Promise((resolve, reject) => {
        if (img.complete) return resolve()
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1350
      const ctx = canvas.getContext('2d')

      const frameEl = frameRef.current
      const frameRect = frameEl ? frameEl.getBoundingClientRect() : { width: 360, height: 450 }
      const k = 1080 / frameRect.width

      const imgRatio = img.naturalWidth / img.naturalHeight
      const targetRatio = 1080 / 1350

      let baseW, baseH
      if (imgRatio > targetRatio) {
        baseH = 1350
        baseW = 1350 * imgRatio
      } else {
        baseW = 1080
        baseH = 1080 / imgRatio
      }

      const drawW = baseW * zoom
      const drawH = baseH * zoom
      const drawX = (1080 - drawW) / 2 + (position.x * k)
      const drawY = (1350 - drawH) / 2 + (position.y * k)

      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, 1080, 1350)
      ctx.drawImage(img, drawX, drawY, drawW, drawH)

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Error al generar la imagen encuadrada')
          setIsApplying(false)
          return
        }
        const newUrl = URL.createObjectURL(blob)
        const sizeKB = Math.round(blob.size / 1024)
        onApplyFrame(blob, newUrl, sizeKB, currentIndex, currentItem)
        setIsApplying(false)
      }, 'image/webp', 0.85)
    } catch (err) {
      console.error('Error applying frame:', err)
      toast.error('No se pudo aplicar el encuadre')
      setIsApplying(false)
    }
  }

  // Customer: Add to cart
  const handleQuickAdd = () => {
    if (!product) return
    const sizeToUse = selectedSize || (product.sizes?.length === 1 ? product.sizes[0] : (product.sizes?.length ? null : 'Única'))
    if (!sizeToUse) {
      toast.error('Selecciona una talla para continuar', { icon: '📏' })
      return
    }

    addItem(product, sizeToUse, false)
    setJustAdded(true)
    toast.success(`"${product.name}" (${sizeToUse}) agregada a tu bolsa`, {
      icon: '🛍️',
      duration: 3500,
    })
  }

  // Customer: Direct WhatsApp checkout
  const handleDirectWhatsApp = () => {
    if (!product) return
    const sizeToUse = selectedSize || (product.sizes?.length === 1 ? product.sizes[0] : (product.sizes?.length ? null : 'Única'))
    if (!sizeToUse) {
      toast.error('Selecciona una talla primero', { icon: '📏' })
      return
    }
    const singleItem = [{ product, size: sizeToUse, quantity: 1 }]
    openWhatsAppCheckout(singleItem, settings)
  }

  const modalContent = (
    <div
      className='fixed inset-0 z-[9999] flex flex-col bg-gray-950/95 backdrop-blur-2xl text-gray-100 select-none animate-fade-in'
      onClick={onClose}
    >
      {/* 1. Header Toolbar */}
      <header
        className='relative z-30 flex items-center justify-between px-3.5 sm:px-6 py-3 bg-gray-950/90 border-b border-gray-800/80 backdrop-blur-md'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title and metadata */}
        <div className='flex items-center gap-2.5 min-w-0'>
          <div className='flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold shrink-0'>
            <Sparkles size={13} className='text-brand-400' />
            <span>{isAdmin ? 'Vista Previa & Encuadre 4:5' : 'Vista Previa en HD'}</span>
          </div>

          {images.length > 1 && (
            <span className='text-xs font-medium text-gray-400 shrink-0 font-sans'>
              {currentIndex + 1}/{images.length}
            </span>
          )}

          {currentName && (
            <span className='text-xs font-medium text-gray-300 truncate hidden md:inline'>
              · {currentName}
            </span>
          )}
        </div>

        {/* Header Right Actions */}
        <div className='flex items-center gap-2 shrink-0'>
          {/* Apply frame button for admin */}
          {isAdmin && onApplyFrame && (
            <button
              type='button'
              onClick={handleSaveFraming}
              disabled={isApplying}
              className='px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-brand-500/25 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer'
            >
              <Check size={14} />
              <span>{isApplying ? 'Guardando...' : 'Aplicar Encuadre'}</span>
            </button>
          )}

          {/* Close button */}
          <button
            type='button'
            onClick={onClose}
            title='Cerrar (Esc)'
            aria-label='Cerrar vista previa'
            className='p-2 rounded-xl bg-gray-900 hover:bg-red-500/20 border border-gray-800 hover:border-red-500/40 text-gray-300 hover:text-red-300 transition-all active:scale-90 flex items-center justify-center cursor-pointer'
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* 2. Main Central Viewport: 4:5 Framing Area */}
      <main
        className='relative flex-1 flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden select-none'
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Navigation arrows if multiple images */}
        {images.length > 1 && (
          <>
            <button
              type='button'
              onClick={handlePrev}
              className='absolute left-2 sm:left-6 z-20 p-2.5 sm:p-3 rounded-full bg-gray-900/80 hover:bg-gray-800 border border-gray-700/60 text-white shadow-xl backdrop-blur-md transition-all active:scale-90 cursor-pointer'
              title='Anterior'
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type='button'
              onClick={handleNext}
              className='absolute right-2 sm:right-6 z-20 p-2.5 sm:p-3 rounded-full bg-gray-900/80 hover:bg-gray-800 border border-gray-700/60 text-white shadow-xl backdrop-blur-md transition-all active:scale-90 cursor-pointer'
              title='Siguiente'
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* 4:5 Boutique Frame Container */}
        <div
          ref={frameRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          className='relative w-full max-w-[320px] xs:max-w-[360px] sm:max-w-[400px] md:max-w-[420px] aspect-[4/5] rounded-3xl overflow-hidden border-2 border-brand-500/50 shadow-2xl shadow-brand-500/20 bg-gray-950 flex items-center justify-center select-none touch-none ring-1 ring-white/10 cursor-grab active:cursor-grabbing'
          style={{ maxHeight: 'calc(100vh - 210px)' }}
          title='Arrastra con el mouse o dedo para mover la foto · Usa la rueda o el control inferior para acercar o alejar'
        >
          {/* Framed Image */}
          <img
            ref={imgRef}
            src={currentUrl}
            alt={currentName || 'Prenda'}
            draggable={false}
            className='w-full h-full object-cover select-none pointer-events-none transition-transform duration-75 will-change-transform'
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          />

          {/* Composition grid lines (Rule of thirds guide for fashion photo framing) */}
          <div className='absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20'>
            <div className='border-r border-b border-brand-300' />
            <div className='border-r border-b border-brand-300' />
            <div className='border-b border-brand-300' />
            <div className='border-r border-b border-brand-300' />
            <div className='border-r border-b border-brand-300' />
            <div className='border-b border-brand-300' />
            <div className='border-r border-brand-300' />
            <div className='border-r border-brand-300' />
            <div />
          </div>

          {/* Floating frame cues */}
          <div className='absolute top-3 left-3 bg-gray-950/80 backdrop-blur-md border border-gray-700/80 rounded-full px-2.5 py-1 text-[11px] font-medium text-gray-200 flex items-center gap-1.5 shadow-md pointer-events-none'>
            <Sparkles size={12} className='text-brand-400' />
            <span>Formato 4:5 Catálogo</span>
          </div>

          <div className='absolute top-3 right-3 bg-gray-950/80 backdrop-blur-md border border-gray-700/80 rounded-full px-2.5 py-1 text-[11px] font-medium text-brand-300 flex items-center gap-1.5 shadow-md pointer-events-none'>
            <Move size={12} />
            <span>Mover foto</span>
          </div>
        </div>
      </main>

      {/* 3. Bottom Interactive Framing & Zoom Controls */}
      <footer
        className='relative z-30 bg-gray-950/90 border-t border-gray-800/80 backdrop-blur-md px-3.5 sm:px-6 py-3.5'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3'>
          {/* Zoom Slider and - / + Controls */}
          <div className='flex items-center gap-3 w-full sm:w-auto justify-center bg-gray-900/90 border border-gray-800 rounded-2xl px-4 py-2 shadow-inner'>
            {/* Zoom Out Button */}
            <button
              type='button'
              onClick={handleZoomOut}
              disabled={zoom <= 0.8}
              title='Alejar (-)'
              className='p-1.5 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer'
            >
              <ZoomOut size={16} />
            </button>

            {/* Continuous Smooth Zoom Slider */}
            <input
              type='range'
              min='0.8'
              max='3'
              step='0.05'
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              aria-label='Nivel de zoom de la foto'
              className='w-28 xs:w-36 sm:w-44 accent-brand-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg'
            />

            {/* Zoom In Button */}
            <button
              type='button'
              onClick={handleZoomIn}
              disabled={zoom >= 3.5}
              title='Acercar (+)'
              className='p-1.5 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer'
            >
              <ZoomIn size={16} />
            </button>

            {/* Current Zoom Percentage Pill */}
            <span className='min-w-[48px] text-center font-mono text-xs font-bold text-brand-300 bg-brand-500/15 border border-brand-500/30 px-2 py-0.5 rounded-lg'>
              {Math.round(zoom * 100)}%
            </span>

            {/* Reset View Button */}
            {(zoom !== 1 || position.x !== 0 || position.y !== 0) && (
              <button
                type='button'
                onClick={resetView}
                title='Restablecer posición y zoom original'
                className='text-xs text-gray-400 hover:text-white flex items-center gap-1 pl-1 border-l border-gray-700/80 transition-colors cursor-pointer'
              >
                <RotateCcw size={13} />
                <span className='hidden xs:inline'>Centrar</span>
              </button>
            )}
          </div>

          {/* Customer Purchasing Controls (when modal opened from public catalog) */}
          {!isAdmin && product ? (
            <div className='flex items-center gap-2 w-full sm:w-auto justify-end'>
              {product.price && (
                <span className='text-sm font-bold text-brand-300 mr-2 font-sans'>
                  {formatPrice(product.price, sym)}
                </span>
              )}

              {justAdded ? (
                <button
                  type='button'
                  onClick={() => {
                    onClose()
                    setCartOpen(true)
                  }}
                  className='btn-primary py-2 px-3 text-xs font-semibold flex items-center gap-1.5'
                >
                  <ShoppingBag size={14} />
                  <span>Ver Bolsa</span>
                </button>
              ) : (
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={handleQuickAdd}
                    className='btn-primary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95'
                  >
                    <ShoppingBag size={14} />
                    <span>Añadir</span>
                  </button>
                  <button
                    type='button'
                    onClick={handleDirectWhatsApp}
                    title='Pedir por WhatsApp'
                    className='p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 transition-colors active:scale-95 cursor-pointer'
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Admin Mode Info & Help Tag */
            <div className='text-center sm:text-right text-[11px] text-gray-400'>
              <span className='text-gray-300 font-medium'>Tip:</span> Arrastra la foto con el dedo o ratón para centrar la prenda
            </div>
          )}
        </div>
      </footer>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }
  return modalContent
}

export default ImageZoomModal
