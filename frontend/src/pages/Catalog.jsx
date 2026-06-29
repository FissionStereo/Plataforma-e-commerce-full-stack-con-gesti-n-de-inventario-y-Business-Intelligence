import { ChevronDown, Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCategories, getProducts } from '../api'
import ProductCard from '../components/ProductCard'

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const query = searchParams.get('q') || ''
  const category = searchParams.get('categoria') || ''
  const sort = searchParams.get('orden') || 'featured'

  useEffect(() => { getCategories().then(setCategories).catch(() => {}) }, [])
  useEffect(() => {
    setLoading(true)
    getProducts({ q: query, category, sort }).then(setProducts).finally(() => setLoading(false))
  }, [query, category, sort])

  const title = useMemo(() => {
    if (query) return `Resultados para “${query}”`
    if (category) return categories.find((item) => item.slug === category)?.name || 'Catálogo'
    return 'Todo lo que buscas'
  }, [query, category, categories])

  const update = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value); else next.delete(key)
    setSearchParams(next)
  }

  return (
    <div className="catalog-page container">
      <div className="catalog-breadcrumb">Inicio <span>/</span> Catálogo {category && <><span>/</span> {title}</>}</div>
      <div className="catalog-header">
        <div><span className="eyebrow">COLECCIÓN NOVA</span><h1>{title}</h1><p>{products.length} productos seleccionados</p></div>
        <div className="catalog-search-mobile"><Search /><input value={query} onChange={(event) => update('q', event.target.value)} placeholder="Buscar en catálogo" /></div>
      </div>
      <div className="catalog-toolbar">
        <button className="filter-toggle" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={18} /> Filtros</button>
        <div className="active-filters">
          {category && <button onClick={() => update('categoria', '')}>{title} <X size={14} /></button>}
          {query && <button onClick={() => update('q', '')}>“{query}” <X size={14} /></button>}
        </div>
        <label className="sort-select">Ordenar por:
          <select value={sort} onChange={(event) => update('orden', event.target.value)}>
            <option value="featured">Recomendados</option><option value="price_asc">Menor precio</option><option value="price_desc">Mayor precio</option><option value="rating">Mejor valorados</option><option value="newest">Más recientes</option>
          </select><ChevronDown size={15} />
        </label>
      </div>
      <div className="catalog-layout">
        <aside className={`filter-sidebar ${filtersOpen ? 'mobile-open' : ''}`}>
          <div className="filter-mobile-head"><strong>Filtrar productos</strong><button onClick={() => setFiltersOpen(false)}><X /></button></div>
          <div className="filter-group"><h3>Categorías</h3>
            <label className={!category ? 'selected' : ''}><input type="radio" checked={!category} onChange={() => update('categoria', '')} />Todos <span>{categories.reduce((sum, item) => sum + item.product_count, 0)}</span></label>
            {categories.map((item) => <label key={item.id} className={category === item.slug ? 'selected' : ''}><input type="radio" checked={category === item.slug} onChange={() => { update('categoria', item.slug); setFiltersOpen(false) }} />{item.name}<span>{item.product_count}</span></label>)}
          </div>
          <div className="filter-group"><h3>Disponibilidad</h3><label className="selected"><input type="checkbox" defaultChecked />Disponible ahora</label><label><input type="checkbox" />Próximamente</label></div>
          <div className="filter-promo"><Filter /><strong>Compra con confianza</strong><p>30 días para cambios y devoluciones.</p></div>
        </aside>
        <section className="catalog-results">
          {loading ? <div className="product-grid">{[...Array(8)].map((_, index) => <div className="product-skeleton" key={index} />)}</div>
            : products.length ? <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id} />)}</div>
              : <div className="no-results"><Search /><h2>No encontramos coincidencias</h2><p>Prueba con otro término o explora una categoría diferente.</p><button className="primary-button" onClick={() => setSearchParams({})}>Ver todos los productos</button></div>}
        </section>
      </div>
    </div>
  )
}

