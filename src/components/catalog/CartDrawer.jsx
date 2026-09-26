import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Trash2, Plus, Minus, ShoppingBag, MessageCircle,
  Flame, Clock, MapPin, ChevronRight, Sparkles
} from 'lucide-react'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import { openWhatsAppCheckout, formatPrice } from '../../lib/whatsapp'
import toast from 'react-hot-toast'

const CartDrawer = () => {
  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice
  } = useCart()
  const { settings } = useStore()

  // Lock body scroll and handle Escape key to close drawer
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

  // Customer delivery information persisted in localStorage
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
      try {
        localStorage.setItem('boutique_delivery_info', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Tu carrito está vacío')
      return
    }
    if (!settings?.whatsapp_number) {
      toast.error('Número de WhatsApp de la tienda no configurado')
      return
    }
    openWhatsAppCheckout(items, settings, deliveryInfo)
    toast.success('¡Abriendo WhatsApp para confirmar tu pedido! 🎉', { duration: 3500 })
  }

  const sym = settings?.currency_symbol || '$'
  const code = settings?.currency_code || 'COP'

  const drawerContent = (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* 1. Translucent luxury backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300'
        onClick={() => setIsOpen(false)}
        aria-hidden='true'
      />

      {/* 2. Slide-over drawer container */}
      <div
        id='cart-drawer'
        className={`absolute top-0 right-0 h-full w-full max-w-md flex flex-col
          bg-gray-900 border-l border-gray-800 shadow-2xl z-10
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-4 sm:p-5 border-b border-gray-800/80 bg-gray-950/60'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0'>
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className='font-display text-lg font-bold text-gray-100 leading-tight'>
                Tu Bolsa de Compras
              </h2>
              <p className='text-gray-400 text-xs'>
                {totalItems} {totalItems === 1 ? 'prenda seleccionada' : 'prendas seleccionadas'}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-1'>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                id='cart-clear'
                className='text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors p-2 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer'
                title='Vaciar bolsa'
              >
                <Trash2 size={15} />
                <span className='hidden sm:inline text-[11px]'>Vaciar</span>
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              id='cart-close'
              className='text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors p-2 rounded-xl cursor-pointer'
              title='Cerrar bolsa (Esc)'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* High demand urgency banner */}
        {items.length > 0 && (
          <div className='bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-300'>
            <div className='flex items-center gap-1.5'>
              <Flame size={14} className='text-amber-400 fill-current animate-pulse' />
              <span className='font-semibold'>Prendas en alta demanda</span>
            </div>
            <span className='text-[11px] text-amber-400/90 font-medium flex items-center gap-1'>
              <Clock size={12} />
              <span>Reserva activa</span>
            </span>
          </div>
        )}

        {/* Cart items list */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5'>
          {items.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-center py-12'>
              <div className='w-20 h-20 rounded-2xl bg-gray-800/70 border border-gray-750 flex items-center justify-center text-gray-500 mb-4'>
                <ShoppingBag size={34} className='opacity-60' />
              </div>
              <p className='text-gray-100 font-bold text-base'>Tu bolsa está vacía</p>
              <p className='text-gray-400 text-xs sm:text-sm mt-1 max-w-xs leading-relaxed'>
                Explora el catálogo y elige tus prendas favoritas en la talla que prefieras.
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className='mt-6 btn-primary py-2.5 px-6 text-xs font-semibold'
              >
                Ver Colección
              </button>
            </div>
          ) : (
            items.map((item) => {
              if (!item || !item.product) return null
              const p = item.product
              const price = Number(p.price) || 0
              const origPrice = Number(p.original_price) || 0
              const hasPromo = p.is_on_sale && origPrice > price
              const photoUrl = p.image_url || (Array.isArray(p.images) && p.images[0]) || ''

              return (
                <div
                  key={`${p.id}-${item.size}`}
                  className='flex gap-3 p-3 bg-gray-800/80 rounded-2xl border border-gray-700/70 hover:border-gray-600 transition-all shadow-md'
                >
                  {/* Item thumbnail */}
                  <div
                    className='w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-900 border border-gray-700/50'
                    style={{ aspectRatio: '4/5' }}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={p.name}
                        className='w-full h-full object-cover'
                        draggable={false}
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-gray-500 text-xl'>
                        👗
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className='flex-1 min-w-0 flex flex-col justify-between'>
                    <div>
                      <div className='flex items-start justify-between gap-2'>
                        <p className='text-gray-100 text-sm font-semibold leading-snug line-clamp-1'>
                          {p.name}
                        </p>
                        <button
                          onClick={() => removeItem(p.id, item.size)}
                          className='text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-1 rounded-lg transition-colors -mr-1 cursor-pointer'
                          title='Eliminar de la bolsa'
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className='flex items-center flex-wrap gap-2 mt-1'>
                        <span className='bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full'>
                          Talla: {item.size}
                        </span>
                        {p.stock_status === 'low_stock' && (
                          <span className='inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full'>
                            <Flame size={10} className='fill-current' />
                            Últimas
                          </span>
                        )}
                        {hasPromo ? (
                          <div className='flex items-center gap-1.5'>
                            <span className='text-pink-400 font-bold text-xs tabular-nums'>
                              {formatPrice(price, sym, code)}
                            </span>
                            <span className='text-gray-500 text-[11px] line-through tabular-nums'>
                              {formatPrice(origPrice, sym, code)}
                            </span>
                          </div>
                        ) : (
                          <span className='text-gray-400 text-xs tabular-nums'>
                            {formatPrice(price, sym, code)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls & Subtotal */}
                    <div className='flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50'>
                      <div className='flex items-center gap-1.5 bg-gray-900/90 rounded-xl p-0.5 border border-gray-700'>
                        <button
                          onClick={() => updateQuantity(p.id, item.size, item.quantity - 1)}
                          className='w-7 h-7 rounded-lg hover:bg-gray-800 text-gray-300 flex items-center justify-center transition-colors active:scale-95 cursor-pointer touch-manipulation'
                          title='Disminuir cantidad'
                        >
                          <Minus size={12} />
                        </button>
                        <span className='text-gray-100 text-xs font-bold w-6 text-center select-none tabular-nums'>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(p.id, item.size, item.quantity + 1)}
                          className='w-7 h-7 rounded-lg hover:bg-gray-800 text-gray-300 flex items-center justify-center transition-colors active:scale-95 cursor-pointer touch-manipulation'
                          title='Aumentar cantidad'
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span className='text-brand-300 font-bold text-sm tabular-nums'>
                        {formatPrice(price * (Number(item.quantity) || 1), sym, code)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer with customer info & WhatsApp checkout */}
        {items.length > 0 && (
          <div className='p-4 sm:p-5 border-t border-gray-800 bg-gray-950/80 space-y-3 pb-6'>
            {/* Customer shipping details */}
            <div className='bg-gray-900/90 border border-gray-800 rounded-2xl p-3 space-y-2 text-left shadow-sm'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1.5 text-xs font-semibold text-gray-200'>
                  <MapPin size={13} className='text-brand-400' />
                  <span>Datos de Envío</span>
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

            {/* Total */}
            <div className='flex items-center justify-between pt-1'>
              <div>
                <span className='text-gray-400 text-xs font-medium'>Total del pedido</span>
                <p className='text-gray-500 text-[11px]'>{totalItems} prenda{totalItems !== 1 ? 's' : ''}</p>
              </div>
              <span className='text-gray-100 font-bold text-xl sm:text-2xl font-sans tracking-tight tabular-nums'>
                {formatPrice(totalPrice, sym, code)}
              </span>
            </div>

            {/* Direct WhatsApp Checkout Button */}
            <button
              onClick={handleCheckout}
              id='cart-checkout-whatsapp'
              className='w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500
                text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all duration-200
                hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] cursor-pointer'
            >
              <MessageCircle size={20} className='text-white' />
              <span>Pedir por WhatsApp</span>
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className='w-full text-center text-xs text-gray-400 hover:text-gray-200 font-medium py-1 transition-colors cursor-pointer'
            >
              ← Seguir explorando la tienda
            </button>
          </div>
        )}
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(drawerContent, document.body)
  }
  return drawerContent
}

export default CartDrawer
