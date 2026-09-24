import { useState, useMemo } from 'react'
import { Flame } from 'lucide-react'
import useProducts from '../hooks/useProducts'
import useCategories from '../hooks/useCategories'
import { useStore } from '../store/StoreContext'
import Navbar from '../components/catalog/Navbar'
import FilterBar from '../components/catalog/FilterBar'
import ProductGrid from '../components/catalog/ProductGrid'
import ProductCard from '../components/catalog/ProductCard'
import CartDrawer from '../components/catalog/CartDrawer'
import { useCart } from '../store/CartContext'

const CatalogPage = () => {
  const { products, loading } = useProducts()
  const { categories } = useCategories()
  const { settings } = useStore()
  const { totalItems, setIsOpen } = useCart()

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [onlySales, setOnlySales] = useState(false)
  const [onlyFeatured, setOnlyFeatured] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Productos con oferta activa
  const saleProducts = useMemo(() => {
    return products.filter((p) => p.is_on_sale && p.original_price > p.price)
  }, [products])

  // Productos destacados
  const featuredProducts = useMemo(() => {
    return products.filter((p) => p.is_featured)
  }, [products])

  // Filtrado en memoria — sin llamada a la BD, 100% instantaneo
  // Las prendas destacadas y ofertas siempre se ordenan de PRIMERO arriba
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const list = products.filter((p) => {
      const matchesCategory = !selectedCategory || p.category_id === selectedCategory
      const matchesSize = !selectedSize || (p.sizes && p.sizes.includes(selectedSize))
      const matchesSale = !onlySales || (p.is_on_sale && p.original_price > p.price)
      const matchesFeatured = !onlyFeatured || p.is_featured
      const matchesSearch = !query || (p.name && p.name.toLowerCase().includes(query))
      return matchesCategory && matchesSize && matchesSale && matchesFeatured && matchesSearch
    })

    return list.sort((a, b) => {
      const scoreA = (a.is_featured ? 2 : 0) + (a.is_on_sale && a.original_price > a.price ? 1 : 0)
      const scoreB = (b.is_featured ? 2 : 0) + (b.is_on_sale && b.original_price > b.price ? 1 : 0)
      return scoreB - scoreA // Mayor prioridad sale arriba
    })
  }, [products, selectedCategory, selectedSize, onlySales, onlyFeatured, searchQuery])

  const storeName = settings?.store_name || 'Boutique'

  const handleResetFilters = () => {
    setSelectedCategory(null)
    setSelectedSize(null)
    setOnlySales(false)
    setOnlyFeatured(false)
    setSearchQuery('')
  }

  return (
    <div className='min-h-screen bg-gray-950 font-sans'>
      {/* Navbar Superior de Lujo con cinta de anuncios, buscador y bolsa */}
      <Navbar
        storeName={storeName}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onlySales={onlySales}
        onToggleSales={() => setOnlySales((prev) => !prev)}
        onlyFeatured={onlyFeatured}
        onToggleFeatured={() => setOnlyFeatured((prev) => !prev)}
        onResetFilters={handleResetFilters}
        saleCount={saleProducts.length}
        featuredCount={featuredProducts.length}
      />

      {/* Hero banner minimalista */}
      <div className='relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-brand-900/20 py-8 md:py-14'>
        <div className='page-container text-center relative z-10'>
          <p className='text-brand-400 text-xs font-semibold tracking-widest uppercase mb-2.5'>
            Nueva colección
          </p>
          <h2 className='font-display text-2xl md:text-5xl font-bold text-gray-100 mb-2.5'>
            Descubre tu estilo
          </h2>
          <p className='text-gray-400 text-xs md:text-base max-w-md mx-auto'>
            Prendas seleccionadas con atención exclusiva. Envíanos tu pedido directo por WhatsApp sin registros.
          </p>
        </div>
        {/* Decoracion de fondo */}
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl' />
      </div>

      {/* Barra de filtros sticky */}
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        selectedSize={selectedSize}
        onlySales={onlySales}
        onlyFeatured={onlyFeatured}
        onCategoryChange={setSelectedCategory}
        onSizeChange={setSelectedSize}
        onToggleSales={() => setOnlySales((prev) => !prev)}
        onToggleFeatured={() => setOnlyFeatured((prev) => !prev)}
        saleCount={saleProducts.length}
        featuredCount={featuredProducts.length}
        totalVisible={filteredProducts.length}
      />

      {/* Floating cart button en movil cuando hay productos */}
      {totalItems > 0 && (
        <aside aria-label='Acceso rápido al carrito' className='fixed bottom-6 right-5 z-30 md:hidden animate-scale-in'>
          <button
            onClick={() => setIsOpen(true)}
            id='floating-cart-btn'
            className='flex items-center gap-2.5 bg-gradient-to-r from-brand-600 to-purple-600 text-white font-bold px-4 py-3.5 rounded-full shadow-2xl shadow-brand-500/50 border border-brand-400/30 active:scale-95 transition-transform'
          >
            <div className='relative'>
              <ShoppingBag size={20} />
              <span className='absolute -top-2 -right-2 bg-pink-400 text-gray-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center'>
                {totalItems}
              </span>
            </div>
            <span className='text-xs font-semibold'>Ver Carrito</span>
          </button>
        </aside>
      )}

      {/* Grid de productos */}
      <main className='page-container py-6 sm:py-8'>
        {/* Sección destacada de Ofertas Exclusivas arriba del catálogo */}
        {saleProducts.length > 0 && !selectedCategory && !selectedSize && !onlySales && (
          <section className='mb-12 relative overflow-hidden rounded-3xl bg-gradient-to-b from-pink-950/25 via-gray-900/60 to-gray-900/40 border border-pink-500/25 p-5 sm:p-7 shadow-2xl animate-fade-in'>
            {/* Resplandor decorativo */}
            <div className='absolute -top-16 -right-16 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none' />

            <div className='relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6'>
              <div>
                <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-bold tracking-wider uppercase mb-2 shadow-sm'>
                  <Flame size={14} className='text-pink-400 fill-current animate-pulse' />
                  <span>Oportunidades Únicas · Precios de Oferta</span>
                </div>
                <h2 className='text-gray-100 font-display text-2xl sm:text-3xl font-bold'>
                  Prendas en Promoción
                </h2>
              </div>
              <p className='text-gray-400 text-xs sm:text-sm max-w-sm'>
                Prendas seleccionadas con descuentos por tiempo limitado. ¡Aprovecha antes de que se agoten!
              </p>
            </div>

            {/* Grid de ofertas */}
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 relative z-10'>
              {saleProducts.map((product) => (
                <ProductCard key={`promo-${product.id}`} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Separador de catálogo si la sección de ofertas está arriba */}
        {saleProducts.length > 0 && !selectedCategory && !selectedSize && !onlySales && (
          <div className='flex items-center justify-between pb-4 border-b border-gray-800/80 mb-6'>
            <div>
              <h3 className='text-gray-100 font-display text-xl font-bold'>
                Toda la Colección
              </h3>
              <p className='text-gray-500 text-xs mt-0.5'>
                Explora todas las prendas disponibles en nuestra boutique
              </p>
            </div>
            <span className='text-gray-500 text-xs font-medium'>
              {filteredProducts.length} prendas
            </span>
          </div>
        )}

        <ProductGrid products={filteredProducts} loading={loading} />
      </main>

      {/* Footer elegante */}
      <footer className='border-t border-gray-800/80 bg-gray-950 py-10 mt-12 text-center'>
        <div className='page-container space-y-4'>
          <h3 className='font-display text-lg font-bold text-gray-200 tracking-wide'>
            {storeName}
          </h3>
          <p className='text-gray-500 text-xs sm:text-sm max-w-sm mx-auto'>
            Catálogo digital de moda y tendencias. Pedidos y atención exclusiva y personalizada vía WhatsApp.
          </p>
          <div className='flex items-center justify-center gap-2 text-xs text-brand-400/80 font-medium pt-2'>
            <span>✨ Calidad Garantizada</span>
            <span>•</span>
            <span>🚀 Envíos Seguros</span>
            <span>•</span>
            <span>💬 Respuesta Inmediata</span>
          </div>
          <p className='text-gray-700 text-xs pt-4'>
            © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Carrito lateral */}
      <CartDrawer />
    </div>
  )
}

export default CatalogPage
