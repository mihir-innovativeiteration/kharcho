import { NextFunction, Request, Response } from 'express';
import {
  confirmDraftsInputSchema,
  parseTransactionInputSchema,
} from '../validators/aiTransaction.validator.js';
import { NaturalLanguageParserService } from '../services/ai/naturalLanguageParser.service.js';
import { TransactionDraftService } from '../services/ai/transactionDraft.service.js';

export class AITransactionController {
  /**
   * POST /api/v1/ai/transactions/parse
   * Parses natural language financial description without creating transactions
   */
  static async parse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const validated = parseTransactionInputSchema.parse(req.body);

      const result = await NaturalLanguageParserService.parseInput(
        userId,
        validated.text,
        {
          locale: validated.locale,
          timezone: validated.timezone,
        }
      );

      res.status(200).json({
        success: true,
        data: result.drafts,
        parserType: result.parserType,
        warnings: result.warnings,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/ai/transactions/confirm
   * Confirms reviewed drafts and creates verified ledger transactions idempotently
   */
  static async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const validated = confirmDraftsInputSchema.parse(req.body);

      const result = await TransactionDraftService.confirmDrafts(userId, validated);

      res.status(result.alreadyProcessed ? 200 : 201).json({
        success: true,
        data: result.transactions,
        count: result.count,
        alreadyProcessed: result.alreadyProcessed,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
