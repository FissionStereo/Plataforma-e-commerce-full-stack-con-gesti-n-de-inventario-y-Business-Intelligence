import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Catalog from './pages/Catalog'
import Account from './pages/Account'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import ProductDetail from './pages/ProductDetail'

const Admin = lazy(() => import('./pages/Admin'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/producto/:slug" element={<ProductDetail />} />
        <Route path="/cuenta" element={<Account />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/admin" element={<Suspense fallback={<div className="route-loader">Preparando Nova Admin…</div>}><Admin /></Suspense>} />
    </Routes>
  )
}
