import { describe, expect, it } from 'vitest';
import { RuleBasedParserService } from '../../src/services/ai/ruleBasedParser.service.js';

describe('RuleBasedParserService - Natural Language Financial Parsing', () => {
  it('parses English expense with card payment: "Spent 850 on dinner last night using my credit card"', () => {
    const res = RuleBasedParserService.parse('Spent 850 on dinner last night using my credit card');
    expect(res.drafts.length).toBe(1);
    const draft = res.drafts[0];
    expect(draft.type).toBe('EXPENSE');
    expect(draft.amount).toBe('850.00');
    expect(draft.categoryId).toBe('cat_food_dining');
    expect(draft.paymentMethodId).toBe('pm_credit_card');
    expect(draft.needsClarification).toBe(false);
  });

  it('parses English income with bank payment: "Salary received 45000 today in bank"', () => {
    const res = RuleBasedParserService.parse('Salary received 45000 today in bank');
    expect(res.drafts.length).toBe(1);
    const draft = res.drafts[0];
    expect(draft.type).toBe('INCOME');
    expect(draft.amount).toBe('45000.00');
    expect(draft.categoryId).toBe('cat_salary');
    expect(draft.paymentMethodId).toBe('pm_bank_transfer');
  });

  it('parses Hinglish multi-transaction sentence: "Aaje 250 nu petrol ane 120 ni coffee UPI thi"', () => {
    const res = RuleBasedParserService.parse('Aaje 250 nu petrol ane 120 ni coffee UPI thi');
    expect(res.drafts.length).toBe(2);

    const petrolDraft = res.drafts[0];
    expect(petrolDraft.type).toBe('EXPENSE');
    expect(petrolDraft.amount).toBe('250.00');
    expect(petrolDraft.categoryId).toBe('cat_petrol_fuel');
    expect(petrolDraft.paymentMethodId).toBe('pm_upi');

    const coffeeDraft = res.drafts[1];
    expect(coffeeDraft.type).toBe('EXPENSE');
    expect(coffeeDraft.amount).toBe('120.00');
    expect(coffeeDraft.categoryId).toBe('cat_food_dining');
    expect(coffeeDraft.paymentMethodId).toBe('pm_upi'); // Carried over from global context
  });

  it('parses Gujarati native script with Gujarati numerals: "આજે ચા માટે ૩૦ રૂપિયા આપ્યા"', () => {
    const res = RuleBasedParserService.parse('આજે ચા માટે ૩૦ રૂપિયા આપ્યા');
    expect(res.drafts.length).toBe(1);
    const draft = res.drafts[0];
    expect(draft.type).toBe('EXPENSE');
    expect(draft.amount).toBe('30.00');
    expect(draft.categoryId).toBe('cat_food_dining');
  });

  it('parses Gujarati native script with UPI: "આજે પેટ્રોલના ૫૦૦ રૂપિયા UPI થી ચૂકવ્યા"', () => {
    const res = RuleBasedParserService.parse('આજે પેટ્રોલના ૫૦૦ રૂપિયા UPI થી ચૂકવ્યા');
    expect(res.drafts.length).toBe(1);
    const draft = res.drafts[0];
    expect(draft.type).toBe('EXPENSE');
    expect(draft.amount).toBe('500.00');
    expect(draft.categoryId).toBe('cat_petrol_fuel');
    expect(draft.paymentMethodId).toBe('pm_upi');
  });

  it('parses Hindi native script: "आज ₹200 का खाना UPI से"', () => {
    const res = RuleBasedParserService.parse('आज ₹200 का खाना UPI से');
    expect(res.drafts.length).toBe(1);
    const draft = res.drafts[0];
    expect(draft.type).toBe('EXPENSE');
    expect(draft.amount).toBe('200.00');
    expect(draft.categoryId).toBe('cat_food_dining');
    expect(draft.paymentMethodId).toBe('pm_upi');
  });

  it('detects ambiguous "kal" and requests clarification', () => {
    const res = RuleBasedParserService.parse('kal 500 petrol');
    expect(res.drafts.length).toBe(1);
    const draft = res.drafts[0];
    expect(draft.amount).toBe('500.00');
    expect(draft.needsClarification).toBe(true);
    expect(draft.clarificationQuestion).toContain('yesterday or tomorrow');
  });

  it('flags missing amount when amount is absent and asks for clarification', () => {
    const res = RuleBasedParserService.parse('Groceries shopping at supermarket');
    expect(res.drafts.length).toBe(1);
    const draft = res.drafts[0];
    expect(draft.amount).toBe('');
    expect(draft.needsClarification).toBe(true);
    expect(draft.clarificationQuestion).toContain('amount');
  });

  it('detects recurring subscription pattern and flags recommendation: "Netflix 649 monthly subscription"', () => {
    const res = RuleBasedParserService.parse('Netflix 649 monthly subscription');
    expect(res.drafts.length).toBe(1);
    const draft = res.drafts[0];
    expect(draft.amount).toBe('649.00');
    expect(draft.categoryId).toBe('cat_entertainment');
    expect(draft.isRecurringSuggestion).toBe(true);
    expect(draft.recurringFrequency).toBe('MONTHLY');
  });

  it('handles Indian multiplier shorthand (1.5k, 2 lakh)', () => {
    const res1 = RuleBasedParserService.parse('Paid 1.5k for electricity bill');
    expect(res1.drafts[0].amount).toBe('1500.00');
    expect(res1.drafts[0].categoryId).toBe('cat_bills_utilities');

    const res2 = RuleBasedParserService.parse('2 lakh salary credited in bank');
    expect(res2.drafts[0].amount).toBe('200000.00');
    expect(res2.drafts[0].type).toBe('INCOME');
  });
});
