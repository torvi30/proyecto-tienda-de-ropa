import { Routes, Route } from 'react-router-dom'
import { StoreProvider } from './store/StoreContext'
import { CartProvider } from './store/CartContext'
import CatalogPage from './pages/CatalogPage'

// Paginas de fases futuras (placeholder por ahora)
const ComingSoon = ({ page }) => (
  <div className='min-h-screen flex items-center justify-center'>
    <div className='text-center'>
      <div className='text-6xl mb-4'>🛍️</div>
      <h1 className='font-display text-3xl font-bold text-gray-100 mb-2'>
        {page}
      </h1>
      <p className='text-gray-500 text-sm'>Próximamente — Fase siguiente</p>
    </div>
  </div>
)

const App = () => {
  return (
    <div className='dark'>
      <StoreProvider>
        <CartProvider>
          <Routes>
            <Route path='/'      element={<CatalogPage />} />
            <Route path='/login' element={<ComingSoon page='Login Admin' />} />
            <Route path='/admin' element={<ComingSoon page='Panel de Administración' />} />
          </Routes>
        </CartProvider>
      </StoreProvider>
    </div>
  )
}

export default App
