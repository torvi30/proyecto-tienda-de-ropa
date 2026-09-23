import { SlidersHorizontal, X } from 'lucide-react'

// Tallas globales del sistema
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única']

const FilterBar = ({
  categories,
  selectedCategory,
  selectedSize,
  onCategoryChange,
  onSizeChange,
  totalVisible,
}) => {
  const hasActiveFilter = selectedCategory || selectedSize

  const clearAll = () => {
    onCategoryChange(null)
    onSizeChange(null)
  }

  return (
    <div className='sticky top-[61px] sm:top-[69px] z-30 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/80 py-2.5 transition-all duration-200'>
      <div className='page-container space-y-2'>
        {/* Fila 1: Categorias con scroll horizontal suave */}
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-1.5 text-gray-400 shrink-0 pr-1'>
            <SlidersHorizontal size={14} className='text-brand-400' />
            <span className='text-xs font-semibold tracking-wider uppercase hidden sm:inline'>Categorías</span>
          </div>

          <div className='flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5'>
            <button
              id='filter-all-categories'
              onClick={() => onCategoryChange(null)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                !selectedCategory
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
              }`}
            >
              Todas
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`filter-cat-${cat.slug}`}
                onClick={() =>
                  onCategoryChange(cat.id === selectedCategory ? null : cat.id)
                }
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Fila 2: Tallas y contador */}
        <div className='flex items-center justify-between gap-2 pt-0.5 border-t border-gray-900'>
          <div className='flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0'>
            <span className='text-gray-500 text-xs shrink-0 font-medium'>Talla:</span>
            {ALL_SIZES.map((size) => (
              <button
                key={size}
                id={`filter-size-${size}`}
                onClick={() => onSizeChange(size === selectedSize ? null : size)}
                className={`shrink-0 size-chip !py-1 !px-2.5 text-xs ${
                  selectedSize === size ? 'size-chip-active' : 'size-chip-inactive'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Limpiar filtros + contador visible */}
          <div className='flex items-center gap-2.5 shrink-0 pl-2'>
            {hasActiveFilter && (
              <button
                id='filter-clear-all'
                onClick={clearAll}
                className='flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 font-medium transition-colors bg-pink-500/10 px-2 py-0.5 rounded-md'
              >
                <X size={12} />
                <span className='hidden xs:inline'>Quitar</span>
              </button>
            )}
            <span className='text-gray-500 text-xs font-medium whitespace-nowrap'>
              <span className='text-gray-300 font-bold'>{totalVisible}</span> prendas
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterBar
