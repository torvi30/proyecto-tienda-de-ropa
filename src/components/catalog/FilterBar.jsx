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
    <div className='sticky top-0 z-30 bg-gray-950/90 backdrop-blur-md border-b border-gray-800 py-3'>
      <div className='page-container'>
        {/* Fila de filtros con scroll horizontal en movil */}
        <div className='flex items-center gap-3'>
          {/* Icono de filtro */}
          <div className='flex items-center gap-1.5 text-gray-400 shrink-0'>
            <SlidersHorizontal size={16} />
            <span className='text-xs font-medium hidden sm:block'>Filtros</span>
          </div>

          {/* Categorias */}
          <div className='flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 pb-1'>
            <button
              id='filter-all-categories'
              onClick={() => onCategoryChange(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                !selectedCategory
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              Todos
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`filter-cat-${cat.slug}`}
                onClick={() =>
                  onCategoryChange(cat.id === selectedCategory ? null : cat.id)
                }
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Segunda fila: tallas */}
        <div className='flex items-center gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1'>
          <span className='text-gray-600 text-xs shrink-0'>Talla:</span>
          {ALL_SIZES.map((size) => (
            <button
              key={size}
              id={`filter-size-${size}`}
              onClick={() => onSizeChange(size === selectedSize ? null : size)}
              className={`shrink-0 size-chip ${
                selectedSize === size ? 'size-chip-active' : 'size-chip-inactive'
              }`}
            >
              {size}
            </button>
          ))}

          {/* Limpiar filtros + contador */}
          <div className='ml-auto flex items-center gap-3 shrink-0'>
            {hasActiveFilter && (
              <button
                id='filter-clear-all'
                onClick={clearAll}
                className='flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors'
              >
                <X size={12} />
                Limpiar
              </button>
            )}
            <span className='text-gray-600 text-xs whitespace-nowrap'>
              {totalVisible} productos
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterBar
