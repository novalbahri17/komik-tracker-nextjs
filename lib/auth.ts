import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { AuthUser } from '@/types';

export interface JWTPayload {
  uid: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

export const JWT_EXPIRES_IN = '2h'; // 2 hours

export function generateJWT(userId: string, role: UserRole): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    uid: userId,
    role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function setAuthCookie(token: string, res: any): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.setHeader('Set-Cookie', [
    `auth_token=${token}; HttpOnly; Secure=${isProduction}; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 2}; ${isProduction ? 'Domain=' + (process.env.APP_URL?.replace('https://', '').replace('http://', '')) : ''}`
  ]);
}

export function clearAuthCookie(res: any): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.setHeader('Set-Cookie', [
    `auth_token=; HttpOnly; Secure=${isProduction}; SameSite=Lax; Path=/; Max-Age=0; ${isProduction ? 'Domain=' + (process.env.APP_URL?.replace('https://', '').replace('http://', '')) : ''}`
  ]);
}

export function getAuthTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies.auth_token || null;
}

export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  const payload = verifyJWT(token);
  if (!payload) return null;

  try {
    const { prisma } = await import('./db');
    const user = await prisma.user.findUnique({
      where: { id: payload.uid },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching user from token:', error);
    return null;
  }
}

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    import('bcrypt').then(bcrypt => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) reject(err);
        else resolve(hash);
      });
    }).catch(reject);
  });
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    import('bcrypt').then(bcrypt => {
      bcrypt.compare(password, hash, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }).catch(reject);
  });
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUsername(username: string): boolean {
  // Username should be 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  return { isValid: true };
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

export function generateSlug(name: string): string {
  return normalizeString(name)
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}