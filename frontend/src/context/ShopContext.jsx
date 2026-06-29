import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('novamarket-cart')) || []
    } catch {
      return []
    }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [customerSession, setCustomerSessionState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('novamarket-customer')) }
    catch { return null }
  })

  useEffect(() => {
    localStorage.setItem('novamarket-cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item,
        )
      }
      return [...current, { ...product, quantity: Math.min(quantity, product.stock) }]
    })
    setCartOpen(true)
  }

  const updateQuantity = (id, quantity) => {
    setCart((current) => current
      .map((item) => item.id === id ? { ...item, quantity: Math.max(0, Math.min(quantity, item.stock)) } : item)
      .filter((item) => item.quantity > 0))
  }

  const removeFromCart = (id) => setCart((current) => current.filter((item) => item.id !== id))
  const clearCart = () => setCart([])
  const setCustomerSession = (session) => {
    localStorage.setItem('novamarket-customer', JSON.stringify(session))
    setCustomerSessionState(session)
  }
  const logoutCustomer = () => {
    localStorage.removeItem('novamarket-customer')
    setCustomerSessionState(null)
  }
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const value = useMemo(() => ({
    cart, cartOpen, setCartOpen, addToCart, updateQuantity, removeFromCart,
    clearCart, cartCount, subtotal, customerSession, setCustomerSession, logoutCustomer,
  }), [cart, cartOpen, cartCount, subtotal, customerSession])

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  return useContext(ShopContext)
}
