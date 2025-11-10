import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { ActionType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
        deletedAt: { not: null }, // Only restore deleted comics
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

    // Restore the comic
    await prisma.comic.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        comicId: id,
        actionType: ActionType.RESTORE_COMIC,
        meta: {
          title: existingComic.title,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Comic restored successfully',
    });
  } catch (error) {
    console.error('Restore comic error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}