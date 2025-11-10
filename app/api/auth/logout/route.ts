import { NextRequest, NextResponse } from 'next/server';
import { getAuthTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { ActionType } from '@prisma/client';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = getAuthTokenFromRequest(request);

    if (token) {
      const user = await getUserFromToken(token);

      if (user) {
        // Log the logout activity
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            actionType: ActionType.UPDATE_PROFILE,
            meta: {
              description: 'User logout',
            },
          },
        });
      }
    }

    // Create response and clear auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.headers.set(
      'Set-Cookie',
      `auth_token=; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=0`
    );

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    // Still return success even if there's an error, just clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.headers.set(
      'Set-Cookie',
      `auth_token=; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=0`
    );

    return response;
  }
}