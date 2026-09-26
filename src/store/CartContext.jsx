import { createContext, useContext, useState, useEffect } from 'react'

const CART_KEY = 'boutique_cart'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY))
      if (Array.isArray(parsed)) {
        // Validate each item to avoid runtime errors from corrupted entries
        return parsed.filter(
          (i) => i && i.product && i.product.id && typeof i.product.price !== 'undefined'
        )
      }
      return []
    } catch {
      return []
    }
  })
  const [isOpen, setIsOpen] = useState(false)

  // Persist to localStorage whenever cart items change
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } catch (e) {
      console.warn('Failed to persist cart to localStorage:', e)
    }
  }, [items])

  const addItem = (product, size = 'Única', openDrawer = false) => {
    if (!product || !product.id) return

    setItems((prev) => {
      const existing = prev.find(
        (i) => i?.product?.id === product.id && i.size === size
      )
      if (existing) {
        return prev.map((i) =>
          i?.product?.id === product.id && i.size === size
            ? { ...i, quantity: (Number(i.quantity) || 1) + 1 }
            : i
        )
      }
      return [...prev, { product, size, quantity: 1 }]
    })

    if (openDrawer) {
      setIsOpen(true)
    }
  }

  const removeItem = (productId, size) => {
    setItems((prev) =>
      prev.filter((i) => !(i?.product?.id === productId && i.size === size))
    )
  }

  const updateQuantity = (productId, size, quantity) => {
    if (quantity <= 0) {
      removeItem(productId, size)
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i?.product?.id === productId && i.size === size
          ? { ...i, quantity: Number(quantity) }
          : i
      )
    )
  }

  const clearCart = () => setItems([])

  const totalItems = items.reduce((sum, i) => sum + (Number(i?.quantity) || 0), 0)
  const totalPrice = items.reduce(
    (sum, i) => sum + (Number(i?.product?.price) || 0) * (Number(i?.quantity) || 1),
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
