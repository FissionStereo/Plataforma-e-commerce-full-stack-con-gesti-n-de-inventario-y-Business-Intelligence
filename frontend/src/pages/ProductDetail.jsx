import { ArrowLeft, Check, ChevronRight, Heart, Minus, Plus, RefreshCw, ShieldCheck, Star, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatMoney, getProduct, getProducts } from '../api'
import ProductCard from '../components/ProductCard'
import ProductVisual from '../components/ProductVisual'
import { useShop } from '../context/ShopContext'

export default function ProductDetail() {
  const { slug } = useParams()
  const { addToCart } = useShop()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setProduct(null)
    getProduct(slug).then((item) => {
      setProduct(item)
      return getProducts({ category: item.category.slug })
    }).then((items) => setRelated(items.filter((item) => item.slug !== slug).slice(0, 4))).catch(() => setError(true))
  }, [slug])

  if (error) return <div className="not-found container"><h1>Producto no encontrado</h1><Link to="/catalogo" className="primary-button">Volver al catálogo</Link></div>
  if (!product) return <div className="detail-loading container"><div /><div /></div>

  return (
    <div className="product-detail-page">
      <div className="container detail-breadcrumb"><Link to="/catalogo"><ArrowLeft size={15} /> Catálogo</Link><ChevronRight size={14} /><span>{product.category.name}</span><ChevronRight size={14} /><strong>{product.name}</strong></div>
      <section className="container product-detail-grid">
        <div className="detail-gallery">
          {product.discount > 0 && <span className="detail-discount">AHORRA {product.discount}%</span>}
          <ProductVisual type={product.image} />
          <div className="gallery-dots"><i className="active" /><i /><i /></div>
        </div>
        <div className="detail-info">
          <span className="product-brand">{product.brand} · {product.sku}</span>
          <h1>{product.name}</h1>
          <p className="detail-lead">{product.short_description}</p>
          <div className="detail-rating"><span><Star fill="currentColor" size={16} /> {product.rating}</span><a href="#descripcion">{product.reviews} reseñas</a><span className="stock-ok"><Check size={14} /> En stock</span></div>
          <div className="detail-price"><strong>{formatMoney(product.price)}</strong>{product.original_price && <del>{formatMoney(product.original_price)}</del>}<span>Precio online</span></div>
          <p className="installments">Hasta <strong>12 cuotas sin intereses</strong> con tarjetas seleccionadas.</p>
          <div className="detail-divider" />
          <div className="quantity-label"><strong>Cantidad</strong><span>{product.stock} unidades disponibles</span></div>
          <div className="detail-buy-row">
            <div className="detail-quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}><Plus /></button></div>
            <button className="primary-button add-detail" onClick={() => addToCart(product, quantity)}>Agregar al carrito</button>
            <button className="detail-wish" aria-label="Favorito"><Heart /></button>
          </div>
          <div className="delivery-box">
            <div><Truck /><p><strong>Envío gratis a todo Lima</strong><span>Recíbelo entre mañana y pasado.</span></p><button>Calcular</button></div>
            <div><RefreshCw /><p><strong>Cambios sin complicaciones</strong><span>Tienes 30 días para decidir.</span></p></div>
            <div><ShieldCheck /><p><strong>Compra 100% protegida</strong><span>Pagos y datos siempre seguros.</span></p></div>
          </div>
        </div>
      </section>
      <section className="detail-description" id="descripcion">
        <div className="container description-grid"><div><span className="eyebrow">CONOCE CADA DETALLE</span><h2>Diseñado para acompañar tu ritmo.</h2></div><div><p>{product.description}</p><ul><li><Check /> Garantía oficial de 12 meses</li><li><Check /> Producto nuevo y sellado</li><li><Check /> Soporte posventa especializado</li></ul></div></div>
      </section>
      {!!related.length && <section className="section container"><div className="section-heading"><div><span className="eyebrow">TAMBIÉN TE PUEDE GUSTAR</span><h2>Más para descubrir</h2></div></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    </div>
  )
}

