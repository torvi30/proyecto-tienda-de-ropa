import { Routes, Route } from 'react-router-dom'
import { StoreProvider } from './store/StoreContext'
import { CartProvider } from './store/CartContext'
import CatalogPage from './pages/CatalogPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'

const App = () => {
  return (
    <div className='dark'>
      <StoreProvider>
        <CartProvider>
          <Routes>
            {/* Catalogo publico */}
            <Route path='/'      element={<CatalogPage />} />

            {/* Admin — proteccion manejada dentro de AdminPage y LoginPage */}
            <Route path='/login' element={<LoginPage />} />
            <Route path='/admin' element={<AdminPage />} />
          </Routes>
        </CartProvider>
      </StoreProvider>
    </div>
  )
}

export default App
