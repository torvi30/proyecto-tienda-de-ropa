import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Ruler, Sparkles, MessageCircle, HelpCircle, Check } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { sanitizeWhatsAppNumber } from '../../lib/whatsapp'

const SIZE_CHART = [
  { size: 'XS', bust: '80 - 84 cm',  waist: '60 - 64 cm',  hip: '86 - 90 cm',  jeans: '4 - 6' },
  { size: 'S',  bust: '85 - 89 cm',  waist: '65 - 69 cm',  hip: '91 - 95 cm',  jeans: '6 - 8' },
  { size: 'M',  bust: '90 - 94 cm',  waist: '70 - 74 cm',  hip: '96 - 100 cm', jeans: '8 - 10' },
  { size: 'L',  bust: '95 - 99 cm',  waist: '75 - 79 cm',  hip: '101 - 105 cm', jeans: '10 - 12' },
  { size: 'XL', bust: '100 - 105 cm', waist: '80 - 85 cm', hip: '106 - 110 cm', jeans: '12 - 14' },
  { size: 'Única', bust: '85 - 98 cm', waist: '65 - 78 cm', hip: '92 - 104 cm', jeans: 'Se adapta (Spandex/Elastizado)' },
]

const SizeGuideModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('chart') // 'chart' | 'how'
  const { settings } = useStore()

  if (!isOpen) return null

  const handleWhatsAppHelp = () => {
    const phone = sanitizeWhatsAppNumber(settings?.whatsapp_number)
    if (!phone) return
    const text = encodeURIComponent('¡Hola! Tengo dudas sobre qué talla elegir para una prenda. ¿Podrían asesorarme con mis medidas? 😊')
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const modal = (
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-gray-950/85 backdrop-blur-xl animate-fade-in'
      onClick={onClose}
    >
      <div
        className='relative w-full max-w-lg bg-gray-900/95 border border-brand-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-brand-500/20 text-gray-100 flex flex-col max-h-[90vh] overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-start justify-between gap-3 border-b border-gray-800 pb-4 shrink-0'>
          <div className='flex items-center gap-2.5'>
            <div className='w-10 h-10 rounded-2xl bg-brand-600/20 border border-brand-500/40 text-brand-400 flex items-center justify-center shadow-inner shrink-0'>
              <Ruler size={20} />
            </div>
            <div>
              <h3 className='font-display text-lg sm:text-xl font-bold text-gray-100 flex items-center gap-1.5'>
                <span>Guía Oficial de Tallas</span>
                <Sparkles size={14} className='text-amber-300' />
              </h3>
              <p className='text-xs text-gray-400'>
                Medidas de referencia corporal para dama (en cm)
              </p>
            </div>
          </div>

          <button
            type='button'
            onClick={onClose}
            className='p-2 rounded-xl bg-gray-800/80 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer shrink-0'
            title='Cerrar guía'
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switchers */}
        <div className='flex items-center gap-2 my-3 p-1 bg-gray-950/70 border border-gray-800 rounded-xl shrink-0'>
          <button
            type='button'
            onClick={() => setActiveTab('chart')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'chart'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Tabla de Medidas
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('how')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'how'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <HelpCircle size={13} />
            <span>¿Cómo medirte?</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className='flex-1 overflow-y-auto space-y-4 pr-1'>
          {activeTab === 'chart' ? (
            <div className='space-y-3 animate-fade-in'>
              {/* Responsive table */}
              <div className='overflow-x-auto rounded-2xl border border-gray-800 bg-gray-950/60'>
                <table className='w-full text-left text-xs'>
                  <thead className='bg-gray-900/90 text-brand-300 uppercase tracking-wider font-semibold border-b border-gray-800 text-[10px] sm:text-xs'>
                    <tr>
                      <th className='p-2.5 sm:p-3'>Talla</th>
                      <th className='p-2.5 sm:p-3'>Busto</th>
                      <th className='p-2.5 sm:p-3'>Cintura</th>
                      <th className='p-2.5 sm:p-3'>Cadera</th>
                      <th className='p-2.5 sm:p-3 hidden sm:table-cell'>Jean</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-800/60 font-sans'>
                    {SIZE_CHART.map((item) => (
                      <tr key={item.size} className='hover:bg-brand-500/5 transition-colors'>
                        <td className='p-2.5 sm:p-3 font-bold text-gray-100 flex items-center gap-1.5'>
                          <span className='w-6 h-6 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center text-xs font-mono font-bold'>
                            {item.size === 'Única' ? 'U' : item.size}
                          </span>
                          <span className='hidden xs:inline'>{item.size}</span>
                        </td>
                        <td className='p-2.5 sm:p-3 text-gray-300 font-mono'>{item.bust}</td>
                        <td className='p-2.5 sm:p-3 text-gray-300 font-mono'>{item.waist}</td>
                        <td className='p-2.5 sm:p-3 text-gray-300 font-mono'>{item.hip}</td>
                        <td className='p-2.5 sm:p-3 text-gray-400 hidden sm:table-cell'>{item.jeans}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tip info card */}
              <div className='p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200 leading-relaxed space-y-1'>
                <p className='font-bold flex items-center gap-1'>
                  <Sparkles size={13} className='text-amber-300' />
                  <span>Consejo de Boutique:</span>
                </p>
                <p className='text-gray-300 text-[11px] sm:text-xs'>
                  Si tus medidas se encuentran entre dos tallas: te recomendamos la <b>talla mayor</b> para un ajuste holgado y fluido, o la <b>talla menor</b> si la tela es licrada y prefieres horma ceñida.
                </p>
              </div>
            </div>
          ) : (
            <div className='space-y-3.5 animate-fade-in text-xs'>
              <div className='flex gap-3 p-3 rounded-2xl bg-gray-950/60 border border-gray-800'>
                <div className='w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0'>1</div>
                <div>
                  <h4 className='font-bold text-gray-200 text-sm'>1. Busto / Pecho</h4>
                  <p className='text-gray-400 mt-0.5 leading-relaxed'>
                    Pasa la cinta métrica por debajo de los brazos y alrededor de la parte más prominente del pecho, manteniendo la cinta recta horizontalmente.
                  </p>
                </div>
              </div>

              <div className='flex gap-3 p-3 rounded-2xl bg-gray-950/60 border border-gray-800'>
                <div className='w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0'>2</div>
                <div>
                  <h4 className='font-bold text-gray-200 text-sm'>2. Cintura</h4>
                  <p className='text-gray-400 mt-0.5 leading-relaxed'>
                    Mide la parte más angosta del torso (generalmente unos 2 a 3 cm por encima de tu ombligo). No aprietes la cinta en exceso.
                  </p>
                </div>
              </div>

              <div className='flex gap-3 p-3 rounded-2xl bg-gray-950/60 border border-gray-800'>
                <div className='w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0'>3</div>
                <div>
                  <h4 className='font-bold text-gray-200 text-sm'>3. Cadera</h4>
                  <p className='text-gray-400 mt-0.5 leading-relaxed'>
                    De pie con los pies juntos, mide alrededor de la parte más ancha de tus caderas y glúteos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className='pt-3 mt-3 border-t border-gray-800 flex items-center justify-between gap-2 shrink-0'>
          <button
            type='button'
            onClick={handleWhatsAppHelp}
            className='flex-1 py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer'
          >
            <MessageCircle size={15} />
            <span>Asesoría de Talla por WhatsApp</span>
          </button>
          <button
            type='button'
            onClick={onClose}
            className='btn-secondary py-2.5 px-4 text-xs font-semibold cursor-pointer'
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modal, document.body)
  }
  return modal
}

export default SizeGuideModal
