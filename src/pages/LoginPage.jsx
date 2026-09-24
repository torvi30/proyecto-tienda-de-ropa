import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import {
  Eye, EyeOff, LogIn, UserPlus, Lock, AlertCircle,
  CheckCircle2, Mail, Sparkles, KeyRound
} from 'lucide-react'
import useAuth from '../hooks/useAuth'
import Spinner from '../components/shared/Spinner'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const { user, loading, signIn, signUp, signInWithGoogle, resetPassword } = useAuth()

  // Modo: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
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
    setSuccessMsg(null)
    setSubmitting(true)

    const cleanEmail = email.trim()

    // 1. Modo Recuperar Contraseña
    if (mode === 'forgot') {
      const { error: resetErr } = await resetPassword(cleanEmail)
      setSubmitting(false)
      if (resetErr) {
        setError('No pudimos enviar el correo. Verifica que esté bien escrito.')
      } else {
        setSuccessMsg(
          `Te hemos enviado un enlace de restablecimiento a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`
        )
      }
      return
    }

    // 2. Modo Registro
    if (mode === 'register') {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.')
        setSubmitting(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.')
        setSubmitting(false)
        return
      }

      const { error: authError } = await signUp(cleanEmail, password, name.trim())
      setSubmitting(false)

      if (authError) {
        const code = authError.code || ''
        if (code === 'auth/email-already-in-use') {
          setError('Este correo ya está registrado. Intenta iniciar sesión.')
        } else if (code === 'auth/invalid-email') {
          setError('El formato del correo electrónico no es válido.')
        } else if (code === 'auth/weak-password') {
          setError('La contraseña es muy débil. Usa al menos 6 caracteres.')
        } else {
          setError(authError.message || 'Error al crear la cuenta.')
        }
      } else {
        toast.success('¡Cuenta creada! Revisa tu correo para verificar tu token.', {
          icon: '🎉',
          duration: 5000,
        })
        setSuccessMsg(
          '¡Cuenta creada exitosamente! Te hemos enviado un correo de verificación con tu token de activación. Ingresando al panel...'
        )
      }
      return
    }

    // 3. Modo Inicio de Sesión
    const { error: authError } = await signIn(cleanEmail, password)
    setSubmitting(false)

    if (authError) {
      const code = authError.code || ''
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      } else if (code === 'auth/invalid-email') {
        setError('El formato del correo no es válido.')
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Espera unos minutos.')
      } else {
        setError(authError.message || 'Error al iniciar sesión.')
      }
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setSuccessMsg(null)
    setSubmitting(true)

    const { error: authError } = await signInWithGoogle()
    setSubmitting(false)

    if (authError) {
      const code = authError.code || ''
      if (code === 'auth/popup-closed-by-user') {
        // Ventana cerrada sin error ruidoso
      } else if (code === 'auth/unauthorized-domain') {
        setError('Dominio no autorizado en Firebase Console.')
      } else {
        setError(authError.message || 'Error al autenticarse con Google.')
      }
    }
  }

  return (
    <div className='min-h-screen bg-gray-950 flex items-center justify-center p-4 font-sans'>
      {/* Decoración de fondo de lujo */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 left-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl' />
      </div>

      <div className='relative w-full max-w-md'>
        {/* Card glassmorphism */}
        <div className='bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl'>
          {/* Logo / Header */}
          <div className='text-center mb-6'>
            <div className='inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-brand-600/25 to-pink-500/20 border border-brand-500/30 rounded-2xl mb-3 shadow-lg shadow-brand-500/15'>
              <Lock size={22} className='text-brand-400' />
            </div>
            <h1 className='font-display text-2xl font-bold text-gray-100'>
              {mode === 'register'
                ? 'Crear Cuenta'
                : mode === 'forgot'
                ? 'Recuperar Acceso'
                : 'Acceso a la Boutique'}
            </h1>
            <p className='text-gray-400 text-xs sm:text-sm mt-1'>
              {mode === 'register'
                ? 'Regístrate para administrar o comprar con beneficios'
                : mode === 'forgot'
                ? 'Ingresa tu correo para recibir el enlace de cambio de clave'
                : 'Ingresa para gestionar tu inventario y métricas'}
            </p>
          </div>

          {/* Selector de pestañas Iniciar Sesión / Crear Cuenta */}
          {mode !== 'forgot' && (
            <div className='flex items-center bg-gray-950 p-1 rounded-2xl border border-gray-800/80 mb-6'>
              <button
                type='button'
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setSuccessMsg(null)
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'login'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LogIn size={14} />
                <span>Iniciar Sesión</span>
              </button>

              <button
                type='button'
                onClick={() => {
                  setMode('register')
                  setError(null)
                  setSuccessMsg(null)
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'register'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus size={14} />
                <span>Crear Cuenta</span>
              </button>
            </div>
          )}

          {/* Botón de Google Sign-In (Un clic para ambos) */}
          {mode !== 'forgot' && (
            <>
              <button
                type='button'
                onClick={handleGoogleSignIn}
                disabled={submitting}
                id='login-google-btn'
                className='w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-50 text-xs sm:text-sm'
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
                <span>
                  {mode === 'register' ? 'Registrarse con Google' : 'Continuar con Google'}
                </span>
              </button>

              {/* Divisor estético */}
              <div className='relative flex items-center justify-center my-5'>
                <div className='border-t border-gray-800 w-full' />
                <span className='bg-gray-900/90 px-3 text-[11px] text-gray-500 uppercase tracking-widest shrink-0 font-medium'>
                  o con correo
                </span>
                <div className='border-t border-gray-800 w-full' />
              </div>
            </>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className='space-y-4' id='auth-form'>
            {/* Campo Nombre (Solo en registro) */}
            {mode === 'register' && (
              <div className='animate-fade-in'>
                <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5' htmlFor='auth-name'>
                  Nombre Completo
                </label>
                <input
                  id='auth-name'
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Ej: Valentina Tamayo'
                  className='form-input'
                  autoComplete='name'
                />
              </div>
            )}

            {/* Campo Email */}
            <div>
              <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5' htmlFor='auth-email'>
                Correo Electrónico
              </label>
              <input
                id='auth-email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='tu@correo.com'
                required
                className='form-input'
                autoComplete='email'
              />
            </div>

            {/* Campo Contraseña */}
            {mode !== 'forgot' && (
              <div>
                <div className='flex items-center justify-between mb-1.5'>
                  <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block' htmlFor='auth-password'>
                    Contraseña
                  </label>
                  {mode === 'login' && (
                    <button
                      type='button'
                      onClick={() => {
                        setMode('forgot')
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      className='text-brand-400 hover:text-brand-300 text-xs font-medium'
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className='relative'>
                  <input
                    id='auth-password'
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='••••••••'
                    required
                    minLength={6}
                    className='form-input pr-11'
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
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
            )}

            {/* Campo Confirmar Contraseña (Solo en registro) */}
            {mode === 'register' && (
              <div className='animate-fade-in'>
                <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5' htmlFor='auth-confirm-password'>
                  Confirmar Contraseña
                </label>
                <input
                  id='auth-confirm-password'
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='••••••••'
                  required
                  minLength={6}
                  className='form-input'
                  autoComplete='new-password'
                />
              </div>
            )}

            {/* Mensajes de Éxito */}
            {successMsg && (
              <div className='flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 text-left animate-fade-in'>
                <CheckCircle2 size={18} className='text-emerald-400 mt-0.5 shrink-0' />
                <p className='text-emerald-300 text-xs leading-relaxed'>{successMsg}</p>
              </div>
            )}

            {/* Mensajes de Error */}
            {error && (
              <div className='flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-2xl p-3.5 text-left animate-fade-in'>
                <AlertCircle size={18} className='text-red-400 mt-0.5 shrink-0' />
                <p className='text-red-400 text-xs leading-relaxed'>{error}</p>
              </div>
            )}

            {/* Botón principal */}
            <button
              type='submit'
              id='auth-submit'
              disabled={submitting}
              className='w-full btn-primary flex items-center justify-center gap-2 py-3.5 mt-2'
            >
              {submitting ? (
                <Spinner size='sm' />
              ) : mode === 'register' ? (
                <>
                  <UserPlus size={18} />
                  <span>Crear Cuenta con Verificación</span>
                </>
              ) : mode === 'forgot' ? (
                <>
                  <Mail size={18} />
                  <span>Enviar Correo de Recuperación</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Ingresar a la Plataforma</span>
                </>
              )}
            </button>
          </form>

          {/* Enlaces de pie de página */}
          <div className='flex items-center justify-between pt-6 border-t border-gray-800/80 mt-6 text-xs text-gray-500'>
            <Link
              to='/'
              className='hover:text-gray-300 transition-colors'
            >
              ← Volver a la tienda
            </Link>

            {mode === 'forgot' && (
              <button
                type='button'
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setSuccessMsg(null)
                }}
                className='text-brand-400 hover:text-brand-300 font-medium'
              >
                Volver a Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
