import { X, Trash2, Plus, Minus, ShoppingBag, MessageCircle } from 'lucide-react'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import { openWhatsAppCheckout, formatPrice } from '../../lib/whatsapp'
import toast from 'react-hot-toast'

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart, totalItems, totalPrice } =
    useCart()
  const { settings } = useStore()

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío')
      return
    }
    if (!settings?.whatsapp_number) {
      toast.error('Número de WhatsApp no configurado')
      return
    }
    openWhatsAppCheckout(items, settings)
    toast.success('¡Redirigiendo a WhatsApp! 🎉')
  }

  const sym = settings?.currency_symbol || '$'
  const code = settings?.currency_code || 'COP'

  return (
    <>
      {/* Overlay oscuro */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-fade-in'
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer desde la derecha */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col
          bg-gray-900 border-l border-gray-800 shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        id='cart-drawer'
      >
        {/* Header */}
        <div className='flex items-center justify-between p-5 border-b border-gray-800'>
          <div className='flex items-center gap-3'>
            <ShoppingBag size={20} className='text-brand-400' />
            <h2 className='font-display text-lg font-semibold text-gray-100'>
              Tu carrito
            </h2>
            {totalItems > 0 && (
              <span className='bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full'>
                {totalItems}
              </span>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                id='cart-clear'
                className='text-gray-500 hover:text-red-400 transition-colors p-1'
                title='Vaciar carrito'
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              id='cart-close'
              className='text-gray-400 hover:text-gray-100 transition-colors p-1'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Items del carrito */}
        <div className='flex-1 overflow-y-auto p-5 space-y-4'>
          {items.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-center'>
              <ShoppingBag size={48} className='text-gray-700 mb-4' />
              <p className='text-gray-400 font-medium'>Tu carrito está vacío</p>
              <p className='text-gray-600 text-sm mt-1'>
                Agrega prendas desde el catálogo
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.product.id}-${item.size}`}
                className='flex gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50'
              >
                {/* Imagen miniatura */}
                <div className='w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-700'>
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className='w-full h-full object-cover'
                  />
                </div>

                {/* Info del producto */}
                <div className='flex-1 min-w-0'>
                  <p className='text-gray-100 text-sm font-medium leading-tight line-clamp-2'>
                    {item.product.name}
                  </p>
                  <p className='text-gray-500 text-xs mt-1'>Talla: {item.size}</p>
                  <p className='text-brand-400 font-bold text-sm mt-1'>
                    {formatPrice(item.product.price, sym, code)}
                  </p>

                  {/* Controles de cantidad */}
                  <div className='flex items-center gap-2 mt-2'>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                      className='w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors'
                    >
                      <Minus size={10} />
                    </button>
                    <span className='text-gray-100 text-sm font-semibold w-4 text-center'>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                      className='w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors'
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>

                {/* Eliminar */}
                <button
                  onClick={() => removeItem(item.product.id, item.size)}
                  className='text-gray-600 hover:text-red-400 transition-colors self-start p-1'
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer con total y checkout */}
        {items.length > 0 && (
          <div className='p-5 border-t border-gray-800 space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-400 font-medium'>Total</span>
              <span className='text-gray-100 font-bold text-xl'>
                {formatPrice(totalPrice, sym, code)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              id='cart-checkout-whatsapp'
              className='w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500
                text-white font-bold py-4 rounded-xl transition-all duration-200
                hover:shadow-lg hover:shadow-green-500/30 active:scale-95'
            >
              <MessageCircle size={20} />
              Pedir por WhatsApp
            </button>
            <p className='text-gray-600 text-xs text-center'>
              Se abrirá WhatsApp con tu pedido listo para enviar
            </p>
          </div>
        )}
      </div>
    </>
  )
}

export default CartDrawer
