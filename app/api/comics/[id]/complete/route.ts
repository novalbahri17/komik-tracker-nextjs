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
        deletedAt: null, // Only complete active comics
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

    // Get the "Completed" status
    const completedStatus = await prisma.status.findFirst({
      where: {
        OR: [
          { slug: 'completed' },
          { slug: 'finished' },
          { name: { contains: 'completed', mode: 'insensitive' } },
          { name: { contains: 'finished', mode: 'insensitive' } },
        ],
      },
    });

    let statusId = undefined;
    if (completedStatus) {
      statusId = completedStatus.id;
    }

    // Update the comic with completed status (if found)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (statusId) {
      updateData.statusId = statusId;
    }

    const updatedComic = await prisma.comic.update({
      where: { id },
      data: updateData,
      include: {
        status: true,
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        comicId: id,
        actionType: ActionType.COMPLETE_COMIC,
        meta: {
          title: existingComic.title,
          lastChapter: existingComic.lastChapter,
          statusChanged: !!statusId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedComic,
      message: statusId
        ? 'Comic marked as completed'
        : 'Comic completion recorded',
    });
  } catch (error) {
    console.error('Complete comic error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}