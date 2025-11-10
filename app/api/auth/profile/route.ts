import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateProfileSchema } from '@/lib/validators';
import { getAuthTokenFromRequest, getUserFromToken, validateEmail, validateUsername } from '@/lib/auth';
import { ActionType } from '@prisma/client';

// GET user profile
export async function GET(request: NextRequest) {
  try {
    const token = getAuthTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get full user profile including settings
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        appSettings: {
          select: {
            themePreset: true,
            darkMode: true,
            pageSize: true,
          },
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        ...fullUser,
        appSettings: fullUser.appSettings || {
          themePreset: 'default',
          darkMode: false,
          pageSize: 20,
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
  try {
    const token = getAuthTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = await getUserFromToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const { username, fullName, email } = validatedData;

    // Check for conflicts if trying to update username or email
    if (username || email) {
      const conflicts = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: currentUser.id } },
            {
              OR: [
                ...(username ? [{ username }] : []),
                ...(email ? [{ email }] : []),
              ],
            },
          ],
        },
      });

      if (conflicts) {
        if (conflicts.username === username) {
          return NextResponse.json(
            { success: false, error: 'Username already taken' },
            { status: 400 }
          );
        }
        if (conflicts.email === email) {
          return NextResponse.json(
            { success: false, error: 'Email already registered' },
            { status: 400 }
          );
        }
      }
    }

    // Validate formats if provided
    if (username && !validateUsername(username)) {
      return NextResponse.json(
        { success: false, error: 'Invalid username format' },
        { status: 400 }
      );
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...(username && { username }),
        ...(fullName && { fullName }),
        ...(email && { email }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        actionType: ActionType.UPDATE_PROFILE,
        meta: {
          description: 'Profile updated',
          changes: {
            ...(username && { username }),
            ...(fullName && { fullName }),
            ...(email && { email }),
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);

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