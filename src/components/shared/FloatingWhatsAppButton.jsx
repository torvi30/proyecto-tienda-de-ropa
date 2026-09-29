import { useState, useEffect } from 'react'
import { MessageCircle, X, Sparkles } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { sanitizeWhatsAppNumber } from '../../lib/whatsapp'

const FloatingWhatsAppButton = () => {
  const { settings } = useStore()
  const [showTooltip, setShowTooltip] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Show tooltip after 2.5 seconds to attract attention without being annoying
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteracted) setShowTooltip(true)
    }, 2500)
    return () => clearTimeout(timer)
  }, [hasInteracted])

  const handleClick = () => {
    setHasInteracted(true)
    setShowTooltip(false)
    const phone = sanitizeWhatsAppNumber(settings?.whatsapp_number)
    if (!phone) return

    const storeTitle = settings?.store_name || 'Boutique'
    const message = encodeURIComponent(
      `¡Hola ${storeTitle}! Estuve viendo su catálogo y me gustaría recibir asesoría personalizada sobre algunas prendas 💕`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  const phone = sanitizeWhatsAppNumber(settings?.whatsapp_number)
  if (!phone) return null

  return (
    <aside
      aria-label='Asesoría directa por WhatsApp'
      className='fixed bottom-6 left-5 z-40 flex items-center select-none'
    >
      <div className='relative flex items-center'>
        {/* Floating tooltip invitation message */}
        {showTooltip && (
          <div className='absolute bottom-16 left-0 bg-gray-950/95 text-gray-100 border border-emerald-500/40 px-3.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl animate-fade-in flex items-start gap-2 max-w-[240px] text-xs'>
            <div className='w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5'>
              <Sparkles size={13} className='text-amber-300' />
            </div>
            <div>
              <p className='font-bold text-emerald-400 leading-tight'>¿Dudas con tu compra?</p>
              <p className='text-gray-300 text-[11px] mt-0.5 leading-snug'>
                Escríbenos y te asesoramos con tallas y fotos reales al instante.
              </p>
            </div>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                setShowTooltip(false)
                setHasInteracted(true)
              }}
              className='text-gray-500 hover:text-gray-300 p-0.5 -mr-1 -mt-1 rounded-md'
              title='Cerrar mensaje'
            >
              <X size={13} />
            </button>
            {/* Tooltip triangle tail */}
            <div className='absolute -bottom-1.5 left-5 w-3 h-3 bg-gray-950 border-r border-b border-emerald-500/40 transform rotate-45' />
          </div>
        )}

        {/* Main Floating Button */}
        <button
          type='button'
          onClick={handleClick}
          id='floating-whatsapp-vip-btn'
          className='group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl shadow-emerald-500/40 border border-emerald-300/40 active:scale-95 transition-all cursor-pointer'
          title='Chatea con una asesora por WhatsApp'
        >
          {/* Subtle pulse radar ring */}
          <span className='absolute inset-0 rounded-full bg-emerald-400 opacity-30 group-hover:animate-ping pointer-events-none' />

          <MessageCircle size={22} className='text-white fill-current/20 shrink-0' />
          <span className='text-xs hidden md:inline font-semibold tracking-wide'>
            Asesoría WhatsApp
          </span>
        </button>
      </div>
    </aside>
  )
}

export default FloatingWhatsAppButton
