import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export const SyncStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const [showBriefly, setShowBriefly] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show "Back online" briefly
      setShowBriefly(true);
      setTimeout(() => setShowBriefly(false), 3000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Poll pending mutations
  const checkPending = useCallback(() => {
    const mutations = queryClient.getMutationCache().getAll();
    const pending = mutations.filter(m => m.state.status === 'pending').length;
    setPendingCount(pending);
  }, [queryClient]);

  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, 2000);
    return () => clearInterval(interval);
  }, [checkPending]);

  // Only show when offline, syncing, or briefly after coming back online
  if (isOnline && pendingCount === 0 && !showBriefly) return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border",
      !isOnline ? "bg-destructive/10 border-destructive/30" :
      pendingCount > 0 ? "bg-yellow-500/10 border-yellow-500/30" :
      "bg-green-500/10 border-green-500/30"
    )}>
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">Offline</span>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-xs">{pendingCount} pending</Badge>
          )}
        </>
      ) : pendingCount > 0 ? (
        <>
          <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />
          <span className="text-sm font-medium text-yellow-600">Syncing {pendingCount}...</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-600">Back online</span>
        </>
      )}
    </div>
  );
};
