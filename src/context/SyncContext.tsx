import React, { createContext, useContext, useEffect, useState } from 'react';
import { SyncState } from '@/types/sync';
import { syncEngine } from '@/services/sync/syncEngine';
import { networkMonitor } from '@/services/sync/networkMonitor';
import { useAuth } from '@/context/AuthContext';

interface SyncContextValue {
  syncStatus: SyncState;
  pendingCount: number;
  lastSyncedAt?: Date;
  lastError?: string;
  isOnline: boolean;
  syncNow: () => Promise<boolean>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncState>('synced');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | undefined>(undefined);
  const [lastError, setLastError] = useState<string | undefined>(undefined);
  const [isOnline, setIsOnline] = useState(networkMonitor.getCachedOnline());

  useEffect(() => {
    const unsubNetwork = networkMonitor.subscribe((online) => {
      setIsOnline(online);
      if (!online) {
        setSyncStatus('offline');
      }
    });

    const unsubSync = syncEngine.subscribe((state) => {
      setSyncStatus(state.status);
      setPendingCount(state.pendingCount);
      setLastSyncedAt(state.lastSyncedAt);
      setLastError(state.lastError);
    });

    return () => {
      unsubNetwork();
      unsubSync();
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      syncEngine.setUserId(user.id);
      void syncEngine.syncNow(user.id);
    } else {
      syncEngine.setUserId(null);
    }
  }, [user?.id]);

  const syncNow = async () => {
    if (!user?.id) return false;
    return syncEngine.syncNow(user.id);
  };

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        pendingCount,
        lastSyncedAt,
        lastError,
        isOnline,
        syncNow,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextValue => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
