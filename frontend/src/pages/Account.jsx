import {
  ArrowRight, CheckCircle2, ChevronDown, CircleUserRound, Clock3, Eye, Heart,
  LockKeyhole, LogOut, MapPin, PackageCheck, Save, ShieldCheck, ShoppingBag,
  Sparkles, UserPlus,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { customerRequest, formatMoney, loginCustomer, registerCustomer } from '../api'
import ProductVisual from '../components/ProductVisual'
import { useShop } from '../context/ShopContext'

const statusLabels = { confirmed: 'Confirmado', preparing: 'Preparando', shipped: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado' }

function CustomerAccess({ onSuccess }) {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [login, setLogin] = useState({ email: 'ana@example.com', password: 'Cliente2026!' })
  const [register, setRegister] = useState({ name: '', email: '', password: '', phone: '', address: '', district: '' })

  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true)
    try {
      const result = mode === 'login'
        ? await loginCustomer(login.email, login.password)
        : await registerCustomer(register)
      onSuccess(result)
    } catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="customer-access-page">
      <div className="container customer-access-grid">
        <div className="customer-access-copy">
          <span className="eyebrow">TU ESPACIO NOVA</span>
          <h1>Todo lo que compras,<br /><em>siempre contigo.</em></h1>
          <p>Revisa tus pedidos, guarda tus datos y continúa exactamente donde lo dejaste.</p>
          <div className="account-benefits">
            <div><span><ShoppingBag /></span><p><strong>Pedidos bajo control</strong><small>Estado y detalle en tiempo real.</small></p></div>
            <div><span><Heart /></span><p><strong>Tu experiencia, a tu manera</strong><small>Datos y preferencias siempre disponibles.</small></p></div>
            <div><span><ShieldCheck /></span><p><strong>Información protegida</strong><small>Sesiones seguras con autenticación JWT.</small></p></div>
          </div>
          <div className="access-art"><span /><span /><PackageCheck /></div>
        </div>
        <div className="customer-auth-card">
          <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>Ingresar</button><button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>Crear cuenta</button></div>
          <div className="auth-card-heading"><span>{mode === 'login' ? <CircleUserRound /> : <UserPlus />}</span><h2>{mode === 'login' ? 'Qué bueno verte otra vez' : 'Empieza tu experiencia Nova'}</h2><p>{mode === 'login' ? 'Ingresa para ver tus compras y datos guardados.' : 'Completa tus datos y crea tu cuenta en segundos.'}</p></div>
          <form onSubmit={submit} className="customer-auth-form">
            {mode === 'register' && <label>Nombre completo<input required minLength="3" value={register.name} onChange={(event) => setRegister({ ...register, name: event.target.value })} placeholder="Andrea Torres" /></label>}
            <label>Correo electrónico<input required type="email" value={mode === 'login' ? login.email : register.email} onChange={(event) => mode === 'login' ? setLogin({ ...login, email: event.target.value }) : setRegister({ ...register, email: event.target.value })} placeholder="tu@email.com" /></label>
            <label>Contraseña<input required type="password" minLength="8" value={mode === 'login' ? login.password : register.password} onChange={(event) => mode === 'login' ? setLogin({ ...login, password: event.target.value }) : setRegister({ ...register, password: event.target.value })} placeholder="Mínimo 8 caracteres" /></label>
            {mode === 'register' && <><label>Celular<input required minLength="7" value={register.phone} onChange={(event) => setRegister({ ...register, phone: event.target.value })} placeholder="999 999 999" /></label><div className="auth-form-row"><label>Distrito<input value={register.district} onChange={(event) => setRegister({ ...register, district: event.target.value })} placeholder="Miraflores" /></label><label>Dirección<input value={register.address} onChange={(event) => setRegister({ ...register, address: event.target.value })} placeholder="Av. Principal 123" /></label></div></>}
            {mode === 'login' && <div className="demo-customer"><Sparkles /><p><strong>Cuenta de demostración</strong><span>ana@example.com · Cliente2026!</span></p></div>}
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button full" disabled={loading}>{loading ? 'Procesando…' : mode === 'login' ? 'Ingresar a mi cuenta' : 'Crear mi cuenta'} <ArrowRight /></button>
          </form>
          <p className="auth-legal"><LockKeyhole /> Tus datos están protegidos y no se comparten.</p>
        </div>
      </div>
    </div>
  )
}

