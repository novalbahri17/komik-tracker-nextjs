import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { DashboardStats } from '@/types';

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

    const userId = user.id;

    // Get basic counts
    const [
      totalComics,
      inProgressComics,
      completedComics,
      totalChapters,
      typeStats,
      statusStats,
      topGenres,
      topPlatforms,
      weeklyProgress,
    ] = await Promise.all([
      // Total comics (excluding deleted)
      prisma.comic.count({
        where: {
          userId,
          deletedAt: null,
        },
      }),
      // In progress comics
      prisma.comic.count({
        where: {
          userId,
          deletedAt: null,
          status: {
            OR: [
              { slug: { contains: 'reading', mode: 'insensitive' } },
              { slug: { contains: 'progress', mode: 'insensitive' } },
              { name: { contains: 'reading', mode: 'insensitive' } },
              { name: { contains: 'progress', mode: 'insensitive' } },
            ],
          },
        },
      }),
      // Completed comics
      prisma.comic.count({
        where: {
          userId,
          deletedAt: null,
          status: {
            OR: [
              { slug: { contains: 'completed', mode: 'insensitive' } },
              { slug: { contains: 'finished', mode: 'insensitive' } },
              { name: { contains: 'completed', mode: 'insensitive' } },
              { name: { contains: 'finished', mode: 'insensitive' } },
            ],
          },
        },
      }),
      // Total chapters
      prisma.comic.aggregate({
        where: {
          userId,
          deletedAt: null,
        },
        _sum: {
          lastChapter: true,
        },
      }),
      // Type distribution
      prisma.comic.groupBy({
        by: ['typeId'],
        where: {
          userId,
          deletedAt: null,
        },
        _count: {
          typeId: true,
        },
      }),
      // Status distribution
      prisma.comic.groupBy({
        by: ['statusId'],
        where: {
          userId,
          deletedAt: null,
        },
        _count: {
          statusId: true,
        },
      }),
      // Top genres
      prisma.comicGenre.groupBy({
        by: ['genreId'],
        where: {
          comic: {
            userId,
            deletedAt: null,
          },
        },
        _count: {
          genreId: true,
        },
        orderBy: {
          _count: {
            genreId: 'desc',
          },
        },
        take: 5,
      }),
      // Top platforms
      prisma.comic.groupBy({
        by: ['platformId'],
        where: {
          userId,
          deletedAt: null,
          platformId: {
            not: null,
          },
        },
        _count: {
          platformId: true,
        },
        orderBy: {
          _count: {
            platformId: 'desc',
          },
        },
        take: 5,
      }),
      // Weekly progress (last 8 weeks)
      prisma.$queryRaw`
        SELECT
          DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL seq WEEK), '%Y-%m-%d') as weekStart,
          COALESCE(SUM(CASE WHEN action_type = 'CREATE_COMIC' THEN 1 ELSE 0 END), 0) as added,
          COALESCE(SUM(CASE WHEN action_type = 'COMPLETE_COMIC' THEN 1 ELSE 0 END), 0) as completed
        FROM (
          SELECT 0 as seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
        ) as weeks
        LEFT JOIN activity_logs ON user_id = ${userId}
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL seq + 1 WEEK)
          AND created_at < DATE_SUB(CURDATE(), INTERVAL seq WEEK)
        GROUP BY seq
        ORDER BY seq
      `,
    ]);

    // Get type details for distribution
    const typeIds = typeStats.map(stat => stat.typeId);
    const types = await prisma.type.findMany({
      where: {
        id: { in: typeIds },
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    // Get status details for distribution
    const statusIds = statusStats.map(stat => stat.statusId);
    const statuses = await prisma.status.findMany({
      where: {
        id: { in: statusIds },
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    // Get genre details
    const genreIds = topGenres.map(stat => stat.genreId);
    const genres = await prisma.genre.findMany({
      where: {
        id: { in: genreIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Get platform details
    const platformIds = topPlatforms
      .filter(stat => stat.platformId !== null)
      .map(stat => stat.platformId!);

    const platforms = platformIds.length > 0 ? await prisma.platform.findMany({
      where: {
        id: { in: platformIds },
      },
      select: {
        id: true,
        name: true,
      },
    }) : [];

    // Build distribution arrays
    const typeDistribution = typeStats.map(stat => {
      const type = types.find(t => t.id === stat.typeId);
      return {
        name: type?.name || 'Unknown',
        count: stat._count.typeId,
        color: type?.color || '#6b7280',
      };
    });

    const statusDistribution = statusStats.map(stat => {
      const status = statuses.find(s => s.id === stat.statusId);
      return {
        name: status?.name || 'Unknown',
        count: stat._count.statusId,
        color: status?.color || '#6b7280',
      };
    });

    const topGenresData = topGenres.map(stat => {
      const genre = genres.find(g => g.id === stat.genreId);
      return {
        name: genre?.name || 'Unknown',
        count: stat._count.genreId,
      };
    });

    const topPlatformsData = topPlatforms.map(stat => {
      if (!stat.platformId) return null;
      const platform = platforms.find(p => p.id === stat.platformId);
      return {
        name: platform?.name || 'Unknown',
        count: stat._count.platformId,
      };
    }).filter(Boolean);

    // Calculate completion rate
    const completionRate = totalComics > 0 ? (completedComics / totalComics) * 100 : 0;

    // Format weekly progress
    const weeklyProgressData = (weeklyProgress as any[]).map((week: any) => ({
      week: week.weekStart,
      added: Number(week.added),
      completed: Number(week.completed),
    }));

    const stats: DashboardStats = {
      totalComics,
      inProgressComics,
      completedComics,
      totalChapters: totalChapters._sum.lastChapter || 0,
      typeDistribution,
      statusDistribution,
      topGenres: topGenresData,
      mostUsedPlatforms: topPlatformsData,
      weeklyProgress: weeklyProgressData,
      completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimal places
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}