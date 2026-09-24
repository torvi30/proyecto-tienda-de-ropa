import { useState, useEffect } from 'react'
import { X, Trash2, Plus, Minus, ShoppingBag, MessageCircle, Flame, Clock, MapPin, ArrowLeft } from 'lucide-react'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import { openWhatsAppCheckout, formatPrice } from '../../lib/whatsapp'
import toast from 'react-hot-toast'

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart, totalItems, totalPrice } =
    useCart()
  const { settings } = useStore()

  // Bloquear scroll de la página y cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, setIsOpen])

  // Datos de entrega del cliente persistidos en localStorage
  const [deliveryInfo, setDeliveryInfo] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem('boutique_delivery_info')) || {
          name: '',
          phone: '',
          city: '',
          address: '',
        }
      )
    } catch {
      return { name: '', phone: '', city: '', address: '' }
    }
  })

  const updateDelivery = (field, val) => {
    setDeliveryInfo((prev) => {
      const updated = { ...prev, [field]: val }
      localStorage.setItem('boutique_delivery_info', JSON.stringify(updated))
      return updated
    })
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío')
      return
    }
    if (!settings?.whatsapp_number) {
      toast.error('Número de WhatsApp no configurado')
      return
    }
    openWhatsAppCheckout(items, settings, deliveryInfo)
    toast.success('¡Redirigiendo a WhatsApp! 🎉')
  }

  const sym = settings?.currency_symbol || '$'
  const code = settings?.currency_code || 'COP'

  return (
    <>
      {/* Overlay translúcido de lujo */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden='true'
      />

      {/* Drawer desde la derecha */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col
          bg-gray-900/98 backdrop-blur-xl border-l border-gray-800 shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        id='cart-drawer'
      >
        {/* Header */}
        <div className='flex items-center justify-between p-4 sm:p-5 border-b border-gray-800/80 bg-gray-950/40'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400'>
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className='font-display text-lg font-bold text-gray-100'>
                Tu Carrito
              </h2>
              <p className='text-gray-500 text-xs'>
                {totalItems} {totalItems === 1 ? 'prenda seleccionada' : 'prendas seleccionadas'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-1.5'>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                id='cart-clear'
                className='text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors p-2 rounded-lg'
                title='Vaciar carrito'
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              id='cart-close'
              className='text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors p-2 rounded-lg'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Banner de Urgencia / Reserva temporal estilo Shein */}
        {items.length > 0 && (
          <div className='bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-300 animate-fade-in'>
            <div className='flex items-center gap-1.5'>
              <Flame size={14} className='text-amber-400 fill-current animate-pulse' />
              <span className='font-semibold'>Prendas en alta demanda</span>
            </div>
            <span className='text-[11px] text-amber-400/90 font-medium flex items-center gap-1'>
              <Clock size={12} />
              <span>Reserva temporal activa</span>
            </span>
          </div>
        )}

        {/* Items del carrito */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-5 space-y-3'>
          {items.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-center py-12'>
              <div className='w-20 h-20 rounded-full bg-gray-800/70 border border-gray-700/50 flex items-center justify-center text-gray-500 mb-4'>
                <ShoppingBag size={32} />
              </div>
              <p className='text-gray-200 font-semibold text-base'>Tu carrito está vacío</p>
              <p className='text-gray-500 text-xs sm:text-sm mt-1 max-w-xs'>
                Explora el catálogo y agrega tus prendas favoritas en tu talla preferida.
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className='mt-6 btn-secondary py-2.5 px-6 text-xs font-semibold'
              >
                Explorar catálogo
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.product.id}-${item.size}`}
                className='flex gap-3 p-3 bg-gray-800/60 rounded-2xl border border-gray-750/60 hover:border-gray-700 transition-all'
              >
                {/* Imagen miniatura */}
                <div
                  className='w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-800 border border-gray-700/50'
                  style={{ aspectRatio: '4/5' }}
                >
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className='w-full h-full object-cover'
                  />
                </div>

                {/* Info del producto */}
                <div className='flex-1 min-w-0 flex flex-col justify-between'>
                  <div>
                    <div className='flex items-start justify-between gap-2'>
                      <p className='text-gray-100 text-sm font-medium leading-snug line-clamp-1'>
                        {item.product.name}
                      </p>
                      {/* Eliminar item */}
                      <button
                        onClick={() => removeItem(item.product.id, item.size)}
                        className='text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-1 rounded transition-colors -mr-1'
                        title='Eliminar prenda'
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className='flex items-center flex-wrap gap-2 mt-1'>
                      <span className='bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full'>
                        Talla {item.size}
                      </span>
                      {item.product?.stock_status === 'low_stock' && (
                        <span className='inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full'>
                          <Flame size={10} className='fill-current' />
                          Pocas unidades
                        </span>
                      )}
                      {item.product?.is_on_sale && item.product?.original_price > item.product?.price ? (
                        <div className='flex items-center gap-1.5'>
                          <span className='text-pink-400 font-bold text-xs tabular-nums'>
                            {formatPrice(item.product.price, sym, code)}
                          </span>
                          <span className='text-gray-500 text-[11px] line-through tabular-nums'>
                            {formatPrice(item.product.original_price, sym, code)}
                          </span>
                        </div>
                      ) : (
                        <span className='text-gray-500 text-xs tabular-nums'>
                          {formatPrice(item.product.price, sym, code)} c/u
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controles de cantidad y subtotal */}
                  <div className='flex items-center justify-between mt-2 pt-2 border-t border-gray-700/40'>
                    <div className='flex items-center gap-1.5 bg-gray-900/80 rounded-lg p-0.5 border border-gray-750'>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                        className='w-7 h-7 rounded-md hover:bg-gray-750 text-gray-300 flex items-center justify-center transition-colors active:scale-95 touch-manipulation'
                        title='Disminuir cantidad'
                      >
                        <Minus size={12} />
                      </button>
                      <span className='text-gray-100 text-xs font-bold w-6 text-center select-none'>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                        className='w-7 h-7 rounded-md hover:bg-gray-750 text-gray-300 flex items-center justify-center transition-colors active:scale-95 touch-manipulation'
                        title='Aumentar cantidad'
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <span className='text-brand-400 font-bold text-sm'>
                      {formatPrice(Number(item.product.price) * item.quantity, sym, code)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con total y checkout */}
        {items.length > 0 && (
          <div className='p-4 sm:p-5 border-t border-gray-800 bg-gray-950/70 space-y-3 pb-6 sm:pb-6'>
            {/* Datos para el Envío (Auto-guardable) */}
            <div className='bg-gray-900/90 border border-gray-800 rounded-2xl p-3 space-y-2 text-left'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1.5 text-xs font-semibold text-gray-200'>
                  <MapPin size={13} className='text-brand-400' />
                  <span>Datos para el Envío</span>
                </div>
                <span className='text-[10px] text-emerald-400 font-medium'>Se guarda solo ✓</span>
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <input
                  type='text'
                  value={deliveryInfo.name}
                  onChange={(e) => updateDelivery('name', e.target.value)}
                  placeholder='Tu Nombre'
                  className='w-full px-2.5 py-1.5 bg-gray-950 border border-gray-750 rounded-xl text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500'
                />
                <input
                  type='text'
                  value={deliveryInfo.city}
                  onChange={(e) => updateDelivery('city', e.target.value)}
                  placeholder='Ciudad'
                  className='w-full px-2.5 py-1.5 bg-gray-950 border border-gray-750 rounded-xl text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500'
                />
              </div>

              <input
                type='text'
                value={deliveryInfo.address}
                onChange={(e) => updateDelivery('address', e.target.value)}
                placeholder='Dirección de entrega y barrio'
                className='w-full px-2.5 py-1.5 bg-gray-950 border border-gray-750 rounded-xl text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <span className='text-gray-400 text-sm font-medium'>Total del pedido</span>
                <p className='text-gray-500 text-[11px]'>Incluye {totalItems} prenda{totalItems !== 1 ? 's' : ''}</p>
              </div>
              <span className='text-gray-100 font-bold text-xl sm:text-2xl font-sans tracking-tight'>
                {formatPrice(totalPrice, sym, code)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              id='cart-checkout-whatsapp'
              className='w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500
                text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all duration-200
                hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] cursor-pointer'
            >
              <MessageCircle size={20} className='text-white' />
              <span>Pedir por WhatsApp</span>
            </button>

            <p className='text-gray-500 text-center text-[11px] leading-tight'>
              💬 Atención directa e inmediata · Se enviará el resumen listo con tallas y total.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

export default CartDrawer
