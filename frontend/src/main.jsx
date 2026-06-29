import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { ShopProvider } from './context/ShopContext'
import './styles.css'
import './styles-pages.css'
import './styles-admin.css'
import './styles-v2.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ShopProvider>
        <App />
      </ShopProvider>
    </HashRouter>
  </React.StrictMode>,
)
