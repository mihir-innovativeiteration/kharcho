import { z } from 'zod';

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(1, 'Category name is required').max(100, 'Category name cannot exceed 100 characters'),
    type: z.enum(['INCOME', 'EXPENSE'], {
      errorMap: () => ({ message: 'Category type must be either INCOME or EXPENSE' }),
    }),
    icon: z.string().trim().min(1, 'Icon name is required').max(50),
    color: z.string().trim().max(20).optional(),
  })
  .strict();

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    icon: z.string().trim().min(1).max(50).optional(),
    color: z.string().trim().max(20).optional(),
  })
  .strict();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
