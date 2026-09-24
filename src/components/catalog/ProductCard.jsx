import { useState } from 'react'
import { ShoppingBag, Check, Flame, Star, ZoomIn } from 'lucide-react'
import StockBadge from '../shared/StockBadge'
import ImageZoomModal from '../shared/ImageZoomModal'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
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

  const currencySymbol = settings?.currency_symbol || '$'

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

  return (
    <article
      className={`product-card group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
        selectedSize
          ? 'bg-gray-900/90 border-2 border-brand-500 shadow-2xl shadow-brand-500/25 ring-2 ring-brand-500/30 -translate-y-1'
          : 'bg-gray-900/60 border border-gray-800/80 hover:border-brand-500/40 hover:-translate-y-1'
      }`}
      id={`product-${product.id}`}
    >
      {/* Contenedor de Imagen con ratio 4:5 y Zoom Interactivo al tocar */}
      <div
        onClick={() => setShowZoom(true)}
        className='relative overflow-hidden bg-gray-900 cursor-pointer select-none'
        style={{ aspectRatio: '4/5' }}
        title='Toca para ampliar y ver detalles en HD'
      >
        {!imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className='w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105'
            loading='lazy'
            onError={() => setImgError(true)}
          />
        ) : (
          <div className='w-full h-full flex flex-col items-center justify-center bg-gray-800/50 text-gray-500'>
            <span className='text-4xl mb-2'>👗</span>
            <span className='text-xs'>Imagen no disponible</span>
          </div>
        )}

        {/* Degradado sutil inferior en la imagen para mayor contraste */}
        <div className='absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-950/80 to-transparent pointer-events-none' />

        {/* Badge de stock sobre la imagen */}
        <div className='absolute top-2.5 left-2.5 z-10'>
          <StockBadge status={product.stock_status} />
        </div>

        {/* Badges flotantes en la esquina superior derecha: Oferta y/o Destacado */}
        <div className='absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 animate-scale-in'>
          {hasPromo && (
            <span className='inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-lg shadow-pink-500/30 uppercase tracking-wider select-none'>
              <Flame size={12} className='fill-current' />
              -{discount}% OFF
            </span>
          )}

          {product?.is_featured && (
            <span
              className='inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-gray-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-lg shadow-amber-500/25 uppercase tracking-wider select-none'
              title='Prenda destacada'
            >
              <Star size={11} className='fill-current' />
              <span className={hasPromo ? 'hidden sm:inline' : 'inline'}>Top</span>
            </span>
          )}
        </div>

        {/* Badge inferior de Prenda Seleccionada cuando se escoge una talla */}
        {selectedSize && (
          <div className='absolute bottom-2.5 left-2.5 z-10 animate-scale-in'>
            <span className='inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-600 via-purple-600 to-pink-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-xl shadow-brand-500/40 border border-brand-300/80'>
              <Check size={13} className='text-white stroke-[3]' />
              <span>Talla {selectedSize}</span>
            </span>
          </div>
        )}

        {/* Botón flotante para ver en detalle / Zoom estilo Shein */}
        <div
          className='absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-gray-950/80 hover:bg-brand-600 text-gray-200 hover:text-white border border-gray-700/80 hover:border-brand-400 backdrop-blur-md flex items-center justify-center shadow-xl transition-all active:scale-90 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'
          title='Ver en detalle / Zoom HD'
        >
          <ZoomIn size={15} />
        </div>
      </div>

      {/* Informacion del producto */}
      <div className='flex flex-col flex-1 p-3.5 sm:p-4 gap-3'>
        <div>
          <h3
            onClick={() => setShowZoom(true)}
            className='text-gray-100 font-medium text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors cursor-pointer'
            title='Toca para ver prenda con zoom HD'
          >
            {product.name}
          </h3>

          {/* Precios: Antes y Ahora si está en promoción */}
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

          {/* Micro-tira de Urgencia estilo Shein */}
          {product.stock_status === 'low_stock' && (
            <div className='flex items-center gap-1.5 mt-2 py-1 px-2 rounded-lg bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/25 text-amber-300 text-[11px] font-semibold'>
              <Flame size={12} className='text-amber-400 fill-current shrink-0 animate-pulse' />
              <span>¡Alta demanda! Quedan pocas unidades</span>
            </div>
          )}
        </div>

        {/* Selector de tallas o medidas */}
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

        {/* Boton de agregar al carrito unificado y responsive */}
        <button
          onClick={handleAddToCart}
          id={`add-to-cart-${product.id}`}
          className={`mt-auto w-full py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
            justAdded
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]'
              : selectedSize
              ? 'bg-gradient-to-r from-brand-600 via-purple-600 to-brand-500 hover:from-brand-500 hover:to-purple-500 text-white shadow-xl shadow-brand-500/30 ring-2 ring-brand-400/30 active:scale-[0.98]'
              : 'bg-gray-800 hover:bg-gray-700/80 text-gray-200 border border-gray-700 active:scale-[0.98]'
          }`}
        >
          {justAdded ? (
            <>
              <Check size={16} className='text-emerald-200 animate-scale-in' />
              <span className='font-bold'>¡Agregado a tu bolsa!</span>
            </>
          ) : (
            <>
              <ShoppingBag size={16} className={selectedSize ? 'text-white' : 'text-gray-400'} />
              <span>
                {selectedSize ? `Agregar • ${selectedSize}` : 'Agregar al carrito'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Previsualizador y Zoom interactivo estilo Shein */}
      <ImageZoomModal
        isOpen={showZoom}
        onClose={() => setShowZoom(false)}
        images={[{ url: product.image_url, name: product.name, product }]}
        isAdmin={false}
      />
    </article>
  )
}

export default ProductCard
