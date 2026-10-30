import { prisma } from '../config/db.js';
import { CreateCategoryInput, UpdateCategoryInput } from '../validators/category.validator.js';

export class CategoryService {
  /**
   * List all system categories plus user's custom categories
   */
  static async listCategories(userId: string, db: any = prisma) {
    const categories = await db.category.findMany({
      where: {
        OR: [
          { isSystem: true },
          { userId },
        ],
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    });

    return categories;
  }

  /**
   * Create custom category for user
   */
  static async createCategory(userId: string, input: CreateCategoryInput, db: any = prisma) {
    const category = await db.category.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        icon: input.icon,
        color: input.color || null,
        isSystem: false,
      },
    });

    return category;
  }

  /**
   * Update user's custom category
   */
  static async updateCategory(userId: string, categoryId: string, input: UpdateCategoryInput, db: any = prisma) {
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || (category.userId !== userId && !category.isSystem)) {
      const err: any = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }

    if (category.isSystem) {
      const err: any = new Error('System categories cannot be modified');
      err.statusCode = 403;
      throw err;
    }

    const updated = await db.category.update({
      where: { id: categoryId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      },
    });

    return updated;
  }

  /**
   * Delete user's custom category
   */
  static async deleteCategory(userId: string, categoryId: string, db: any = prisma) {
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || (category.userId !== userId && !category.isSystem)) {
      const err: any = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }

    if (category.isSystem) {
      const err: any = new Error('System categories cannot be deleted');
      err.statusCode = 403;
      throw err;
    }

    // Protect historical data: check if category is used in existing transactions
    const inUse = await db.transaction.findFirst({
      where: { categoryId },
    });

    if (inUse) {
      const err: any = new Error('Cannot delete category with associated transactions. Reassign transactions first.');
      err.statusCode = 400;
      throw err;
    }

    await db.category.delete({
      where: { id: categoryId },
    });

    return { success: true, id: categoryId };
  }
}
