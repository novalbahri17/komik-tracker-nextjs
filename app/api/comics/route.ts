import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createComicSchema, comicFiltersSchema } from '@/lib/validators';
import { getAuthTokenFromRequest, getUserFromToken, normalizeString, generateSlug } from '@/lib/auth';
import { ActionType, UserRole } from '@prisma/client';

// GET - List comics with filtering, pagination, and sorting
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
    const filters = comicFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      typeIds: searchParams.get('typeIds')?.split(',').filter(Boolean) || undefined,
      statusIds: searchParams.get('statusIds')?.split(',').filter(Boolean) || undefined,
      genreIds: searchParams.get('genreIds')?.split(',').filter(Boolean) || undefined,
      platformIds: searchParams.get('platformIds')?.split(',').filter(Boolean) || undefined,
      sortBy: searchParams.get('sortBy') || 'newest',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    });

    const { search, typeIds, statusIds, genreIds, platformIds, sortBy, page, pageSize } = filters;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {
      userId: user.id,
      deletedAt: null, // Only show non-deleted comics in main list
    };

    if (search) {
      const normalizedSearch = normalizeString(search);
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          normalizedTitle: {
            contains: normalizedSearch,
          },
        },
        {
          authorArtist: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (typeIds && typeIds.length > 0) {
      where.typeId = { in: typeIds };
    }

    if (statusIds && statusIds.length > 0) {
      where.statusId = { in: statusIds };
    }

    if (platformIds && platformIds.length > 0) {
      where.platformId = { in: platformIds };
    }

    if (genreIds && genreIds.length > 0) {
      where.genres = {
        some: {
          genreId: { in: genreIds },
        },
      };
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' }; // Default: newest first
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'titleAZ':
        orderBy = { title: 'asc' };
        break;
      case 'titleZA':
        orderBy = { title: 'desc' };
        break;
      case 'chaptersAsc':
        orderBy = { lastChapter: 'asc' };
        break;
      case 'chaptersDesc':
        orderBy = { lastChapter: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Execute queries in parallel
    const [comics, totalCount] = await Promise.all([
      prisma.comic.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          type: true,
          status: true,
          platform: true,
          genres: {
            include: {
              genre: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.comic.count({ where }),
    ]);

    // Format the response
    const formattedComics = comics.map(comic => ({
      ...comic,
      genres: comic.genres.map(g => g.genre),
    }));

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      success: true,
      data: {
        comics: formattedComics,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          pageSize,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get comics error:', error);

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

// POST - Create new comic
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = createComicSchema.parse(body);

    const {
      title,
      authorArtist,
      typeId,
      statusId,
      platformId,
      lastChapter,
      notes,
      linkUrl,
      genreIds,
    } = validatedData;

    // Verify that the type, status, platform exist and user has access to them
    const [type, status, platform] = await Promise.all([
      prisma.type.findFirst({
        where: {
          id: typeId,
          OR: [
            { memberLocked: false },
            { userId: user.id },
            { userId: null },
          ],
        },
      }),
      prisma.status.findFirst({
        where: {
          id: statusId,
          OR: [
            { memberLocked: false },
            { userId: user.id },
            { userId: null },
          ],
        },
      }),
      platformId ? prisma.platform.findFirst({
        where: {
          id: platformId,
          OR: [
            { memberLocked: false },
            { userId: user.id },
            { userId: null },
          ],
        },
      }) : Promise.resolve(null),
    ]);

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unauthorized type' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unauthorized status' },
        { status: 400 }
      );
    }

    if (platformId && !platform) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unauthorized platform' },
        { status: 400 }
      );
    }

    // Verify all genres exist and are accessible
    const genres = await prisma.genre.findMany({
      where: {
        id: { in: genreIds },
        OR: [
          { memberLocked: false },
          { userId: user.id },
          { userId: null },
        ],
      },
    });

    if (genres.length !== genreIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more genres are invalid or unauthorized' },
        { status: 400 }
      );
    }

    // Create the comic
    const normalizedTitle = normalizeString(title);
    const comic = await prisma.comic.create({
      data: {
        userId: user.id,
        title,
        normalizedTitle,
        authorArtist,
        typeId,
        statusId,
        platformId,
        lastChapter: lastChapter || 0,
        notes,
        linkUrl,
      },
      include: {
        type: true,
        status: true,
        platform: true,
        genres: {
          include: {
            genre: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Connect genres
    if (genreIds.length > 0) {
      await prisma.comicGenre.createMany({
        data: genreIds.map(genreId => ({
          comicId: comic.id,
          genreId,
        })),
      });

      // Refetch to include genres
      comic.genres = await prisma.comicGenre.findMany({
        where: { comicId: comic.id },
        include: { genre: true },
      });
    }

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        comicId: comic.id,
        actionType: ActionType.CREATE_COMIC,
        meta: {
          title: comic.title,
          typeId,
          statusId,
          platformId,
          genreIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...comic,
        genres: comic.genres.map(g => g.genre),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create comic error:', error);

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