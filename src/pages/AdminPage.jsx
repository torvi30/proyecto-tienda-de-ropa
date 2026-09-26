import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useProducts from '../hooks/useProducts'
import AdminNavbar from '../components/admin/AdminNavbar'
import SingleProductUpload from '../components/admin/SingleProductUpload'
import ProductList from '../components/admin/ProductList'
import CategoryManager from '../components/admin/CategoryManager'
import StoreSettingsManager from '../components/admin/StoreSettingsManager'
import AdminMetrics from '../components/admin/AdminMetrics'
import Spinner from '../components/shared/Spinner'

const AdminPage = () => {
  const { user, loading, signOut } = useAuth()
  const { products } = useProducts()
  const [activeTab, setActiveTab] = useState('metrics')
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
      {/* Unified Admin Dashboard Navbar */}
      <AdminNavbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={signOut}
        productCount={products?.length || 0}
      />

      {/* Tab content view router with mobile bottom clearance */}
      <main className='page-container pt-5 pb-28 md:py-8'>
        {activeTab === 'metrics' && (
          <AdminMetrics onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'upload' && (
          <div>
            <div className='mb-6 max-w-xl mx-auto'>
              <h2 className='text-gray-100 font-display text-2xl font-bold'>Subir Prenda</h2>
              <p className='text-gray-400 text-sm mt-1'>
                Elige la foto, define nombre, precio y tallas, y publícala de inmediato en la tienda
              </p>
            </div>
            <SingleProductUpload
              onSuccess={() => setRefreshKey((k) => k + 1)}
              onNavigateInventory={() => setActiveTab('products')}
            />
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

        {activeTab === 'categories' && (
          <div>
            <div className='mb-6 max-w-2xl mx-auto'>
              <h2 className='text-gray-100 font-display text-2xl font-bold'>Gestión de Categorías</h2>
              <p className='text-gray-500 text-sm mt-1'>
                Crea, edita y organiza las secciones de tu tienda
              </p>
            </div>
            <CategoryManager />
          </div>
        )}

        {activeTab === 'settings' && (
          <StoreSettingsManager />
        )}
      </main>
    </div>
  )
}

export default AdminPage
