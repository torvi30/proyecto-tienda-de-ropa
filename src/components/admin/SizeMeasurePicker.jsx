import { useState } from 'react'
import { Plus, X, Ruler } from 'lucide-react'

export const SIZE_PRESETS = {
  ropa: {
    label: 'Ropa',
    items: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'],
  },
  accesorios: {
    label: 'Accesorios / Bolsos / Gafas',
    items: ['Única', 'Ajustable', 'Estándar', 'Pequeño', 'Mediano', 'Grande'],
  },
  calzado: {
    label: 'Calzado',
    items: ['35', '36', '37', '38', '39', '40', '41', '42', '43'],
  },
  relojes: {
    label: 'Relojes / Joyería',
    items: ['38mm', '40mm', '42mm', '44mm', '46mm', 'Ajustable'],
  },
}

const SizeMeasurePicker = ({ selected = [], onChange, label = 'Tallas / Medidas / Tamaños' }) => {
  const [activeTab, setActiveTab] = useState('ropa')
  const [customValue, setCustomValue] = useState('')

  const toggleItem = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val))
    } else {
      onChange([...selected, val])
    }
  }

  const handleAddCustom = (e) => {
    if (e) e.preventDefault()
    const trimmed = customValue.trim()
    if (!trimmed) return
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed])
    }
    setCustomValue('')
  }

  const removeItem = (val) => {
    onChange(selected.filter((s) => s !== val))
  }

  return (
    <div className='space-y-2.5 font-sans'>
      {/* Header & selected count */}
      <div className='flex items-center justify-between'>
        <label className='text-gray-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5'>
          <Ruler size={13} className='text-brand-400' />
          <span>{label} *</span>
        </label>
        {selected.length > 0 && (
          <span className='text-brand-300 text-xs font-medium'>
            {selected.length} seleccionada{selected.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Currently selected sizing chips */}
      {selected.length > 0 && (
        <div className='p-2.5 bg-gray-950/70 border border-brand-500/30 rounded-2xl flex flex-wrap gap-1.5 items-center'>
          <span className='text-gray-500 text-[11px] font-semibold uppercase mr-1 select-none'>
            Activas:
          </span>
          {selected.map((item) => (
            <span
              key={item}
              className='inline-flex items-center gap-1 bg-brand-500/25 border border-brand-500/50 text-brand-300 text-xs font-bold px-2.5 py-1 rounded-xl shadow-sm'
            >
              <span>{item}</span>
              <button
                type='button'
                onClick={() => removeItem(item)}
                className='hover:text-red-400 transition-colors p-0.5 rounded'
                title={`Eliminar ${item}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Product category sizing preset tabs */}
      <div className='flex gap-1 overflow-x-auto no-scrollbar py-0.5'>
        {Object.entries(SIZE_PRESETS).map(([key, { label: tabLabel }]) => (
          <button
            key={key}
            type='button'
            onClick={() => setActiveTab(key)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === key
                ? 'bg-gray-800 text-brand-300 border border-brand-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-855'
            }`}
          >
            {tabLabel}
          </button>
        ))}
      </div>

      {/* Preset size chips */}
      <div className='flex flex-wrap gap-1.5 p-2 bg-gray-900/50 border border-gray-800/80 rounded-2xl'>
        {SIZE_PRESETS[activeTab].items.map((item) => {
          const isSelected = selected.includes(item)
          return (
            <button
              key={item}
              type='button'
              onClick={() => toggleItem(item)}
              className={`size-chip !py-1 !px-2.5 text-xs ${
                isSelected ? 'size-chip-active' : 'size-chip-inactive'
              }`}
            >
              {item}
            </button>
          )
        })}
      </div>

      {/* Custom size / dimension write-in input */}
      <div className='flex items-center gap-2 pt-0.5'>
        <div className='relative flex-1'>
          <input
            type='text'
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCustom(e)
              }
            }}
            placeholder='Escribe medida personalizada (ej: 25x15 cm, 42mm, 18 cm, Estándar)...'
            className='form-input text-xs py-2 px-3 font-sans'
          />
        </div>
        <button
          type='button'
          onClick={handleAddCustom}
          disabled={!customValue.trim()}
          className='btn-secondary py-2 px-3 text-xs flex items-center gap-1 shrink-0 font-sans disabled:opacity-40'
        >
          <Plus size={14} />
          <span>Añadir</span>
        </button>
      </div>

      {selected.length === 0 && (
        <p className='text-amber-400/80 text-[11px]'>
          * Selecciona o añade al menos una talla, medida o tamaño para tu producto.
        </p>
      )}
    </div>
  )
}

export default SizeMeasurePicker
