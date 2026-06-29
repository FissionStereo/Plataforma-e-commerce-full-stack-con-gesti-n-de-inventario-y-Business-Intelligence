import { ChevronDown, Menu, Search, ShieldCheck, ShoppingBag, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import CartDrawer from './CartDrawer'

export default function Layout() {
  const { cartCount, setCartOpen, customerSession } = useShop()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const apiDocsUrl = import.meta.env.VITE_API_DOCS_URL || 'http://127.0.0.1:8000/docs'

  const submitSearch = (event) => {
    event.preventDefault()
    navigate(`/catalogo${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`)
    setMenuOpen(false)
  }

  return (
    <div className="site-shell">
      <div className="promo-bar">
        <span>Envío gratis desde S/ 149</span>
        <span className="promo-center">Compra hoy. Disfruta hoy.</span>
        <Link to="/admin"><ShieldCheck size={14} /> Portal administrativo</Link>
      </div>
      <header className="site-header">
        <div className="header-main container">
          <button className="mobile-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menú">
            {menuOpen ? <X /> : <Menu />}
          </button>
          <Link to="/" className="brand" aria-label="NovaMarket inicio">
            <span className="brand-mark"><i /><i /></span>
            <span>NOVA<strong>MARKET</strong></span>
          </Link>
          <form className="header-search" onSubmit={submitSearch}>
            <Search size={19} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="¿Qué estás buscando hoy?" aria-label="Buscar productos" />
            <button type="submit">Buscar</button>
          </form>
          <div className="header-actions">
            <Link to="/cuenta" className="header-action"><UserRound /><span>{customerSession ? customerSession.user.name.split(' ')[0] : 'Mi cuenta'}<small>{customerSession ? 'Ver mis pedidos' : 'Hola, ingresa'}</small></span></Link>
            <button className="header-action cart-action" onClick={() => setCartOpen(true)}>
              <ShoppingBag /><span>Carrito<small>{cartCount ? `${cartCount} producto${cartCount > 1 ? 's' : ''}` : 'Está vacío'}</small></span>
              {cartCount > 0 && <b>{cartCount}</b>}
            </button>
          </div>
        </div>
        <nav className={`main-nav container ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/catalogo" onClick={() => setMenuOpen(false)} className="all-products"><Menu size={17} /> Todos los productos <ChevronDown size={15} /></NavLink>
          <NavLink to="/catalogo?categoria=tecnologia" onClick={() => setMenuOpen(false)}>Tecnología</NavLink>
          <NavLink to="/catalogo?categoria=hogar" onClick={() => setMenuOpen(false)}>Hogar</NavLink>
          <NavLink to="/catalogo?categoria=moda" onClick={() => setMenuOpen(false)}>Moda</NavLink>
          <NavLink to="/catalogo?categoria=deportes" onClick={() => setMenuOpen(false)}>Deportes</NavLink>
          <NavLink to="/catalogo?categoria=belleza" onClick={() => setMenuOpen(false)}>Belleza</NavLink>
          <NavLink to="/catalogo?ofertas=1" onClick={() => setMenuOpen(false)} className="nav-offer">Ofertas <span>HOT</span></NavLink>
        </nav>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Link to="/" className="brand brand-light"><span className="brand-mark"><i /><i /></span><span>NOVA<strong>MARKET</strong></span></Link>
            <p>Una tienda por departamentos creada para comprar más fácil, descubrir mejor y vivir distinto.</p>
          </div>
          <div><h4>Compra</h4><Link to="/catalogo">Todos los productos</Link><Link to="/catalogo?categoria=tecnologia">Tecnología</Link><Link to="/catalogo?categoria=hogar">Hogar</Link></div>
          <div><h4>Ayuda</h4><a href="#envios">Envíos y entregas</a><a href="#cambios">Cambios y devoluciones</a><a href="#contacto">Contáctanos</a></div>
          <div><h4>Proyecto</h4><Link to="/admin">Panel administrativo</Link><a href={apiDocsUrl} target="_blank" rel="noreferrer">Documentación API</a><span>Demo de portafolio</span></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 NovaMarket. Proyecto demostrativo.</span><span>Hecho con React · FastAPI · PostgreSQL</span></div>
      </footer>
      <CartDrawer />
    </div>
  )
}
