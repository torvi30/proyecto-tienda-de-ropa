import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import {
  LayoutGrid, Upload, LogOut, Store,
  Package, Zap, ExternalLink
} from 'lucide-react'
import useAuth from '../hooks/useAuth'
import BatchUpload from '../components/admin/BatchUpload'
import ProductList from '../components/admin/ProductList'
import Spinner from '../components/shared/Spinner'

const TABS = [
  { id: 'upload',   label: 'Subir fotos',  icon: Upload },
  { id: 'products', label: 'Inventario',   icon: Package },
]

const AdminPage = () => {
  const { user, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('upload')
  const [refreshKey, setRefreshKey] = useState(0)

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-950'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (!user) return <Navigate to='/login' replace />

  const handleUploadSuccess = () => {
    setRefreshKey((k) => k + 1)
    setActiveTab('products')
  }

  return (
    <div className='min-h-screen bg-gray-950'>
      {/* Header del admin */}
      <header className='bg-gray-900 border-b border-gray-800 sticky top-0 z-40'>
        <div className='page-container flex items-center justify-between py-3'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-brand-600/20 border border-brand-500/30 rounded-lg flex items-center justify-center'>
              <LayoutGrid size={16} className='text-brand-400' />
            </div>
            <div>
              <h1 className='text-gray-100 font-semibold text-sm leading-tight'>Panel Admin</h1>
              <span className='text-emerald-400 text-xs flex items-center gap-1 font-medium'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse'></span>
                Conectado a Firebase
              </span>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {/* Ver tienda */}
            <Link
              to='/'
              id='admin-view-store'
              className='flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors text-xs p-2'
            >
              <Store size={14} />
              <span className='hidden sm:block'>Ver tienda</span>
              <ExternalLink size={12} />
            </Link>

            {/* Cerrar sesion */}
            <button
              onClick={signOut}
              id='admin-logout'
              className='flex items-center gap-1.5 text-gray-500 hover:text-red-400 transition-colors text-xs p-2'
            >
              <LogOut size={14} />
              <span className='hidden sm:block'>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats rápidas */}
      <div className='bg-gradient-to-r from-brand-900/20 to-gray-900/50 border-b border-gray-800'>
        <div className='page-container py-3 sm:py-4'>
          <div className='flex items-center gap-2'>
            <Zap size={16} className='text-brand-400 shrink-0' />
            <p className='text-gray-300 text-xs sm:text-sm truncate'>
              Sesión activa: <span className='text-brand-300 font-semibold'>{user?.email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de navegacion */}
      <div className='border-b border-gray-800 bg-gray-950 sticky top-[57px] z-30'>
        <div className='page-container'>
          <div className='flex gap-1'>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`admin-tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all duration-200
                  ${activeTab === id
                    ? 'border-brand-500 text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido de cada tab */}
      <main className='page-container py-8'>
        {activeTab === 'upload' && (
          <div>
            <div className='mb-6'>
              <h2 className='text-gray-100 font-display text-2xl font-bold'>Subir productos</h2>
              <p className='text-gray-500 text-sm mt-1'>
                Arrastra hasta 20 fotos · Se comprimen automáticamente a WebP antes de subirse
              </p>
            </div>
            <BatchUpload onSuccess={handleUploadSuccess} />
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <div className='mb-6'>
              <h2 className='text-gray-100 font-display text-2xl font-bold'>Inventario</h2>
              <p className='text-gray-500 text-sm mt-1'>
                Toca el punto de color para cambiar el stock · Ojo para ocultar/mostrar
              </p>
            </div>
            <div className='mb-4 p-3 bg-gray-800/40 border border-gray-700/50 rounded-xl'>
              <div className='flex items-center gap-4 text-xs text-gray-500 flex-wrap'>
                <span className='flex items-center gap-1.5'>
                  <span className='w-2 h-2 rounded-full bg-green-400 inline-block' />
                  Disponible
                </span>
                <span className='flex items-center gap-1.5'>
                  <span className='w-2 h-2 rounded-full bg-yellow-400 inline-block' />
                  Últimas unidades
                </span>
                <span className='flex items-center gap-1.5'>
                  <span className='w-2 h-2 rounded-full bg-red-400 inline-block' />
                  Agotado (oculto del catálogo)
                </span>
                <span className='ml-auto'>Toca el punto para ciclar estados →</span>
              </div>
            </div>
            <ProductList refreshKey={refreshKey} />
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminPage
