import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PropertyProvider } from './contexts/PropertyContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Configure offline-first query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: true,
      retry: 3,
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 3,
    }
  }
})

// Enable dark mode
document.documentElement.classList.add('dark')

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <PropertyProvider>
      <App />
    </PropertyProvider>
  </QueryClientProvider>
);
