import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode is disabled in production builds by default. Removing here avoids double effects during dev.
createRoot(document.getElementById('root')!).render(
  <App />,
)
