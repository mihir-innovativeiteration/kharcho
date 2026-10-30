import { Request, Response, NextFunction } from 'express';
import {
  batchSyncInputSchema,
  syncChangesQuerySchema,
} from '../validators/sync.validator.js';
import { SyncService } from '../services/sync.service.js';

export class SyncController {
  /**
   * Process a batch of sync operations from offline outbox
   */
  static async handleBatchSync(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = batchSyncInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const result = await SyncService.processBatchOperations(
        req.user!.id,
        parsed.data.operations
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetch incremental changes since a timestamp
   */
  static async handleGetChanges(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = syncChangesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const since = parsed.data.since ? new Date(parsed.data.since) : undefined;
      const result = await SyncService.getIncrementalChanges(req.user!.id, since);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
