import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createEnumSchema, enumKindSchema } from '@/lib/validators';
import { getAuthTokenFromRequest, getUserFromToken, generateSlug } from '@/lib/auth';
import { UserRole, ActionType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ kind: string }>;
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

// GET - List enums of a specific kind
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { kind } = await params;
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

    // Validate kind
    const validatedKind = enumKindSchema.parse(kind);
    const modelConfig = getModelFromKind(validatedKind);
    if (!modelConfig) {
      return NextResponse.json(
        { success: false, error: 'Invalid enum kind' },
        { status: 400 }
      );
    }

    const { model } = modelConfig;

    // Determine what the user can see
    let whereClause: any = {};

    if (user.role === UserRole.member) {
      // Members can see:
      // 1. All global default entries (memberLocked: true, userId: null)
      // 2. Their own custom entries (memberLocked: false, userId: current user)
      whereClause = {
        OR: [
          { memberLocked: true, userId: null },
          { memberLocked: false, userId: user.id },
        ],
      };
    }

    // Admin can see everything

    const { searchParams } = new URL(request.url);
    const includeUsage = searchParams.get('includeUsage') === 'true';

    let items: any[] = [];

    if (includeUsage) {
      // Include usage counts
      const aggregateSelect: any = {
        id: true,
        name: true,
        slug: true,
        color: true,
        memberLocked: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      };

      // Add count based on kind
      switch (validatedKind) {
        case 'types':
          aggregateSelect._count = {
            comics: true,
          };
          break;
        case 'statuses':
          aggregateSelect._count = {
            comics: true,
          };
          break;
        case 'genres':
          aggregateSelect._count = {
            comics: true,
          };
          break;
        case 'platforms':
          aggregateSelect._count = {
            comics: true,
          };
          break;
      }

      items = await (model as any).findMany({
        where: whereClause,
        orderBy: [
          { memberLocked: 'desc' }, // Show locked (default) items first
          { name: 'asc' },
        ],
        select: aggregateSelect,
      });

      // Include user info for custom items
      if (items.some((item: any) => item.userId)) {
        const userIds = [...new Set(items.map((item: any) => item.userId).filter(Boolean))];
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            username: true,
          },
        });

        const userMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, any>);

        items = items.map((item: any) => ({
          ...item,
          user: item.userId ? userMap[item.userId] : null,
        }));
      }
    } else {
      // Simple list without usage counts
      items = await (model as any).findMany({
        where: whereClause,
        orderBy: [
          { memberLocked: 'desc' }, // Show locked (default) items first
          { name: 'asc' },
        ],
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          memberLocked: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        items,
        kind: validatedKind,
      },
    });
  } catch (error) {
    console.error('Get enums error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new enum
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { kind } = await params;
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

    // Validate kind
    const validatedKind = enumKindSchema.parse(kind);
    const modelConfig = getModelFromKind(validatedKind);
    if (!modelConfig) {
      return NextResponse.json(
        { success: false, error: 'Invalid enum kind' },
        { status: 400 }
      );
    }

    const { model, name: modelName, actionType } = modelConfig;

    // Check permissions
    if (user.role === UserRole.member) {
      // Members can only create custom platforms
      if (validatedKind !== 'platforms') {
        return NextResponse.json(
          { success: false, error: 'Only admins can create custom types, statuses, and genres' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const validatedData = createEnumSchema.parse(body);

    const { name, color } = validatedData;
    const slug = generateSlug(name);

    // Check if slug already exists
    const existingItem = await (model as any).findFirst({
      where: { slug },
    });

    if (existingItem) {
      return NextResponse.json(
        { success: false, error: `${modelName} with this name already exists` },
        { status: 400 }
      );
    }

    // Create the new enum
    const newItem = await (model as any).create({
      data: {
        name,
        slug,
        color,
        memberLocked: false, // Custom items are never locked
        userId: user.id, // Custom items belong to the user
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        actionType,
        meta: {
          name,
          kind: validatedKind,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: newItem,
    }, { status: 201 });
  } catch (error) {
    console.error('Create enum error:', error);

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