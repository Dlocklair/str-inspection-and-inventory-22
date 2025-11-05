import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export const SyncStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Count pending mutations
  useEffect(() => {
    const mutations = queryClient.getMutationCache().getAll();
    const pending = mutations.filter(m => m.state.status === 'pending').length;
    setPendingCount(pending);
  }, [queryClient]);

  if (isOnline && pendingCount === 0) return null;

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 z-50 shadow-lg border-2",
      !isOnline ? "border-destructive" : "border-warning"
    )}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {!isOnline ? (
            <>
              <WifiOff className="h-5 w-5 text-destructive" />
              <div className="text-sm">
                <div className="font-semibold text-destructive">Offline Mode</div>
                <div className="text-muted-foreground">Changes will sync when online</div>
              </div>
            </>
          ) : pendingCount > 0 ? (
            <>
              <Clock className="h-5 w-5 text-warning animate-pulse" />
              <div className="text-sm">
                <div className="font-semibold text-warning">Syncing...</div>
                <div className="text-muted-foreground">{pendingCount} pending change{pendingCount !== 1 ? 's' : ''}</div>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div className="text-sm">
                <div className="font-semibold text-success">All synced</div>
                <div className="text-muted-foreground">Up to date</div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
