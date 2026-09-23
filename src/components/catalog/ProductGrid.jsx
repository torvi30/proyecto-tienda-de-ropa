import ProductCard from './ProductCard'

// Skeleton de carga para cada tarjeta
const ProductSkeleton = () => (
  <div className='bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden animate-pulse'>
    <div className='bg-gray-800' style={{ aspectRatio: '4/5' }} />
    <div className='p-4 space-y-3'>
      <div className='h-4 bg-gray-800 rounded w-3/4' />
      <div className='h-6 bg-gray-800 rounded w-1/3' />
      <div className='flex gap-2'>
        <div className='h-7 w-10 bg-gray-800 rounded-full' />
        <div className='h-7 w-10 bg-gray-800 rounded-full' />
        <div className='h-7 w-10 bg-gray-800 rounded-full' />
      </div>
      <div className='h-10 bg-gray-800 rounded-xl' />
    </div>
  </div>
)

const ProductGrid = ({ products, loading }) => {
  if (loading) {
    return (
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5'>
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-24 text-center'>
        <div className='text-6xl mb-4'>🔍</div>
        <h3 className='text-gray-300 text-lg font-semibold mb-2'>
          Sin resultados
        </h3>
        <p className='text-gray-500 text-sm max-w-xs'>
          No encontramos prendas con esos filtros. Intenta con otra talla o categoría.
        </p>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5'>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default ProductGrid
