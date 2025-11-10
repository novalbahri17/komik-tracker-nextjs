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

    // Check if comic exists and belongs to user
    const existingComic = await prisma.comic.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null, // Only increment chapters for active comics
      },
      select: {
        id: true,
        title: true,
        lastChapter: true,
        userId: true,
      },
    });

    if (!existingComic) {
      return NextResponse.json(
        { success: false, error: 'Comic not found' },
        { status: 404 }
      );
    }

    // Increment the last chapter
    const updatedComic = await prisma.comic.update({
      where: { id },
      data: {
        lastChapter: existingComic.lastChapter + 1,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        lastChapter: true,
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        comicId: id,
        actionType: ActionType.INCREMENT_CHAPTER,
        meta: {
          title: existingComic.title,
          previousChapter: existingComic.lastChapter,
          newChapter: updatedComic.lastChapter,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedComic,
      message: `Chapter incremented to ${updatedComic.lastChapter}`,
    });
  } catch (error) {
    console.error('Increment chapter error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}