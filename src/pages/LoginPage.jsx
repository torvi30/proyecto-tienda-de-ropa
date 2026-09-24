import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Lock, AlertCircle } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import Spinner from '../components/shared/Spinner'

const LoginPage = () => {
  const { user, loading, signIn, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Si ya está autenticado, redirigir al panel
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
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      } else if (code === 'auth/configuration-not-found') {
        setError(
          'Firebase Authentication no está habilitado en tu consola. Debes ir a Firebase Console -> Authentication -> Método de acceso y activar "Correo electrónico / Contraseña".'
        )
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

  const handleGoogleSignIn = async () => {
    setError(null)
    setSubmitting(true)

    const { error: authError } = await signInWithGoogle()

    if (authError) {
      const code = authError.code || ''
      if (code === 'auth/popup-closed-by-user') {
        // Ventana cerrada por el usuario, sin error ruidoso
      } else if (
        code === 'auth/operation-not-allowed' ||
        code === 'auth/configuration-not-found'
      ) {
        setError(
          'El acceso con Google no está habilitado en tu consola Firebase. Ve a Firebase Console -> Authentication -> Método de acceso y habilita "Google".'
        )
      } else if (code === 'auth/unauthorized-domain') {
        setError(
          'Dominio no autorizado en Firebase. Añade "localhost" a la lista de Dominios autorizados en Authentication -> Configuración.'
        )
      } else {
        setError(authError.message || 'Error al autenticarse con Google.')
      }
    }
    setSubmitting(false)
  }

  return (
    <div className='min-h-screen bg-gray-950 flex items-center justify-center p-4'>
      {/* Decoración de fondo */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl' />
      </div>

      <div className='relative w-full max-w-md'>
        {/* Card glassmorphism */}
        <div className='bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl'>
          {/* Logo / Header */}
          <div className='text-center mb-6'>
            <div className='inline-flex items-center justify-center w-14 h-14 bg-brand-600/20 border border-brand-500/30 rounded-2xl mb-4'>
              <Lock size={24} className='text-brand-400' />
            </div>
            <h1 className='font-display text-2xl font-bold text-gray-100'>
              Panel Admin
            </h1>
            <p className='text-gray-500 text-sm mt-1'>Acceso exclusivo al administrador</p>
          </div>

          {/* Botón de Google Sign-In */}
          <button
            type='button'
            onClick={handleGoogleSignIn}
            disabled={submitting}
            id='login-google-btn'
            className='w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-50'
          >
            <svg className='w-5 h-5 shrink-0' viewBox='0 0 24 24'>
              <path
                fill='#4285F4'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='#34A853'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='#FBBC05'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z'
              />
              <path
                fill='#EA4335'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
              />
            </svg>
            <span className='text-sm'>Continuar con Google</span>
          </button>

          {/* Divisor estético */}
          <div className='relative flex items-center justify-center my-6'>
            <div className='border-t border-gray-800 w-full' />
            <span className='bg-gray-900/90 px-3 text-[11px] text-gray-500 uppercase tracking-widest shrink-0 font-medium'>
              o con correo
            </span>
            <div className='border-t border-gray-800 w-full' />
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className='space-y-4' id='login-form'>
            <div>
              <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5' htmlFor='login-email'>
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
              <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5' htmlFor='login-password'>
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
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1'
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className='flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-left'>
                <AlertCircle size={16} className='text-red-400 mt-0.5 shrink-0' />
                <p className='text-red-400 text-xs sm:text-sm leading-relaxed'>{error}</p>
              </div>
            )}

            <button
              type='submit'
              id='login-submit'
              disabled={submitting}
              className='w-full btn-primary flex items-center justify-center gap-2 py-3.5 mt-2'
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
              className='text-gray-500 hover:text-gray-300 text-xs transition-colors'
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
