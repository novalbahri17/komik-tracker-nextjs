import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { activityLogFiltersSchema } from '@/lib/validators';
import { getActivityDescription } from '@/config/constants';

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

    const { searchParams } = new URL(request.url);
    const filters = activityLogFiltersSchema.parse({
      limit: parseInt(searchParams.get('limit') || '10'),
      userId: searchParams.get('userId') || user.id, // Default to current user
      actionType: searchParams.get('actionType') || undefined,
    });

    const { limit, userId, actionType } = filters;

    // Build where clause
    const where: any = {
      userId: userId === user.id ? user.id : undefined, // Only allow users to see their own logs unless they're admin
    };

    // If user is admin, they can see all logs or filter by specific user
    if (user.role === 'admin') {
      if (userId !== user.id) {
        where.userId = userId;
      }
    }

    if (actionType) {
      where.actionType = actionType;
    }

    const activities = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        comic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Format activities with descriptions
    const formattedActivities = activities.map(activity => ({
      ...activity,
      description: getActivityDescription(activity.actionType, activity.meta),
    }));

    return NextResponse.json({
      success: true,
      data: formattedActivities,
    });
  } catch (error) {
    console.error('Get activity error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid filter parameters' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}