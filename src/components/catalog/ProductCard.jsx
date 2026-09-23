import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import StockBadge from '../shared/StockBadge'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import toast from 'react-hot-toast'

const ProductCard = ({ product }) => {
  const { addItem } = useCart()
  const { settings } = useStore()
  const [selectedSize, setSelectedSize] = useState(null)
  const [imgError, setImgError] = useState(false)

  const currencySymbol = settings?.currency_symbol || '$'

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Selecciona una talla primero', { id: 'size-required' })
      return
    }
    addItem(product, selectedSize)
    toast.success(`${product.name} agregado al carrito`, {
      icon: '🛍️',
    })
  }

  return (
    <article className='product-card group flex flex-col' id={`product-${product.id}`}>
      {/* Imagen del producto */}
      <div className='relative overflow-hidden bg-gray-800' style={{ aspectRatio: '4/5' }}>
        {!imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
            loading='lazy'
            onError={() => setImgError(true)}
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gray-800'>
            <span className='text-5xl'>👗</span>
          </div>
        )}

        {/* Badge de stock sobre la imagen */}
        <div className='absolute top-3 left-3'>
          <StockBadge status={product.stock_status} />
        </div>

        {/* Overlay con boton de agregar rapido en hover (desktop) */}
        <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-end p-4'>
          <button
            onClick={handleAddToCart}
            id={`quick-add-${product.id}`}
            className='w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2'
          >
            <ShoppingBag size={16} />
            {selectedSize ? `Agregar talla ${selectedSize}` : 'Selecciona una talla'}
          </button>
        </div>
      </div>

      {/* Informacion del producto */}
      <div className='flex flex-col flex-1 p-4 gap-3'>
        <div>
          <h3 className='text-gray-100 font-semibold text-sm leading-tight line-clamp-2'>
            {product.name}
          </h3>
          <p className='text-brand-400 font-bold text-lg mt-1'>
            {currencySymbol}{Number(product.price).toLocaleString('es-CO')}
          </p>
        </div>

        {/* Selector de tallas */}
        {product.sizes && product.sizes.length > 0 && (
          <div>
            <p className='text-gray-500 text-xs mb-2 uppercase tracking-wide'>Talla</p>
            <div className='flex flex-wrap gap-1.5'>
              {product.sizes.map((size) => (
                <button
                  key={size}
                  id={`size-${product.id}-${size}`}
                  onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                  className={`size-chip ${
                    selectedSize === size ? 'size-chip-active' : 'size-chip-inactive'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Boton de agregar (siempre visible en movil) */}
        <button
          onClick={handleAddToCart}
          id={`add-to-cart-${product.id}`}
          className='mt-auto btn-primary py-2.5 text-sm flex items-center justify-center gap-2 md:hidden'
        >
          <ShoppingBag size={16} />
          Agregar al carrito
        </button>

        <button
          onClick={handleAddToCart}
          id={`add-to-cart-desktop-${product.id}`}
          className='mt-auto btn-primary py-2.5 text-sm-items-center justify-center gap-2 hidden md:flex'
        >
          <ShoppingBag size={16} />
          Agregar al carrito
        </button>
      </div>
    </article>
  )
}

export default ProductCard