export default function Account() {
  const { customerSession, setCustomerSession, logoutCustomer } = useShop()
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('orders')
  const [expanded, setExpanded] = useState(null)
  const [profile, setProfile] = useState(customerSession?.user || {})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const token = customerSession?.access_token
  useEffect(() => {
    if (!token) return
    Promise.all([customerRequest('/me', token), customerRequest('/orders', token)])
      .then(([user, rows]) => { setProfile(user); setOrders(rows); setCustomerSession({ ...customerSession, user }) })
      .catch(() => logoutCustomer())
  }, [token])

  if (!customerSession) return <CustomerAccess onSuccess={setCustomerSession} />

  const saveProfile = async (event) => {
    event.preventDefault(); setLoading(true); setMessage('')
    try {
      const updated = await customerRequest('/me', token, { method: 'PATCH', body: JSON.stringify({ name: profile.name, phone: profile.phone, address: profile.address, district: profile.district }) })
      setProfile(updated); setCustomerSession({ ...customerSession, user: updated }); setMessage('Tus datos se guardaron correctamente.')
    } catch (error) { setMessage(error.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="account-page">
      <section className="account-hero"><div className="container"><div className="account-avatar">{profile.name?.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><span className="eyebrow">MI CUENTA</span><h1>Hola, {profile.name?.split(' ')[0]}</h1><p>{profile.email}</p></div><button onClick={logoutCustomer}><LogOut /> Cerrar sesión</button></div></section>
      <div className="container account-layout">
        <aside className="account-nav"><button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}><ShoppingBag /> Mis pedidos <span>{orders.length}</span></button><button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}><CircleUserRound /> Mis datos</button><button className={tab === 'addresses' ? 'active' : ''} onClick={() => setTab('addresses')}><MapPin /> Direcciones</button></aside>
        <main className="account-content">
          {tab === 'orders' && <><div className="account-section-heading"><div><span className="eyebrow">HISTORIAL</span><h2>Mis pedidos</h2><p>Sigue cada compra desde aquí.</p></div><Link to="/catalogo" className="text-button">Seguir comprando <ArrowRight /></Link></div>{orders.length ? <div className="customer-orders">{orders.map((order) => <article className={`customer-order ${expanded === order.id ? 'expanded' : ''}`} key={order.id}><button className="customer-order-head" onClick={() => setExpanded(expanded === order.id ? null : order.id)}><span className={`customer-status status-${order.status}`}><PackageCheck /></span><div><small>Pedido {order.number}</small><strong>{new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></div><span className={`status-pill status-${order.status}`}>{statusLabels[order.status]}</span><b>{formatMoney(order.total)}</b><ChevronDown /></button>{expanded === order.id && <div className="customer-order-detail"><div className="customer-order-items">{order.items.map((item) => <div key={item.product_id}><ProductVisual compact /><p><strong>{item.name}</strong><span>{item.quantity} × {formatMoney(item.price)}</span></p><b>{formatMoney(item.subtotal)}</b></div>)}</div><div className="order-delivery-note"><Clock3 /><p><strong>{order.status === 'delivered' ? 'Pedido entregado' : 'Estamos preparando tu compra'}</strong><span>Recibirás una actualización cuando cambie de estado.</span></p></div></div>}</article>)}</div> : <div className="account-empty"><ShoppingBag /><h3>Aún no tienes pedidos</h3><p>Cuando hagas tu primera compra aparecerá aquí.</p><Link to="/catalogo" className="primary-button">Explorar productos</Link></div>}</>}
          {tab === 'profile' && <><div className="account-section-heading"><div><span className="eyebrow">INFORMACIÓN PERSONAL</span><h2>Mis datos</h2><p>Mantén tu información actualizada.</p></div></div><form className="profile-form" onSubmit={saveProfile}><label>Nombre completo<input value={profile.name || ''} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label>Correo electrónico<input value={profile.email || ''} disabled /></label><label>Celular<input value={profile.phone || ''} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label><label>Distrito<input value={profile.district || ''} onChange={(event) => setProfile({ ...profile, district: event.target.value })} /></label><label className="wide">Dirección<input value={profile.address || ''} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></label>{message && <div className="profile-message"><CheckCircle2 /> {message}</div>}<button className="primary-button" disabled={loading}><Save /> {loading ? 'Guardando…' : 'Guardar cambios'}</button></form></>}
          {tab === 'addresses' && <><div className="account-section-heading"><div><span className="eyebrow">ENTREGAS</span><h2>Dirección principal</h2><p>La usaremos para completar tu compra más rápido.</p></div></div><div className="address-card"><span><MapPin /></span><div><strong>{profile.address || 'Agrega una dirección'}</strong><p>{profile.district || 'Distrito pendiente'} · Lima, Perú</p><small>Dirección predeterminada</small></div><button onClick={() => setTab('profile')}>Editar</button></div></>}
        </main>
      </div>
    </div>
  )
}

