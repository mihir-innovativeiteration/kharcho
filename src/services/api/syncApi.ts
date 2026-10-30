import { authApi } from './authApi';
import { BatchSyncResponse } from '@/types/sync';

class SyncApiClient {
  /**
   * Send batch of offline mutations to backend
   */
  async processBatchOperations(operations: any[]): Promise<BatchSyncResponse> {
    const res = await authApi.request<{
      success: boolean;
      data: BatchSyncResponse;
    }>('/sync/operations', {
      method: 'POST',
      body: JSON.stringify({ operations }),
    });

    return res.data;
  }

  /**
   * Fetch incremental server changes since cursor timestamp
   */
  async getIncrementalChanges(since?: string): Promise<{
    transactions: any[];
    serverTimestamp: string;
  }> {
    const endpoint = since
      ? `/sync/changes?since=${encodeURIComponent(since)}`
      : '/sync/changes';

    const res = await authApi.request<{
      success: boolean;
      data: {
        transactions: any[];
        serverTimestamp: string;
      };
    }>(endpoint, {
      method: 'GET',
    });

    return res.data;
  }
}

export const syncApiClient = new SyncApiClient();
