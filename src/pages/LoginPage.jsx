import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Lock, AlertCircle } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import Spinner from '../components/shared/Spinner'

const LoginPage = () => {
  const { user, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Si ya esta autenticado, redirigir al panel
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-950'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (user) return <Navigate to='/admin' replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: authError } = await signIn(email.trim(), password)

    if (authError) {
      const code = authError.code || ''
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      } else if (code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.')
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Por favor espera unos minutos.')
      } else {
        setError(authError.message || 'Error al iniciar sesión con Firebase.')
      }
    }
    setSubmitting(false)
  }

  return (
    <div className='min-h-screen bg-gray-950 flex items-center justify-center p-4'>
      {/* Decoracion de fondo */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl' />
      </div>

      <div className='relative w-full max-w-md'>
        {/* Card glassmorphism */}
        <div className='bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl'>
          {/* Logo / Header */}
          <div className='text-center mb-8'>
            <div className='inline-flex items-center justify-center w-14 h-14 bg-brand-600/20 border border-brand-500/30 rounded-2xl mb-4'>
              <Lock size={24} className='text-brand-400' />
            </div>
            <h1 className='font-display text-2xl font-bold text-gray-100'>
              Panel Admin
            </h1>
            <p className='text-gray-500 text-sm mt-1'>Acceso exclusivo al administrador</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className='space-y-5' id='login-form'>
            <div>
              <label className='text-gray-400 text-sm font-medium block mb-2' htmlFor='login-email'>
                Email
              </label>
              <input
                id='login-email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='admin@miboutique.com'
                required
                className='form-input'
                autoComplete='email'
              />
            </div>

            <div>
              <label className='text-gray-400 text-sm font-medium block mb-2' htmlFor='login-password'>
                Contraseña
              </label>
              <div className='relative'>
                <input
                  id='login-password'
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••'
                  required
                  className='form-input pr-11'
                  autoComplete='current-password'
                />
                <button
                  type='button'
                  onClick={() => setShowPass(!showPass)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors'
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className='flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3'>
                <AlertCircle size={16} className='text-red-400 mt-0.5 shrink-0' />
                <p className='text-red-400 text-sm'>{error}</p>
              </div>
            )}

            <button
              type='submit'
              id='login-submit'
              disabled={submitting}
              className='w-full btn-primary flex items-center justify-center gap-2 py-4'
            >
              {submitting ? (
                <Spinner size='sm' />
              ) : (
                <>
                  <LogIn size={18} />
                  Ingresar al panel
                </>
              )}
            </button>
          </form>

          {/* Volver a la tienda */}
          <div className='text-center mt-6'>
            <a
              href='/'
              className='text-gray-600 hover:text-gray-400 text-sm transition-colors'
            >
              ← Volver a la tienda
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
