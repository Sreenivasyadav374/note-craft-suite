import { createRoot } from 'react-dom/client'
import React, { Suspense } from 'react'
import { withLDProvider } from 'launchdarkly-react-client-sdk'
import './index.css'

// ✅ Lazy load the main App bundle
const App = React.lazy(() => import('./App.tsx'))

const LDApp = withLDProvider({
  clientSideID: '[PASTE_YOUR_CLIENT_SIDE_ID_HERE]',
  context: {
    kind: 'user',
    key: 'anonymous-user',
  },
})(function LDWrappedApp() {
  return (
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
})

const root = createRoot(document.getElementById('root')!)

root.render(<LDApp />)

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
