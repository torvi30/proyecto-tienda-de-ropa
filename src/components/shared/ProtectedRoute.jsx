import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Spinner from './Spinner'

// Protects admin routes — redirects to /login if unauthenticated
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
