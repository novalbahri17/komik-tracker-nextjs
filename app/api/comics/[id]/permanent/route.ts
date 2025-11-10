import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { ActionType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    // Check if comic exists, belongs to user, and is deleted
    const existingComic = await prisma.comic.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: { not: null }, // Only permanently delete deleted comics
      },
      select: {
        id: true,
        title: true,
        userId: true,
      },
    });

    if (!existingComic) {
      return NextResponse.json(
        { success: false, error: 'Deleted comic not found' },
        { status: 404 }
      );
    }

    // Delete related records first (genre relationships and activity logs)
    await Promise.all([
      prisma.comicGenre.deleteMany({
        where: { comicId: id },
      }),
      prisma.activityLog.deleteMany({
        where: { comicId: id },
      }),
    ]);

    // Permanently delete the comic
    await prisma.comic.delete({
      where: { id },
    });

    // Log the activity (this will be deleted with the cleanup above, but we'll try to log it before deletion)
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        actionType: ActionType.PERMANENT_DELETE_COMIC,
        meta: {
          title: existingComic.title,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Comic permanently deleted',
    });
  } catch (error) {
    console.error('Permanent delete comic error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}