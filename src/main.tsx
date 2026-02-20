import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PropertyProvider } from './contexts/PropertyContext'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import localforage from 'localforage'

// Configure localforage for offline data storage
localforage.config({
  name: 'str-manager',
  storeName: 'offline_cache',
});

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
});

// Persist query cache to localStorage for offline access
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'str-query-cache',
  throttleTime: 1000,
});

// Process queued mutations when coming back online
window.addEventListener('online', () => {
  console.log('Back online - refreshing data');
  queryClient.invalidateQueries();
});

// Enable dark mode
document.documentElement.classList.add('dark')

createRoot(document.getElementById("root")!).render(
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
  >
    <PropertyProvider>
      <App />
    </PropertyProvider>
  </PersistQueryClientProvider>
);
