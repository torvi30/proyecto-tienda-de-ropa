import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Spinner from './Spinner'

// Protege rutas de admin — redirige a /login si no hay sesion
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-950'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (!user) return <Navigate to='/login' replace />

  return children
}

export default ProtectedRoute
