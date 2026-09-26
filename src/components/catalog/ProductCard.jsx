import { useState, useMemo } from 'react'
import {
  ShoppingBag, Check, Flame, Star, ZoomIn, Sparkles,
  MessageCircle, Share2, ChevronLeft, ChevronRight, Images
} from 'lucide-react'
import StockBadge from '../shared/StockBadge'
import ImageZoomModal from '../shared/ImageZoomModal'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import { openWhatsAppCheckout } from '../../lib/whatsapp'
import toast from 'react-hot-toast'

const ProductCard = ({ product }) => {
  const { addItem, setIsOpen } = useCart()
  const { settings } = useStore()
  const [selectedSize, setSelectedSize] = useState(
    product?.sizes?.length === 1 ? product.sizes[0] : null
  )
  const [imgError, setImgError] = useState(false)
  const [highlightSize, setHighlightSize] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(null)

  const currencySymbol = settings?.currency_symbol || '$'

  // Extract all available photos for this product
  const productImages = useMemo(() => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images.filter(Boolean)
    }
    return product?.image_url ? [product.image_url] : []
  }, [product?.images, product?.image_url])

  const currentImageUrl = productImages[activeImageIndex] || product?.image_url

  // Mobile swipe gestures
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX)
    }
  }

  const handleTouchEnd = (e) => {
    if (touchStartX === null || !e.changedTouches || e.changedTouches.length === 0) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX
    if (Math.abs(diff) > 35 && productImages.length > 1) {
      if (diff > 0) {
        // Swipe left -> next image
        setActiveImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0))
      } else {
        // Swipe right -> prev image
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1))
      }
    }
    setTouchStartX(null)
  }

  const handlePrevImage = (e) => {
    e.stopPropagation()
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1))
  }

  const handleNextImage = (e) => {
    e.stopPropagation()
    setActiveImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0))
  }

  // Detectar si la prenda es recién llegada (subida en los últimos 7 días)
  const isNewArrival = useMemo(() => {
    if (!product?.created_at) return false
    try {
      const createdTime = product.created_at?.toDate
        ? product.created_at.toDate().getTime()
        : product.created_at?.seconds
        ? product.created_at.seconds * 1000
        : new Date(product.created_at).getTime()

      if (isNaN(createdTime)) return false
      const diffMs = Date.now() - createdTime
      return diffMs >= 0 && diffMs < 7 * 24 * 60 * 60 * 1000
    } catch {
      return false
    }
  }, [product?.created_at])

  const hasPromo = product?.is_on_sale && product?.original_price > product?.price
  const discount = hasPromo
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0
  const savings = hasPromo ? product.original_price - product.price : 0

  const handleAddToCart = () => {
    if (!selectedSize) {
      setHighlightSize(true)
      setTimeout(() => setHighlightSize(false), 800)
      toast.error('Elige una talla o medida para continuar', {
        id: `size-required-${product.id}`,
        icon: '📏',
      })
      return
    }

    addItem(product, selectedSize, false)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2200)

    toast.success(
      (t) => (
        <div className='flex items-center justify-between gap-3 text-sm'>
          <span>
            <b>{product.name}</b> ({selectedSize}) agregado
          </span>
          <button
            onClick={() => {
              toast.dismiss(t.id)
              setIsOpen(true)
            }}
            className='underline text-brand-300 font-bold hover:text-white shrink-0 ml-2'
          >
            Ver bolsa 🛍️
          </button>
        </div>
      ),
      { icon: '🛍️', duration: 4000 }
    )
  }

  // Compra directa e inmediata por WhatsApp
  const handleDirectWhatsApp = (e) => {
    e.stopPropagation()
    const sizeToUse = selectedSize || (product?.sizes?.length === 1 ? product.sizes[0] : null)
    if (!sizeToUse && product?.sizes?.length > 1) {
      setHighlightSize(true)
      setTimeout(() => setHighlightSize(false), 800)
      toast.error('Elige tu talla antes de pedir por WhatsApp', { icon: '📏' })
      return
    }

    try {
      openWhatsAppCheckout(
        [
          {
            product,
            size: sizeToUse || 'Única',
            quantity: 1,
          },
        ],
        settings
      )
      toast.success('¡Abriendo WhatsApp para tu pedido! 🎉')
    } catch (err) {
      toast.error(err.message || 'Error al conectar con WhatsApp')
    }
  }

  // Compartir enlace directo de la prenda
  const handleShare = async (e) => {
    e.stopPropagation()
    const storeTitle = settings?.store_name || 'Boutique'
    const shareText = `¡Mira este(a) ${product.name} en ${storeTitle}! ${currencySymbol}${Number(product.price).toLocaleString('es-CO')}`
    const shareUrl = `${window.location.origin}/#product-${product.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      toast.success('¡Enlace de la prenda copiado!', { icon: '📋' })
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  return (
    <article
      className={`product-card group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
        selectedSize
          ? 'bg-gray-900/90 border-2 border-brand-500 shadow-2xl shadow-brand-500/25 ring-2 ring-brand-500/30 -translate-y-1'
          : 'bg-gray-900/60 border border-gray-800/80 hover:border-brand-500/40 hover:-translate-y-1'
      }`}
      id={`product-${product.id}`}
    >
      {/* 4:5 Aspect Ratio Image Container with Interactive Zoom Trigger & Swipe Carousel */}
      <div
        onClick={() => setShowZoom(true)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className='relative overflow-hidden bg-gray-900 cursor-pointer select-none group/img'
        style={{ aspectRatio: '4/5' }}
        title='Toca para ampliar y ver todas las fotos en HD'
      >
        {!imgError && currentImageUrl ? (
          <img
            key={currentImageUrl}
            src={currentImageUrl}
            alt={product.name}
            className='w-full h-full object-cover transition-transform duration-500 ease-out group-hover/img:scale-105 select-none pointer-events-none'
            loading='lazy'
            draggable={false}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className='w-full h-full flex flex-col items-center justify-center bg-gray-800/50 text-gray-500'>
            <span className='text-4xl mb-2'>👗</span>
            <span className='text-xs'>Imagen no disponible</span>
          </div>
        )}

        {/* Subtle bottom gradient overlay for contrast */}
        <div className='absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-950/80 to-transparent pointer-events-none' />

        {/* Stock status badge */}
        <div className='absolute top-2.5 left-2.5 z-10'>
          <StockBadge status={product.stock_status} />
        </div>

        {/* Multi-photo counter badge (e.g. 1/3) */}
        {productImages.length > 1 && (
          <div className='absolute top-2.5 left-1/2 -translate-x-1/2 z-10 bg-gray-950/80 backdrop-blur-md border border-gray-700/80 px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-200 shadow-md flex items-center gap-1 select-none pointer-events-none'>
            <Images size={11} className='text-brand-400' />
            <span>{activeImageIndex + 1}/{productImages.length}</span>
          </div>
        )}

        {/* Carousel Navigation Arrows on Desktop / Hover */}
        {productImages.length > 1 && (
          <>
            <button
              type='button'
              onClick={handlePrevImage}
              className='absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-gray-950/75 hover:bg-brand-600 text-white backdrop-blur-md border border-gray-700/80 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all active:scale-90 shadow-md cursor-pointer'
              title='Foto anterior'
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type='button'
              onClick={handleNextImage}
              className='absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-gray-950/75 hover:bg-brand-600 text-white backdrop-blur-md border border-gray-700/80 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all active:scale-90 shadow-md cursor-pointer'
              title='Siguiente foto'
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Promotional / Top featured / New arrival badges */}
        <div className='absolute top-2.5 right-2.5 z-10 flex flex-wrap justify-end gap-1.5 animate-scale-in max-w-[70%]'>
          {isNewArrival && (
            <span
              className='inline-flex items-center gap-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-lg shadow-purple-600/30 uppercase tracking-wider select-none border border-violet-400/40'
              title='Prenda de la nueva colección'
            >
              <Sparkles size={11} className='text-amber-300 fill-current animate-pulse' />
              <span>Nuevo</span>
            </span>
          )}

          {hasPromo && (
            <span className='inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-lg shadow-pink-500/30 uppercase tracking-wider select-none'>
              <Flame size={12} className='fill-current' />
              -{discount}% OFF
            </span>
          )}

          {product?.is_featured && !hasPromo && (
            <span
              className='inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-gray-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-lg shadow-amber-500/25 uppercase tracking-wider select-none'
              title='Prenda destacada'
            >
              <Star size={11} className='fill-current' />
              <span>Top</span>
            </span>
          )}
        </div>

        {/* Selected size indicator badge */}
        {selectedSize && (
          <div className='absolute bottom-3 left-2.5 z-10 animate-scale-in'>
            <span className='inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-600 via-purple-600 to-pink-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-xl shadow-brand-500/40 border border-brand-300/80'>
              <Check size={13} className='text-white stroke-[3]' />
              <span>Talla {selectedSize}</span>
            </span>
          </div>
        )}

        {/* Pagination Dots */}
        {productImages.length > 1 && (
          <div className='absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none'>
            {productImages.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeImageIndex
                    ? 'w-4 bg-brand-400 shadow-md'
                    : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Floating HD Zoom trigger button */}
        <div
          className='absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-gray-950/80 hover:bg-brand-600 text-gray-200 hover:text-white border border-gray-700/80 hover:border-brand-400 backdrop-blur-md flex items-center justify-center shadow-xl transition-all active:scale-90 opacity-90 sm:opacity-0 sm:group-hover/img:opacity-100 transition-opacity'
          title='Ver en detalle / Zoom HD'
        >
          <ZoomIn size={15} />
        </div>
      </div>

      {/* Product details and purchase options */}
      <div className='flex flex-col flex-1 p-3.5 sm:p-4 gap-3'>
        <div>
          <h3
            onClick={() => setShowZoom(true)}
            className='text-gray-100 font-medium text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors cursor-pointer'
            title='Toca para ver prenda con zoom HD'
          >
            {product.name}
          </h3>

          {/* Pricing: Promotional Strikethrough vs Current Price */}
          <div className='flex items-baseline flex-wrap gap-2 mt-1.5'>
            <span
              className={`font-bold text-lg sm:text-xl font-sans tracking-tight tabular-nums ${
                hasPromo ? 'text-pink-400' : 'text-brand-400'
              }`}
            >
              {currencySymbol}{Number(product.price).toLocaleString('es-CO')}
            </span>

            {hasPromo && (
              <span className='text-gray-500 text-xs sm:text-sm line-through font-normal tabular-nums'>
                {currencySymbol}{Number(product.original_price).toLocaleString('es-CO')}
              </span>
            )}
          </div>

          {hasPromo && (
            <p className='text-[11px] text-pink-400/90 font-medium mt-0.5'>
              Ahorras {currencySymbol}{Number(savings).toLocaleString('es-CO')} COP
            </p>
          )}

          {/* Urgency ticker for low stock */}
          {product.stock_status === 'low_stock' && (
            <div className='flex items-center gap-1.5 mt-2 py-1 px-2 rounded-lg bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/25 text-amber-300 text-[11px] font-semibold'>
              <Flame size={12} className='text-amber-400 fill-current shrink-0 animate-pulse' />
              <span>¡Alta demanda! Quedan pocas unidades</span>
            </div>
          )}
        </div>

        {/* Size / Measurement interactive chips */}
        {product.sizes && product.sizes.length > 0 && (
          <div className={`transition-all duration-300 ${highlightSize ? 'scale-[1.02] bg-brand-500/10 p-1.5 rounded-xl border border-brand-500/40' : ''}`}>
            <div className='flex items-center justify-between mb-1.5'>
              <span className='text-gray-500 text-[11px] uppercase tracking-wider font-semibold'>
                {selectedSize ? `Selección: ${selectedSize}` : 'Elige talla o medida'}
              </span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {product.sizes.map((size) => {
                const isSelected = selectedSize === size
                return (
                  <button
                    key={size}
                    type='button'
                    id={`size-${product.id}-${size}`}
                    onClick={() => setSelectedSize(isSelected && product.sizes.length > 1 ? null : size)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-95 touch-manipulation ${
                      isSelected
                        ? 'bg-gradient-to-r from-brand-600 via-purple-600 to-brand-500 text-white border-brand-300 shadow-lg shadow-brand-500/40 scale-105 ring-2 ring-brand-400/50'
                        : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:border-brand-400/80 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <span>{size}</span>
                    {isSelected && <Check size={12} className='text-white stroke-[3]' />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Unified action buttons row: Add to cart + Direct WhatsApp + Share */}
        <div className='mt-auto flex items-center gap-2 pt-1'>
          <button
            onClick={handleAddToCart}
            id={`add-to-cart-${product.id}`}
            className={`flex-1 py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]'
                : selectedSize
                ? 'bg-gradient-to-r from-brand-600 via-purple-600 to-brand-500 hover:from-brand-500 hover:to-purple-500 text-white shadow-xl shadow-brand-500/30 ring-1 ring-brand-400/40 active:scale-[0.98]'
                : 'bg-gray-800 hover:bg-gray-700/80 text-gray-200 border border-gray-700 active:scale-[0.98]'
            }`}
          >
            {justAdded ? (
              <>
                <Check size={16} className='text-emerald-200 animate-scale-in' />
                <span className='font-bold'>¡Agregado!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={15} className={selectedSize ? 'text-white' : 'text-gray-400'} />
                <span>
                  {selectedSize ? `Agregar • ${selectedSize}` : 'Agregar a la bolsa'}
                </span>
              </>
            )}
          </button>

          {/* Quick Direct WhatsApp checkout button */}
          <button
            type='button'
            onClick={handleDirectWhatsApp}
            className='p-2.5 sm:py-3 sm:px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 hover:border-emerald-400 text-emerald-400 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 active:scale-95 cursor-pointer'
            title='Pedir directamente por WhatsApp'
          >
            <MessageCircle size={16} />
            <span className='hidden sm:inline'>Pedir ya</span>
          </button>

          {/* Share button */}
          <button
            type='button'
            onClick={handleShare}
            className='p-2.5 sm:p-3 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-200 rounded-xl transition-all flex items-center justify-center shrink-0 active:scale-95 cursor-pointer'
            title='Compartir enlace de esta prenda'
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>

      {/* Previsualizador y Zoom interactivo estilo Shein con todas las fotos */}
      <ImageZoomModal
        isOpen={showZoom}
        onClose={() => setShowZoom(false)}
        images={productImages.map((url) => ({ url, name: product.name, product }))}
        initialIndex={activeImageIndex}
        isAdmin={false}
      />
    </article>
  )
}

export default ProductCard
