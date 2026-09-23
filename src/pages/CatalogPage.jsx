import { useState, useMemo } from 'react'
import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import useProducts from '../hooks/useProducts'
import useCategories from '../hooks/useCategories'
import { useStore } from '../store/StoreContext'
import FilterBar from '../components/catalog/FilterBar'
import ProductGrid from '../components/catalog/ProductGrid'
import CartDrawer from '../components/catalog/CartDrawer'
import { useCart } from '../store/CartContext'
import { ShoppingBag } from 'lucide-react'

const CatalogPage = () => {
  const { products, loading } = useProducts()
  const { categories } = useCategories()
  const { settings } = useStore()
  const { totalItems, setIsOpen } = useCart()

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)

  // Filtrado en memoria — sin llamada a la BD, 100% instantaneo
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = !selectedCategory || p.category_id === selectedCategory
      const matchesSize =
        !selectedSize || (p.sizes && p.sizes.includes(selectedSize))
      return matchesCategory && matchesSize
    })
  }, [products, selectedCategory, selectedSize])

  const storeName = settings?.store_name || 'Boutique'

  return (
    <div className='min-h-screen bg-gray-950'>
      {/* Header de la tienda */}
      <header className='bg-gray-950/95 backdrop-blur-md border-b border-gray-800/60 sticky top-0 z-40'>
        <div className='page-container flex items-center justify-between py-4'>
          {/* Logo / Nombre de la tienda */}
          <div>
            <h1 className='font-display text-xl md:text-2xl font-bold text-gray-100 tracking-wide'>
              {storeName}
            </h1>
            <p className='text-gray-500 text-xs hidden sm:block'>Moda exclusiva</p>
          </div>

          {/* Acciones del header */}
          <div className='flex items-center gap-3'>
            {/* Acceso admin (discreto) */}
            <Link
              to='/login'
              id='header-admin-link'
              className='text-gray-600 hover:text-gray-400 transition-colors p-2'
              title='Panel de administración'
            >
              <Lock size={16} />
            </Link>

            {/* Boton del carrito */}
            <button
              id='header-cart-button'
              onClick={() => setIsOpen(true)}
              className='relative flex items-center gap-2 bg-brand-600 hover:bg-brand-500
                text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200
                hover:shadow-lg hover:shadow-brand-500/30 active:scale-95'
            >
              <ShoppingBag size={18} />
              <span className='hidden sm:block text-sm'>Carrito</span>
              {totalItems > 0 && (
                <span className='absolute -top-2 -right-2 bg-pink-400 text-gray-950 text-xs font-black
                  w-5 h-5 rounded-full flex items-center justify-center animate-scale-in'>
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero banner minimalista */}
      <div className='relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-brand-900/20 py-10 md:py-16'>
        <div className='page-container text-center relative z-10'>
          <p className='text-brand-400 text-xs font-semibold tracking-widest uppercase mb-3'>
            Nueva colección
          </p>
          <h2 className='font-display text-3xl md:text-5xl font-bold text-gray-100 mb-3'>
            Descubre tu estilo
          </h2>
          <p className='text-gray-400 text-sm md:text-base max-w-md mx-auto'>
            Prendas seleccionadas para la mujer moderna. Envíanos tu pedido directo por WhatsApp.
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
        onCategoryChange={setSelectedCategory}
        onSizeChange={setSelectedSize}
        totalVisible={filteredProducts.length}
      />

      {/* Grid de productos */}
      <main className='page-container py-8'>
        <ProductGrid products={filteredProducts} loading={loading} />
      </main>

      {/* Footer */}
      <footer className='border-t border-gray-800 py-8 mt-8'>
        <div className='page-container text-center'>
          <p className='text-gray-600 text-sm'>
            {storeName} · Hecho con ❤️ ·{' '}
            <span className='text-brand-500'>Pedidos por WhatsApp</span>
          </p>
        </div>
      </footer>

      {/* Carrito lateral */}
      <CartDrawer />
    </div>
  )
}

export default CatalogPage
