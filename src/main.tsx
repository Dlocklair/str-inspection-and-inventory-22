import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PropertyProvider } from './contexts/PropertyContext'

// Enable dark mode
document.documentElement.classList.add('dark')

createRoot(document.getElementById("root")!).render(
  <PropertyProvider>
    <App />
  </PropertyProvider>
);
