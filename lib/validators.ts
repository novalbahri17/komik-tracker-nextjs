import { z } from 'zod';
import { UserRole, ActionType } from '@prisma/client';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name cannot exceed 100 characters').optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  userId: z.string().min(1, 'User ID is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const updateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name cannot exceed 100 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// Comic schemas
export const createComicSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  authorArtist: z.string().max(100, 'Author/Artist name cannot exceed 100 characters').optional(),
  typeId: z.string().min(1, 'Type is required'),
  statusId: z.string().min(1, 'Status is required'),
  platformId: z.string().optional(),
  lastChapter: z.number().int().min(0, 'Last chapter must be a positive integer').default(0),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  linkUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  genreIds: z.array(z.string()).min(1, 'At least one genre is required'),
});

export const updateComicSchema = createComicSchema.partial().extend({
  id: z.string().min(1, 'Comic ID is required'),
});

export const comicFiltersSchema = z.object({
  search: z.string().optional(),
  typeIds: z.array(z.string()).optional(),
  statusIds: z.array(z.string()).optional(),
  genreIds: z.array(z.string()).optional(),
  platformIds: z.array(z.string()).optional(),
  sortBy: z.enum(['newest', 'oldest', 'titleAZ', 'titleZA', 'chaptersAsc', 'chaptersDesc']).default('newest'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// Enum (Type/Status/Genre/Platform) schemas
export const createEnumSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name cannot exceed 50 characters'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

export const updateEnumSchema = createEnumSchema.partial().extend({
  id: z.string().min(1, 'ID is required'),
});

export const enumKindSchema = z.enum(['types', 'statuses', 'genres', 'platforms']);

// Settings schemas
export const updateSettingsSchema = z.object({
  themePreset: z.string().optional(),
  darkMode: z.boolean().optional(),
  pageSize: z.number().int().min(5).max(100).optional(),
});

// Activity log schemas
export const activityLogFiltersSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  userId: z.string().optional(),
  actionType: z.nativeEnum(ActionType).optional(),
});

// Export types for use in components
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateComicInput = z.infer<typeof createComicSchema>;
export type UpdateComicInput = z.infer<typeof updateComicSchema>;
export type ComicFiltersInput = z.infer<typeof comicFiltersSchema>;
export type CreateEnumInput = z.infer<typeof createEnumSchema>;
export type UpdateEnumInput = z.infer<typeof updateEnumSchema>;
export type EnumKindInput = z.infer<typeof enumKindSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ActivityLogFiltersInput = z.infer<typeof activityLogFiltersSchema>;