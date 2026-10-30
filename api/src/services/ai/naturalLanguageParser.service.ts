import { prisma } from '../../config/db.js';
import { GeminiProviderService } from './geminiProvider.service.js';
import { ParseResult, RuleBasedParserService } from './ruleBasedParser.service.js';
import { CategoryContext, PaymentMethodContext } from './aiProvider.interface.js';

export class NaturalLanguageParserService {
  private static geminiProvider = new GeminiProviderService();

  /**
   * Parse natural language transaction input
   */
  static async parseInput(
    userId: string,
    text: string,
    options: { locale?: string; timezone?: string } = {},
    db: any = prisma
  ): Promise<ParseResult> {
    // 1. Fetch available categories and payment methods for the authenticated user
    const [categories, paymentMethods] = await Promise.all([
      db.category.findMany({
        where: {
          OR: [{ isSystem: true }, { userId }],
        },
        select: { id: true, name: true, type: true },
      }),
      db.paymentMethod.findMany({
        where: {
          OR: [{ isSystem: true }, { userId }],
        },
        select: { id: true, name: true, type: true },
      }),
    ]);

    const categoryContext: CategoryContext[] = categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
    }));

    const paymentMethodContext: PaymentMethodContext[] = paymentMethods.map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
    }));

    let result: ParseResult | null = null;

    // 2. Try Gemini Provider if configured and available
    if (this.geminiProvider.isAvailable()) {
      try {
        result = await this.geminiProvider.parse(text, {
          locale: options.locale,
          timezone: options.timezone,
          categories: categoryContext,
          paymentMethods: paymentMethodContext,
        });
      } catch (err: any) {
        console.warn(
          'Gemini AI parser encountered an error, falling back to rule-based parser:',
          err?.message
        );
      }
    }

    // 3. Fallback to Rule-based Multilingual Parser
    if (!result) {
      result = RuleBasedParserService.parse(text, {
        locale: options.locale,
        timezone: options.timezone,
      });
    }

    // 4. Validate category and payment method ownership/existence against user's actual available options
    const categoryMap = new Map(categoryContext.map((c) => [c.id, c]));
    const paymentMethodMap = new Map(paymentMethodContext.map((p) => [p.id, p]));

    for (const draft of result.drafts) {
      // Validate Category ID
      const matchedCat = categoryMap.get(draft.categoryId);
      if (!matchedCat) {
        // Fallback to a safe existing system category matching the transaction type
        const fallbackId = draft.type === 'INCOME' ? 'cat_salary' : 'cat_other_expense';
        const fallbackCat = categoryMap.get(fallbackId);
        draft.categoryId = fallbackId;
        draft.categoryName = fallbackCat ? fallbackCat.name : 'Other Expense';
        draft.warnings.push('Category was mapped to a default category available in your account.');
      } else {
        draft.categoryName = matchedCat.name;
        // Ensure type compatibility
        if (matchedCat.type !== draft.type) {
          draft.type = matchedCat.type;
        }
      }

      // Validate Payment Method ID if present
      if (draft.paymentMethodId) {
        const matchedPm = paymentMethodMap.get(draft.paymentMethodId);
        if (!matchedPm) {
          draft.paymentMethodId = null;
          draft.paymentMethodName = null;
          draft.warnings.push('Unrecognized payment method was reset.');
        } else {
          draft.paymentMethodName = matchedPm.name;
        }
      }
    }

    return result;
  }
}
