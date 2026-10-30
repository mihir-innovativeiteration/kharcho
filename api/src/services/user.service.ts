import { prisma } from '../config/db.js';
import { SafeUser, toSafeUser } from './auth.service.js';

export class UserService {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.disabledAt) {
      throw new Error('This account has been deactivated');
    }

    return toSafeUser(user);
  }

  /**
   * Update permitted user profile fields
   */
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      preferredLanguage?: string;
      preferredTheme?: string;
      budgetAlertsEnabled?: boolean;
    }
  ): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.disabledAt) {
      throw new Error('This account has been deactivated');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.preferredLanguage ? { preferredLanguage: data.preferredLanguage } : {}),
        ...(data.preferredTheme ? { preferredTheme: data.preferredTheme } : {}),
        ...(data.budgetAlertsEnabled !== undefined ? { budgetAlertsEnabled: data.budgetAlertsEnabled } : {}),
      },
    });

    return toSafeUser(updated);
  }

  /**
   * Permanently delete user account and all associated financial records (GDPR / Store compliance)
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Cascade delete user and all related records (sessions, transactions, budgets, goals, rules)
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}

export const userService = new UserService();
