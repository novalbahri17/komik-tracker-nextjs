import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/lib/validators';
import { generateJWT, setAuthCookie, hashPassword, validateEmail, validateUsername, generateSlug, normalizeString } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const { username, email, password, fullName } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 400 }
        );
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { success: false, error: 'Username already taken' },
          { status: 400 }
        );
      }
    }

    // Validate email and username formats (double check)
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!validateUsername(username)) {
      return NextResponse.json(
        { success: false, error: 'Invalid username format' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName: fullName || null,
        role: UserRole.member,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    // Create default app settings for the user
    await prisma.appSettings.create({
      data: {
        userId: user.id,
        themePreset: 'default',
        darkMode: false,
        pageSize: 20,
      },
    });

    // Generate JWT and set cookie
    const token = generateJWT(user.id, user.role);
    setAuthCookie(token, {
      setHeader: (name: string, value: string) => {
        // This will be handled by NextResponse headers
      },
    } as any);

    // Set the cookie in the response
    const response = NextResponse.json({
      success: true,
      user,
    }, { status: 201 });

    response.headers.set(
      'Set-Cookie',
      `auth_token=${token}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 2}`
    );

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        actionType: 'UPDATE_PROFILE',
        meta: {
          description: 'User registration',
          username,
          email,
        },
      },
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid input data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}