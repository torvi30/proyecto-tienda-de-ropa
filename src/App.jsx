import { Routes, Route } from 'react-router-dom'

// Paginas (se iran creando en cada fase)
const ComingSoon = ({ page }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4">🛍️</div>
      <h1 className="font-display text-4xl font-bold text-gray-100 mb-2">Boutique Luna</h1>
      <p className="text-gray-400 text-lg">
        <span className="text-brand-400 font-semibold">{page}</span> — En construccion
      </p>
      <p className="text-gray-600 text-sm mt-4">
        Fase 1 completada ✅ — Continua con la Fase 2
      </p>
    </div>
  </div>
)

const App = () => {
  return (
    <div className="dark">
      <Routes>
        <Route path="/"       element={<ComingSoon page="Catalogo Publico" />} />
        <Route path="/admin"  element={<ComingSoon page="Panel de Administracion" />} />
        <Route path="/login"  element={<ComingSoon page="Login Admin" />} />
      </Routes>
    </div>
  )
}

export default App
