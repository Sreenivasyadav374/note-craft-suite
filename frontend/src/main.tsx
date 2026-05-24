import { createRoot } from 'react-dom/client'
import React, { Suspense } from 'react'
import './index.css'

// ✅ Lazy load the main App bundle
const App = React.lazy(() => import('./App.tsx'))

const root = createRoot(document.getElementById('root')!)

// ✅ Show lightweight splash while JS loads
root.render(
  <Suspense fallback={<div style={{
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem'
  }}>Loading NoteCraft...</div>}>
    <App />
  </Suspense>
)

// ✅ Delay service worker registration slightly (avoid blocking)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => console.log('[SW] Registered:', reg.scope))
        .catch((err) => console.log('[SW] Registration failed:', err))
    }, 3000)
  })
}
