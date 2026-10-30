import { PaymentMethod } from './transaction';

export type SyncState = 'synced' | 'syncing' | 'pending' | 'offline' | 'conflict' | 'error';

export type LocalSyncStatus =
  | 'SYNCED'
  | 'PENDING_CREATE'
  | 'PENDING_UPDATE'
  | 'PENDING_DELETE'
  | 'CONFLICT';

export type OutboxStatus = 'PENDING' | 'IN_PROGRESS' | 'SYNCED' | 'FAILED';

export interface LocalTransaction {
  id: string; // Provisional UUID or Server UUID
  serverId?: string | null;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  title: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  paymentMethodId?: string | null;
  date: string;
  note?: string;
  syncStatus: LocalSyncStatus;
  clientMutationId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface OutboxItem {
  operationId: string;
  userId: string;
  entityType: 'TRANSACTION';
  entityId: string;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE';
  clientMutationId?: string;
  expectedVersion?: number;
  payload?: any;
  createdAt: string;
  attemptCount: number;
  lastError?: string | null;
  status: OutboxStatus;
}

export interface SyncOperationResult {
  operationId: string;
  status: 'APPLIED' | 'CONFLICT' | 'FAILED';
  serverId?: string;
  data?: any;
  error?: string;
  serverRecord?: any;
}

export interface BatchSyncResponse {
  processed: number;
  results: SyncOperationResult[];
}

export interface NotificationPreferences {
  budgetAlertsEnabled: boolean;
  billRemindersEnabled: boolean;
  savingsMilestonesEnabled: boolean;
  syncAlertsEnabled: boolean;
  dailySummaryEnabled: boolean;
}
