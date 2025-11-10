import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validators';
import { PASSWORD_RESET_TOKEN_EXPIRY } from '@/config/constants';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function hashToken(token: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  return crypto.subtle.digest('SHA-256', data).then(hash => {
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

async function sendResetEmail(email: string, resetLink: string): Promise<void> {
  const APP_URL = process.env.APP_URL || 'http://localhost:3000';
  const RESEND_FROM = process.env.RESEND_FROM;

  if (!RESEND_FROM) {
    throw new Error('RESEND_FROM environment variable is not set');
  }

  try {
    await resend.emails.send({
      from: RESEND_FROM,
      to: [email],
      subject: 'Reset Your Password - Komik Tracker',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; margin: 0;">Komik Tracker</h1>
            <p style="color: #6b7280; margin: 5px 0;">Reset Your Password</p>
          </div>

          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Password Reset Request</h2>
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password for your Komik Tracker account.
              Click the button below to set a new password. This link will expire in 15 minutes.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}"
                 style="background-color: #3b82f6; color: white; padding: 12px 30px;
                        text-decoration: none; border-radius: 6px; font-weight: 600;
                        display: inline-block; font-size: 16px;">
                Reset Password
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              If you didn't request this password reset, you can safely ignore this email.
              Your password will remain unchanged.
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              This link expires in 15 minutes for security reasons.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #3b82f6; font-size: 11px; word-break: break-all; margin: 10px 0;">
              ${resetLink}
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    const { email } = validatedData;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const rawToken = generateResetToken();
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY);

    // Store reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Generate reset link
    const APP_URL = process.env.APP_URL || 'http://localhost:3000';
    const resetLink = `${APP_URL}/auth/reset?token=${encodeURIComponent(rawToken)}&u=${encodeURIComponent(user.id)}`;

    try {
      // Send reset email
      await sendResetEmail(user.email, resetLink);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);

      // Clean up the token since email failed
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          tokenHash,
        },
      });

      return NextResponse.json(
        { success: false, error: 'Failed to send password reset email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);

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