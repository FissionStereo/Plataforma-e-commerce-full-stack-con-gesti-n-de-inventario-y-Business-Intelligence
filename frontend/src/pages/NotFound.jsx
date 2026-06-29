import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return <div className="not-found container"><span>404</span><h1>Esta página se fue de compras.</h1><p>No pudimos encontrar lo que buscas, pero el catálogo sigue lleno de buenas ideas.</p><Link to="/" className="primary-button"><ArrowLeft /> Volver al inicio</Link></div>
}

