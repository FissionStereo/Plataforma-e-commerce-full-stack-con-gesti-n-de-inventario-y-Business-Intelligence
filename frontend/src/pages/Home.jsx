import { ArrowRight, BadgeCheck, Box, CreditCard, Headphones, RefreshCw, Sparkles, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, getProducts } from '../api'
import ProductCard from '../components/ProductCard'
import ProductVisual from '../components/ProductVisual'

const benefits = [
  { icon: Truck, title: 'Envío gratis', text: 'En compras desde S/ 149' },
  { icon: CreditCard, title: 'Compra segura', text: 'Tus pagos están protegidos' },
  { icon: RefreshCw, title: 'Cambios simples', text: 'Hasta 30 días' },
  { icon: Headphones, title: 'Estamos contigo', text: 'Soporte cuando lo necesites' },
]

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    Promise.all([getProducts({ featured: true }), getCategories()])
      .then(([products, categoryRows]) => {
        setFeatured(products)
        setCategories(categoryRows)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker"><Sparkles size={15} /> SEMANA NOVA · HASTA 30% DSCTO.</span>
            <h1>Lo que te mueve,<br /><em>más cerca.</em></h1>
            <p>Tecnología, hogar y estilo elegidos para hacer tus días más simples y un poco más extraordinarios.</p>
            <div className="hero-actions">
              <Link className="primary-button large" to="/catalogo">Descubrir ahora <ArrowRight size={18} /></Link>
              <Link className="text-button" to="/catalogo?ofertas=1">Ver todas las ofertas</Link>
            </div>
            <div className="hero-proof"><BadgeCheck size={18} /><span><strong>+12 mil</strong> compras felices este mes</span><div className="avatar-stack"><i>AT</i><i>DR</i><i>CF</i><i>+</i></div></div>
          </div>
          <div className="hero-art">
            <span className="hero-shape shape-one" /><span className="hero-shape shape-two" />
            <div className="hero-product-card">
              <span className="floating-label top"><small>NUEVO</small>Pulse Max</span>
              <ProductVisual type="headphones" />
              <span className="floating-label bottom"><strong>S/ 349</strong><small>Audio espacial</small></span>
            </div>
            <span className="hero-note">Diseñado para<br /><strong>sentirlo todo.</strong></span>
          </div>
        </div>
      </section>

      <section className="benefit-strip">
        <div className="container benefit-grid">
          {benefits.map(({ icon: Icon, title, text }) => <div key={title}><span><Icon /></span><div><strong>{title}</strong><small>{text}</small></div></div>)}
        </div>
      </section>

      <section className="section container">
        <div className="section-heading"><div><span className="eyebrow">Explora a tu manera</span><h2>Todo lo que te inspira</h2></div><Link className="text-button" to="/catalogo">Ver catálogo <ArrowRight size={17} /></Link></div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <Link to={`/catalogo?categoria=${category.slug}`} className={`category-card category-${index + 1}`} key={category.id} style={{ '--accent': category.accent }}>
              <div><span>{String(index + 1).padStart(2, '0')}</span><h3>{category.name}</h3><p>{category.product_count} {category.product_count === 1 ? 'producto' : 'productos'}</p></div>
              <ProductVisual type={category.icon === 'shirt' ? 'shoes' : category.icon === 'dumbbell' ? 'watch' : category.icon} compact />
              <i><ArrowRight /></i>
            </Link>
          ))}
        </div>
      </section>

      <section className="section featured-section">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">Elegidos por todos</span><h2>Favoritos que valen la pena</h2></div><Link className="text-button" to="/catalogo">Ver todo <ArrowRight size={17} /></Link></div>
          <div className="product-grid">
            {featured.length ? featured.slice(0, 8).map((product) => <ProductCard product={product} key={product.id} />) : [...Array(4)].map((_, index) => <div className="product-skeleton" key={index} />)}
          </div>
        </div>
      </section>

      <section className="section container editorial-grid">
        <article className="editorial-card editorial-tech">
          <div><span className="eyebrow">TECNOLOGÍA QUE SUMA</span><h2>Tu mejor trabajo empieza con mejores herramientas.</h2><Link to="/catalogo?categoria=tecnologia">Explorar tecnología <ArrowRight /></Link></div>
          <ProductVisual type="laptop" />
        </article>
        <article className="editorial-card editorial-home">
          <div><span className="eyebrow">CASA, DULCE CASA</span><h2>Espacios que se sienten realmente tuyos.</h2><Link to="/catalogo?categoria=hogar">Descubrir hogar <ArrowRight /></Link></div>
          <ProductVisual type="lamp" />
        </article>
      </section>

      <section className="newsletter-section">
        <div className="container newsletter-inner">
          <div className="newsletter-icon"><Box /></div>
          <div><span className="eyebrow">ENTÉRATE PRIMERO</span><h2>Lo nuevo llega a tu correo.</h2><p>Ofertas honestas, lanzamientos y una que otra sorpresa.</p></div>
          <form onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="tu@email.com" aria-label="Correo electrónico" /><button>Quiero ser parte <ArrowRight /></button></form>
        </div>
      </section>
    </>
  )
}
