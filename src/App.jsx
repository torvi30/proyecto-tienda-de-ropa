import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { StoreProvider } from './store/StoreContext'
import { CartProvider } from './store/CartContext'
import CatalogPage from './pages/CatalogPage'
import Spinner from './components/shared/Spinner'

// Lazy-load admin routes so public shopper bundle is super light and fast
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

const RouteFallback = () => (
  <div className='min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-gray-400'>
    <Spinner size='lg' />
    <span className='mt-3 text-xs tracking-wider uppercase font-semibold text-gray-500'>Cargando...</span>
  </div>
)

const App = () => {
  return (
    <div className='dark'>
      <StoreProvider>
        <CartProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Catalogo publico */}
              <Route path='/'      element={<CatalogPage />} />

              {/* Admin — cargado bajo demanda solo cuando se visita la ruta */}
              <Route path='/login' element={<LoginPage />} />
              <Route path='/admin' element={<AdminPage />} />
            </Routes>
          </Suspense>
        </CartProvider>
      </StoreProvider>
    </div>
  )
}

export default App
