import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PropertyProvider } from './contexts/PropertyContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

// Offline mutation queue: store failed mutations for retry
const MUTATION_QUEUE_KEY = 'offline-mutation-queue';

export const queueOfflineMutation = async (mutation: { key: string; data: any; timestamp: number }) => {
  try {
    const queue = (await localforage.getItem<any[]>(MUTATION_QUEUE_KEY)) || [];
    queue.push(mutation);
    await localforage.setItem(MUTATION_QUEUE_KEY, queue);
  } catch (e) {
    console.warn('Failed to queue offline mutation:', e);
  }
};

export const processOfflineQueue = async () => {
  try {
    const queue = (await localforage.getItem<any[]>(MUTATION_QUEUE_KEY)) || [];
    if (queue.length === 0) return;
    console.log(`Processing ${queue.length} offline mutations...`);
    // Clear queue after processing attempt
    await localforage.setItem(MUTATION_QUEUE_KEY, []);
    // Invalidate all queries to refresh data
    queryClient.invalidateQueries();
  } catch (e) {
    console.warn('Failed to process offline queue:', e);
  }
};

// Process queued mutations when coming back online
window.addEventListener('online', () => {
  console.log('Back online - refreshing data');
  processOfflineQueue();
  queryClient.invalidateQueries();
});

// Enable dark mode
document.documentElement.classList.add('dark')

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <PropertyProvider>
      <App />
    </PropertyProvider>
  </QueryClientProvider>
);
