import { authApi } from './authApi';
import {
  CandidateDraft,
  ConfirmDraftsResponse,
  ConfirmedDraftItem,
  ParseResponse,
} from '@/types/aiTransaction';

// Fallback preview rule-based parse when unauthenticated
function clientPreviewParse(text: string): CandidateDraft[] {
  const lower = text.toLowerCase();
  const isIncome = /\b(?:salary|received|credited|earned|malya|mili)\b/i.test(lower);
  const isUpi = /\b(?:upi|gpay|phonepe|paytm)\b/i.test(lower);
  const isCash = /\b(?:cash|rokad|nagad)\b/i.test(lower);

  const numMatch = text.match(/\b\d+(?:\.\d+)?\b/);
  const amount = numMatch ? parseFloat(numMatch[0]).toFixed(2) : '250.00';

  let categoryId = 'cat_food_dining';
  let categoryName = 'Food & Dining';

  if (/\b(?:petrol|fuel|diesel)\b/i.test(lower)) {
    categoryId = 'cat_petrol_fuel';
    categoryName = 'Petrol & Fuel';
  } else if (/\b(?:groceries|kirana|milk)\b/i.test(lower)) {
    categoryId = 'cat_groceries';
    categoryName = 'Groceries';
  } else if (isIncome) {
    categoryId = 'cat_salary';
    categoryName = 'Salary';
  }

  return [
    {
      draftId: `draft_preview_${Date.now()}`,
      type: isIncome ? 'INCOME' : 'EXPENSE',
      amount,
      currency: 'INR',
      description: isIncome ? 'Salary Income' : categoryName,
      categoryId,
      categoryName,
      paymentMethodId: isUpi ? 'pm_upi' : isCash ? 'pm_cash' : 'pm_upi',
      paymentMethodName: isUpi ? 'UPI' : isCash ? 'Cash' : 'UPI',
      transactionDate: new Date().toISOString(),
      confidence: 0.95,
      needsClarification: false,
      warnings: [],
      sourceSegment: text,
    },
  ];
}

async function isUserAuthenticated(): Promise<boolean> {
  return Boolean(authApi.getAccessToken() || (await authApi.getStoredRefreshToken()));
}

export class AITransactionApiClient {
  /**
   * Parse natural-language expense or income text into structured transaction drafts
   */
  async parseInput(
    text: string,
    locale: string = 'en',
    timezone: string = 'Asia/Kolkata'
  ): Promise<ParseResponse> {
    const isAuthed = await isUserAuthenticated();
    if (!isAuthed) {
      return {
        success: true,
        data: clientPreviewParse(text),
        parserType: 'rule_based',
        warnings: [],
        timestamp: new Date().toISOString(),
      };
    }

    const res = await authApi.request<ParseResponse>('/ai/transactions/parse', {
      method: 'POST',
      body: JSON.stringify({
        text,
        locale,
        timezone,
      }),
    });

    return res;
  }

  /**
   * Confirm reviewed drafts and record them in the verified financial ledger
   */
  async confirmDrafts(
    drafts: ConfirmedDraftItem[],
    idempotencyKey: string
  ): Promise<ConfirmDraftsResponse> {
    const isAuthed = await isUserAuthenticated();
    if (!isAuthed) {
      return {
        success: true,
        count: drafts.length,
        data: drafts.map((d, i) => ({
          id: `preview_tx_${Date.now()}_${i}`,
          ...d,
          createdAt: new Date().toISOString(),
        })),
        alreadyProcessed: false,
        message: `Successfully created ${drafts.length} transaction${drafts.length > 1 ? 's' : ''} (Preview Mode)`,
        timestamp: new Date().toISOString(),
      };
    }

    const res = await authApi.request<ConfirmDraftsResponse>(
      '/ai/transactions/confirm',
      {
        method: 'POST',
        body: JSON.stringify({
          idempotencyKey,
          drafts,
        }),
      }
    );

    return res;
  }
}

export const aiTransactionApiClient = new AITransactionApiClient();
