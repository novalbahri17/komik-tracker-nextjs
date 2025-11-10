import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthTokenFromRequest, getUserFromToken } from '@/lib/auth';

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

    // Get all user data with relations
    const [comics, types, statuses, genres, platforms, activityLogs, settings] = await Promise.all([
      // Get all comics (including deleted ones for backup)
      prisma.comic.findMany({
        where: { userId: user.id },
        include: {
          type: true,
          status: true,
          platform: true,
          genres: {
            include: {
              genre: true,
            },
          },
        },
      }),
      // Get user's custom types, statuses, genres, platforms
      prisma.type.findMany({
        where: {
          userId: user.id,
          memberLocked: false,
        },
      }),
      prisma.status.findMany({
        where: {
          userId: user.id,
          memberLocked: false,
        },
      }),
      prisma.genre.findMany({
        where: {
          userId: user.id,
          memberLocked: false,
        },
      }),
      prisma.platform.findMany({
        where: {
          userId: user.id,
          memberLocked: false,
        },
      }),
      // Get activity logs
      prisma.activityLog.findMany({
        where: { userId: user.id },
        include: {
          comic: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Get user settings
      prisma.appSettings.findUnique({
        where: { userId: user.id },
      }),
    ]);

    // Format comics data
    const formattedComics = comics.map(comic => ({
      ...comic,
      genres: comic.genres.map(cg => cg.genre),
    }));

    // Format user profile
    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    // Build export data structure
    const exportData = {
      metadata: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: userProfile,
        counts: {
          comics: comics.length,
          customTypes: types.length,
          customStatuses: statuses.length,
          customGenres: genres.length,
          customPlatforms: platforms.length,
          activityLogs: activityLogs.length,
        },
      },
      user: userProfile,
      comics: formattedComics,
      customData: {
        types,
        statuses,
        genres,
        platforms,
      },
      activityLogs,
      settings,
    };

    // Set response headers for JSON download
    const response = NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="komik-tracker-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

    // Log the export activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        actionType: 'UPDATE_PROFILE', // Using this as there's no specific export action type
        meta: {
          description: 'Data export performed',
          format: 'json',
          comicsCount: comics.length,
        },
      },
    });

    return response;
  } catch (error) {
    console.error('Export JSON error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}