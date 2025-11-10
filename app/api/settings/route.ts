import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateSettingsSchema } from '@/lib/validators';
import { getAuthTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { ActionType } from '@prisma/client';

// GET - Get user settings
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

    let settings = await prisma.appSettings.findUnique({
      where: { userId: user.id },
    });

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          userId: user.id,
          themePreset: 'default',
          darkMode: false,
          pageSize: 20,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
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
    const validatedData = updateSettingsSchema.parse(body);

    const { themePreset, darkMode, pageSize } = validatedData;

    // Get existing settings
    let settings = await prisma.appSettings.findUnique({
      where: { userId: user.id },
    });

    let updatedSettings;
    if (settings) {
      // Update existing settings
      updatedSettings = await prisma.appSettings.update({
        where: { userId: user.id },
        data: {
          ...(themePreset !== undefined && { themePreset }),
          ...(darkMode !== undefined && { darkMode }),
          ...(pageSize !== undefined && { pageSize }),
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new settings
      updatedSettings = await prisma.appSettings.create({
        data: {
          userId: user.id,
          themePreset: themePreset || 'default',
          darkMode: darkMode || false,
          pageSize: pageSize || 20,
        },
      });
    }

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        actionType: ActionType.UPDATE_PROFILE,
        meta: {
          description: 'Settings updated',
          changes: {
            ...(themePreset !== undefined && { themePreset }),
            ...(darkMode !== undefined && { darkMode }),
            ...(pageSize !== undefined && { pageSize }),
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSettings,
    });
  } catch (error) {
    console.error('Update settings error:', error);

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