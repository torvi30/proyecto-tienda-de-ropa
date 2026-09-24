import { useState, useEffect } from 'react'
import {
  Store, MessageCircle, DollarSign, Sparkles,
  Check, Loader2, ExternalLink, HelpCircle, ShieldCheck
} from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import toast from 'react-hot-toast'

const StoreSettingsManager = () => {
  const { settings, loading, updateSettings } = useStore()

  const [storeName, setStoreName] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [currencyCode, setCurrencyCode] = useState('COP')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name || '')
      setWhatsappNumber(settings.whatsapp_number || '')
      setWelcomeMessage(settings.welcome_message || '¡Hola! Quiero hacer el siguiente pedido en la boutique:')
      setCurrencySymbol(settings.currency_symbol || '$')
      setCurrencyCode(settings.currency_code || 'COP')
    }
  }, [settings])

  const handleSave = async (e) => {
    e.preventDefault()

    const cleanPhone = whatsappNumber.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 8) {
      toast.error('Por favor ingresa un número de WhatsApp válido con indicativo de país (ej: 573001234567)')
      return
    }

    if (!storeName.trim()) {
      toast.error('El nombre de la tienda no puede estar vacío')
      return
    }

    setSaving(true)
    try {
      await updateSettings({
        store_name: storeName.trim(),
        whatsapp_number: cleanPhone,
        welcome_message: welcomeMessage.trim(),
        currency_symbol: currencySymbol.trim(),
        currency_code: currencyCode.trim(),
      })
      toast.success('¡Configuración guardada exitosamente!', {
        icon: '💎',
        duration: 3500,
      })
    } catch (err) {
      console.error('Error guardando configuración:', err)
      toast.error('Error al guardar la configuración en la base de datos')
    } finally {
      setSaving(false)
    }
  }

  const testWhatsAppUrl = () => {
    const cleanPhone = whatsappNumber.replace(/\D/g, '')
    if (!cleanPhone) {
      toast.error('Primero escribe un número de teléfono')
      return
    }
    const testMsg = encodeURIComponent(`Hola ${storeName || 'Boutique'}, este es un mensaje de prueba para verificar la conexión de mi tienda.`)
    window.open(`https://wa.me/${cleanPhone}?text=${testMsg}`, '_blank')
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center p-12'>
        <Loader2 size={28} className='text-brand-400 animate-spin' />
      </div>
    )
  }

  return (
    <div className='max-w-3xl mx-auto space-y-6 font-sans'>
      <div className='flex items-center justify-between pb-4 border-b border-gray-800/80'>
        <div>
          <div className='flex items-center gap-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1'>
            <Sparkles size={14} />
            <span>Ajustes Generales</span>
          </div>
          <h2 className='text-gray-100 font-display text-2xl font-bold'>
            Configuración de la Tienda
          </h2>
          <p className='text-gray-400 text-xs sm:text-sm mt-0.5'>
            Personaliza el número de WhatsApp receptor, nombre de marca y moneda.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className='space-y-6'>
        {/* Tarjeta 1: WhatsApp y Pedidos */}
        <div className='bg-gray-900/60 border border-gray-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5'>
          <div className='flex items-center gap-3 pb-3 border-b border-gray-800/80'>
            <div className='w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400'>
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className='text-gray-100 font-semibold text-base'>
                WhatsApp para Recepción de Pedidos
              </h3>
              <p className='text-gray-400 text-xs'>
                A este número llegarán todos los carritos de compra de tus clientes
              </p>
            </div>
          </div>

          <div>
            <label className='block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5'>
              Número de WhatsApp (con indicativo de país)
            </label>
            <div className='flex flex-col sm:flex-row gap-2'>
              <div className='relative flex-1 rounded-2xl bg-gray-950 border border-gray-700/80 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all'>
                <input
                  type='text'
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder='Ej: 573001234567'
                  className='w-full px-4 py-3 bg-transparent text-gray-100 text-sm font-sans focus:outline-none'
                />
              </div>

              <button
                type='button'
                onClick={testWhatsAppUrl}
                className='px-4 py-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0'
                title='Abrir chat de prueba'
              >
                <ExternalLink size={14} />
                <span>Probar enlace</span>
              </button>
            </div>
            <p className='text-gray-500 text-[11px] mt-1.5'>
              💡 Escribe el código de tu país sin el signo más (+) ni espacios. Por ejemplo, en Colombia: <span className='text-emerald-400 font-mono'>573001234567</span>.
            </p>
          </div>

          <div>
            <label className='block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5'>
              Mensaje inicial de saludo en el pedido
            </label>
            <input
              type='text'
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder='¡Hola! Quiero hacer el siguiente pedido en la boutique:'
              className='w-full px-4 py-3 rounded-2xl bg-gray-950 border border-gray-700/80 focus:border-brand-500 focus:outline-none text-gray-100 text-sm font-sans'
            />
            <p className='text-gray-500 text-[11px] mt-1'>
              Este texto encabeza la lista de prendas que el cliente envía a tu WhatsApp.
            </p>
          </div>
        </div>

        {/* Tarjeta 2: Identidad y Marca */}
        <div className='bg-gray-900/60 border border-gray-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5'>
          <div className='flex items-center gap-3 pb-3 border-b border-gray-800/80'>
            <div className='w-10 h-10 rounded-2xl bg-brand-600/15 border border-brand-500/30 flex items-center justify-center text-brand-400'>
              <Store size={20} />
            </div>
            <div>
              <h3 className='text-gray-100 font-semibold text-base'>
                Identidad de la Tienda
              </h3>
              <p className='text-gray-400 text-xs'>
                Nombre comercial y presentación pública
              </p>
            </div>
          </div>

          <div>
            <label className='block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5'>
              Nombre de la Boutique / Tienda
            </label>
            <input
              type='text'
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder='Ej: Boutique Élite'
              className='w-full px-4 py-3 rounded-2xl bg-gray-950 border border-gray-700/80 focus:border-brand-500 focus:outline-none text-gray-100 text-sm font-sans'
            />
            <p className='text-gray-500 text-[11px] mt-1'>
              Se mostrará en la barra de navegación, el pie de página y en los mensajes automáticos.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5'>
                Símbolo de Moneda
              </label>
              <input
                type='text'
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder='$'
                maxLength={4}
                className='w-full px-4 py-3 rounded-2xl bg-gray-950 border border-gray-700/80 focus:border-brand-500 focus:outline-none text-gray-100 text-sm font-sans'
              />
            </div>

            <div>
              <label className='block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-1.5'>
                Código de Moneda
              </label>
              <input
                type='text'
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                placeholder='COP'
                maxLength={4}
                className='w-full px-4 py-3 rounded-2xl bg-gray-950 border border-gray-700/80 focus:border-brand-500 focus:outline-none text-gray-100 text-sm font-sans uppercase'
              />
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Vista Previa del Mensaje de WhatsApp */}
        <div className='bg-gradient-to-br from-emerald-950/20 via-gray-900/60 to-gray-950 border border-emerald-500/25 rounded-3xl p-5 sm:p-7 shadow-xl'>
          <div className='flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3'>
            <ShieldCheck size={16} />
            <span>Vista Previa del Pedido en WhatsApp</span>
          </div>

          <div className='bg-gray-950/90 rounded-2xl border border-gray-800 p-4 font-mono text-xs text-gray-300 leading-relaxed shadow-inner'>
            <p className='text-emerald-400 font-bold mb-2'>
              {welcomeMessage || `Hola ${storeName || 'Boutique'}!`}
            </p>
            <p className='text-gray-400 mb-1'>Mi pedido:</p>
            <p className='text-gray-200'>• Vestido Seda Negro — Talla: M — *{currencySymbol}120.000*</p>
            <p className='text-gray-200'>• Bolso Cuero — Talla: Única — *{currencySymbol}85.000* ~{currencySymbol}100.000~ 🔥 (-15% OFF)</p>
            <p className='text-emerald-300 font-bold mt-2'>*TOTAL: {currencySymbol}205.000*</p>
            <p className='text-gray-400 mt-2'>¿Tienen todo disponible? 😊</p>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className='flex justify-end pt-2'>
          <button
            type='submit'
            disabled={saving}
            className='w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95'
          >
            {saving ? (
              <>
                <Loader2 size={18} className='animate-spin' />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default StoreSettingsManager
