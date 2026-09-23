import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import StockBadge from '../shared/StockBadge'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import toast from 'react-hot-toast'

const ProductCard = ({ product }) => {
  const { addItem, setIsOpen } = useCart()
  const { settings } = useStore()
  const [selectedSize, setSelectedSize] = useState(null)
  const [imgError, setImgError] = useState(false)
  const [highlightSize, setHighlightSize] = useState(false)

  const currencySymbol = settings?.currency_symbol || '$'

  const handleAddToCart = () => {
    if (!selectedSize) {
      setHighlightSize(true)
      setTimeout(() => setHighlightSize(false), 800)
      toast.error('Elige una talla para continuar', {
        id: `size-required-${product.id}`,
        icon: '📏',
      })
      return
    }

    addItem(product, selectedSize)
    toast.success(
      (t) => (
        <div className='flex items-center justify-between gap-3 text-sm'>
          <span>
            <b>{product.name}</b> (Talla {selectedSize}) agregado
          </span>
          <button
            onClick={() => {
              toast.dismiss(t.id)
              setIsOpen(true)
            }}
            className='underline text-brand-300 font-bold hover:text-white shrink-0'
          >
            Ver carrito
          </button>
        </div>
      ),
      { icon: '🛍️', duration: 3500 }
    )
  }

  return (
    <article
      className='product-card group flex flex-col bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden hover:border-brand-500/40 transition-all duration-300'
      id={`product-${product.id}`}
    >
      {/* Contenedor de Imagen con ratio 4:5 */}
      <div className='relative overflow-hidden bg-gray-900' style={{ aspectRatio: '4/5' }}>
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
      </div>

      {/* Informacion del producto */}
      <div className='flex flex-col flex-1 p-3.5 sm:p-4 gap-3'>
        <div>
          <h3 className='text-gray-100 font-medium text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors'>
            {product.name}
          </h3>
          <div className='flex items-baseline gap-1 mt-1'>
            <span className='text-brand-400 font-bold text-lg sm:text-xl font-sans tracking-tight'>
              {currencySymbol}{Number(product.price).toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        {/* Selector de tallas */}
        {product.sizes && product.sizes.length > 0 && (
          <div className={`transition-all duration-300 ${highlightSize ? 'scale-[1.02] bg-brand-500/10 p-1.5 rounded-xl border border-brand-500/40' : ''}`}>
            <div className='flex items-center justify-between mb-1.5'>
              <span className='text-gray-500 text-[11px] uppercase tracking-wider font-semibold'>
                {selectedSize ? `Talla: ${selectedSize}` : 'Elige tu talla'}
              </span>
            </div>
            <div className='flex flex-wrap gap-1.5'>
              {product.sizes.map((size) => {
                const isSelected = selectedSize === size
                return (
                  <button
                    key={size}
                    type='button'
                    id={`size-${product.id}-${size}`}
                    onClick={() => setSelectedSize(isSelected ? null : size)}
                    className={`size-chip flex items-center gap-1 ${
                      isSelected ? 'size-chip-active' : 'size-chip-inactive'
                    }`}
                  >
                    {size}
                    {isSelected && <Check size={11} className='text-brand-300' />}
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
            selectedSize
              ? 'btn-primary shadow-lg shadow-brand-500/20'
              : 'bg-gray-800 hover:bg-gray-700/80 text-gray-200 border border-gray-700 active:scale-[0.98]'
          }`}
        >
          <ShoppingBag size={16} className={selectedSize ? 'text-white' : 'text-gray-400'} />
          <span>
            {selectedSize ? `Agregar • Talla ${selectedSize}` : 'Agregar al carrito'}
          </span>
        </button>
      </div>
    </article>
  )
}

export default ProductCard
