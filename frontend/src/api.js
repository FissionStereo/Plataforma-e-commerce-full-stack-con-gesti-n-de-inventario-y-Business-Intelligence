export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'Ocurrió un error inesperado' }))
    throw new Error(body.detail || 'No se pudo completar la operación')
  }

  if (response.status === 204) return null
  return response.json()
}

export function getCategories() {
  return request('/categories')
}

export function getProducts(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  return request(`/products${search.size ? `?${search}` : ''}`)
}

export function getProduct(slug) {
  return request(`/products/${slug}`)
}

export function createOrder(payload) {
  return request('/orders', { method: 'POST', body: JSON.stringify(payload) })
}

export function loginAdmin(email, password) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function loginCustomer(email, password) {
  return request('/customer/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function registerCustomer(payload) {
  return request('/customer/register', { method: 'POST', body: JSON.stringify(payload) })
}

export function customerRequest(path, token, options = {}) {
  return request(`/customer${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  })
}

export function adminRequest(path, token, options = {}) {
  return request(`/admin${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  })
}

export function formatMoney(value) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 }).format(value || 0)
}
