import { ArrowLeft, CheckCircle2, ChevronRight, CreditCard, LockKeyhole, MapPin, PackageCheck, ShieldCheck, Smartphone, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createOrder, formatMoney } from '../api'
import ProductVisual from '../components/ProductVisual'
import { useShop } from '../context/ShopContext'

const initialForm = { name: '', email: '', phone: '', address: '', district: '' }

export default function Checkout() {
  const { cart, subtotal, clearCart, customerSession } = useShop()
  const customer = customerSession?.user
  const [form, setForm] = useState(() => customer ? {
    name: customer.name || '', email: customer.email || '', phone: customer.phone || '',
    address: customer.address || '', district: customer.district || '',
  } : initialForm)
  const [payment, setPayment] = useState('card')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)
  const shipping = subtotal >= 149 ? 0 : 14.9

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true)
    try {
      const created = await createOrder({ customer: form, payment_method: payment, items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })) })
      setOrder(created); clearCart(); window.scrollTo(0, 0)
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }

  if (order) return (
    <div className="checkout-success container">
      <div className="success-icon"><CheckCircle2 /></div><span className="eyebrow">COMPRA CONFIRMADA</span><h1>¡Gracias, {order.customer.name.split(' ')[0]}!</h1><p>Tu pedido <strong>{order.number}</strong> ya está en marcha. Enviamos la confirmación a {order.customer.email}.</p>
      <div className="order-progress"><div className="done"><i><CheckCircle2 /></i><strong>Confirmado</strong><span>Ahora</span></div><span /><div><i><PackageCheck /></i><strong>Preparando</strong><span>Muy pronto</span></div><span /><div><i><MapPin /></i><strong>En camino</strong><span>1–2 días</span></div></div>
      <div className="success-summary"><span>Total pagado</span><strong>{formatMoney(order.total)}</strong></div>
      <Link to="/catalogo" className="primary-button">Seguir explorando <ChevronRight /></Link>
    </div>
  )

  if (!cart.length) return <div className="empty-checkout container"><span><WalletCards /></span><h1>Aún no hay nada por pagar</h1><p>Tu próxima compra favorita puede estar a un clic.</p><Link className="primary-button" to="/catalogo">Explorar productos</Link></div>

  return (
    <div className="checkout-page">
      <div className="container checkout-top"><Link to="/catalogo"><ArrowLeft /> Seguir comprando</Link><div className="checkout-brand"><i /><span>NOVA<strong>MARKET</strong></span></div><span><LockKeyhole /> Pago seguro</span></div>
      <div className="container checkout-grid">
        <form className="checkout-form" onSubmit={submit}>
          <div className="checkout-step"><div className="step-number">1</div><div className="step-content"><h2>¿Dónde entregamos?</h2><p>Usaremos estos datos para coordinar tu pedido.</p><div className="form-grid"><label className="full-field">Nombre completo<input name="name" required minLength="3" value={form.name} onChange={change} placeholder="Ej. Andrea Torres" /></label><label>Correo electrónico<input name="email" required type="email" value={form.email} onChange={change} placeholder="andrea@email.com" /></label><label>Celular<input name="phone" required minLength="7" value={form.phone} onChange={change} placeholder="999 999 999" /></label><label className="full-field">Dirección<input name="address" required minLength="5" value={form.address} onChange={change} placeholder="Av., calle, número y referencia" /></label><label>Distrito<input name="district" required minLength="2" value={form.district} onChange={change} placeholder="Miraflores" /></label></div></div></div>
          <div className="checkout-step"><div className="step-number">2</div><div className="step-content"><h2>Elige cómo pagar</h2><p>Esta demo no procesa cobros reales.</p><div className="payment-options">
            <label className={payment === 'card' ? 'active' : ''}><input type="radio" name="payment" checked={payment === 'card'} onChange={() => setPayment('card')} /><span><CreditCard /></span><div><strong>Tarjeta débito o crédito</strong><small>Visa, Mastercard y Amex</small></div><i /></label>
            <label className={payment === 'yape' ? 'active' : ''}><input type="radio" name="payment" checked={payment === 'yape'} onChange={() => setPayment('yape')} /><span><Smartphone /></span><div><strong>Yape o Plin</strong><small>Paga desde tu celular</small></div><i /></label>
            <label className={payment === 'cash' ? 'active' : ''}><input type="radio" name="payment" checked={payment === 'cash'} onChange={() => setPayment('cash')} /><span><WalletCards /></span><div><strong>Pago contra entrega</strong><small>Disponible en zonas seleccionadas</small></div><i /></label>
          </div></div></div>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button checkout-submit" disabled={loading}>{loading ? 'Confirmando tu compra…' : `Confirmar compra · ${formatMoney(subtotal + shipping)}`} <LockKeyhole /></button>
        </form>
        <aside className="checkout-summary"><h2>Tu pedido <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></h2><div className="checkout-items">{cart.map((item) => <div className="checkout-item" key={item.id}><ProductVisual type={item.image} compact /><div><span>{item.brand}</span><strong>{item.name}</strong><small>Cantidad: {item.quantity}</small></div><b>{formatMoney(item.price * item.quantity)}</b></div>)}</div><div className="summary-lines"><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><div><span>Envío</span><strong className={shipping === 0 ? 'free' : ''}>{shipping === 0 ? 'Gratis' : formatMoney(shipping)}</strong></div><div className="summary-total"><span>Total</span><strong>{formatMoney(subtotal + shipping)}</strong></div></div><div className="secure-note"><ShieldCheck /><p><strong>Compra protegida</strong><span>Tus datos viajan cifrados y seguros.</span></p></div></aside>
      </div>
    </div>
  )
}
