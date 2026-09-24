import { X, ShoppingBag, MessageCircle, Sparkles, CheckCircle2, ShieldCheck, Truck } from 'lucide-react'

const HowToBuyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-950/80 backdrop-blur-md animate-fade-in'>
      <div
        className='relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-8 shadow-2xl font-sans'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow de fondo */}
        <div className='absolute -top-20 -right-20 w-52 h-52 bg-brand-600/15 rounded-full blur-3xl pointer-events-none' />

        {/* Boton cerrar */}
        <button
          onClick={onClose}
          className='absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-full transition-colors'
          aria-label='Cerrar modal'
        >
          <X size={20} />
        </button>

        {/* Encabezado */}
        <div className='text-center mb-7'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-2'>
            <Sparkles size={14} className='text-brand-400' />
            <span>Guía de Compra</span>
          </div>
          <h3 className='font-display text-2xl sm:text-3xl font-bold text-gray-100'>
            ¿Cómo comprar en nuestra boutique?
          </h3>
          <p className='text-gray-400 text-xs sm:text-sm mt-1.5'>
            Comprar con nosotros es rápido, seguro y 100% personalizado sin formularios tediosos.
          </p>
        </div>

        {/* Pasos visuales */}
        <div className='space-y-4 mb-8'>
          <div className='flex items-start gap-4 p-3.5 bg-gray-950/50 rounded-2xl border border-gray-800/80'>
            <div className='w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0 font-bold text-sm'>
              1
            </div>
            <div>
              <h4 className='text-gray-200 text-sm font-semibold flex items-center gap-2'>
                Elige tus prendas favoritas
              </h4>
              <p className='text-gray-400 text-xs mt-0.5 leading-relaxed'>
                Explora el catálogo, revisa las fotos en alta definición y escoge tu talla o medida ideal.
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 p-3.5 bg-gray-950/50 rounded-2xl border border-gray-800/80'>
            <div className='w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center shrink-0 font-bold text-sm'>
              2
            </div>
            <div>
              <h4 className='text-gray-200 text-sm font-semibold flex items-center gap-2'>
                Añade a tu bolsa
                <ShoppingBag size={14} className='text-pink-400' />
              </h4>
              <p className='text-gray-400 text-xs mt-0.5 leading-relaxed'>
                Toca en "Agregar al carrito". Puedes añadir todas las prendas y accesorios que quieras en un solo pedido.
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 p-3.5 bg-gray-950/50 rounded-2xl border border-gray-800/80'>
            <div className='w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 font-bold text-sm'>
              3
            </div>
            <div>
              <h4 className='text-gray-200 text-sm font-semibold flex items-center gap-2'>
                Finaliza directo por WhatsApp
                <MessageCircle size={14} className='text-emerald-400' />
              </h4>
              <p className='text-gray-400 text-xs mt-0.5 leading-relaxed'>
                Al pulsar "Pedir por WhatsApp", se redacta automáticamente tu orden con fotos, tallas y precio total para coordinar pago y entrega directa.
              </p>
            </div>
          </div>
        </div>

        {/* Garantías boutique */}
        <div className='grid grid-cols-2 gap-3 pt-2 pb-6 border-t border-gray-800/80 text-xs text-gray-400'>
          <div className='flex items-center gap-2'>
            <ShieldCheck size={16} className='text-brand-400 shrink-0' />
            <span>Compra 100% Segura</span>
          </div>
          <div className='flex items-center gap-2'>
            <Truck size={16} className='text-brand-400 shrink-0' />
            <span>Envíos Nacionales</span>
          </div>
        </div>

        {/* Boton de accion principal */}
        <button
          onClick={onClose}
          className='w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-brand-600/30 transition-all duration-200 flex items-center justify-center gap-2'
        >
          <CheckCircle2 size={18} />
          <span>¡Entendido! Comenzar a Ver Prendas</span>
        </button>
      </div>
    </div>
  )
}

export default HowToBuyModal
