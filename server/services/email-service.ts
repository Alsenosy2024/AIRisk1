import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create a reusable transporter for emails
// For development testing, we'll use Ethereal (fake SMTP service)
let transporter: nodemailer.Transporter;

// In-memory store for password reset tokens
// In a production app, this would be stored in a database
const resetTokens = new Map<string, { userId: number, token: string, expires: Date }>();

// Initialize the email transporter
export async function initializeEmailService() {
  // For development, create a test account at ethereal.email
  if (process.env.NODE_ENV !== 'production') {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    // Create reusable transporter object using the default SMTP transport
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    console.log(`Email service initialized with test account: ${testAccount.user}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl}`);
  } else {
    // For production, use a real SMTP provider (like Gmail, Outlook, etc.)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('Email service initialized with production settings');
  }
}

// Send confirmation email after user registration
export async function sendConfirmationEmail(email: string, name: string) {
  try {
    const info = await transporter.sendMail({
      from: '"Risk Management System" <noreply@riskpro.com>',
      to: email,
      subject: 'Welcome to Risk Management System - Confirm Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Risk Management System, ${name}!</h2>
          <p>Thank you for registering with our Risk Management System. Your account has been created successfully.</p>
          <p>Please verify your email address to ensure you receive important notifications about your account and risks.</p>
          <div style="margin: 30px 0;">
            <a href="#" style="background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p>If you didn't create this account, please ignore this email.</p>
          <p>Thank you,<br>Risk Management System Team</p>
        </div>
      `,
    });

    console.log('Confirmation email sent: %s', info.messageId);
    
    // For ethereal email, log the URL where the message can be viewed
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
}

// Generate password reset token and send reset email
export async function sendPasswordResetEmail(userId: number, email: string, name: string): Promise<{ token: string | null, previewUrl?: string }> {
  try {
    // Generate unique reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour
    
    // Save token to our in-memory store (would be in DB in production)
    resetTokens.set(token, { 
      userId, 
      token, 
      expires 
    });
    
    // Get the base URL for the app
    const baseUrl = process.env.APP_URL || window.location.origin || 'http://localhost:5000';
    
    // Send the reset email
    const info = await transporter.sendMail({
      from: '"Risk Management System" <noreply@riskpro.com>',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password for your Risk Management System account.</p>
          <p>To reset your password, click the button below. This link will expire in 1 hour.</p>
          <div style="margin: 30px 0;">
            <a href="${baseUrl}/reset-password?token=${token}" 
               style="background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Thank you,<br>Risk Management System Team</p>
        </div>
      `,
    });

    console.log('Password reset email sent: %s', info.messageId);
    
    let previewUrl;
    // For ethereal email, get the URL where the message can be viewed
    if (process.env.NODE_ENV !== 'production') {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Preview URL: %s', previewUrl);
    }
    
    return { token, previewUrl };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { token: null };
  }
}

// Verify reset token
export function verifyResetToken(token: string): { valid: boolean, userId?: number } {
  const resetData = resetTokens.get(token);
  
  if (!resetData) {
    return { valid: false };
  }
  
  if (new Date() > resetData.expires) {
    // Token has expired, remove it
    resetTokens.delete(token);
    return { valid: false };
  }
  
  return { valid: true, userId: resetData.userId };
}

// Clear token after use
export function clearResetToken(token: string): boolean {
  return resetTokens.delete(token);
}