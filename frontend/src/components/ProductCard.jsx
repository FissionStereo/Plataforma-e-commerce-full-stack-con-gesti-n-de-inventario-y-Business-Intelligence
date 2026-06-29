import { Heart, Plus, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../api'
import { useShop } from '../context/ShopContext'
import ProductVisual from './ProductVisual'

export default function ProductCard({ product }) {
  const { addToCart } = useShop()
  return (
    <article className="product-card">
      <Link to={`/producto/${product.slug}`} className="product-card-visual" aria-label={`Ver ${product.name}`}>
        {product.discount > 0 && <span className="discount-pill">-{product.discount}%</span>}
        <button className="wish-button" type="button" aria-label="Agregar a favoritos" onClick={(event) => event.preventDefault()}>
          <Heart size={18} />
        </button>
        <ProductVisual type={product.image} />
      </Link>
      <div className="product-card-body">
        <span className="product-brand">{product.brand}</span>
        <Link to={`/producto/${product.slug}`} className="product-name">{product.name}</Link>
        <div className="rating-row"><Star size={14} fill="currentColor" /> {product.rating} <span>({product.reviews})</span></div>
        <div className="price-row">
          <div>
            <strong>{formatMoney(product.price)}</strong>
            {product.original_price && <del>{formatMoney(product.original_price)}</del>}
          </div>
          <button className="quick-add" onClick={() => addToCart(product)} disabled={!product.stock} aria-label={`Agregar ${product.name}`}>
            <Plus size={19} />
          </button>
        </div>
      </div>
    </article>
  )
}

