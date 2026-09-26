import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, Search, X, Flame, Star,
  HelpCircle, Lock, Sparkles
} from 'lucide-react'
import { useCart } from '../../store/CartContext'
import HowToBuyModal from './HowToBuyModal'

const Navbar = ({
  storeName = 'Boutique',
  searchQuery,
  onSearchChange,
  onlySales,
  onToggleSales,
  onlyFeatured,
  onToggleFeatured,
  onlyNew,
  onToggleNew,
  onResetFilters,
  saleCount = 0,
  featuredCount = 0,
  newCount = 0,
}) => {
  const { totalItems, setIsOpen } = useCart()
  const [showHowToBuy, setShowHowToBuy] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  return (
    <>
      {/* 1. Top Luxury Announcement Bar */}
      <div className='bg-gradient-to-r from-brand-950 via-gray-900 to-pink-950 border-b border-gray-800/80 text-gray-300 py-1.5 px-4 text-xs select-none'>
        <div className='page-container flex items-center justify-between'>
          <div className='flex items-center gap-2 mx-auto sm:mx-0 overflow-hidden text-center'>
            <span className='inline-flex items-center gap-1.5 font-semibold text-brand-300 tracking-wide uppercase text-[11px]'>
              <Sparkles size={13} className='text-brand-400 shrink-0 animate-pulse' />
              <span>Nueva Colección</span>
            </span>
            <span className='text-gray-600 hidden sm:inline'>•</span>
            <span className='text-gray-400 hidden sm:inline text-xs'>
              Envíos nacionales seguros · Atención personalizada y directa vía WhatsApp
            </span>
          </div>

          {/* Direct link to How to Buy modal in top ticker */}
          <button
            onClick={() => setShowHowToBuy(true)}
            className='hidden md:flex items-center gap-1 text-gray-400 hover:text-brand-300 text-xs transition-colors'
          >
            <HelpCircle size={13} />
            <span>¿Cómo comprar?</span>
          </button>
        </div>
      </div>

      {/* 2. Main Sticky Navigation Bar */}
      <header className='bg-gray-950/95 backdrop-blur-md border-b border-gray-800/80 sticky top-0 z-40 transition-all'>
        <div className='page-container flex items-center justify-between gap-3 py-3 sm:py-3.5'>
          {/* Brand Logo & Name */}
          <div className='flex items-center gap-3 shrink-0'>
            <button
              onClick={() => {
                if (onResetFilters) onResetFilters()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className='text-left group'
            >
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform'>
                  <div className='w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center'>
                    <span className='font-display font-black text-brand-300 text-base'>
                      {storeName.charAt(0) || 'B'}
                    </span>
                  </div>
                </div>
                <div>
                  <h1 className='font-display text-lg sm:text-xl font-bold text-gray-100 tracking-wide group-hover:text-brand-300 transition-colors'>
                    {storeName}
                  </h1>
                  <p className='text-gray-500 text-[10px] tracking-widest uppercase font-medium -mt-1 hidden sm:block'>
                    Boutique Exclusiva
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop center navigation (Collection, Sales, Featured, How to Buy) */}
          <nav className='hidden lg:flex items-center gap-1.5'>
            <button
              onClick={() => {
                if (onResetFilters) onResetFilters()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className='px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-900 transition-colors'
            >
              Colección
            </button>

            {newCount > 0 && (
              <button
                onClick={onToggleNew}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  onlyNew
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-violet-400 hover:bg-violet-500/10'
                }`}
              >
                <Sparkles size={14} className='text-amber-300 fill-current animate-pulse' />
                <span>Nuevos</span>
                <span className='ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30'>
                  {newCount}
                </span>
              </button>
            )}

            {saleCount > 0 && (
              <button
                onClick={onToggleSales}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  onlySales
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                    : 'text-pink-400 hover:bg-pink-500/10'
                }`}
              >
                <Flame size={14} className='fill-current' />
                <span>Ofertas</span>
                <span className='ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30'>
                  {saleCount}
                </span>
              </button>
            )}

            {featuredCount > 0 && (
              <button
                onClick={onToggleFeatured}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  onlyFeatured
                    ? 'bg-amber-400 text-gray-950 font-bold shadow-md shadow-amber-400/30'
                    : 'text-amber-300 hover:bg-amber-400/10'
                }`}
              >
                <Star size={14} className='fill-current' />
                <span>Destacados</span>
              </button>
            )}

            <button
              onClick={() => setShowHowToBuy(true)}
              className='flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-gray-900 transition-colors'
            >
              <HelpCircle size={14} />
              <span>¿Cómo comprar?</span>
            </button>
          </nav>

          {/* Live Search Input (Desktop / Tablet) */}
          <div className='hidden sm:flex items-center flex-1 max-w-xs relative mx-2'>
            <Search size={15} className='absolute left-3 text-gray-500 pointer-events-none' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder='Buscar prenda, vestido, accesorio...'
              className='w-full pl-9 pr-8 py-1.5 bg-gray-900/80 border border-gray-800 rounded-full text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all'
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className='absolute right-2.5 p-0.5 text-gray-500 hover:text-gray-300'
                title='Limpiar búsqueda'
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Right-side actions (Mobile search toggle, Cart bag, Admin link) */}
          <div className='flex items-center gap-2 sm:gap-3 shrink-0'>
            {/* Mobile search toggle button */}
            <button
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className={`p-2 rounded-xl border transition-colors sm:hidden ${
                mobileSearchOpen || searchQuery
                  ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
              aria-label='Buscar productos'
            >
              <Search size={17} />
            </button>

            {/* Mobile How to Buy button */}
            <button
              onClick={() => setShowHowToBuy(true)}
              className='p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 transition-colors md:hidden'
              title='Guía de compra'
            >
              <HelpCircle size={17} />
            </button>

            {/* Discrete Admin Panel Access link */}
            <Link
              to='/login'
              id='header-admin-link'
              className='text-gray-600 hover:text-gray-400 transition-colors p-2 rounded-lg'
              title='Acceso administrativo'
            >
              <Lock size={15} />
            </Link>

            {/* Shopping Cart Drawer Toggle Button */}
            <button
              id='header-cart-button'
              onClick={() => setIsOpen(true)}
              className='relative flex items-center gap-2 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500
                text-white font-semibold px-3.5 py-2 rounded-xl transition-all duration-200
                shadow-lg shadow-brand-600/25 hover:shadow-brand-500/40 active:scale-95'
            >
              <ShoppingBag size={17} />
              <span className='hidden sm:inline text-xs font-bold'>Bolsa</span>
              {totalItems > 0 && (
                <span className='bg-pink-400 text-gray-950 text-[11px] font-black px-1.5 py-0.2 min-w-[20px] h-5 rounded-full flex items-center justify-center shadow-md animate-scale-in'>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable mobile search bar */}
        {mobileSearchOpen && (
          <div className='sm:hidden px-4 pb-3 pt-1 border-t border-gray-800/80 animate-fade-in'>
            <div className='relative'>
              <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500' />
              <input
                type='text'
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder='Buscar por nombre, accesorio o prenda...'
                className='w-full pl-9 pr-9 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500'
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white'
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Explanatory How to Buy modal */}
      <HowToBuyModal isOpen={showHowToBuy} onClose={() => setShowHowToBuy(false)} />
    </>
  )
}

export default Navbar
