import { useState, useEffect, useRef } from 'react'
import {
  X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight,
  Crop, Sparkles, Flame, ShoppingBag, MessageCircle, Check
} from 'lucide-react'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import toast from 'react-hot-toast'

const ZOOM_LEVELS = [1, 1.5, 2, 2.75]

const ImageZoomModal = ({
  isOpen,
  onClose,
  images = [], // Array de objetos { url, name, sizeKB, product } o strings
  initialIndex = 0,
  isAdmin = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoomIndex, setZoomIndex] = useState(0) // índice en ZOOM_LEVELS
  const [showCropFrame, setShowCropFrame] = useState(true) // Guía ratio 4:5 estilo Shein
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedSize, setSelectedSize] = useState(null)

  const { addItem, setIsOpen: setCartOpen } = useCart()
  const { settings } = useStore()
  const sym = settings?.currency_symbol || '$'

  const containerRef = useRef(null)

  // Sincronizar índice inicial cuando se abre
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setZoomIndex(0)
      setPosition({ x: 0, y: 0 })
      setSelectedSize(null)
    }
  }, [isOpen, initialIndex])

  // Controles de teclado: Escape, flechas izquierda/derecha
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
  }, [isOpen, currentIndex, images.length, zoomIndex])

  if (!isOpen || images.length === 0) return null

  const currentItem = images[currentIndex]
  const currentUrl = typeof currentItem === 'string' ? currentItem : currentItem.url
  const currentName = typeof currentItem === 'string' ? '' : currentItem.name || ''
  const currentSizeKB = typeof currentItem === 'string' ? null : currentItem.sizeKB
  const product = typeof currentItem === 'object' && currentItem.product ? currentItem.product : null

  const currentZoom = ZOOM_LEVELS[zoomIndex]

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1))
  }

  const handleZoomOut = () => {
    setZoomIndex((prev) => {
      const next = Math.max(prev - 1, 0)
      if (next === 0) setPosition({ x: 0, y: 0 })
      return next
    })
  }

  const resetZoom = () => {
    setZoomIndex(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleDoubleClick = () => {
    if (zoomIndex === 0) {
      setZoomIndex(2) // 2x zoom
    } else {
      resetZoom()
    }
  }

  const handlePrev = () => {
    resetZoom()
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = () => {
    resetZoom()
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  // Soporte de arrastre (Pan) cuando hay zoom activo
  const handleMouseDown = (e) => {
    if (currentZoom === 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || currentZoom === 1) return
    const maxOffset = (currentZoom - 1) * 300
    const newX = Math.max(-maxOffset, Math.min(maxOffset, e.clientX - dragStart.x))
    const newY = Math.max(-maxOffset, Math.min(maxOffset, e.clientY - dragStart.y))
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Acción rápida de compra estilo Shein / Zara si se está viendo un producto del catálogo
  const handleQuickAdd = () => {
    if (!product) return
    const sizeToUse = selectedSize || (product.sizes?.length === 1 ? product.sizes[0] : null)
    if (!sizeToUse && product.sizes?.length > 0) {
      toast.error('Selecciona una talla primero', { icon: '📏' })
      return
    }
    addItem(product, sizeToUse || 'Única')
    toast.success(`"${product.name}" agregado a tu bolsa`, { icon: '🛍️' })
    onClose()
    setCartOpen(true)
  }

  return (
    <div
      className='fixed inset-0 z-50 flex flex-col bg-gray-950/98 backdrop-blur-2xl text-gray-100 select-none animate-fade-in'
      onClick={onClose}
    >
      {/* 1. Barra Superior de Control de Lujo */}
      <header
        className='relative z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gray-950/80 border-b border-gray-800/80'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lado izquierdo: Título / Contador de fotos */}
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold'>
            <Sparkles size={13} className='text-brand-400' />
            <span>Previsualizador HD</span>
          </div>

          {images.length > 1 && (
            <span className='text-xs font-medium text-gray-400 font-sans'>
              {currentIndex + 1} de {images.length} fotos
            </span>
          )}

          {currentName && (
            <span className='text-xs font-semibold text-gray-200 hidden sm:inline max-w-xs truncate'>
              · {currentName}
            </span>
          )}
        </div>

        {/* Lado derecho: Herramientas de Zoom, Marco 4:5 y Cerrar */}
        <div className='flex items-center gap-2'>
          {/* Botón Alternar Guía 4:5 (Boutique Frame) */}
          <button
            type='button'
            onClick={() => setShowCropFrame(!showCropFrame)}
            title='Alternar simulador de encuadre 4:5 de la tienda'
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border ${
              showCropFrame
                ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Crop size={15} />
            <span className='hidden md:inline'>Marco 4:5</span>
          </button>

          {/* Grupo de Controles de Zoom */}
          <div className='flex items-center bg-gray-900 border border-gray-800 rounded-xl p-0.5'>
            <button
              type='button'
              onClick={handleZoomOut}
              disabled={zoomIndex === 0}
              title='Alejar (-)'
              className='p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors rounded-lg'
            >
              <ZoomOut size={16} />
            </button>

            <button
              type='button'
              onClick={resetZoom}
              title='Restablecer 100%'
              className='px-2 py-1 text-xs font-semibold font-mono text-brand-300 hover:text-brand-200 transition-colors'
            >
              {currentZoom}x
            </button>

            <button
              type='button'
              onClick={handleZoomIn}
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              title='Acercar (+)'
              className='p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors rounded-lg'
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
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {/* Botón Cerrar */}
          <button
            type='button'
            onClick={onClose}
            title='Cerrar (Esc)'
            className='p-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition-colors ml-1'
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* 2. Área Central Panorámica con Imagen y Zoom */}
      <main
        ref={containerRef}
        className='relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6'
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: currentZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Marco de recorte 4:5 estilo Boutique (Simulador de Catálogo) */}
        <div
          className={`relative flex items-center justify-center transition-all duration-300 ${
            showCropFrame
              ? 'border-2 border-brand-500/40 rounded-3xl shadow-2xl shadow-brand-500/10 overflow-hidden'
              : ''
          }`}
          style={{
            height: 'min(78vh, 680px)',
            aspectRatio: showCropFrame ? '4/5' : 'auto',
          }}
          onDoubleClick={handleDoubleClick}
        >
          {/* Imagen con transformaciones suaves de zoom y paneo */}
          <img
            src={currentUrl}
            alt={currentName || 'Previsualización'}
            draggable={false}
            className='max-h-full max-w-full object-contain transition-transform duration-150 select-none'
            style={{
              transform: `scale(${currentZoom}) translate(${position.x / currentZoom}px, ${position.y / currentZoom}px)`,
              transformOrigin: 'center center',
            }}
          />

          {/* Indicador de encuadre móvil Shein en las esquinas */}
          {showCropFrame && (
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

          {/* Hint de doble clic / arrastre */}
          {currentZoom === 1 && (
            <div className='absolute bottom-3 bg-gray-950/80 border border-gray-800 text-gray-400 text-[11px] px-3 py-1 rounded-full pointer-events-none backdrop-blur-md hidden sm:block'>
              💡 Doble clic para zoom · Rueda o botones +/- para ampliar
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
            title='Foto anterior (←)'
            className='absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-200 flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-90 z-20'
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
            title='Foto siguiente (→)'
            className='absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-200 flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-90 z-20'
          >
            <ChevronRight size={22} />
          </button>
        )}
      </main>

      {/* 3. Barra Inferior Estilo Shein: Información y Compra Rápida o Ficha de Optimización */}
      <footer
        className='relative z-20 bg-gray-950/90 border-t border-gray-800/80 px-4 sm:px-6 py-3'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3'>
          {/* Si estamos en vista de producto (Cliente o Admin) */}
          {product ? (
            <>
              <div className='flex items-center gap-3 w-full sm:w-auto'>
                <div>
                  <h4 className='text-gray-100 font-semibold text-sm sm:text-base'>
                    {product.name}
                  </h4>
                  <div className='flex items-center gap-2 mt-0.5'>
                    <span className='text-brand-400 font-bold text-base sm:text-lg'>
                      {sym}{Number(product.price).toLocaleString('es-CO')}
                    </span>
                    {product.is_on_sale && product.original_price > product.price && (
                      <span className='text-gray-500 text-xs line-through'>
                        {sym}{Number(product.original_price).toLocaleString('es-CO')}
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

              {/* Selector de tallas y botón de compra directa estilo Shein */}
              <div className='flex items-center gap-3 w-full sm:w-auto justify-end'>
                {product.sizes && product.sizes.length > 0 && (
                  <div className='flex items-center gap-1 overflow-x-auto no-scrollbar py-1'>
                    {product.sizes.map((sz) => (
                      <button
                        key={sz}
                        type='button'
                        onClick={() => setSelectedSize(sz)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          selectedSize === sz
                            ? 'bg-brand-600 border-brand-500 text-white'
                            : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type='button'
                  onClick={handleQuickAdd}
                  className='btn-primary py-2.5 px-5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-brand-500/20'
                >
                  <ShoppingBag size={15} />
                  <span>Añadir a la Bolsa</span>
                </button>
              </div>
            </>
          ) : (
            /* Vista de Subida / Admin: Ficha técnica de compresión */
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
                ✨ Nitidez garantizada para clientes en móvil
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}

export default ImageZoomModal
