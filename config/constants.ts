export const COOKIE_NAME = 'auth_token';
export const COOKIE_MAX_AGE = 2 * 60 * 60; // 2 hours in seconds
export const RECYCLE_BIN_DAYS = 30; // Days before permanent deletion
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_USERNAME_LENGTH = 20;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_FULL_NAME_LENGTH = 100;
export const MAX_TITLE_LENGTH = 200;
export const MAX_AUTHOR_LENGTH = 100;
export const MAX_NOTES_LENGTH = 1000;
export const MAX_GENRE_NAME_LENGTH = 50;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const PASSWORD_RESET_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds

export const PAGINATION_SIZES = [10, 20, 30, 40];
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'titleAZ', label: 'Title (A-Z)' },
  { value: 'titleZA', label: 'Title (Z-A)' },
  { value: 'chaptersAsc', label: 'Chapters (Low to High)' },
  { value: 'chaptersDesc', label: 'Chapters (High to Low)' },
];

export const DEBOUNCE_DELAY = 500; // milliseconds for search debounce

export const TOAST_DURATION = 3000; // milliseconds

export const RECYCLE_BIN_COLORS = {
  danger: '#dc2626',     // ≤7 days - red
  warning: '#f59e0b',   // 8-14 days - yellow
  safe: '#6b7280',      // ≥15 days - gray
};

export const getRecycleBinColor = (deletedAt: Date): string => {
  const now = new Date();
  const daysSinceDeletion = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceDeletion <= 7) {
    return RECYCLE_BIN_COLORS.danger;
  } else if (daysSinceDeletion <= 14) {
    return RECYCLE_BIN_COLORS.warning;
  } else {
    return RECYCLE_BIN_COLORS.safe;
  }
};

export const getActivityDescription = (actionType: string, meta?: any): string => {
  switch (actionType) {
    case 'CREATE_COMIC':
      return `Added comic "${meta?.title || 'Unknown'}"`;
    case 'UPDATE_COMIC':
      return `Updated comic "${meta?.title || 'Unknown'}"`;
    case 'DELETE_COMIC':
      return `Deleted comic "${meta?.title || 'Unknown'}"`;
    case 'RESTORE_COMIC':
      return `Restored comic "${meta?.title || 'Unknown'}"`;
    case 'PERMANENT_DELETE_COMIC':
      return `Permanently deleted comic "${meta?.title || 'Unknown'}"`;
    case 'INCREMENT_CHAPTER':
      return `Incremented chapter for "${meta?.title || 'Unknown'}"`;
    case 'COMPLETE_COMIC':
      return `Marked "${meta?.title || 'Unknown'}" as completed`;
    case 'CREATE_TYPE':
      return `Created type "${meta?.name || 'Unknown'}"`;
    case 'UPDATE_TYPE':
      return `Updated type "${meta?.name || 'Unknown'}"`;
    case 'DELETE_TYPE':
      return `Deleted type "${meta?.name || 'Unknown'}"`;
    case 'CREATE_STATUS':
      return `Created status "${meta?.name || 'Unknown'}"`;
    case 'UPDATE_STATUS':
      return `Updated status "${meta?.name || 'Unknown'}"`;
    case 'DELETE_STATUS':
      return `Deleted status "${meta?.name || 'Unknown'}"`;
    case 'CREATE_GENRE':
      return `Created genre "${meta?.name || 'Unknown'}"`;
    case 'UPDATE_GENRE':
      return `Updated genre "${meta?.name || 'Unknown'}"`;
    case 'DELETE_GENRE':
      return `Deleted genre "${meta?.name || 'Unknown'}"`;
    case 'CREATE_PLATFORM':
      return `Created platform "${meta?.name || 'Unknown'}"`;
    case 'UPDATE_PLATFORM':
      return `Updated platform "${meta?.name || 'Unknown'}"`;
    case 'DELETE_PLATFORM':
      return `Deleted platform "${meta?.name || 'Unknown'}"`;
    case 'UPDATE_PROFILE':
      return meta?.description === 'User login' ? 'Logged in' :
             meta?.description === 'User logout' ? 'Logged out' :
             meta?.description === 'User registration' ? 'Registered account' :
             meta?.description === 'Profile updated' ? 'Updated profile' :
             'Updated profile';
    case 'CHANGE_PASSWORD':
      return 'Changed password';
    default:
      return 'Unknown action';
  }
};