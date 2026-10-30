import { prisma } from '../../config/db.js';
import { ConfirmDraftsInput, DraftItemInput } from '../../validators/aiTransaction.validator.js';
import { TransactionService } from '../transaction.service.js';

interface IdempotencyRecord {
  userId: string;
  transactionIds: string[];
  createdAt: Date;
}

export class TransactionDraftService {
  // In-memory idempotency cache with TTL
  private static idempotencyCache = new Map<string, IdempotencyRecord>();

  /**
   * Confirm and record verified transaction drafts
   */
  static async confirmDrafts(
    userId: string,
    input: ConfirmDraftsInput,
    db: any = prisma
  ) {
    const { idempotencyKey, drafts } = input;

    // 1. Check in-memory idempotency cache
    const cached = this.idempotencyCache.get(idempotencyKey);
    if (cached && cached.userId === userId) {
      const existing = await db.transaction.findMany({
        where: {
          id: { in: cached.transactionIds },
          userId,
        },
        include: { category: true, paymentMethod: true },
      });

      if (existing.length > 0) {
        return {
          success: true,
          alreadyProcessed: true,
          count: existing.length,
          transactions: existing.map((tx: any) => TransactionService.formatTransaction(tx)),
          message: 'Drafts were already confirmed previously with this idempotency key.',
        };
      }
    }

    // 2. Check database for existing transactions tagged with this idempotency key
    const idempotencyTag = `[idempotency:${idempotencyKey}]`;
    const dbExisting = await db.transaction.findMany({
      where: {
        userId,
        notes: { contains: idempotencyTag },
      },
      include: { category: true, paymentMethod: true },
    });

    if (dbExisting.length > 0) {
      // Store in memory for faster subsequent hits
      this.idempotencyCache.set(idempotencyKey, {
        userId,
        transactionIds: dbExisting.map((t: any) => t.id),
        createdAt: new Date(),
      });

      return {
        success: true,
        alreadyProcessed: true,
        count: dbExisting.length,
        transactions: dbExisting.map((tx: any) => TransactionService.formatTransaction(tx)),
        message: 'Drafts were already confirmed previously with this idempotency key.',
      };
    }

    // 3. Process each draft through TransactionService.createTransaction
    // This guarantees monetary precision, category/paymentMethod ownership checks,
    // and triggers budget monitoring & threshold alerts!
    const createdTransactions: any[] = [];

    for (const draft of drafts) {
      const notesWithTag = draft.notes
        ? `${draft.notes.trim()} ${idempotencyTag}`
        : idempotencyTag;

      const created = await TransactionService.createTransaction(
        userId,
        {
          type: draft.type,
          amount: draft.amount,
          currency: draft.currency || 'INR',
          description: draft.description,
          categoryId: draft.categoryId,
          paymentMethodId: draft.paymentMethodId || undefined,
          transactionDate: draft.transactionDate,
          notes: notesWithTag,
        },
        db
      );

      createdTransactions.push(created);
    }

    // 4. Save to idempotency cache
    this.idempotencyCache.set(idempotencyKey, {
      userId,
      transactionIds: createdTransactions.map((t) => t.id),
      createdAt: new Date(),
    });

    // Cleanup old cache entries (older than 2 hours)
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    for (const [key, record] of this.idempotencyCache.entries()) {
      if (record.createdAt.getTime() < twoHoursAgo) {
        this.idempotencyCache.delete(key);
      }
    }

    return {
      success: true,
      alreadyProcessed: false,
      count: createdTransactions.length,
      transactions: createdTransactions,
      message: `Successfully created ${createdTransactions.length} transaction${createdTransactions.length > 1 ? 's' : ''}.`,
    };
  }
}
