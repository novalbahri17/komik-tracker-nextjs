import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateEnumSchema } from '@/lib/validators';
import { getAuthTokenFromRequest, getUserFromToken, generateSlug } from '@/lib/auth';
import { UserRole, ActionType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ kind: string; id: string }>;
}

function getModelFromKind(kind: string) {
  switch (kind) {
    case 'types':
      return {
        model: prisma.type,
        name: 'Type',
        actionType: ActionType.CREATE_TYPE,
        updateAction: ActionType.UPDATE_TYPE,
        deleteAction: ActionType.DELETE_TYPE,
      };
    case 'statuses':
      return {
        model: prisma.status,
        name: 'Status',
        actionType: ActionType.CREATE_STATUS,
        updateAction: ActionType.UPDATE_STATUS,
        deleteAction: ActionType.DELETE_STATUS,
      };
    case 'genres':
      return {
        model: prisma.genre,
        name: 'Genre',
        actionType: ActionType.CREATE_GENRE,
        updateAction: ActionType.UPDATE_GENRE,
        deleteAction: ActionType.DELETE_GENRE,
      };
    case 'platforms':
      return {
        model: prisma.platform,
        name: 'Platform',
        actionType: ActionType.CREATE_PLATFORM,
        updateAction: ActionType.UPDATE_PLATFORM,
        deleteAction: ActionType.DELETE_PLATFORM,
      };
    default:
      return null;
  }
}

// GET - Get single enum by ID
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

    const modelConfig = getModelFromKind(kind);
    if (!modelConfig) {
      return NextResponse.json(
        { success: false, error: 'Invalid enum kind' },
        { status: 400 }
      );
    }

    const { model } = modelConfig;

    // Build where clause based on user role
    let whereClause: any = { id };

    if (user.role === UserRole.member) {
      whereClause = {
        id,
        OR: [
          { memberLocked: true, userId: null },
          { memberLocked: false, userId: user.id },
        ],
      };
    }

    const item = await (model as any).findFirst({
      where: whereClause,
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Get enum error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update enum
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const modelConfig = getModelFromKind(kind);
    if (!modelConfig) {
      return NextResponse.json(
        { success: false, error: 'Invalid enum kind' },
        { status: 400 }
      );
    }

    const { model, name: modelName, updateAction } = modelConfig;

    // Get existing item
    const existingItem = await (model as any).findFirst({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: `${modelName} not found` },
        { status: 404 }
      );
    }

    // Check permissions
    if (existingItem.memberLocked) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify default (locked) items' },
        { status: 403 }
      );
    }

    if (existingItem.userId !== user.id && user.role !== UserRole.admin) {
      return NextResponse.json(
        { success: false, error: 'You can only modify your own custom items' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateEnumSchema.parse({ ...body, id });

    const { name, color } = validatedData;
    const updateData: any = {};

    if (name) {
      const slug = generateSlug(name);

      // Check if new slug conflicts with existing items
      const conflictItem = await (model as any).findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (conflictItem) {
        return NextResponse.json(
          { success: false, error: `${modelName} with this name already exists` },
          { status: 400 }
        );
      }

      updateData.name = name;
      updateData.slug = slug;
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    updateData.updatedAt = new Date();

    // Update the item
    const updatedItem = await (model as any).update({
      where: { id },
      data: updateData,
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        actionType: updateAction,
        meta: {
          name: updatedItem.name,
          kind,
          changes: updateData,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error('Update enum error:', error);

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

// DELETE - Delete enum
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const modelConfig = getModelFromKind(kind);
    if (!modelConfig) {
      return NextResponse.json(
        { success: false, error: 'Invalid enum kind' },
        { status: 400 }
      );
    }

    const { model, name: modelName, deleteAction } = modelConfig;

    // Get existing item
    const existingItem = await (model as any).findFirst({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: `${modelName} not found` },
        { status: 404 }
      );
    }

    // Check permissions
    if (existingItem.memberLocked) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default (locked) items' },
        { status: 403 }
      );
    }

    if (existingItem.userId !== user.id && user.role !== UserRole.admin) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own custom items' },
        { status: 403 }
      );
    }

    // Check if item is in use
    let usageCount = 0;
    switch (kind) {
      case 'types':
        usageCount = await prisma.comic.count({
          where: { typeId: id, deletedAt: null },
        });
        break;
      case 'statuses':
        usageCount = await prisma.comic.count({
          where: { statusId: id, deletedAt: null },
        });
        break;
      case 'genres':
        usageCount = await prisma.comicGenre.count({
          where: { genreId: id },
        });
        break;
      case 'platforms':
        usageCount = await prisma.comic.count({
          where: { platformId: id, deletedAt: null },
        });
        break;
    }

    if (usageCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete ${modelName.toLowerCase()} as it is being used by ${usageCount} comic(s)` },
        { status: 400 }
      );
    }

    // Delete the item
    await (model as any).delete({
      where: { id },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        actionType: deleteAction,
        meta: {
          name: existingItem.name,
          kind,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${modelName} deleted successfully`,
    });
  } catch (error) {
    console.error('Delete enum error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}