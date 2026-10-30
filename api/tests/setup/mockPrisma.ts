import { vi } from 'vitest';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
  preferredLanguage: string;
  preferredTheme: string;
  budgetAlertsEnabled: boolean;
  billRemindersEnabled: boolean;
  savingsMilestonesEnabled: boolean;
  syncAlertsEnabled: boolean;
  dailySummaryEnabled: boolean;
  disabledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthIdentityRecord {
  id: string;
  userId: string;
  provider: string;
  providerSubject: string;
  createdAt: Date;
}

interface RefreshSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  deviceInfo: string | null;
}

interface TokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

interface CategoryRecord {
  id: string;
  userId: string | null;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentMethodRecord {
  id: string;
  userId: string | null;
  name: string;
  type: string;
  details: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionRecord {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: Prisma.Decimal;
  currency: string;
  description: string;
  categoryId: string;
  paymentMethodId: string | null;
  transactionDate: Date;
  notes: string | null;
  clientMutationId: string | null;
  version: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface BudgetRecord {
  id: string;
  userId: string;
  name: string;
  type: 'OVERALL' | 'CATEGORY';
  categoryId: string | null;
  amount: Prisma.Decimal;
  currency: string;
  period: 'MONTHLY' | 'CUSTOM';
  startDate: Date | null;
  endDate: Date | null;
  warningThresholds: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BudgetAlertRecord {
  id: string;
  userId: string;
  budgetId: string;
  thresholdPercent: number;
  periodKey: string;
  triggeredAt: Date;
  readAt: Date | null;
  createdAt: Date;
}

interface SavingsGoalRecord {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  targetAmount: Prisma.Decimal;
  currency: string;
  targetDate: Date | null;
  icon: string | null;
  color: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

interface SavingsContributionRecord {
  id: string;
  userId: string;
  goalId: string;
  amount: Prisma.Decimal;
  contributionDate: Date;
  note: string | null;
  createdAt: Date;
}

interface RecurringRuleRecord {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  providerName: string | null;
  type: 'INCOME' | 'EXPENSE';
  amount: Prisma.Decimal;
  currency: string;
  categoryId: string | null;
  paymentMethodId: string | null;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  startDate: Date;
  nextDueAt: Date;
  endDate: Date | null;
  timezone: string;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  autoPost: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

interface RecurringOccurrenceRecord {
  id: string;
  recurringRuleId: string;
  userId: string;
  occurrenceKey: string;
  scheduledAt: Date;
  status: 'UPCOMING' | 'DUE' | 'AWAITING_CONFIRMATION' | 'PAID' | 'SKIPPED' | 'FAILED';
  transactionId: string | null;
  reminderSentAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RecurringReminderRecord {
  id: string;
  userId: string;
  ruleId: string;
  occurrenceId: string;
  title: string;
  message: string;
  amount: Prisma.Decimal;
  currency: string;
  dueDate: Date;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

interface SyncReceiptRecord {
  id: string;
  userId: string;
  operationId: string;
  entityType: string;
  entityId: string;
  operationType: string;
  status: string;
  resultPayload: string | null;
  createdAt: Date;
}

interface DevicePushTokenRecord {
  id: string;
  userId: string;
  token: string;
  platform: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
}

export class InMemoryPrismaMock {
  public users: UserRecord[] = [];
  public identities: AuthIdentityRecord[] = [];
  public refreshSessions: RefreshSessionRecord[] = [];
  public verificationTokens: TokenRecord[] = [];
  public passwordResetTokens: TokenRecord[] = [];
  public categories: CategoryRecord[] = [];
  public paymentMethods: PaymentMethodRecord[] = [];
  public transactions: TransactionRecord[] = [];
  public budgets: BudgetRecord[] = [];
  public budgetAlerts: BudgetAlertRecord[] = [];
  public savingsGoals: SavingsGoalRecord[] = [];
  public savingsContributions: SavingsContributionRecord[] = [];
  public recurringRules: RecurringRuleRecord[] = [];
  public recurringOccurrences: RecurringOccurrenceRecord[] = [];
  public recurringReminders: RecurringReminderRecord[] = [];
  public syncReceipts: SyncReceiptRecord[] = [];
  public devicePushTokens: DevicePushTokenRecord[] = [];

  clear() {
    this.users = [];
    this.identities = [];
    this.refreshSessions = [];
    this.verificationTokens = [];
    this.passwordResetTokens = [];
    this.categories = [];
    this.paymentMethods = [];
    this.transactions = [];
    this.budgets = [];
    this.budgetAlerts = [];
    this.savingsGoals = [];
    this.savingsContributions = [];
    this.recurringRules = [];
    this.recurringOccurrences = [];
    this.recurringReminders = [];
    this.syncReceipts = [];
    this.devicePushTokens = [];
  }

  user = {
    findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
      return this.users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) || null;
    }),
    create: vi.fn(async ({ data }: { data: any }) => {
      const record: UserRecord = {
        id: data.id || crypto.randomUUID(),
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash || null,
        emailVerifiedAt: data.emailVerifiedAt || null,
        preferredLanguage: data.preferredLanguage || 'en',
        preferredTheme: data.preferredTheme || 'light',
        budgetAlertsEnabled: data.budgetAlertsEnabled !== undefined ? data.budgetAlertsEnabled : true,
        billRemindersEnabled: data.billRemindersEnabled !== undefined ? data.billRemindersEnabled : true,
        savingsMilestonesEnabled: data.savingsMilestonesEnabled !== undefined ? data.savingsMilestonesEnabled : true,
        syncAlertsEnabled: data.syncAlertsEnabled !== undefined ? data.syncAlertsEnabled : true,
        dailySummaryEnabled: data.dailySummaryEnabled !== undefined ? data.dailySummaryEnabled : false,
        disabledAt: data.disabledAt || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
      const idx = this.users.findIndex((u) => u.id === where.id);
      if (idx === -1) throw new Error('User not found');
      this.users[idx] = { ...this.users[idx], ...data, updatedAt: new Date() };
      return this.users[idx];
    }),
    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      const idx = this.users.findIndex((u) => u.id === where.id);
      if (idx === -1) throw new Error('User not found');
      const removed = this.users.splice(idx, 1)[0];
      // Cascade delete user-owned data in mock
      this.transactions = this.transactions.filter((t) => t.userId !== where.id);
      this.budgets = this.budgets.filter((b) => b.userId !== where.id);
      this.savingsGoals = this.savingsGoals.filter((g) => g.userId !== where.id);
      this.savingsContributions = this.savingsContributions.filter((c) => c.userId !== where.id);
      this.recurringRules = this.recurringRules.filter((r) => r.userId !== where.id);
      this.recurringOccurrences = this.recurringOccurrences.filter((o) => o.userId !== where.id);
      this.recurringReminders = this.recurringReminders.filter((rem) => rem.userId !== where.id);
      this.refreshSessions = this.refreshSessions.filter((s) => s.userId !== where.id);
      return removed;
    }),
  };

  authIdentity = {
    findUnique: vi.fn(async ({ where }: any) => {
      const provider = where.provider_providerSubject?.provider;
      const sub = where.provider_providerSubject?.providerSubject;
      const id = this.identities.find((i) => i.provider === provider && i.providerSubject === sub);
      if (!id) return null;
      const user = this.users.find((u) => u.id === id.userId);
      return { ...id, user };
    }),
    create: vi.fn(async ({ data }: any) => {
      const record: AuthIdentityRecord = {
        id: crypto.randomUUID(),
        userId: data.userId,
        provider: data.provider,
        providerSubject: data.providerSubject,
        createdAt: new Date(),
      };
      this.identities.push(record);
      return record;
    }),
  };

  refreshSession = {
    findUnique: vi.fn(async ({ where }: { where: { tokenHash: string } }) => {
      const session = this.refreshSessions.find((s) => s.tokenHash === where.tokenHash);
      if (!session) return null;
      const user = this.users.find((u) => u.id === session.userId);
      return { ...session, user };
    }),
    create: vi.fn(async ({ data }: any) => {
      const record: RefreshSessionRecord = {
        id: crypto.randomUUID(),
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
        lastUsedAt: null,
        revokedAt: null,
        deviceInfo: data.deviceInfo || null,
      };
      this.refreshSessions.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.refreshSessions.findIndex((s) => s.id === where.id);
      if (idx !== -1) {
        this.refreshSessions[idx] = { ...this.refreshSessions[idx], ...data };
        return this.refreshSessions[idx];
      }
      return null;
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      let count = 0;
      this.refreshSessions.forEach((s, idx) => {
        let match = true;
        if (where.tokenHash && s.tokenHash !== where.tokenHash) match = false;
        if (where.userId && s.userId !== where.userId) match = false;
        if (where.revokedAt === null && s.revokedAt !== null) match = false;
        if (match) {
          this.refreshSessions[idx] = { ...s, ...data };
          count++;
        }
      });
      return { count };
    }),
  };

  verificationToken = {
    findUnique: vi.fn(async ({ where }: { where: { tokenHash: string } }) => {
      return this.verificationTokens.find((t) => t.tokenHash === where.tokenHash) || null;
    }),
    create: vi.fn(async ({ data }: any) => {
      const record: TokenRecord = {
        id: crypto.randomUUID(),
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        consumedAt: null,
        createdAt: new Date(),
      };
      this.verificationTokens.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.verificationTokens.findIndex((t) => t.id === where.id);
      if (idx !== -1) {
        this.verificationTokens[idx] = { ...this.verificationTokens[idx], ...data };
        return this.verificationTokens[idx];
      }
      return null;
    }),
  };

  passwordResetToken = {
    findUnique: vi.fn(async ({ where }: { where: { tokenHash: string } }) => {
      return this.passwordResetTokens.find((t) => t.tokenHash === where.tokenHash) || null;
    }),
    create: vi.fn(async ({ data }: any) => {
      const record: TokenRecord = {
        id: crypto.randomUUID(),
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        consumedAt: null,
        createdAt: new Date(),
      };
      this.passwordResetTokens.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.passwordResetTokens.findIndex((t) => t.id === where.id);
      if (idx !== -1) {
        this.passwordResetTokens[idx] = { ...this.passwordResetTokens[idx], ...data };
        return this.passwordResetTokens[idx];
      }
      return null;
    }),
  };

  category = {
    findMany: vi.fn(async (args?: any) => {
      let result = [...this.categories];
      if (args?.where) {
        if (args.where.OR) {
          result = result.filter((c) =>
            args.where.OR.some((cond: any) => {
              if (cond.isSystem && c.isSystem) return true;
              if (cond.userId && c.userId === cond.userId) return true;
              return false;
            })
          );
        }
        if (args.where.type) {
          result = result.filter((c) => c.type === args.where.type);
        }
      }
      return result;
    }),
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      return this.categories.find((c) => c.id === where.id) || null;
    }),
    findFirst: vi.fn(async ({ where }: any) => {
      return this.categories.find((c) => {
        if (where.id && c.id !== where.id) return false;
        if (where.userId && c.userId !== where.userId) return false;
        return true;
      }) || null;
    }),
    create: vi.fn(async ({ data }: any) => {
      const record: CategoryRecord = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId || null,
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color || null,
        isSystem: Boolean(data.isSystem),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.categories.push(record);
      return record;
    }),
    upsert: vi.fn(async ({ where, update, create }: any) => {
      const existing = this.categories.find((c) => c.id === where.id);
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      const record: CategoryRecord = {
        id: create.id || where.id || crypto.randomUUID(),
        userId: create.userId || null,
        name: create.name,
        type: create.type,
        icon: create.icon,
        color: create.color || null,
        isSystem: Boolean(create.isSystem),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.categories.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.categories.findIndex((c) => c.id === where.id);
      if (idx === -1) throw new Error('Category not found');
      this.categories[idx] = { ...this.categories[idx], ...data, updatedAt: new Date() };
      return this.categories[idx];
    }),
    delete: vi.fn(async ({ where }: any) => {
      const idx = this.categories.findIndex((c) => c.id === where.id);
      if (idx === -1) throw new Error('Category not found');
      const removed = this.categories.splice(idx, 1)[0];
      return removed;
    }),
  };

  paymentMethod = {
    findMany: vi.fn(async (args?: any) => {
      let result = [...this.paymentMethods];
      if (args?.where?.OR) {
        result = result.filter((pm) =>
          args.where.OR.some((cond: any) => {
            if (cond.isSystem && pm.isSystem) return true;
            if (cond.userId && pm.userId === cond.userId) return true;
            return false;
          })
        );
      }
      return result;
    }),
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      return this.paymentMethods.find((pm) => pm.id === where.id) || null;
    }),
    create: vi.fn(async ({ data }: any) => {
      const record: PaymentMethodRecord = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId || null,
        name: data.name,
        type: data.type,
        details: data.details || null,
        isSystem: Boolean(data.isSystem),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.paymentMethods.push(record);
      return record;
    }),
    upsert: vi.fn(async ({ where, update, create }: any) => {
      const existing = this.paymentMethods.find((pm) => pm.id === where.id);
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      const record: PaymentMethodRecord = {
        id: create.id || where.id || crypto.randomUUID(),
        userId: create.userId || null,
        name: create.name,
        type: create.type,
        details: create.details || null,
        isSystem: Boolean(create.isSystem),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.paymentMethods.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.paymentMethods.findIndex((pm) => pm.id === where.id);
      if (idx === -1) throw new Error('Payment method not found');
      this.paymentMethods[idx] = { ...this.paymentMethods[idx], ...data, updatedAt: new Date() };
      return this.paymentMethods[idx];
    }),
    delete: vi.fn(async ({ where }: any) => {
      const idx = this.paymentMethods.findIndex((pm) => pm.id === where.id);
      if (idx === -1) throw new Error('Payment method not found');
      const removed = this.paymentMethods.splice(idx, 1)[0];
      return removed;
    }),
  };

  transaction = {
    findMany: vi.fn(async (args: any) => {
      const where = args?.where || {};
      let list = this.transactions.filter((tx) => {
        if (where.userId && tx.userId !== where.userId) return false;
        if (where.type && tx.type !== where.type) return false;
        if (where.currency && tx.currency !== where.currency) return false;
        if (where.categoryId && tx.categoryId !== where.categoryId) return false;
        if (where.paymentMethodId && tx.paymentMethodId !== where.paymentMethodId) return false;
        if (where.clientMutationId && tx.clientMutationId !== where.clientMutationId) return false;
        if (where.deletedAt === null && tx.deletedAt !== null) return false;
        if (where.deletedAt && where.deletedAt.not === null && tx.deletedAt === null) return false;
        if (where.updatedAt) {
          const uDate = tx.updatedAt.getTime();
          if (where.updatedAt.gt && uDate <= where.updatedAt.gt.getTime()) return false;
          if (where.updatedAt.gte && uDate < where.updatedAt.gte.getTime()) return false;
        }

        if (where.transactionDate) {
          const tDate = tx.transactionDate.getTime();
          if (where.transactionDate.gte && tDate < where.transactionDate.gte.getTime()) return false;
          if (where.transactionDate.lte && tDate > where.transactionDate.lte.getTime()) return false;
        }

        if (where.OR) {
          const match = where.OR.some((cond: any) => {
            if (cond.description?.contains && !tx.description.toLowerCase().includes(cond.description.contains.toLowerCase())) {
              return false;
            }
            if (cond.notes?.contains && (!tx.notes || !tx.notes.toLowerCase().includes(cond.notes.contains.toLowerCase()))) {
              return false;
            }
            return true;
          });
          if (!match) return false;
        }

        return true;
      });

      // Sorting
      if (args?.orderBy) {
        const orderArr = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
        list.sort((a, b) => {
          for (const ord of orderArr) {
            const [key, dir] = Object.entries(ord)[0];
            let valA: any = (a as any)[key];
            let valB: any = (b as any)[key];
            if (valA instanceof Date) valA = valA.getTime();
            if (valB instanceof Date) valB = valB.getTime();
            if (valA instanceof Prisma.Decimal) valA = Number(valA);
            if (valB instanceof Prisma.Decimal) valB = Number(valB);

            if (valA < valB) return dir === 'asc' ? -1 : 1;
            if (valA > valB) return dir === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }

      if (args?.skip) {
        list = list.slice(args.skip);
      }
      if (args?.take) {
        list = list.slice(0, args.take);
      }

      // Attach category and paymentMethod relations
      return list.map((tx) => ({
        ...tx,
        category: this.categories.find((c) => c.id === tx.categoryId),
        paymentMethod: tx.paymentMethodId ? this.paymentMethods.find((pm) => pm.id === tx.paymentMethodId) : null,
      }));
    }),
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      const tx = this.transactions.find((t) => t.id === where.id);
      if (!tx) return null;
      return {
        ...tx,
        category: this.categories.find((c) => c.id === tx.categoryId),
        paymentMethod: tx.paymentMethodId ? this.paymentMethods.find((pm) => pm.id === tx.paymentMethodId) : null,
      };
    }),
    findFirst: vi.fn(async ({ where }: any) => {
      const tx = this.transactions.find((t) => {
        if (where.id && t.id !== where.id) return false;
        if (where.categoryId && t.categoryId !== where.categoryId) return false;
        if (where.userId && t.userId !== where.userId) return false;
        if (where.clientMutationId && t.clientMutationId !== where.clientMutationId) return false;
        return true;
      });
      return tx || null;
    }),
    count: vi.fn(async ({ where }: any) => {
      const list = this.transactions.filter((tx) => {
        if (where?.userId && tx.userId !== where.userId) return false;
        if (where?.type && tx.type !== where.type) return false;
        if (where?.categoryId && tx.categoryId !== where.categoryId) return false;
        if (where?.paymentMethodId && tx.paymentMethodId !== where.paymentMethodId) return false;
        if (where?.clientMutationId && tx.clientMutationId !== where.clientMutationId) return false;
        if (where?.deletedAt === null && tx.deletedAt !== null) return false;
        if (where?.transactionDate) {
          const tDate = tx.transactionDate.getTime();
          if (where.transactionDate.gte && tDate < where.transactionDate.gte.getTime()) return false;
          if (where.transactionDate.lte && tDate > where.transactionDate.lte.getTime()) return false;
        }
        return true;
      });
      return list.length;
    }),
    create: vi.fn(async ({ data }: any) => {
      if (data.clientMutationId) {
        const existing = this.transactions.find((t) => t.clientMutationId === data.clientMutationId);
        if (existing) {
          const err: any = new Error('Unique constraint failed on clientMutationId');
          err.code = 'P2002';
          throw err;
        }
      }

      const record: TransactionRecord = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId,
        type: data.type,
        amount: data.amount instanceof Prisma.Decimal ? data.amount : new Prisma.Decimal(data.amount),
        currency: data.currency || 'INR',
        description: data.description,
        categoryId: data.categoryId,
        paymentMethodId: data.paymentMethodId || null,
        transactionDate: data.transactionDate instanceof Date ? data.transactionDate : new Date(data.transactionDate),
        notes: data.notes || null,
        clientMutationId: data.clientMutationId || null,
        version: data.version || 1,
        deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.transactions.push(record);
      return {
        ...record,
        category: this.categories.find((c) => c.id === record.categoryId),
        paymentMethod: record.paymentMethodId ? this.paymentMethods.find((pm) => pm.id === record.paymentMethodId) : null,
      };
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.transactions.findIndex((t) => t.id === where.id);
      if (idx === -1) throw new Error('Transaction not found');
      this.transactions[idx] = {
        ...this.transactions[idx],
        ...data,
        updatedAt: new Date(),
      };
      return {
        ...this.transactions[idx],
        category: this.categories.find((c) => c.id === this.transactions[idx].categoryId),
        paymentMethod: this.transactions[idx].paymentMethodId
          ? this.paymentMethods.find((pm) => pm.id === this.transactions[idx].paymentMethodId)
          : null,
      };
    }),
    delete: vi.fn(async ({ where }: any) => {
      const idx = this.transactions.findIndex((t) => t.id === where.id);
      if (idx === -1) throw new Error('Transaction not found');
      const removed = this.transactions.splice(idx, 1)[0];
      return removed;
    }),
  };

  budget = {
    findMany: vi.fn(async (args: any = {}) => {
      let list = this.budgets.filter((b) => {
        if (args.where?.userId && b.userId !== args.where.userId) return false;
        if (args.where?.type && b.type !== args.where.type) return false;
        if (args.where?.period && b.period !== args.where.period) return false;
        if (args.where?.isActive !== undefined && b.isActive !== args.where.isActive) return false;
        return true;
      });

      return list.map((b) => ({
        ...b,
        category: b.categoryId ? this.categories.find((c) => c.id === b.categoryId) : null,
      }));
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      const b = this.budgets.find((item) => item.id === where.id);
      if (!b) return null;
      return {
        ...b,
        category: b.categoryId ? this.categories.find((c) => c.id === b.categoryId) : null,
      };
    }),
    findFirst: vi.fn(async ({ where }: any) => {
      const b = this.budgets.find((item) => {
        if (where.userId && item.userId !== where.userId) return false;
        if (where.type && item.type !== where.type) return false;
        if (where.categoryId !== undefined && item.categoryId !== where.categoryId) return false;
        if (where.period && item.period !== where.period) return false;
        if (where.isActive !== undefined && item.isActive !== where.isActive) return false;
        return true;
      });
      if (!b) return null;
      return {
        ...b,
        category: b.categoryId ? this.categories.find((c) => c.id === b.categoryId) : null,
      };
    }),
    create: vi.fn(async ({ data }: any) => {
      const record: BudgetRecord = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId,
        name: data.name,
        type: data.type || 'CATEGORY',
        categoryId: data.categoryId || null,
        amount: data.amount instanceof Prisma.Decimal ? data.amount : new Prisma.Decimal(data.amount),
        currency: data.currency || 'INR',
        period: data.period || 'MONTHLY',
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        warningThresholds: data.warningThresholds || '50,80,100',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.budgets.push(record);
      return {
        ...record,
        category: record.categoryId ? this.categories.find((c) => c.id === record.categoryId) : null,
      };
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.budgets.findIndex((b) => b.id === where.id);
      if (idx === -1) throw new Error('Budget not found');
      this.budgets[idx] = {
        ...this.budgets[idx],
        ...data,
        updatedAt: new Date(),
      };
      return {
        ...this.budgets[idx],
        category: this.budgets[idx].categoryId
          ? this.categories.find((c) => c.id === this.budgets[idx].categoryId)
          : null,
      };
    }),
    delete: vi.fn(async ({ where }: any) => {
      const idx = this.budgets.findIndex((b) => b.id === where.id);
      if (idx === -1) throw new Error('Budget not found');
      const removed = this.budgets.splice(idx, 1)[0];
      return removed;
    }),
  };

  budgetAlert = {
    findMany: vi.fn(async (args: any = {}) => {
      let list = this.budgetAlerts.filter((a) => {
        if (args.where?.userId && a.userId !== args.where.userId) return false;
        if (args.where?.readAt !== undefined) {
          if (args.where.readAt === null && a.readAt !== null) return false;
          if (args.where.readAt !== null && a.readAt === null) return false;
        }
        return true;
      });

      if (args.skip) list = list.slice(args.skip);
      if (args.take) list = list.slice(0, args.take);

      return list.map((a) => {
        const b = this.budgets.find((item) => item.id === a.budgetId);
        return {
          ...a,
          budget: b
            ? {
                ...b,
                category: b.categoryId ? this.categories.find((c) => c.id === b.categoryId) : null,
              }
            : null,
        };
      });
    }),
    findFirst: vi.fn(async ({ where }: any) => {
      const a = this.budgetAlerts.find((item) => {
        if (where.userId && item.userId !== where.userId) return false;
        if (where.budgetId && item.budgetId !== where.budgetId) return false;
        if (where.thresholdPercent && item.thresholdPercent !== where.thresholdPercent) return false;
        if (where.periodKey && item.periodKey !== where.periodKey) return false;
        return true;
      });
      return a || null;
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      const a = this.budgetAlerts.find((item) => item.id === where.id);
      if (!a) return null;
      const b = this.budgets.find((item) => item.id === a.budgetId);
      return {
        ...a,
        budget: b
          ? {
              ...b,
              category: b.categoryId ? this.categories.find((c) => c.id === b.categoryId) : null,
            }
          : null,
      };
    }),
    count: vi.fn(async ({ where }: any) => {
      const list = this.budgetAlerts.filter((a) => {
        if (where?.userId && a.userId !== where.userId) return false;
        if (where?.readAt === null && a.readAt !== null) return false;
        return true;
      });
      return list.length;
    }),
    create: vi.fn(async ({ data }: any) => {
      // Check unique constraint: budgetId + thresholdPercent + periodKey
      const duplicate = this.budgetAlerts.find(
        (a) =>
          a.budgetId === data.budgetId &&
          a.thresholdPercent === data.thresholdPercent &&
          a.periodKey === data.periodKey
      );
      if (duplicate) {
        const err: any = new Error('Unique constraint failed on the fields: (`budgetId`,`thresholdPercent`,`periodKey`)');
        err.code = 'P2002';
        throw err;
      }

      const record: BudgetAlertRecord = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId,
        budgetId: data.budgetId,
        thresholdPercent: data.thresholdPercent,
        periodKey: data.periodKey,
        triggeredAt: data.triggeredAt || new Date(),
        readAt: data.readAt || null,
        createdAt: new Date(),
      };
      this.budgetAlerts.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.budgetAlerts.findIndex((a) => a.id === where.id);
      if (idx === -1) throw new Error('BudgetAlert not found');
      this.budgetAlerts[idx] = {
        ...this.budgetAlerts[idx],
        ...data,
      };
      const b = this.budgets.find((item) => item.id === this.budgetAlerts[idx].budgetId);
      return {
        ...this.budgetAlerts[idx],
        budget: b
          ? {
              ...b,
              category: b.categoryId ? this.categories.find((c) => c.id === b.categoryId) : null,
            }
          : null,
      };
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      let count = 0;
      for (let i = 0; i < this.budgetAlerts.length; i++) {
        const a = this.budgetAlerts[i];
        if (where.userId && a.userId !== where.userId) continue;
        if (where.readAt === null && a.readAt !== null) continue;
        this.budgetAlerts[i] = { ...a, ...data };
        count++;
      }
      return { count };
    }),
  };

  savingsGoal = {
    findMany: vi.fn(async (args: any = {}) => {
      let list = this.savingsGoals.filter((g) => {
        if (args.where?.userId && g.userId !== args.where.userId) return false;
        if (args.where?.status && g.status !== args.where.status) return false;
        return true;
      });

      return list.map((g) => ({
        ...g,
        contributions: this.savingsContributions.filter((c) => c.goalId === g.id),
      }));
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      const g = this.savingsGoals.find((item) => item.id === where.id);
      if (!g) return null;
      return {
        ...g,
        contributions: this.savingsContributions.filter((c) => c.goalId === g.id),
      };
    }),
    create: vi.fn(async ({ data }: any) => {
      const record: SavingsGoalRecord = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId,
        name: data.name,
        description: data.description || null,
        targetAmount:
          data.targetAmount instanceof Prisma.Decimal ? data.targetAmount : new Prisma.Decimal(data.targetAmount),
        currency: data.currency || 'INR',
        targetDate: data.targetDate || null,
        icon: data.icon || 'PiggyBank',
        color: data.color || '#10B981',
        status: data.status || 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.savingsGoals.push(record);
      return {
        ...record,
        contributions: [],
      };
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.savingsGoals.findIndex((g) => g.id === where.id);
      if (idx === -1) throw new Error('Savings goal not found');
      this.savingsGoals[idx] = {
        ...this.savingsGoals[idx],
        ...data,
        updatedAt: new Date(),
      };
      return {
        ...this.savingsGoals[idx],
        contributions: this.savingsContributions.filter((c) => c.goalId === where.id),
      };
    }),
    delete: vi.fn(async ({ where }: any) => {
      const idx = this.savingsGoals.findIndex((g) => g.id === where.id);
      if (idx === -1) throw new Error('Savings goal not found');
      const removed = this.savingsGoals.splice(idx, 1)[0];
      // cascade contributions
      this.savingsContributions = this.savingsContributions.filter((c) => c.goalId !== where.id);
      return removed;
    }),
  };

  savingsContribution = {
    findMany: vi.fn(async (args: any = {}) => {
      let list = this.savingsContributions.filter((c) => {
        if (args.where?.userId && c.userId !== args.where.userId) return false;
        if (args.where?.goalId && c.goalId !== args.where.goalId) return false;
        return true;
      });
      return list;
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      const c = this.savingsContributions.find((item) => item.id === where.id);
      return c || null;
    }),
    create: vi.fn(async ({ data }: any) => {
      const record: SavingsContributionRecord = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId,
        goalId: data.goalId,
        amount: data.amount instanceof Prisma.Decimal ? data.amount : new Prisma.Decimal(data.amount),
        contributionDate: data.contributionDate || new Date(),
        note: data.note || null,
        createdAt: new Date(),
      };
      this.savingsContributions.push(record);
      return record;
    }),
    delete: vi.fn(async ({ where }: any) => {
      const idx = this.savingsContributions.findIndex((c) => c.id === where.id);
      if (idx === -1) throw new Error('Contribution not found');
      const removed = this.savingsContributions.splice(idx, 1)[0];
      return removed;
    }),
  };

  recurringRule = {
    findMany: vi.fn(async (args: any = {}) => {
      let list = this.recurringRules.filter((r) => {
        if (args.where?.userId && r.userId !== args.where.userId) return false;
        if (args.where?.status && r.status !== args.where.status) return false;
        if (args.where?.type && r.type !== args.where.type) return false;
        if (args.where?.frequency && r.frequency !== args.where.frequency) return false;
        return true;
      });

      if (args.skip) list = list.slice(args.skip);
      if (args.take) list = list.slice(0, args.take);

      return list.map((r) => ({
        ...r,
        category: r.categoryId ? this.categories.find((c) => c.id === r.categoryId) : null,
        paymentMethod: r.paymentMethodId ? this.paymentMethods.find((pm) => pm.id === r.paymentMethodId) : null,
        occurrences: this.recurringOccurrences.filter((o) => o.recurringRuleId === r.id),
      }));
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      const r = this.recurringRules.find((item) => item.id === where.id);
      if (!r) return null;
      return {
        ...r,
        category: r.categoryId ? this.categories.find((c) => c.id === r.categoryId) : null,
        paymentMethod: r.paymentMethodId ? this.paymentMethods.find((pm) => pm.id === r.paymentMethodId) : null,
        occurrences: this.recurringOccurrences.filter((o) => o.recurringRuleId === r.id),
      };
    }),
    findFirst: vi.fn(async ({ where }: any) => {
      const r = this.recurringRules.find((item) => {
        if (where.userId && item.userId !== where.userId) return false;
        if (where.status && item.status !== where.status) return false;
        return true;
      });
      if (!r) return null;
      return {
        ...r,
        category: r.categoryId ? this.categories.find((c) => c.id === r.categoryId) : null,
        paymentMethod: r.paymentMethodId ? this.paymentMethods.find((pm) => pm.id === r.paymentMethodId) : null,
        occurrences: this.recurringOccurrences.filter((o) => o.recurringRuleId === r.id),
      };
    }),
    count: vi.fn(async ({ where }: any = {}) => {
      const list = this.recurringRules.filter((r) => {
        if (where?.userId && r.userId !== where.userId) return false;
        if (where?.status && r.status !== where.status) return false;
        if (where?.type && r.type !== where.type) return false;
        return true;
      });
      return list.length;
    }),
    create: vi.fn(async ({ data }: any) => {
      const record: RecurringRuleRecord = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId,
        title: data.title,
        description: data.description || null,
        providerName: data.providerName || null,
        type: data.type || 'EXPENSE',
        amount: data.amount instanceof Prisma.Decimal ? data.amount : new Prisma.Decimal(data.amount),
        currency: data.currency || 'INR',
        categoryId: data.categoryId || null,
        paymentMethodId: data.paymentMethodId || null,
        frequency: data.frequency || 'MONTHLY',
        interval: data.interval || 1,
        startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
        nextDueAt: data.nextDueAt instanceof Date ? data.nextDueAt : new Date(data.nextDueAt),
        endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate)) : null,
        timezone: data.timezone || 'Asia/Kolkata',
        reminderEnabled: data.reminderEnabled !== undefined ? data.reminderEnabled : true,
        reminderDaysBefore: data.reminderDaysBefore !== undefined ? data.reminderDaysBefore : 1,
        autoPost: data.autoPost !== undefined ? data.autoPost : false,
        status: data.status || 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.recurringRules.push(record);
      return {
        ...record,
        category: record.categoryId ? this.categories.find((c) => c.id === record.categoryId) : null,
        paymentMethod: record.paymentMethodId
          ? this.paymentMethods.find((pm) => pm.id === record.paymentMethodId)
          : null,
      };
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.recurringRules.findIndex((r) => r.id === where.id);
      if (idx === -1) throw new Error('RecurringRule not found');
      this.recurringRules[idx] = {
        ...this.recurringRules[idx],
        ...data,
        updatedAt: new Date(),
      };
      const r = this.recurringRules[idx];
      return {
        ...r,
        category: r.categoryId ? this.categories.find((c) => c.id === r.categoryId) : null,
        paymentMethod: r.paymentMethodId ? this.paymentMethods.find((pm) => pm.id === r.paymentMethodId) : null,
      };
    }),
    delete: vi.fn(async ({ where }: any) => {
      const idx = this.recurringRules.findIndex((r) => r.id === where.id);
      if (idx === -1) throw new Error('RecurringRule not found');
      const removed = this.recurringRules.splice(idx, 1)[0];
      // cascade occurrences
      this.recurringOccurrences = this.recurringOccurrences.filter((o) => o.recurringRuleId !== where.id);
      return removed;
    }),
  };

  recurringOccurrence = {
    findMany: vi.fn(async (args: any = {}) => {
      let list = this.recurringOccurrences.filter((o) => {
        if (args.where?.userId && o.userId !== args.where.userId) return false;
        if (args.where?.recurringRuleId && o.recurringRuleId !== args.where.recurringRuleId) return false;
        if (args.where?.status) {
          if (args.where.status.in && !args.where.status.in.includes(o.status)) return false;
          if (typeof args.where.status === 'string' && o.status !== args.where.status) return false;
        }
        if (args.where?.reminderSentAt === null && o.reminderSentAt !== null) return false;
        if (args.where?.scheduledAt) {
          const sTime = o.scheduledAt.getTime();
          if (args.where.scheduledAt.gte && sTime < args.where.scheduledAt.gte.getTime()) return false;
          if (args.where.scheduledAt.lte && sTime > args.where.scheduledAt.lte.getTime()) return false;
        }
        if (args.where?.rule?.autoPost !== undefined) {
          const parentRule = this.recurringRules.find((r) => r.id === o.recurringRuleId);
          if (!parentRule || parentRule.autoPost !== args.where.rule.autoPost) return false;
          if (args.where.rule.status && parentRule.status !== args.where.rule.status) return false;
        }
        return true;
      });

      if (args.skip) list = list.slice(args.skip);
      if (args.take) list = list.slice(0, args.take);

      return list.map((o) => {
        const r = this.recurringRules.find((item) => item.id === o.recurringRuleId);
        const tx = o.transactionId ? this.transactions.find((t) => t.id === o.transactionId) : null;
        return {
          ...o,
          rule: r
            ? {
                ...r,
                category: r.categoryId ? this.categories.find((c) => c.id === r.categoryId) : null,
                paymentMethod: r.paymentMethodId ? this.paymentMethods.find((pm) => pm.id === r.paymentMethodId) : null,
              }
            : null,
          transaction: tx || null,
        };
      });
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      const o = this.recurringOccurrences.find((item) => item.id === where.id);
      if (!o) return null;
      const r = this.recurringRules.find((item) => item.id === o.recurringRuleId);
      const tx = o.transactionId ? this.transactions.find((t) => t.id === o.transactionId) : null;
      return {
        ...o,
        rule: r
          ? {
              ...r,
              category: r.categoryId ? this.categories.find((c) => c.id === r.categoryId) : null,
            }
          : null,
        transaction: tx || null,
      };
    }),
    findFirst: vi.fn(async ({ where }: any) => {
      const o = this.recurringOccurrences.find((item) => {
        if (where.userId && item.userId !== where.userId) return false;
        if (where.recurringRuleId && item.recurringRuleId !== where.recurringRuleId) return false;
        if (where.occurrenceKey && item.occurrenceKey !== where.occurrenceKey) return false;
        return true;
      });
      if (!o) return null;
      const r = this.recurringRules.find((item) => item.id === o.recurringRuleId);
      return {
        ...o,
        rule: r || null,
      };
    }),
    count: vi.fn(async ({ where }: any = {}) => {
      const list = this.recurringOccurrences.filter((o) => {
        if (where?.userId && o.userId !== where.userId) return false;
        if (where?.recurringRuleId && o.recurringRuleId !== where.recurringRuleId) return false;
        if (where?.status && o.status !== where.status) return false;
        return true;
      });
      return list.length;
    }),
    create: vi.fn(async ({ data }: any) => {
      // Enforce unique constraint: [recurringRuleId, occurrenceKey]
      const duplicate = this.recurringOccurrences.find(
        (o) => o.recurringRuleId === data.recurringRuleId && o.occurrenceKey === data.occurrenceKey
      );
      if (duplicate) {
        const err: any = new Error(
          'Unique constraint failed on the fields: (`recurringRuleId`,`occurrenceKey`)'
        );
        err.code = 'P2002';
        throw err;
      }

      const record: RecurringOccurrenceRecord = {
        id: data.id || crypto.randomUUID(),
        recurringRuleId: data.recurringRuleId,
        userId: data.userId,
        occurrenceKey: data.occurrenceKey,
        scheduledAt: data.scheduledAt instanceof Date ? data.scheduledAt : new Date(data.scheduledAt),
        status: data.status || 'UPCOMING',
        transactionId: data.transactionId || null,
        reminderSentAt: data.reminderSentAt ? new Date(data.reminderSentAt) : null,
        paidAt: data.paidAt ? new Date(data.paidAt) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.recurringOccurrences.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.recurringOccurrences.findIndex((o) => o.id === where.id);
      if (idx === -1) throw new Error('RecurringOccurrence not found');
      this.recurringOccurrences[idx] = {
        ...this.recurringOccurrences[idx],
        ...data,
        updatedAt: new Date(),
      };
      const o = this.recurringOccurrences[idx];
      const r = this.recurringRules.find((item) => item.id === o.recurringRuleId);
      const tx = o.transactionId ? this.transactions.find((t) => t.id === o.transactionId) : null;
      return {
        ...o,
        rule: r
          ? {
              ...r,
              category: r.categoryId ? this.categories.find((c) => c.id === r.categoryId) : null,
            }
          : null,
        transaction: tx || null,
      };
    }),
    delete: vi.fn(async ({ where }: any) => {
      const idx = this.recurringOccurrences.findIndex((o) => o.id === where.id);
      if (idx === -1) throw new Error('RecurringOccurrence not found');
      return this.recurringOccurrences.splice(idx, 1)[0];
    }),
  };

  recurringReminder = {
    findMany: vi.fn(async (args: any = {}) => {
      let list = this.recurringReminders.filter((rem) => {
        if (args.where?.userId && rem.userId !== args.where.userId) return false;
        if (args.where?.isRead !== undefined && rem.isRead !== args.where.isRead) return false;
        return true;
      });
      return list;
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      const rem = this.recurringReminders.find((item) => item.id === where.id);
      return rem || null;
    }),
    findFirst: vi.fn(async ({ where }: any) => {
      const rem = this.recurringReminders.find((item) => {
        if (where.userId && item.userId !== where.userId) return false;
        if (where.occurrenceId && item.occurrenceId !== where.occurrenceId) return false;
        return true;
      });
      return rem || null;
    }),
    count: vi.fn(async ({ where }: any = {}) => {
      const list = this.recurringReminders.filter((rem) => {
        if (where?.userId && rem.userId !== where.userId) return false;
        if (where?.isRead !== undefined && rem.isRead !== where.isRead) return false;
        return true;
      });
      return list.length;
    }),
    create: vi.fn(async ({ data }: any) => {
      const duplicate = this.recurringReminders.find(
        (rem) => rem.userId === data.userId && rem.occurrenceId === data.occurrenceId
      );
      if (duplicate) {
        const err: any = new Error(
          'Unique constraint failed on the fields: (`userId`,`occurrenceId`)'
        );
        err.code = 'P2002';
        throw err;
      }

      const record: RecurringReminderRecord = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId,
        ruleId: data.ruleId,
        occurrenceId: data.occurrenceId,
        title: data.title,
        message: data.message,
        amount: data.amount instanceof Prisma.Decimal ? data.amount : new Prisma.Decimal(data.amount),
        currency: data.currency || 'INR',
        dueDate: data.dueDate instanceof Date ? data.dueDate : new Date(data.dueDate),
        isRead: data.isRead !== undefined ? data.isRead : false,
        readAt: data.readAt ? new Date(data.readAt) : null,
        createdAt: new Date(),
      };
      this.recurringReminders.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.recurringReminders.findIndex((rem) => rem.id === where.id);
      if (idx === -1) throw new Error('RecurringReminder not found');
      this.recurringReminders[idx] = {
        ...this.recurringReminders[idx],
        ...data,
      };
      return this.recurringReminders[idx];
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      let count = 0;
      for (let i = 0; i < this.recurringReminders.length; i++) {
        const rem = this.recurringReminders[i];
        if (where.userId && rem.userId !== where.userId) continue;
        if (where.isRead !== undefined && rem.isRead !== where.isRead) continue;
        this.recurringReminders[i] = { ...rem, ...data };
        count++;
      }
      return { count };
    }),
  };

  syncReceipt = {
    findUnique: vi.fn(async ({ where }: any) => {
      if (where.operationId) {
        return this.syncReceipts.find((r) => r.operationId === where.operationId) || null;
      }
      if (where.id) {
        return this.syncReceipts.find((r) => r.id === where.id) || null;
      }
      return null;
    }),
    findFirst: vi.fn(async ({ where }: any) => {
      return this.syncReceipts.find((r) => {
        if (where?.userId && r.userId !== where.userId) return false;
        if (where?.operationId && r.operationId !== where.operationId) return false;
        if (where?.entityId && r.entityId !== where.entityId) return false;
        return true;
      }) || null;
    }),
    findMany: vi.fn(async ({ where }: any = {}) => {
      return this.syncReceipts.filter((r) => {
        if (where?.userId && r.userId !== where.userId) return false;
        return true;
      });
    }),
    create: vi.fn(async ({ data }: any) => {
      const duplicate = this.syncReceipts.find((r) => r.operationId === data.operationId);
      if (duplicate) {
        const err: any = new Error('Unique constraint failed on operationId');
        err.code = 'P2002';
        throw err;
      }
      const record: SyncReceiptRecord = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId,
        operationId: data.operationId,
        entityType: data.entityType,
        entityId: data.entityId,
        operationType: data.operationType,
        status: data.status,
        resultPayload: data.resultPayload || null,
        createdAt: new Date(),
      };
      this.syncReceipts.push(record);
      return record;
    }),
  };

  devicePushToken = {
    findUnique: vi.fn(async ({ where }: any) => {
      if (where.token) {
        return this.devicePushTokens.find((t) => t.token === where.token) || null;
      }
      if (where.id) {
        return this.devicePushTokens.find((t) => t.id === where.id) || null;
      }
      return null;
    }),
    findMany: vi.fn(async ({ where }: any = {}) => {
      return this.devicePushTokens.filter((t) => {
        if (where?.userId && t.userId !== where.userId) return false;
        if (where?.isActive !== undefined && t.isActive !== where.isActive) return false;
        return true;
      });
    }),
    upsert: vi.fn(async ({ where, create, update }: any) => {
      const idx = this.devicePushTokens.findIndex((t) => t.token === where.token);
      if (idx !== -1) {
        this.devicePushTokens[idx] = {
          ...this.devicePushTokens[idx],
          ...update,
          updatedAt: new Date(),
          lastSeenAt: new Date(),
        };
        return this.devicePushTokens[idx];
      }
      const record: DevicePushTokenRecord = {
        id: create.id || crypto.randomUUID(),
        userId: create.userId,
        token: create.token,
        platform: create.platform,
        isActive: create.isActive !== undefined ? create.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeenAt: new Date(),
      };
      this.devicePushTokens.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const idx = this.devicePushTokens.findIndex((t) => t.token === where.token || t.id === where.id);
      if (idx === -1) throw new Error('DevicePushToken not found');
      this.devicePushTokens[idx] = {
        ...this.devicePushTokens[idx],
        ...data,
        updatedAt: new Date(),
      };
      return this.devicePushTokens[idx];
    }),
    deleteMany: vi.fn(async ({ where }: any = {}) => {
      const initial = this.devicePushTokens.length;
      this.devicePushTokens = this.devicePushTokens.filter((t) => {
        if (where?.userId && t.userId !== where.userId) return true;
        if (where?.token && t.token !== where.token) return true;
        return false;
      });
      return { count: initial - this.devicePushTokens.length };
    }),
  };

  $transaction = vi.fn(async (arg: any) => {
    if (typeof arg === 'function') {
      return await arg(this);
    }
    if (Array.isArray(arg)) {
      return await Promise.all(arg);
    }
    return arg;
  });

  $disconnect = vi.fn(async () => {});
}

export const mockPrisma = new InMemoryPrismaMock();
