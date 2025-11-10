import { User, Comic, Type, Status, Genre, Platform, ActivityLog, UserRole, ActionType } from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  Comic,
  Type,
  Status,
  Genre,
  Platform,
  ActivityLog,
  UserRole,
  ActionType,
} from '@prisma/client';

// Extended types with relations
export type ComicWithRelations = Comic & {
  type: Type;
  status: Status;
  platform?: Platform | null;
  genres: (Genre & { comicGenres: { comicId: string; genreId: string }[] })[];
  user: User;
};

export type ComicWithRelationsAndActivity = ComicWithRelations & {
  activityLogs: ActivityLog[];
};

export type UserWithSettings = User & {
  appSettings?: {
    id: string;
    userId: string;
    themePreset: string | null;
    darkMode: boolean;
    pageSize: number;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

export type ActivityLogWithComic = ActivityLog & {
  comic?: Comic | null;
  user: User;
};

export type TypeWithUsage = Type & {
  _count: {
    comics: number;
  };
  user?: User | null;
};

export type StatusWithUsage = Status & {
  _count: {
    comics: number;
  };
  user?: User | null;
};

export type GenreWithUsage = Genre & {
  _count: {
    comics: number;
  };
  user?: User | null;
};

export type PlatformWithUsage = Platform & {
  _count: {
    comics: number;
  };
  user?: User | null;
};

// API Request/Response types
export interface CreateComicRequest {
  title: string;
  authorArtist?: string;
  typeId: string;
  statusId: string;
  platformId?: string;
  lastChapter?: number;
  notes?: string;
  linkUrl?: string;
  genreIds: string[];
}

export interface UpdateComicRequest extends Partial<CreateComicRequest> {
  id: string;
}

export interface ComicFilters {
  search?: string;
  typeIds?: string[];
  statusIds?: string[];
  genreIds?: string[];
  platformIds?: string[];
  sortBy?: 'newest' | 'oldest' | 'titleAZ' | 'titleZA' | 'chaptersAsc' | 'chaptersDesc';
  page?: number;
  pageSize?: number;
}

export interface DashboardStats {
  totalComics: number;
  inProgressComics: number;
  completedComics: number;
  totalChapters: number;
  typeDistribution: { name: string; count: number; color: string }[];
  statusDistribution: { name: string; count: number; color: string }[];
  topGenres: { name: string; count: number }[];
  mostUsedPlatforms: { name: string; count: number }[];
  weeklyProgress: { week: string; added: number; completed: number }[];
  completionRate: number;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  role: UserRole;
  createdAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  userId: string;
  password: string;
}

export interface UpdateProfileRequest {
  username?: string;
  fullName?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateEnumRequest {
  name: string;
  color?: string;
}

export interface UpdateEnumRequest extends Partial<CreateEnumRequest> {
  id: string;
}

// Theme presets
export interface ThemePreset {
  name: string;
  displayName: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export const themePresets: ThemePreset[] = [
  {
    name: 'default',
    displayName: 'Default Blue',
    primaryColor: '#3b82f6',
    accentColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
  },
  {
    name: 'emerald',
    displayName: 'Emerald Green',
    primaryColor: '#10b981',
    accentColor: '#14b8a6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
  },
  {
    name: 'rose',
    displayName: 'Rose Pink',
    primaryColor: '#f43f5e',
    accentColor: '#ec4899',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
  },
  {
    name: 'amber',
    displayName: 'Amber Warm',
    primaryColor: '#f59e0b',
    accentColor: '#ef4444',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
  },
  {
    name: 'purple',
    displayName: 'Royal Purple',
    primaryColor: '#8b5cf6',
    accentColor: '#a855f7',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
  },
  {
    name: 'teal',
    displayName: 'Teal Ocean',
    primaryColor: '#14b8a6',
    accentColor: '#06b6d4',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
  },
  {
    name: 'orange',
    displayName: 'Sunset Orange',
    primaryColor: '#f97316',
    accentColor: '#fb923c',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
  },
  {
    name: 'indigo',
    displayName: 'Deep Indigo',
    primaryColor: '#6366f1',
    accentColor: '#818cf8',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
  },
  {
    name: 'gray',
    displayName: 'Modern Gray',
    primaryColor: '#6b7280',
    accentColor: '#9ca3af',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
  },
  {
    name: 'red',
    displayName: 'Ruby Red',
    primaryColor: '#ef4444',
    accentColor: '#f87171',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
  },
  {
    name: 'green',
    displayName: 'Forest Green',
    primaryColor: '#22c55e',
    accentColor: '#4ade80',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
  },
  {
    name: 'blue',
    displayName: 'Sky Blue',
    primaryColor: '#0ea5e9',
    accentColor: '#38bdf8',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
  },
];