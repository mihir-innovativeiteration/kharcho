export interface CandidateDraft {
  draftId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string; // "250.00" or "" if clarification needed
  currency: string;
  description: string;
  categoryId: string;
  categoryName: string;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  transactionDate: string; // ISO string
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
  warnings: string[];
  isRecurringSuggestion?: boolean;
  recurringFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  sourceSegment?: string;
}

export interface ParseResponse {
  success: boolean;
  data: CandidateDraft[];
  parserType: 'ai' | 'rule_based';
  warnings: string[];
  timestamp: string;
}

export interface ConfirmedDraftItem {
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  currency: string;
  description: string;
  categoryId: string;
  paymentMethodId?: string | null;
  transactionDate: string;
  notes?: string | null;
}

export interface ConfirmDraftsResponse {
  success: boolean;
  count: number;
  data: any[];
  alreadyProcessed: boolean;
  message: string;
  timestamp: string;
}
