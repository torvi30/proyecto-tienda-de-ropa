import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight,
  Crop, Sparkles, Flame, ShoppingBag, MessageCircle, Check,
  Search, Move, ArrowRight
} from 'lucide-react'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import { openWhatsAppCheckout, formatPrice } from '../../lib/whatsapp'
import toast from 'react-hot-toast'

const ZOOM_LEVELS = [1, 1.75, 2.5, 3.5]

const ImageZoomModal = ({
  isOpen,
  onClose,
  images = [], // Array de objetos { url, name, sizeKB, product } o strings
  initialIndex = 0,
  isAdmin = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoomIndex, setZoomIndex] = useState(0) // índice en ZOOM_LEVELS
  const [showCropFrame, setShowCropFrame] = useState(isAdmin) // Guía solo por defecto para admin
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedSize, setSelectedSize] = useState(null)
  const [justAdded, setJustAdded] = useState(false)

  // Modo Lupa Dinámica en Desktop (Magnifier Lens)
  const [lensActive, setLensActive] = useState(true)
  const [lensPos, setLensPos] = useState({ x: 0, y: 0, active: false })

  // Gestos táctiles en móvil (Pinch to zoom)
  const touchStartDistRef = useRef(0)
  const touchStartZoomRef = useRef(1)

  const { addItem, setIsOpen: setCartOpen } = useCart()
  const { settings } = useStore()
  const sym = settings?.currency_symbol || '$'
  const code = settings?.currency_code || 'COP'

  const containerRef = useRef(null)
  const imgRef = useRef(null)

  // Sincronizar índice inicial cuando se abre y bloquear scroll
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setZoomIndex(0)
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
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomIndex((prev) => {
      const next = Math.max(prev - 1, 0)
      if (next === 0) setPosition({ x: 0, y: 0 })
      return next
    })
  }, [])

  const resetZoom = useCallback(() => {
    setZoomIndex(0)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handlePrev = useCallback(() => {
    resetZoom()
    setJustAdded(false)
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length, resetZoom])

  const handleNext = useCallback(() => {
    resetZoom()
    setJustAdded(false)
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length, resetZoom])

  // Controles de teclado: Escape, flechas izquierda/derecha, zoom +/-
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && images.length > 1) handlePrev()
      if (e.key === 'ArrowRight' && images.length > 1) handleNext()
      if (e.key === '+' || e.key === '=') handleZoomIn()
      if (e.key === '-') handleZoomOut()
      if (e.key === '0') resetZoom()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length, handlePrev, handleNext, handleZoomIn, handleZoomOut, resetZoom, onClose])

  if (!isOpen || images.length === 0) return null

  const currentItem = images[currentIndex] || images[0]
  const currentUrl = typeof currentItem === 'string' ? currentItem : currentItem.url
  const currentName = typeof currentItem === 'string' ? '' : currentItem.name || ''
  const currentSizeKB = typeof currentItem === 'string' ? null : currentItem.sizeKB
  const product = typeof currentItem === 'object' && currentItem.product ? currentItem.product : null

  const currentZoom = ZOOM_LEVELS[zoomIndex]

  // Doble click o doble tap para alternar zoom 1x / 2.5x
  const handleToggleZoom = (e) => {
    if (zoomIndex === 0) {
      setZoomIndex(2) // 2.5x zoom
      // Centrar hacia el punto de click si es posible
      if (containerRef.current && e?.clientX) {
        const rect = containerRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left - rect.width / 2
        const clickY = e.clientY - rect.top - rect.height / 2
        setPosition({ x: -clickX * 0.8, y: -clickY * 0.8 })
      }
    } else {
      resetZoom()
    }
  }

  // Soporte de arrastre (Pan) con mouse
  const handleMouseDown = (e) => {
    if (currentZoom === 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e) => {
    // Si hay zoom activo, manejar pan
    if (isDragging && currentZoom > 1) {
      const maxOffset = (currentZoom - 1) * 350
      const newX = Math.max(-maxOffset, Math.min(maxOffset, e.clientX - dragStart.x))
      const newY = Math.max(-maxOffset, Math.min(maxOffset, e.clientY - dragStart.y))
      setPosition({ x: newX, y: newY })
      return
    }

    // Modo Lupa Dinámica (Magnifier Lens) cuando no hay zoom activo y no se está arrastrando
    if (currentZoom === 1 && lensActive && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect()
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100
        setLensPos({
          x: e.clientX,
          y: e.clientY,
          xPercent,
          yPercent,
          active: true,
        })
      } else {
        setLensPos((prev) => ({ ...prev, active: false }))
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Soporte de rueda de ratón para zoom fluido
  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      handleZoomIn()
    } else if (e.deltaY > 0) {
      handleZoomOut()
    }
  }

  // Gestos táctiles para móvil: Pinch to zoom y arrastre táctil
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      touchStartDistRef.current = dist
      touchStartZoomRef.current = currentZoom
    } else if (e.touches.length === 1 && currentZoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const ratio = dist / (touchStartDistRef.current || 1)
      if (ratio > 1.3 && zoomIndex < ZOOM_LEVELS.length - 1) {
        setZoomIndex(Math.min(zoomIndex + 1, ZOOM_LEVELS.length - 1))
        touchStartDistRef.current = dist
      } else if (ratio < 0.75 && zoomIndex > 0) {
        setZoomIndex(Math.max(zoomIndex - 1, 0))
        touchStartDistRef.current = dist
      }
    } else if (e.touches.length === 1 && isDragging && currentZoom > 1) {
      const maxOffset = (currentZoom - 1) * 350
      const newX = Math.max(-maxOffset, Math.min(maxOffset, e.touches[0].clientX - dragStart.x))
      const newY = Math.max(-maxOffset, Math.min(maxOffset, e.touches[0].clientY - dragStart.y))
      setPosition({ x: newX, y: newY })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Acción de compra sin oscurecer la pantalla ni desconectar al usuario
  const handleQuickAdd = () => {
    if (!product) return
    const sizeToUse = selectedSize || (product.sizes?.length === 1 ? product.sizes[0] : null)
    if (!sizeToUse && product.sizes?.length > 0) {
      toast.error('Selecciona una talla para continuar', { icon: '📏' })
      return
    }

    // Agregar al carrito SIN forzar apertura violenta del drawer
    addItem(product, sizeToUse || 'Única', false)
    setJustAdded(true)
    toast.success(`"${product.name}" (${sizeToUse || 'Única'}) agregada a tu bolsa`, {
      icon: '🛍️',
      duration: 3500,
    })
  }

  // Ir directo a WhatsApp para comprar esta prenda
  const handleDirectWhatsApp = () => {
    if (!product) return
    const sizeToUse = selectedSize || (product.sizes?.length === 1 ? product.sizes[0] : null)
    if (!sizeToUse && product.sizes?.length > 0) {
      toast.error('Selecciona una talla primero', { icon: '📏' })
      return
    }
    const singleItem = [{ product, size: sizeToUse || 'Única', quantity: 1 }]
    openWhatsAppCheckout(singleItem, settings)
  }

  return (
    <div
      className='fixed inset-0 z-50 flex flex-col bg-gray-950/95 backdrop-blur-2xl text-gray-100 select-none animate-fade-in'
      onClick={onClose}
    >
      {/* 1. Barra Superior de Control de Lujo */}
      <header
        className='relative z-30 flex items-center justify-between px-3 sm:px-6 py-3 bg-gray-950/80 border-b border-gray-800/80 backdrop-blur-md'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lado izquierdo: Título y Contador */}
        <div className='flex items-center gap-2.5 min-w-0'>
          <div className='flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold shrink-0'>
            <Sparkles size={13} className='text-brand-400' />
            <span className='hidden sm:inline'>Detalle en Alta Definición</span>
            <span className='sm:hidden'>Zoom HD</span>
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

        {/* Lado derecho: Herramientas de Zoom y Cerrar */}
        <div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
          {/* Alternar modo Lupa (solo desktop y si no es admin) */}
          {!isAdmin && (
            <button
              type='button'
              onClick={() => {
                setLensActive(!lensActive)
                resetZoom()
              }}
              title={lensActive ? 'Desactivar lupa flotante' : 'Activar lupa flotante'}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                lensActive
                  ? 'bg-brand-600/20 border-brand-500/40 text-brand-300 shadow-sm'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Search size={14} />
              <span>Modo Lupa</span>
            </button>
          )}

          {/* Guía de corte 4:5 solo si es Admin */}
          {isAdmin && (
            <button
              type='button'
              onClick={() => setShowCropFrame(!showCropFrame)}
              title='Alternar simulador de encuadre 4:5'
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                showCropFrame
                  ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Crop size={15} />
              <span className='hidden md:inline'>Marco 4:5</span>
            </button>
          )}

          {/* Grupo de Controles de Zoom */}
          <div className='flex items-center bg-gray-900 border border-gray-800 rounded-xl p-0.5 shadow-inner'>
            <button
              type='button'
              onClick={handleZoomOut}
              disabled={zoomIndex === 0}
              title='Alejar (-)'
              className='p-1.5 text-gray-400 hover:text-white disabled:opacity-25 disabled:hover:text-gray-400 transition-colors rounded-lg active:scale-95'
            >
              <ZoomOut size={16} />
            </button>

            <button
              type='button'
              onClick={resetZoom}
              title='Restablecer 100%'
              className='px-2 py-0.5 text-xs font-semibold font-mono text-brand-300 hover:text-brand-200 transition-colors select-none'
            >
              {Math.round(currentZoom * 100)}%
            </button>

            <button
              type='button'
              onClick={handleZoomIn}
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              title='Acercar (+)'
              className='p-1.5 text-gray-400 hover:text-white disabled:opacity-25 disabled:hover:text-gray-400 transition-colors rounded-lg active:scale-95'
            >
              <ZoomIn size={16} />
            </button>

            {currentZoom > 1 && (
              <button
                type='button'
                onClick={resetZoom}
                title='Restablecer vista original'
                className='p-1.5 text-gray-400 hover:text-white border-l border-gray-800 transition-colors'
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          {/* Botón Cerrar visible y claro */}
          <button
            type='button'
            onClick={onClose}
            title='Cerrar (Esc)'
            aria-label='Cerrar visor de zoom'
            className='p-2 rounded-xl bg-gray-900 hover:bg-red-500/20 border border-gray-800 hover:border-red-500/40 text-gray-300 hover:text-red-300 transition-all ml-1 active:scale-90 flex items-center justify-center'
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* 2. Área Central con Visor Ultra-HD */}
      <main
        ref={containerRef}
        className='relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6 select-none touch-none'
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false)
          setLensPos((prev) => ({ ...prev, active: false }))
        }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: currentZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'crosshair' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Contenedor de la prenda */}
        <div
          className={`relative flex items-center justify-center transition-all duration-200 ${
            showCropFrame && isAdmin
              ? 'border-2 border-brand-500/40 rounded-3xl shadow-2xl shadow-brand-500/10 overflow-hidden'
              : ''
          }`}
          style={{
            maxHeight: 'min(74vh, 720px)',
            maxWidth: '100%',
            aspectRatio: showCropFrame && isAdmin ? '4/5' : 'auto',
          }}
          onDoubleClick={handleToggleZoom}
        >
          {/* Imagen principal */}
          <img
            ref={imgRef}
            src={currentUrl}
            alt={currentName || 'Prenda en detalle'}
            draggable={false}
            className='max-h-[72vh] max-w-full w-auto object-contain rounded-2xl sm:rounded-3xl shadow-2xl select-none transition-transform duration-100 ease-out pointer-events-none'
            style={{
              transform: `scale(${currentZoom}) translate(${position.x / currentZoom}px, ${position.y / currentZoom}px)`,
              transformOrigin: 'center center',
            }}
          />

          {/* Lente Lupa Flotante de Micro-Detalle (Efecto Shein / Farfetch) */}
          {currentZoom === 1 && lensActive && lensPos.active && (
            <div
              className='pointer-events-none fixed z-40 w-44 h-44 sm:w-56 sm:h-56 rounded-full border-2 border-brand-400 shadow-2xl shadow-brand-500/40 overflow-hidden bg-gray-950 animate-scale-in ring-4 ring-black/40'
              style={{
                left: lensPos.x - (typeof window !== 'undefined' && window.innerWidth < 640 ? 88 : 112),
                top: lensPos.y - (typeof window !== 'undefined' && window.innerWidth < 640 ? 88 : 112),
                backgroundImage: `url(${currentUrl})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '350%',
                backgroundPosition: `${lensPos.xPercent}% ${lensPos.yPercent}%`,
              }}
            >
              {/* Retículo de precisión */}
              <div className='absolute inset-0 flex items-center justify-center opacity-30'>
                <div className='w-full h-[1px] bg-brand-400' />
                <div className='h-full w-[1px] bg-brand-400 absolute' />
              </div>
              <span className='absolute bottom-2 right-2 bg-gray-950/80 px-2 py-0.5 rounded-full text-[10px] font-mono text-brand-300 font-bold border border-brand-500/30'>
                3.5x HD
              </span>
            </div>
          )}

          {/* Marcadores de encuadre para admin */}
          {showCropFrame && isAdmin && (
            <>
              <div className='absolute top-3 left-3 bg-gray-950/80 border border-brand-500/30 text-brand-300 text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none'>
                Ratio 4:5 Catálogo
              </div>
              <div className='absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-400 pointer-events-none' />
              <div className='absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand-400 pointer-events-none' />
              <div className='absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand-400 pointer-events-none' />
              <div className='absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-400 pointer-events-none' />
            </>
          )}

          {/* Indicador de ayuda al usuario en pantalla completa */}
          {currentZoom === 1 && !lensPos.active && (
            <div className='absolute bottom-3 bg-gray-950/80 border border-gray-800 text-gray-300 text-[11px] px-3.5 py-1.5 rounded-full pointer-events-none backdrop-blur-md flex items-center gap-2 shadow-lg'>
              <Move size={12} className='text-brand-400' />
              <span>Doble toque o clic para zoom profundo · Arrastra para explorar la tela</span>
            </div>
          )}
        </div>

        {/* Flecha Anterior */}
        {images.length > 1 && (
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
            title='Prenda anterior (←)'
            className='absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-brand-500/40 text-gray-200 flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-90 z-20'
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Flecha Siguiente */}
        {images.length > 1 && (
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            title='Prenda siguiente (→)'
            className='absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-brand-500/40 text-gray-200 flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-90 z-20'
          >
            <ChevronRight size={22} />
          </button>
        )}
      </main>

      {/* 3. Barra Inferior Estilo Boutique: Detalle y Compra Asistida */}
      <footer
        className='relative z-30 bg-gray-950/95 border-t border-gray-800/80 px-3 sm:px-6 py-3 backdrop-blur-xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='max-w-4xl mx-auto'>
          {product ? (
            <div className='flex flex-col sm:flex-row items-center justify-between gap-3'>
              {/* Información y Precio */}
              <div className='flex items-center justify-between w-full sm:w-auto gap-3'>
                <div>
                  <h4 className='text-gray-100 font-semibold text-sm sm:text-base leading-tight'>
                    {product.name}
                  </h4>
                  <div className='flex items-center gap-2 mt-1'>
                    <span className='text-brand-400 font-bold text-base sm:text-lg tabular-nums'>
                      {formatPrice(product.price, sym, code)}
                    </span>
                    {product.is_on_sale && product.original_price > product.price && (
                      <span className='text-gray-500 text-xs line-through tabular-nums'>
                        {formatPrice(product.original_price, sym, code)}
                      </span>
                    )}
                    {product.is_on_sale && (
                      <span className='text-[10px] font-bold text-pink-400 bg-pink-500/15 border border-pink-500/30 px-1.5 py-0.2 rounded-full'>
                        OFERTA
                      </span>
                    )}
                    {product.stock_status === 'low_stock' && (
                      <span className='text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse'>
                        <Flame size={10} className='fill-current text-amber-400' />
                        ¡Casi agotado!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tallas y Botón de Agregar a la bolsa */}
              <div className='flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end'>
                {product.sizes && product.sizes.length > 0 && (
                  <div className='flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5'>
                    {product.sizes.map((sz) => {
                      const isSelected = selectedSize === sz
                      return (
                        <button
                          key={sz}
                          type='button'
                          onClick={() => setSelectedSize(sz)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-brand-600 border-brand-500 text-white shadow-md shadow-brand-500/25 scale-105'
                              : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {sz}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Si recién agregó la prenda, ofrecer ir a pagar o seguir explorando */}
                {justAdded ? (
                  <div className='flex items-center gap-2 animate-scale-in'>
                    <button
                      type='button'
                      onClick={() => {
                        onClose()
                        setCartOpen(true)
                      }}
                      className='flex items-center gap-1.5 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold py-2 px-3.5 rounded-xl text-xs shadow-lg shadow-brand-500/25 active:scale-95 transition-all'
                    >
                      <ShoppingBag size={14} />
                      <span>Ver mi bolsa</span>
                      <ArrowRight size={13} />
                    </button>
                    <button
                      type='button'
                      onClick={onClose}
                      className='py-2 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-medium'
                    >
                      Seguir explorando
                    </button>
                  </div>
                ) : (
                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      onClick={handleQuickAdd}
                      className='btn-primary py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 active:scale-95'
                    >
                      <ShoppingBag size={14} />
                      <span>{selectedSize ? `Añadir • ${selectedSize}` : 'Añadir a la bolsa'}</span>
                    </button>

                    <button
                      type='button'
                      onClick={handleDirectWhatsApp}
                      title='Pedir directo por WhatsApp'
                      className='p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 transition-colors active:scale-95'
                    >
                      <MessageCircle size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Vista de Subida / Admin: Ficha técnica de compresión WebP */
            <div className='flex items-center justify-between w-full text-xs text-gray-400'>
              <div className='flex items-center gap-3'>
                <span className='flex items-center gap-1.5 text-emerald-400 font-semibold'>
                  <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
                  Formato WebP Optimizado
                </span>
                {currentSizeKB && (
                  <span className='bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-lg text-gray-300 font-mono'>
                    {currentSizeKB} KB
                  </span>
                )}
                <span className='hidden sm:inline text-gray-500'>
                  Resolución 1080×1350 px (4:5)
                </span>
              </div>
              <div className='text-gray-500 text-[11px]'>
                ✨ Máxima nitidez para catálogo móvil
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}

export default ImageZoomModal
