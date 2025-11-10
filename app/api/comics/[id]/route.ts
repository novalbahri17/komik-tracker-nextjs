import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateComicSchema } from '@/lib/validators';
import { getAuthTokenFromRequest, getUserFromToken, normalizeString } from '@/lib/auth';
import { ActionType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single comic by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    const comic = await prisma.comic.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null, // Only return non-deleted comics
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

    if (!comic) {
      return NextResponse.json(
        { success: false, error: 'Comic not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedComic = {
      ...comic,
      genres: comic.genres.map(g => g.genre),
    };

    return NextResponse.json({
      success: true,
      data: formattedComic,
    });
  } catch (error) {
    console.error('Get comic error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update comic
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
    const validatedData = updateComicSchema.parse({ ...body, id });

    // Check if comic exists and belongs to user
    const existingComic = await prisma.comic.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null,
      },
    });

    if (!existingComic) {
      return NextResponse.json(
        { success: false, error: 'Comic not found' },
        { status: 404 }
      );
    }

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
      typeId ? prisma.type.findFirst({
        where: {
          id: typeId,
          OR: [
            { memberLocked: false },
            { userId: user.id },
            { userId: null },
          ],
        },
      }) : Promise.resolve(null),
      statusId ? prisma.status.findFirst({
        where: {
          id: statusId,
          OR: [
            { memberLocked: false },
            { userId: user.id },
            { userId: null },
          ],
        },
      }) : Promise.resolve(null),
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

    if (typeId && !type) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unauthorized type' },
        { status: 400 }
      );
    }

    if (statusId && !status) {
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

    // Verify all genres exist and are accessible if provided
    if (genreIds && genreIds.length > 0) {
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
    }

    // Update the comic
    const updateData: any = {
      ...(title && {
        title,
        normalizedTitle: normalizeString(title),
      }),
      ...(authorArtist !== undefined && { authorArtist }),
      ...(typeId && { typeId }),
      ...(statusId && { statusId }),
      ...(platformId !== undefined && { platformId }),
      ...(lastChapter !== undefined && { lastChapter }),
      ...(notes !== undefined && { notes }),
      ...(linkUrl !== undefined && { linkUrl }),
      updatedAt: new Date(),
    };

    const updatedComic = await prisma.comic.update({
      where: { id },
      data: updateData,
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

    // Update genres if provided
    if (genreIds) {
      // Delete existing genre relationships
      await prisma.comicGenre.deleteMany({
        where: { comicId: id },
      });

      // Create new genre relationships if any
      if (genreIds.length > 0) {
        await prisma.comicGenre.createMany({
          data: genreIds.map(genreId => ({
            comicId: id,
            genreId,
          })),
        });
      }

      // Refetch to include updated genres
      updatedComic.genres = await prisma.comicGenre.findMany({
        where: { comicId: id },
        include: { genre: true },
      });
    }

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        comicId: id,
        actionType: ActionType.UPDATE_COMIC,
        meta: {
          title: updatedComic.title,
          changes: {
            ...(title && { title }),
            ...(authorArtist !== undefined && { authorArtist }),
            ...(typeId && { typeId }),
            ...(statusId && { statusId }),
            ...(platformId !== undefined && { platformId }),
            ...(lastChapter !== undefined && { lastChapter }),
            ...(notes !== undefined && { notes }),
            ...(linkUrl !== undefined && { linkUrl }),
            ...(genreIds && { genreIds }),
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedComic,
        genres: updatedComic.genres.map(g => g.genre),
      },
    });
  } catch (error) {
    console.error('Update comic error:', error);

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

// DELETE - Soft delete comic
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // Check if comic exists and belongs to user
    const existingComic = await prisma.comic.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null, // Only allow deletion of non-deleted comics
      },
      select: {
        id: true,
        title: true,
        userId: true,
      },
    });

    if (!existingComic) {
      return NextResponse.json(
        { success: false, error: 'Comic not found' },
        { status: 404 }
      );
    }

    // Soft delete the comic
    await prisma.comic.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        comicId: id,
        actionType: ActionType.DELETE_COMIC,
        meta: {
          title: existingComic.title,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Comic deleted successfully',
    });
  } catch (error) {
    console.error('Delete comic error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}