import { randomUUID } from 'crypto';
import { IAITransactionParser, ParserContext } from './aiProvider.interface.js';
import { CandidateDraft, ParseResult } from './ruleBasedParser.service.js';

export class GeminiProviderService implements IAITransactionParser {
  name = 'gemini';

  private getApiKey(): string | null {
    return process.env.GEMINI_API_KEY || null;
  }

  isAvailable(): boolean {
    return Boolean(this.getApiKey());
  }

  async parse(text: string, context: ParserContext): Promise<ParseResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const categoriesList = context.categories
      .map((c) => `- ID: "${c.id}", Name: "${c.name}", Type: "${c.type}"`)
      .join('\n');

    const paymentMethodsList = context.paymentMethods
      .map((p) => `- ID: "${p.id}", Name: "${p.name}"`)
      .join('\n');

    const systemPrompt = `You are an expert multilingual personal finance assistant for the Kharcho expense tracking mobile app in India.
Your task is to analyze user text and extract one or more financial transactions (Expense or Income).
The input may be in English, Gujarati, Hindi, or Hinglish (mixed Hindi/Gujarati/English).
Today's Date: ${new Date().toISOString().split('T')[0]}. Timezone: ${context.timezone || 'Asia/Kolkata'}.

Available Categories:
${categoriesList}

Available Payment Methods:
${paymentMethodsList}

Output Format: You MUST return ONLY valid JSON matching this schema:
{
  "drafts": [
    {
      "type": "EXPENSE" or "INCOME",
      "amount": "string of positive decimal, e.g. '250.00'. Leave as '' if amount is missing/unknown",
      "currency": "INR",
      "description": "Short clean description (e.g. 'Petrol', 'Coffee', 'Salary')",
      "categoryId": "one of the available category IDs above, or 'cat_other_expense'",
      "categoryName": "matching category name",
      "paymentMethodId": "one of the available payment method IDs above or null",
      "paymentMethodName": "matching payment method name or null",
      "transactionDate": "ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)",
      "confidence": number between 0.1 and 1.0,
      "needsClarification": boolean (true if date is ambiguous like bare 'kal', or amount is missing),
      "clarificationQuestion": "Question to ask the user if needsClarification is true, else null",
      "warnings": ["array of warning strings, if any"],
      "isRecurringSuggestion": boolean (true if user mentions a recurring subscription/bill like Netflix or rent)
    }
  ]
}

Important Rules:
1. Handle multiple items in a single sentence (e.g. "Aaje 250 petrol ane 120 coffee" -> 2 drafts).
2. Gujarati/Hindi words like "kal" can mean yesterday or tomorrow. If context is ambiguous, set needsClarification=true and ask "Did you mean yesterday or tomorrow?".
3. If amount is missing, leave amount as "" and set needsClarification=true.
4. Convert Gujarati numerals (૦-૯) and Devanagari numerals (०-९) to standard numbers.
5. Do NOT include markdown code blocks (\`\`\`json) in the response. Return raw JSON only.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Input: "${text}"` }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data: any = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error('Gemini API returned empty response');
      }

      const parsed = JSON.parse(rawJson);
      if (!parsed.drafts || !Array.isArray(parsed.drafts)) {
        throw new Error('Invalid JSON structure from Gemini');
      }

      const drafts: CandidateDraft[] = parsed.drafts.map((d: any) => ({
        draftId: `draft_${randomUUID()}`,
        type: d.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
        amount: typeof d.amount === 'number' ? d.amount.toFixed(2) : String(d.amount || ''),
        currency: d.currency || 'INR',
        description: d.description || 'Expense',
        categoryId: d.categoryId || 'cat_other_expense',
        categoryName: d.categoryName || 'Other Expense',
        paymentMethodId: d.paymentMethodId || null,
        paymentMethodName: d.paymentMethodName || null,
        transactionDate: d.transactionDate || new Date().toISOString(),
        confidence: typeof d.confidence === 'number' ? d.confidence : 0.9,
        needsClarification: Boolean(d.needsClarification),
        clarificationQuestion: d.clarificationQuestion || undefined,
        warnings: Array.isArray(d.warnings) ? d.warnings : [],
        isRecurringSuggestion: Boolean(d.isRecurringSuggestion),
        sourceSegment: text,
      }));

      return {
        drafts,
        parserType: 'ai',
        warnings: [],
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
