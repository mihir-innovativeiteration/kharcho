import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { LocalTransaction, OutboxItem, OutboxStatus } from '@/types/sync';

class SQLiteService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  /**
   * Initialize SQLite local database with required schemas and indexes
   */
  async init(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    try {
      this.db = await SQLite.openDatabaseAsync('kharcho_local_v1.db');

      // Enable WAL journal mode for performance and concurrency
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS local_transactions (
          id TEXT PRIMARY KEY,
          server_id TEXT,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'INR',
          title TEXT NOT NULL,
          category_id TEXT NOT NULL,
          payment_method TEXT NOT NULL,
          payment_method_id TEXT,
          date TEXT NOT NULL,
          note TEXT,
          sync_status TEXT NOT NULL DEFAULT 'PENDING_CREATE',
          client_mutation_id TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_tx_user_date ON local_transactions(user_id, date);
        CREATE INDEX IF NOT EXISTS idx_tx_sync_status ON local_transactions(user_id, sync_status);
        CREATE INDEX IF NOT EXISTS idx_tx_client_mutation ON local_transactions(client_mutation_id);

        CREATE TABLE IF NOT EXISTS sync_outbox (
          operation_id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation_type TEXT NOT NULL,
          client_mutation_id TEXT,
          expected_version INTEGER,
          payload TEXT,
          created_at TEXT NOT NULL,
          attempt_count INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          status TEXT NOT NULL DEFAULT 'PENDING'
        );

        CREATE INDEX IF NOT EXISTS idx_outbox_user_status ON sync_outbox(user_id, status);

        CREATE TABLE IF NOT EXISTS local_cache_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      this.isInitialized = true;
    } catch (err) {
      console.warn('SQLite init warning (fallback mode):', err);
    }
  }

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db || !this.isInitialized) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Local SQLite database failed to initialize');
    }
    return this.db;
  }

  // ==========================================
  // TRANSACTION CRUD & PERSISTENCE
  // ==========================================

  /**
   * Save a transaction locally and atomically queue an outbox CREATE operation
   */
  async saveLocalTransaction(
    tx: LocalTransaction,
    addToOutbox = true
  ): Promise<LocalTransaction> {
    const db = await this.getDb();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT OR REPLACE INTO local_transactions (
          id, server_id, user_id, type, amount, currency, title,
          category_id, payment_method, payment_method_id, date,
          note, sync_status, client_mutation_id, version,
          created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tx.id,
          tx.serverId || null,
          tx.userId,
          tx.type,
          tx.amount,
          tx.currency || 'INR',
          tx.title,
          tx.categoryId,
          tx.paymentMethod,
          tx.paymentMethodId || null,
          tx.date,
          tx.note || null,
          tx.syncStatus,
          tx.clientMutationId,
          tx.version || 1,
          tx.createdAt,
          tx.updatedAt,
          tx.deletedAt || null,
        ]
      );

      if (addToOutbox && tx.syncStatus === 'PENDING_CREATE') {
        const operationId = Crypto.randomUUID();
        await db.runAsync(
          `INSERT INTO sync_outbox (
            operation_id, user_id, entity_type, entity_id, operation_type,
            client_mutation_id, expected_version, payload, created_at,
            attempt_count, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            operationId,
            tx.userId,
            'TRANSACTION',
            tx.id,
            'CREATE',
            tx.clientMutationId,
            1,
            JSON.stringify({
              type: tx.type === 'expense' ? 'EXPENSE' : 'INCOME',
              amount: tx.amount,
              currency: tx.currency || 'INR',
              description: tx.title,
              categoryId: tx.categoryId,
              paymentMethodId: tx.paymentMethodId,
              transactionDate: tx.date,
              notes: tx.note,
            }),
            new Date().toISOString(),
            0,
            'PENDING',
          ]
        );
      }
    });

    return tx;
  }

  /**
   * Update transaction locally and queue an outbox UPDATE operation
   */
  async updateLocalTransaction(
    id: string,
    updates: Partial<LocalTransaction>,
    addToOutbox = true
  ): Promise<LocalTransaction | null> {
    const db = await this.getDb();
    const existing = await this.getTransactionById(id);
    if (!existing) return null;

    const updated: LocalTransaction = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
      syncStatus: updates.syncStatus || 'PENDING_UPDATE',
    };

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE local_transactions SET
          type = ?, amount = ?, currency = ?, title = ?,
          category_id = ?, payment_method = ?, payment_method_id = ?,
          date = ?, note = ?, sync_status = ?, version = ?,
          updated_at = ?
        WHERE id = ?`,
        [
          updated.type,
          updated.amount,
          updated.currency,
          updated.title,
          updated.categoryId,
          updated.paymentMethod,
          updated.paymentMethodId || null,
          updated.date,
          updated.note || null,
          updated.syncStatus,
          updated.version,
          updated.updatedAt,
          id,
        ]
      );

      if (addToOutbox) {
        const operationId = Crypto.randomUUID();
        await db.runAsync(
          `INSERT INTO sync_outbox (
            operation_id, user_id, entity_type, entity_id, operation_type,
            expected_version, payload, created_at, attempt_count, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            operationId,
            updated.userId,
            'TRANSACTION',
            updated.serverId || updated.id,
            'UPDATE',
            existing.version,
            JSON.stringify({
              type: updated.type === 'expense' ? 'EXPENSE' : 'INCOME',
              amount: updated.amount,
              currency: updated.currency,
              description: updated.title,
              categoryId: updated.categoryId,
              paymentMethodId: updated.paymentMethodId,
              transactionDate: updated.date,
              notes: updated.note,
            }),
            new Date().toISOString(),
            0,
            'PENDING',
          ]
        );
      }
    });

    return updated;
  }

  /**
   * Soft-delete transaction locally and queue an outbox DELETE operation
   */
  async deleteLocalTransaction(
    id: string,
    addToOutbox = true
  ): Promise<boolean> {
    const db = await this.getDb();
    const existing = await this.getTransactionById(id);
    if (!existing) return false;

    const deletedAt = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE local_transactions SET
          deleted_at = ?,
          sync_status = 'PENDING_DELETE',
          updated_at = ?
        WHERE id = ?`,
        [deletedAt, deletedAt, id]
      );

      if (addToOutbox) {
        const operationId = Crypto.randomUUID();
        await db.runAsync(
          `INSERT INTO sync_outbox (
            operation_id, user_id, entity_type, entity_id, operation_type,
            created_at, attempt_count, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            operationId,
            existing.userId,
            'TRANSACTION',
            existing.serverId || existing.id,
            'DELETE',
            deletedAt,
            0,
            'PENDING',
          ]
        );
      }
    });

    return true;
  }

  /**
   * Reconcile local ID with server ID after successful creation
   */
  async reconcileTransactionServerId(
    localId: string,
    serverId: string,
    serverData?: any
  ): Promise<void> {
    const db = await this.getDb();

    await db.withTransactionAsync(async () => {
      if (localId !== serverId) {
        // If IDs differ, replace local primary key with authoritative server ID
        await db.runAsync(
          `UPDATE local_transactions SET
            id = ?,
            server_id = ?,
            sync_status = 'SYNCED',
            version = ?,
            updated_at = ?
          WHERE id = ?`,
          [
            serverId,
            serverId,
            serverData?.version || 1,
            new Date().toISOString(),
            localId,
          ]
        );

        // Also update any pending outbox items pointing to the provisional localId
        await db.runAsync(
          `UPDATE sync_outbox SET entity_id = ? WHERE entity_id = ?`,
          [serverId, localId]
        );
      } else {
        await db.runAsync(
          `UPDATE local_transactions SET
            server_id = ?,
            sync_status = 'SYNCED',
            version = ?,
            updated_at = ?
          WHERE id = ?`,
          [serverId, serverData?.version || 1, new Date().toISOString(), serverId]
        );
      }
    });
  }

  /**
   * Fetch a single transaction by ID
   */
  async getTransactionById(id: string): Promise<LocalTransaction | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM local_transactions WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!row) return null;
    return this.mapRowToTransaction(row);
  }

  /**
   * Get all active local transactions for a specific user (Account isolation)
   */
  async getLocalTransactions(userId: string): Promise<LocalTransaction[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM local_transactions
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY date DESC, created_at DESC`,
      [userId]
    );

    return rows.map((r) => this.mapRowToTransaction(r));
  }

  private mapRowToTransaction(row: any): LocalTransaction {
    return {
      id: row.id,
      serverId: row.server_id,
      userId: row.user_id,
      type: row.type as any,
      amount: Number(row.amount),
      currency: row.currency,
      title: row.title,
      categoryId: row.category_id,
      paymentMethod: row.payment_method as any,
      paymentMethodId: row.payment_method_id,
      date: row.date,
      note: row.note || undefined,
      syncStatus: row.sync_status as any,
      clientMutationId: row.client_mutation_id,
      version: Number(row.version),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at || null,
    };
  }

  // ==========================================
  // OUTBOX QUEUE OPERATIONS
  // ==========================================

  /**
   * Retrieve pending outbox operations for user
   */
  async getPendingOutboxItems(userId: string): Promise<OutboxItem[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM sync_outbox
       WHERE user_id = ? AND status IN ('PENDING', 'FAILED')
       ORDER BY created_at ASC`,
      [userId]
    );

    return rows.map((r) => ({
      operationId: r.operation_id,
      userId: r.user_id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      operationType: r.operation_type,
      clientMutationId: r.client_mutation_id || undefined,
      expectedVersion: r.expected_version ? Number(r.expected_version) : undefined,
      payload: r.payload ? JSON.parse(r.payload) : undefined,
      createdAt: r.created_at,
      attemptCount: Number(r.attempt_count),
      lastError: r.last_error || null,
      status: r.status as OutboxStatus,
    }));
  }

  /**
   * Get pending outbox count for user
   */
  async getOutboxCount(userId: string): Promise<number> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_outbox
       WHERE user_id = ? AND status IN ('PENDING', 'FAILED', 'IN_PROGRESS')`,
      [userId]
    );
    return row?.count || 0;
  }

  /**
   * Update status of an outbox item
   */
  async updateOutboxItemStatus(
    operationId: string,
    status: OutboxStatus,
    lastError?: string
  ): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `UPDATE sync_outbox SET
        status = ?,
        last_error = ?,
        attempt_count = attempt_count + 1
      WHERE operation_id = ?`,
      [status, lastError || null, operationId]
    );
  }

  /**
   * Remove acknowledged item from outbox
   */
  async removeOutboxItem(operationId: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(`DELETE FROM sync_outbox WHERE operation_id = ?`, [
      operationId,
    ]);
  }

  /**
   * Clear outbox for user (on explicit user account deletion or reset)
   */
  async clearUserData(userId: string): Promise<void> {
    const db = await this.getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM sync_outbox WHERE user_id = ?`, [userId]);
      await db.runAsync(`DELETE FROM local_transactions WHERE user_id = ?`, [userId]);
    });
  }

  // ==========================================
  // METADATA / CACHE CURSOR
  // ==========================================

  async getSyncCursor(userId: string): Promise<string | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM local_cache_metadata WHERE key = ?`,
      [`last_sync_cursor_${userId}`]
    );
    return row?.value || null;
  }

  async setSyncCursor(userId: string, cursor: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO local_cache_metadata (key, value, updated_at)
       VALUES (?, ?, ?)`,
      [`last_sync_cursor_${userId}`, cursor, new Date().toISOString()]
    );
  }
}

export const sqliteService = new SQLiteService();
