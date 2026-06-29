import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../api'
import { useShop } from '../context/ShopContext'
import ProductVisual from './ProductVisual'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, subtotal } = useShop()
  return (
    <>
      <button className={`drawer-backdrop ${cartOpen ? 'visible' : ''}`} onClick={() => setCartOpen(false)} aria-label="Cerrar carrito" />
      <aside className={`cart-drawer ${cartOpen ? 'open' : ''}`} aria-hidden={!cartOpen}>
        <div className="drawer-header">
          <div><span className="eyebrow">Tu selección</span><h2>Carrito <small>{cart.length}</small></h2></div>
          <button className="icon-button" onClick={() => setCartOpen(false)}><X /></button>
        </div>
        <div className="drawer-content">
          {!cart.length ? (
            <div className="empty-cart">
              <span><ShoppingBag size={32} /></span>
              <h3>Tu carrito está esperando</h3>
              <p>Descubre productos elegidos para hacer tus días más simples.</p>
              <Link className="primary-button" to="/catalogo" onClick={() => setCartOpen(false)}>Explorar catálogo</Link>
            </div>
          ) : cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <ProductVisual type={item.image} compact />
              <div className="cart-item-info">
                <span>{item.brand}</span>
                <strong>{item.name}</strong>
                <p>{formatMoney(item.price)}</p>
                <div className="quantity-control">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                </div>
              </div>
              <button className="remove-item" onClick={() => removeFromCart(item.id)} aria-label="Eliminar"><Trash2 size={17} /></button>
            </div>
          ))}
        </div>
        {!!cart.length && (
          <div className="drawer-summary">
            <div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
            <p>{subtotal >= 149 ? 'Tu envío es gratis.' : `Te faltan ${formatMoney(149 - subtotal)} para envío gratis.`}</p>
            <Link className="primary-button full" to="/checkout" onClick={() => setCartOpen(false)}>
              Continuar compra <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}

