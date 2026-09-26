import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    try {
      // Clear potentially corrupt localStorage cart if necessary
      window.location.reload()
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center text-gray-100'>
          <div className='w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-3xl mb-4'>
            🛍️
          </div>
          <h2 className='text-xl font-bold font-display text-gray-100 mb-2'>
            Boutique en línea
          </h2>
          <p className='text-sm text-gray-400 max-w-sm mb-6'>
            Tuvimos un inconveniente temporal al cargar la vista. Toca el botón abajo para recargar la tienda.
          </p>
          <button
            onClick={this.handleReset}
            className='btn-primary py-3 px-6 text-sm font-semibold'
          >
            Recargar tienda
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
