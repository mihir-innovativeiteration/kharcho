import { prisma } from '../config/db.js';
import { SyncOperationInput } from '../validators/sync.validator.js';
import { TransactionService } from './transaction.service.js';

export interface SyncOperationResult {
  operationId: string;
  status: 'APPLIED' | 'CONFLICT' | 'FAILED';
  serverId?: string;
  data?: any;
  error?: string;
  serverRecord?: any;
}

export class SyncService {
  /**
   * Process a batch of mutations atomically or sequentially per operation
   */
  static async processBatchOperations(
    userId: string,
    operations: SyncOperationInput[],
    db: any = prisma
  ): Promise<{ processed: number; results: SyncOperationResult[] }> {
    const results: SyncOperationResult[] = [];

    for (const op of operations) {
      try {
        // 1. Idempotency check: Look up existing receipt
        const existingReceipt = await db.syncReceipt.findUnique({
          where: { operationId: op.operationId },
        });

        if (existingReceipt) {
          if (existingReceipt.resultPayload) {
            try {
              const cached = JSON.parse(existingReceipt.resultPayload);
              results.push(cached);
              continue;
            } catch {
              // fallback if parse fails
            }
          }
          results.push({
            operationId: op.operationId,
            status: existingReceipt.status as any,
            serverId: existingReceipt.entityId,
          });
          continue;
        }

        let opResult: SyncOperationResult;

        // 2. Handle Operation Type
        switch (op.operationType) {
          case 'CREATE': {
            if (!op.payload) {
              opResult = {
                operationId: op.operationId,
                status: 'FAILED',
                error: 'Payload is required for CREATE operation',
              };
              break;
            }

            // Check if already created by clientMutationId
            if (op.clientMutationId) {
              const existingTx = await db.transaction.findFirst({
                where: {
                  userId,
                  clientMutationId: op.clientMutationId,
                },
                include: {
                  category: true,
                  paymentMethod: true,
                },
              });

              if (existingTx) {
                const formatted = TransactionService.formatTransaction(existingTx);
                opResult = {
                  operationId: op.operationId,
                  status: 'APPLIED',
                  serverId: existingTx.id,
                  data: formatted,
                };
                break;
              }
            }

            const created = await TransactionService.createTransaction(
              userId,
              {
                type: op.payload.type || 'EXPENSE',
                amount: op.payload.amount !== undefined ? op.payload.amount : 0,
                currency: op.payload.currency || 'INR',
                description: op.payload.description || 'Offline transaction',
                categoryId: op.payload.categoryId || '',
                paymentMethodId: op.payload.paymentMethodId || undefined,
                transactionDate: op.payload.transactionDate || new Date().toISOString(),
                notes: op.payload.notes || undefined,
                clientMutationId: op.clientMutationId,
                version: 1,
              },
              db
            );

            opResult = {
              operationId: op.operationId,
              status: 'APPLIED',
              serverId: created.id,
              data: created,
            };
            break;
          }

          case 'UPDATE': {
            const existingTx = await db.transaction.findUnique({
              where: { id: op.entityId },
              include: {
                category: true,
                paymentMethod: true,
              },
            });

            if (!existingTx || existingTx.userId !== userId) {
              opResult = {
                operationId: op.operationId,
                status: 'FAILED',
                error: 'Transaction not found or inaccessible',
              };
              break;
            }

            if (existingTx.deletedAt) {
              opResult = {
                operationId: op.operationId,
                status: 'CONFLICT',
                error: 'Transaction was deleted on the server',
                serverRecord: TransactionService.formatTransaction(existingTx),
              };
              break;
            }

            // Optimistic concurrency version check
            if (op.expectedVersion !== undefined && existingTx.version !== op.expectedVersion) {
              opResult = {
                operationId: op.operationId,
                status: 'CONFLICT',
                error: `Version mismatch: client expected version ${op.expectedVersion}, but server has version ${existingTx.version}`,
                serverRecord: TransactionService.formatTransaction(existingTx),
              };
              break;
            }

            const updated = await TransactionService.updateTransaction(
              userId,
              op.entityId,
              {
                ...(op.payload?.type ? { type: op.payload.type } : {}),
                ...(op.payload?.amount !== undefined ? { amount: op.payload.amount } : {}),
                ...(op.payload?.currency ? { currency: op.payload.currency } : {}),
                ...(op.payload?.description ? { description: op.payload.description } : {}),
                ...(op.payload?.categoryId ? { categoryId: op.payload.categoryId } : {}),
                ...(op.payload?.paymentMethodId !== undefined ? { paymentMethodId: op.payload.paymentMethodId } : {}),
                ...(op.payload?.transactionDate ? { transactionDate: op.payload.transactionDate } : {}),
                ...(op.payload?.notes !== undefined ? { notes: op.payload.notes } : {}),
              },
              db
            );

            opResult = {
              operationId: op.operationId,
              status: 'APPLIED',
              serverId: updated.id,
              data: updated,
            };
            break;
          }

          case 'DELETE': {
            const existingTx = await db.transaction.findUnique({
              where: { id: op.entityId },
            });

            if (!existingTx || existingTx.userId !== userId) {
              // Idempotent: already deleted or not found
              opResult = {
                operationId: op.operationId,
                status: 'APPLIED',
                serverId: op.entityId,
              };
              break;
            }

            // Soft-delete for incremental sync awareness
            await db.transaction.update({
              where: { id: op.entityId },
              data: {
                deletedAt: new Date(),
                version: (existingTx.version || 1) + 1,
              },
            });

            opResult = {
              operationId: op.operationId,
              status: 'APPLIED',
              serverId: op.entityId,
            };
            break;
          }

          default:
            opResult = {
              operationId: op.operationId,
              status: 'FAILED',
              error: `Unsupported operationType ${(op as any).operationType}`,
            };
        }

        // 3. Save receipt for idempotency
        try {
          await db.syncReceipt.create({
            data: {
              userId,
              operationId: op.operationId,
              entityType: op.entityType,
              entityId: opResult.serverId || op.entityId,
              operationType: op.operationType,
              status: opResult.status,
              resultPayload: JSON.stringify(opResult),
            },
          });
        } catch {
          // ignore duplicate receipt race condition
        }

        results.push(opResult);
      } catch (err: any) {
        results.push({
          operationId: op.operationId,
          status: 'FAILED',
          error: err?.message || 'Operation failed during sync processing',
        });
      }
    }

    return {
      processed: results.length,
      results,
    };
  }

  /**
   * Retrieve incremental changes since cursor timestamp
   */
  static async getIncrementalChanges(
    userId: string,
    since?: Date,
    db: any = prisma
  ) {
    const where: any = {
      userId,
    };

    if (since) {
      where.updatedAt = {
        gt: since,
      };
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        category: true,
        paymentMethod: true,
      },
      orderBy: {
        updatedAt: 'asc',
      },
    });

    return {
      transactions: transactions.map((tx: any) => TransactionService.formatTransaction(tx)),
      serverTimestamp: new Date().toISOString(),
    };
  }
}
