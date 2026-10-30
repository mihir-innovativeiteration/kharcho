import { randomUUID } from 'crypto';

export interface CandidateDraft {
  draftId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string; // Validated positive decimal string e.g. "250.00" or "" if missing
  currency: string;
  description: string;
  categoryId: string;
  categoryName: string;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  transactionDate: string; // ISO string
  confidence: number; // 0 to 1
  needsClarification: boolean;
  clarificationQuestion?: string;
  warnings: string[];
  isRecurringSuggestion?: boolean;
  recurringFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  sourceSegment: string;
}

export interface ParseResult {
  drafts: CandidateDraft[];
  parserType: 'rule_based' | 'ai';
  warnings: string[];
}

function matchWord(text: string, pattern: string): boolean {
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${pattern})(?:[^\\p{L}\\p{N}]|$)`, 'iu').test(text);
}

export class RuleBasedParserService {
  /**
   * Convert Gujarati & Devanagari numerals to standard Western Arabic numerals (0-9)
   */
  static normalizeNumerals(text: string): string {
    const devanagariNumerals: Record<string, string> = {
      '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
      '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
    };
    const gujaratiNumerals: Record<string, string> = {
      '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4',
      '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
    };

    let result = '';
    for (const char of text) {
      if (devanagariNumerals[char] !== undefined) {
        result += devanagariNumerals[char];
      } else if (gujaratiNumerals[char] !== undefined) {
        result += gujaratiNumerals[char];
      } else {
        result += char;
      }
    }
    return result;
  }

  /**
   * Parse monetary amount from text, handling Indian conventions (e.g. ₹500, Rs. 1500, 1.5k, 2 lakh)
   */
  static extractAmount(text: string): { amount: string; rawMatch?: string } | null {
    // 1. Check for multiplier patterns e.g. "1.5k", "25k", "2 lakh", "1.5 crore"
    const multiplierRegex = /(\d+(?:\.\d+)?)\s*(k|lakh|lac|crore|cr|લાખ|કરોડ|लाख|करोड़)\b/i;
    const multMatch = text.match(multiplierRegex);
    if (multMatch) {
      const num = parseFloat(multMatch[1]);
      const unit = multMatch[2].toLowerCase();
      let multiplier = 1;
      if (unit === 'k') multiplier = 1000;
      else if (['lakh', 'lac', 'લાખ', 'लाख'].includes(unit)) multiplier = 100000;
      else if (['crore', 'cr', 'કરોડ', 'करोड़'].includes(unit)) multiplier = 10000000;

      const total = (num * multiplier).toFixed(2);
      return { amount: total, rawMatch: multMatch[0] };
    }

    // 2. Check for currency symbol / keyword prefixed or suffixed amounts
    // e.g. ₹500, Rs. 1,500, 250 nu, 250 na, 250 રૂપિયા, 500 rs
    const currencyRegex = /(?:[₹$€£]|rs\.?|inr|રૂ|રૂપિયા|रुपये|rupees)\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/i;
    const currMatch = text.match(currencyRegex);
    if (currMatch) {
      const cleanNum = currMatch[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0) {
        return { amount: parsed.toFixed(2), rawMatch: currMatch[0] };
      }
    }

    // 3. Suffix format: "500 rs", "500 rupees", "250 nu", "250 na", "30 ni"
    const suffixRegex = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?:[₹$€£]|rs\.?|inr|રૂ|રૂપિયા|रुपये|rupees|nu|na|ni|ka|ke|ki|no)/i;
    const suffMatch = text.match(suffixRegex);
    if (suffMatch) {
      const cleanNum = suffMatch[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0) {
        return { amount: parsed.toFixed(2), rawMatch: suffMatch[0] };
      }
    }

    // 4. Standalone numbers e.g. "petrol 250", "netflix 649"
    const standaloneRegex = /\b(\d+(?:\.\d{1,2})?)\b/;
    const standMatch = text.match(standaloneRegex);
    if (standMatch) {
      const parsed = parseFloat(standMatch[1]);
      if (!isNaN(parsed) && parsed > 0) {
        return { amount: parsed.toFixed(2), rawMatch: standMatch[0] };
      }
    }

    return null;
  }

  /**
   * Split multiple transaction expressions joined by "and", "ane", "aur", commas, etc.
   */
  static splitIntoSegments(text: string): string[] {
    // Delimiters: "and", "ane", "અને", "aur", "और", "plus", "&", ",", ";"
    // But do not split on commas within numbers (e.g. 1,500)
    const sanitized = text.replace(/(\d),(\d)/g, '$1$2');

    // Split on conjunctions
    const parts = sanitized.split(/\b(?:and|ane|aur|plus|સાથે|તથા|અને|और)\b|[;&]|\s*,\s*/i);
    const cleaned = parts.map((p) => p.trim()).filter((p) => p.length > 2);

    return cleaned.length > 0 ? cleaned : [text.trim()];
  }

  /**
   * Detect date and handle ambiguous expressions like "kal" / "કાલે" / "कल"
   */
  static resolveDate(
    segment: string,
    fullText: string,
    timezone: string = 'Asia/Kolkata'
  ): {
    date: string;
    needsClarification: boolean;
    clarificationQuestion?: string;
    warning?: string;
  } {
    const lower = `${segment} ${fullText}`.toLowerCase();
    const now = new Date();

    // 1. Explicit today
    if (matchWord(lower, 'today|aaj|aaje|current|આજે|आज')) {
      return { date: now.toISOString(), needsClarification: false };
    }

    // 2. Explicit yesterday: "yesterday", "gaye kale", "beete kal", "last night", "kal raat", "ગઈ કાલે", "બીતા કલ"
    if (matchWord(lower, 'yesterday|gaye kale|beete kal|last night|kal raat|ગઈ કાલે|બીતા કલ|बीता कल|बीते कल')) {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return { date: yesterday.toISOString(), needsClarification: false };
    }

    // 3. Explicit tomorrow: "tomorrow", "aavti kale", "આવતી કાલે", "aane wale kal"
    if (matchWord(lower, 'tomorrow|aavti kale|આવતી કાલે|आने वाला कल')) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return { date: tomorrow.toISOString(), needsClarification: false };
    }

    // 4. Ambiguous "kal" / "kale" / "કાલે" / "कल"
    if (matchWord(lower, 'kal|kale|કાલે|कल')) {
      // Check for past tense indicator words
      const hasPastClue = matchWord(
        lower,
        'spent|paid|aapyu|lidhu|chookvya|de diya|kharida|received|malya|mili|કીધું|આપ્યા|ચૂકવ્યા|લીધું|दिया|खरीदा'
      );

      // Check for future tense indicator words
      const hasFutureClue = matchWord(lower, 'will|aapse|dega|pay karish|de dunga|ભરીશ|આપીશ|દूँगा|दूंगा');

      if (hasPastClue && !hasFutureClue) {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return {
          date: yesterday.toISOString(),
          needsClarification: false,
          warning: 'Resolved "kal" as yesterday based on past context.',
        };
      }

      if (hasFutureClue && !hasPastClue) {
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return {
          date: tomorrow.toISOString(),
          needsClarification: false,
          warning: 'Resolved "kal" as tomorrow based on future context.',
        };
      }

      // Ambiguous: ask user for clarification!
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return {
        date: yesterday.toISOString(), // Sensible default for expense logging
        needsClarification: true,
        clarificationQuestion: 'Did you mean yesterday or tomorrow for "kal"?',
        warning: 'The word "kal" can mean yesterday or tomorrow. Please confirm the date.',
      };
    }

    // Default to today
    return { date: now.toISOString(), needsClarification: false };
  }

  /**
   * Identify payment method from text
   */
  static resolvePaymentMethod(text: string): { id: string; name: string } | null {
    const lower = text.toLowerCase();

    // UPI
    if (matchWord(lower, 'upi|gpay|google pay|phonepe|paytm|bhim|upi thi|upi se|યુપીઆઈ')) {
      return { id: 'pm_upi', name: 'UPI' };
    }

    // Cash
    if (matchWord(lower, 'cash|rokad|nagad|રોકડ|नकद|cash ma|cash se')) {
      return { id: 'pm_cash', name: 'Cash' };
    }

    // Card (Credit or Debit)
    if (matchWord(lower, 'credit card|credit')) {
      return { id: 'pm_credit_card', name: 'Credit Card' };
    }
    if (matchWord(lower, 'debit card|debit')) {
      return { id: 'pm_debit_card', name: 'Debit Card' };
    }
    if (matchWord(lower, 'card|કાર્ડ|कार्ड|card thi|card se')) {
      return { id: 'pm_credit_card', name: 'Credit Card' };
    }

    // Bank Transfer
    if (matchWord(lower, 'bank|net banking|neft|imps|rtgs|બેંક|बैंक|transfer|khate|खाते')) {
      return { id: 'pm_bank_transfer', name: 'Bank Transfer' };
    }

    return null;
  }

  /**
   * Match category and transaction type
   */
  static resolveCategoryAndType(text: string): {
    categoryId: string;
    categoryName: string;
    type: 'INCOME' | 'EXPENSE';
    cleanDescription: string;
  } {
    const lower = text.toLowerCase();

    // 1. Income detection
    const isIncome = matchWord(
      lower,
      'salary|received|credited|earned|pagaar|vetan|stipend|freelance|dividend|refund|malya|mili|kamaya|પગાર\\S*|વેતન\\S*|મળ્યા|સંપાદિત|कमाए|मिला|वेतन'
    );

    if (isIncome) {
      if (matchWord(lower, 'freelance|client|project fee')) {
        return { categoryId: 'cat_freelance', categoryName: 'Freelance', type: 'INCOME', cleanDescription: 'Freelance income' };
      }
      if (matchWord(lower, 'dividend|interest|stock|mf|mutual fund')) {
        return { categoryId: 'cat_investment_income', categoryName: 'Investment Income', type: 'INCOME', cleanDescription: 'Investment return' };
      }
      if (matchWord(lower, 'gift|bhet|shagun|ઈનામ|ભેટ')) {
        return { categoryId: 'cat_gift', categoryName: 'Gift', type: 'INCOME', cleanDescription: 'Gift received' };
      }
      return { categoryId: 'cat_salary', categoryName: 'Salary', type: 'INCOME', cleanDescription: 'Salary' };
    }

    // 2. Expense Categories
    if (matchWord(lower, 'petrol|diesel|fuel|cng|પેટ્રોલ\\S*|ડીઝલ\\S*|ईंधन|पेट्रोल\\S*')) {
      return { categoryId: 'cat_petrol_fuel', categoryName: 'Petrol & Fuel', type: 'EXPENSE', cleanDescription: 'Petrol & Fuel' };
    }

    if (matchWord(lower, 'chai|tea|coffee|cafe|swiggy|zomato|dinner|lunch|breakfast|food|restaurant|nashto|khana|ચા\\S*|કોફી|જમવા\\S*|નાસ્તો|ખાવા\\S*|खाना\\S*|चाय|कॉफ़ी|खाना')) {
      return { categoryId: 'cat_food_dining', categoryName: 'Food & Dining', type: 'EXPENSE', cleanDescription: 'Food & Dining' };
    }

    if (matchWord(lower, 'groceries|grocery|kirana|veggies|vegetables|milk|doodh|shakbhaji|ration|blinkit|zepto|instamart|શાકભાજી\\S*|દૂધ|કરિયાણું|किराना|सब्जी\\S*|दूध')) {
      return { categoryId: 'cat_groceries', categoryName: 'Groceries', type: 'EXPENSE', cleanDescription: 'Groceries' };
    }

    if (matchWord(lower, 'rent|bhadu|flat rent|room rent|ભાડું|ભાડા\\S*|किराया|किराये')) {
      return { categoryId: 'cat_rent', categoryName: 'Rent', type: 'EXPENSE', cleanDescription: 'House Rent' };
    }

    if (matchWord(lower, 'electricity|light bill|bill|power|water|gas|wifi|broadband|recharge|torrent|વીજળી\\S*|બિલ|बिजली\\S*|बिल')) {
      return { categoryId: 'cat_bills_utilities', categoryName: 'Bills & Utilities', type: 'EXPENSE', cleanDescription: 'Utility Bill' };
    }

    if (matchWord(lower, 'cab|uber|ola|auto|rickshaw|bus|train|metro|flight|rickshaw|રિક્શા|બસ|ઓટો|ऑटो|रिक्शा')) {
      return { categoryId: 'cat_transportation', categoryName: 'Transportation', type: 'EXPENSE', cleanDescription: 'Transportation' };
    }

    if (matchWord(lower, 'shopping|clothes|amazon|flipkart|myntra|shoes|kapda|ખરીદી|कपड़े|कपड़ा')) {
      return { categoryId: 'cat_shopping', categoryName: 'Shopping', type: 'EXPENSE', cleanDescription: 'Shopping' };
    }

    if (matchWord(lower, 'movie|cinema|netflix|hotstar|prime|game|theatre|પિક્ચર|सिनेमा')) {
      return { categoryId: 'cat_entertainment', categoryName: 'Entertainment', type: 'EXPENSE', cleanDescription: 'Entertainment' };
    }

    if (matchWord(lower, 'doctor|medicine|pharmacy|hospital|clinic|medical|dawa|દવા\\S*|दवा\\S*')) {
      return { categoryId: 'cat_health', categoryName: 'Health', type: 'EXPENSE', cleanDescription: 'Health & Medical' };
    }

    return { categoryId: 'cat_other_expense', categoryName: 'Other Expense', type: 'EXPENSE', cleanDescription: 'Expense' };
  }

  /**
   * Derive a concise, readable description for the transaction
   */
  static formatDescription(
    segment: string,
    categoryName: string,
    extractedAmount: string
  ): string {
    // Remove amount tokens, dates, and payment keywords from segment to form a natural description
    let clean = segment
      .replace(/\b(?:today|aaj|aaje|yesterday|gaye kale|tomorrow|kal|kale|કાલે|આજે|आज|कल)\b/gi, '')
      .replace(/\b(?:upi|cash|card|bank|credit|debit|phonepe|gpay|paytm)\b/gi, '')
      .replace(/\b(?:thi|ma|se|nu|na|ni|ka|ke|ki|rupees|rs\.?|inr|રૂ|રૂપિયા|रुपये)\b/gi, '')
      .replace(/[₹$€£,]/g, '')
      .replace(/\b\d+(?:\.\d+)?\b/g, '')
      .trim();

    clean = clean.replace(/\s+/g, ' ');
    if (clean.length >= 3) {
      // Capitalize first letter
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return categoryName;
  }

  /**
   * Check for recurring payment intent (e.g. "Netflix 649 monthly subscription")
   */
  static checkRecurringIntent(text: string): {
    isRecurring: boolean;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  } {
    const lower = text.toLowerCase();
    if (/\b(?:monthly|subscription|per month|every month|har mahine|દર મહિને|દર માસે|हर महीने)\b/i.test(lower)) {
      return { isRecurring: true, frequency: 'MONTHLY' };
    }
    if (/\b(?:yearly|annual|annually|per year|every year|દર વર્ષે|हर साल)\b/i.test(lower)) {
      return { isRecurring: true, frequency: 'YEARLY' };
    }
    if (/\b(?:weekly|per week|every week|દર અઠવાડિયે|हर हफ्ते)\b/i.test(lower)) {
      return { isRecurring: true, frequency: 'WEEKLY' };
    }
    if (/\b(?:daily|every day|roj|darroj|દરરોજ|रोज)\b/i.test(lower)) {
      return { isRecurring: true, frequency: 'DAILY' };
    }
    return { isRecurring: false };
  }

  /**
   * Main parsing function
   */
  static parse(
    rawText: string,
    options: { locale?: string; timezone?: string } = {}
  ): ParseResult {
    const timezone = options.timezone || 'Asia/Kolkata';
    const normalized = this.normalizeNumerals(rawText.trim());

    // Check overall recurring intent
    const recurringCheck = this.checkRecurringIntent(normalized);

    // Global payment method and date if defined at sentence level
    const globalPaymentMethod = this.resolvePaymentMethod(normalized);
    const globalDate = this.resolveDate(normalized, normalized, timezone);

    // Split multi-transaction expressions
    const segments = this.splitIntoSegments(normalized);
    const drafts: CandidateDraft[] = [];
    const overallWarnings: string[] = [];

    if (globalDate.warning) {
      overallWarnings.push(globalDate.warning);
    }

    for (const segment of segments) {
      const amountResult = this.extractAmount(segment);
      const paymentMethod = this.resolvePaymentMethod(segment) || globalPaymentMethod;
      const dateResult = this.resolveDate(segment, normalized, timezone);

      const { categoryId, categoryName, type } = this.resolveCategoryAndType(segment);
      const description = this.formatDescription(segment, categoryName, amountResult?.amount || '');

      const warnings: string[] = [];
      let needsClarification = false;
      let clarificationQuestion: string | undefined;

      // Handle missing amount
      let amount = '';
      if (!amountResult || !amountResult.amount) {
        needsClarification = true;
        clarificationQuestion = `What was the amount spent for ${description || categoryName}?`;
        warnings.push('Amount could not be reliably detected. Please specify the amount.');
      } else {
        amount = amountResult.amount;
      }

      // Handle ambiguous date
      if (dateResult.needsClarification) {
        needsClarification = true;
        clarificationQuestion = clarificationQuestion || dateResult.clarificationQuestion;
        if (dateResult.warning) warnings.push(dateResult.warning);
      }

      // Handle recurring notice
      if (recurringCheck.isRecurring) {
        warnings.push('Recurring payment detected. You can also track this in Bills & Subscriptions.');
      }

      drafts.push({
        draftId: `draft_${randomUUID()}`,
        type,
        amount,
        currency: 'INR',
        description,
        categoryId,
        categoryName,
        paymentMethodId: paymentMethod?.id || null,
        paymentMethodName: paymentMethod?.name || null,
        transactionDate: dateResult.date || globalDate.date,
        confidence: needsClarification ? 0.65 : 0.95,
        needsClarification,
        clarificationQuestion,
        warnings,
        isRecurringSuggestion: recurringCheck.isRecurring,
        recurringFrequency: recurringCheck.frequency,
        sourceSegment: segment,
      });
    }

    return {
      drafts,
      parserType: 'rule_based',
      warnings: overallWarnings,
    };
  }
}
