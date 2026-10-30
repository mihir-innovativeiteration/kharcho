import { sqliteService } from '../storage/sqliteService';
import { syncApiClient } from '../api/syncApi';
import { networkMonitor } from './networkMonitor';
import { SyncState, OutboxItem } from '@/types/sync';

type SyncListener = (state: {
  status: SyncState;
  pendingCount: number;
  lastSyncedAt?: Date;
  lastError?: string;
}) => void;

class SyncEngine {
  private status: SyncState = 'synced';
  private pendingCount = 0;
  private lastSyncedAt?: Date;
  private lastError?: string;
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private retryTimeout: any = null;
  private currentUserId: string | null = null;

  constructor() {
    // Listen to network transitions
    networkMonitor.subscribe(async (isOnline) => {
      if (!isOnline) {
        this.status = 'offline';
        this.notify();
      } else if (this.currentUserId) {
        // Automatically trigger sync when coming back online
        void this.syncNow(this.currentUserId);
      }
    });
  }

  public setUserId(userId: string | null) {
    this.currentUserId = userId;
    if (userId) {
      void this.refreshPendingCount(userId);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener({
      status: this.status,
      pendingCount: this.pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener({
          status: this.status,
          pendingCount: this.pendingCount,
          lastSyncedAt: this.lastSyncedAt,
          lastError: this.lastError,
        });
      } catch {
        // ignore subscriber errors
      }
    }
  }

  public async refreshPendingCount(userId: string): Promise<number> {
    try {
      this.pendingCount = await sqliteService.getOutboxCount(userId);
      if (this.pendingCount > 0 && this.status !== 'offline' && !this.isSyncing) {
        this.status = 'pending';
      }
      this.notify();
      return this.pendingCount;
    } catch {
      return 0;
    }
  }

  /**
   * Main synchronization routine
   */
  public async syncNow(userId: string): Promise<boolean> {
    if (this.isSyncing) return false;

    const isOnline = await networkMonitor.isOnline();
    if (!isOnline) {
      this.status = 'offline';
      await this.refreshPendingCount(userId);
      this.notify();
      return false;
    }

    try {
      this.isSyncing = true;
      this.status = 'syncing';
      this.lastError = undefined;
      this.notify();

      // 1. Fetch pending outbox items
      const outboxItems = await sqliteService.getPendingOutboxItems(userId);
      this.pendingCount = outboxItems.length;

      if (outboxItems.length > 0) {
        // Group into batch
        const batch = outboxItems.map((item: OutboxItem) => ({
          operationId: item.operationId,
          entityType: item.entityType,
          entityId: item.entityId,
          operationType: item.operationType,
          clientMutationId: item.clientMutationId,
          expectedVersion: item.expectedVersion,
          payload: item.payload,
        }));

        // Send to backend
        const response = await syncApiClient.processBatchOperations(batch);

        for (const res of response.results) {
          const matchedItem = outboxItems.find((o) => o.operationId === res.operationId);
          if (!matchedItem) continue;

          if (res.status === 'APPLIED') {
            if (matchedItem.operationType === 'CREATE' && res.serverId) {
              await sqliteService.reconcileTransactionServerId(
                matchedItem.entityId,
                res.serverId,
                res.data
              );
            }
            await sqliteService.removeOutboxItem(matchedItem.operationId);
          } else if (res.status === 'CONFLICT') {
            await sqliteService.updateOutboxItemStatus(
              matchedItem.operationId,
              'FAILED',
              res.error || 'Conflict'
            );
            await sqliteService.updateLocalTransaction(
              matchedItem.entityId,
              { syncStatus: 'CONFLICT' },
              false
            );
            this.status = 'conflict';
          } else {
            await sqliteService.updateOutboxItemStatus(
              matchedItem.operationId,
              'FAILED',
              res.error || 'Failed'
            );
          }
        }
      }

      // 2. Fetch incremental changes from server to update local cache
      const cursor = await sqliteService.getSyncCursor(userId);
      const changes = await syncApiClient.getIncrementalChanges(cursor || undefined);

      if (changes.transactions && changes.transactions.length > 0) {
        for (const serverTx of changes.transactions) {
          if (serverTx.deletedAt) {
            await sqliteService.deleteLocalTransaction(serverTx.id, false);
          } else {
            await sqliteService.saveLocalTransaction(
              {
                id: serverTx.id,
                serverId: serverTx.id,
                userId,
                type: serverTx.type.toLowerCase() as any,
                amount: Number(serverTx.amount),
                currency: serverTx.currency || 'INR',
                title: serverTx.description,
                categoryId: serverTx.categoryId,
                paymentMethod: (serverTx.paymentMethod?.name || 'UPI') as any,
                paymentMethodId: serverTx.paymentMethodId,
                date: serverTx.transactionDate,
                note: serverTx.notes,
                syncStatus: 'SYNCED',
                clientMutationId: serverTx.clientMutationId || `server-${serverTx.id}`,
                version: serverTx.version || 1,
                createdAt: serverTx.createdAt,
                updatedAt: serverTx.updatedAt,
              },
              false
            );
          }
        }
      }

      if (changes.serverTimestamp) {
        await sqliteService.setSyncCursor(userId, changes.serverTimestamp);
      }

      // 3. Finalize status
      this.pendingCount = await sqliteService.getOutboxCount(userId);
      this.lastSyncedAt = new Date();
      this.status = this.pendingCount > 0 ? 'pending' : 'synced';
      this.notify();
      return true;
    } catch (err: any) {
      console.warn('Sync engine error:', err);
      this.lastError = err?.message || 'Sync failed';
      this.status = 'error';
      await this.refreshPendingCount(userId);
      this.notify();

      // Exponential backoff retry
      this.scheduleRetry(userId);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  private scheduleRetry(userId: string) {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    // Retry after 15 seconds with jitter
    const delay = 15000 + Math.random() * 5000;
    this.retryTimeout = setTimeout(() => {
      if (this.currentUserId === userId && networkMonitor.getCachedOnline()) {
        void this.syncNow(userId);
      }
    }, delay);
  }

  public cleanup() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.listeners.clear();
  }
}

export const syncEngine = new SyncEngine();
