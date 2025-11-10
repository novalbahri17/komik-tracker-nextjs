import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthTokenFromRequest, getUserFromToken } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ kind: string; id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { kind, id } = await params;
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

    let usageCount = 0;
    let usageDetails: any[] = [];

    switch (kind) {
      case 'types':
        const comicsByType = await prisma.comic.findMany({
          where: {
            typeId: id,
            deletedAt: null,
            userId: user.id, // Only count usage for current user's comics
          },
          select: {
            id: true,
            title: true,
            user: {
              select: {
                username: true,
              },
            },
          },
          take: 10, // Limit to 10 examples
        });

        usageCount = await prisma.comic.count({
          where: {
            typeId: id,
            deletedAt: null,
            userId: user.id,
          },
        });

        usageDetails = comicsByType;
        break;

      case 'statuses':
        const comicsByStatus = await prisma.comic.findMany({
          where: {
            statusId: id,
            deletedAt: null,
            userId: user.id,
          },
          select: {
            id: true,
            title: true,
            user: {
              select: {
                username: true,
              },
            },
          },
          take: 10,
        });

        usageCount = await prisma.comic.count({
          where: {
            statusId: id,
            deletedAt: null,
            userId: user.id,
          },
        });

        usageDetails = comicsByStatus;
        break;

      case 'genres':
        const comicsByGenre = await prisma.comicGenre.findMany({
          where: {
            genreId: id,
            comic: {
              deletedAt: null,
              userId: user.id,
            },
          },
          include: {
            comic: {
              select: {
                id: true,
                title: true,
                user: {
                  select: {
                    username: true,
                  },
                },
              },
            },
          },
          take: 10,
        });

        usageCount = await prisma.comicGenre.count({
          where: {
            genreId: id,
            comic: {
              deletedAt: null,
              userId: user.id,
            },
          },
        });

        usageDetails = comicsByGenre.map(cg => ({
          id: cg.comic.id,
          title: cg.comic.title,
          user: cg.comic.user,
        }));
        break;

      case 'platforms':
        const comicsByPlatform = await prisma.comic.findMany({
          where: {
            platformId: id,
            deletedAt: null,
            userId: user.id,
          },
          select: {
            id: true,
            title: true,
            user: {
              select: {
                username: true,
              },
            },
          },
          take: 10,
        });

        usageCount = await prisma.comic.count({
          where: {
            platformId: id,
            deletedAt: null,
            userId: user.id,
          },
        });

        usageDetails = comicsByPlatform;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid enum kind' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        usageCount,
        usageDetails,
        kind,
        id,
        canDelete: usageCount === 0,
      },
    });
  } catch (error) {
    console.error('Check usage error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}