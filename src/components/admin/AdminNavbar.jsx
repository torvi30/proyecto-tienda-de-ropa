import { Link } from 'react-router-dom'
import {
  LayoutGrid, Upload, LogOut, Store,
  Package, Layers, ExternalLink, User, Settings, TrendingUp
} from 'lucide-react'

const TABS = [
  { id: 'metrics',    label: 'Métricas',      icon: TrendingUp },
  { id: 'products',   label: 'Inventario',    icon: Package },
  { id: 'upload',     label: 'Subir Fotos',   icon: Upload },
  { id: 'categories', label: 'Categorías',    icon: Layers },
  { id: 'settings',   label: 'Ajustes',       icon: Settings },
]

const AdminNavbar = ({
  user,
  activeTab,
  onTabChange,
  onSignOut,
  productCount = 0,
}) => {
  return (
    <header className='bg-gray-900/95 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40 transition-all'>
      <div className='page-container'>
        {/* Fila principal del navbar */}
        <div className='flex items-center justify-between gap-4 py-3'>
          {/* Logo y estado de conexión */}
          <div className='flex items-center gap-3 shrink-0'>
            <div className='w-9 h-9 bg-gradient-to-tr from-brand-600/30 to-purple-500/20 border border-brand-500/40 rounded-xl flex items-center justify-center shadow-md shadow-brand-500/10'>
              <LayoutGrid size={18} className='text-brand-400' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-gray-100 font-bold text-sm sm:text-base leading-tight font-display'>
                  Panel Boutique
                </h1>
                <span className='hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold tracking-wide'>
                  <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse' />
                  En línea
                </span>
              </div>
              <p className='text-gray-500 text-[11px] hidden sm:block'>
                Administración y Gestión de Inventario
              </p>
            </div>
          </div>

          {/* Navegación por tabs en Desktop / Tablet (Segmented Control) */}
          <nav className='hidden md:flex items-center bg-gray-950 p-1 rounded-2xl border border-gray-800/80 shadow-inner'>
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  id={`admin-nav-tab-${id}`}
                  onClick={() => onTabChange(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/60'
                  }`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                  {id === 'products' && productCount > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-brand-700 text-brand-100'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {productCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Acciones y Perfil de Usuario */}
          <div className='flex items-center gap-2 sm:gap-3 shrink-0'>
            {/* Email de sesión */}
            {user?.email && (
              <div className='hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-gray-950/60 rounded-xl border border-gray-800/80 text-xs text-gray-300'>
                <User size={13} className='text-brand-400' />
                <span className='max-w-[140px] truncate font-medium text-gray-300'>
                  {user.email}
                </span>
              </div>
            )}

            {/* Ver tienda pública */}
            <Link
              to='/'
              id='admin-view-store'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 text-gray-200 hover:text-white transition-all text-xs font-medium shadow-sm'
              title='Abrir tienda en nueva pestaña'
            >
              <Store size={14} className='text-brand-400' />
              <span className='hidden sm:inline'>Ver Tienda</span>
              <ExternalLink size={12} className='text-gray-400' />
            </Link>

            {/* Salir */}
            <button
              onClick={onSignOut}
              id='admin-logout'
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors text-xs font-medium'
              title='Cerrar sesión'
            >
              <LogOut size={14} />
              <span className='hidden sm:inline'>Salir</span>
            </button>
          </div>
        </div>

        {/* Fila secundaria de Tabs en Móvil */}
        <div className='md:hidden flex items-center justify-around gap-1 pb-3 pt-1 border-t border-gray-800/60'>
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                id={`admin-nav-tab-mobile-${id}`}
                onClick={() => onTabChange(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'bg-gray-950/60 text-gray-400 border border-gray-800/60'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
                {id === 'products' && productCount > 0 && (
                  <span className='text-[10px] opacity-80'>({productCount})</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}

export default AdminNavbar
