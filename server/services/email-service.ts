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
  try {
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
      // For production environments, check which email provider to use
      
      // Check for SendGrid API key (preferred for production)
      if (process.env.SENDGRID_API_KEY) {
        transporter = nodemailer.createTransport({
          service: 'SendGrid',
          auth: {
            user: 'apikey', // SendGrid requires this to be 'apikey'
            pass: process.env.SENDGRID_API_KEY
          }
        });
        console.log('Email service initialized with SendGrid');
      } 
      // Check for Gmail credentials
      else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD // This should be an app password
          }
        });
        console.log('Email service initialized with Gmail');
      }
      // Fallback to generic SMTP configuration
      else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        console.log('Email service initialized with custom SMTP provider');
      } 
      // If no production credentials found, warn and fall back to Ethereal
      else {
        console.warn('No production email credentials found. Falling back to Ethereal test email for development.');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`Email service initialized with fallback test account: ${testAccount.user}`);
      }
    }
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('Email service successfully verified');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize email service:', error);
    return false;
  }
}

// Send confirmation email after user registration
export async function sendConfirmationEmail(email: string, name: string): Promise<{success: boolean, previewUrl?: string}> {
  try {
    // Get the base URL for the app
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    
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
            <a href="${baseUrl}/auth" style="background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Log In Now
            </a>
          </div>
          <p>If you didn't create this account, please ignore this email.</p>
          <p>Thank you,<br>Risk Management System Team</p>
        </div>
      `,
    });

    console.log('Confirmation email sent: %s', info.messageId);
    
    let previewUrl: string | undefined;
    // For ethereal email, get the URL where the message can be viewed
    if (process.env.NODE_ENV !== 'production') {
      try {
        // The getTestMessageUrl function can return string | false
        const messageUrl = nodemailer.getTestMessageUrl(info);
        if (messageUrl) {
          previewUrl = messageUrl.toString();
          console.log('Preview URL: %s', previewUrl);
        }
      } catch (error) {
        console.error('Error getting preview URL:', error);
      }
    }
    
    return { success: true, previewUrl };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false };
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
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    
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
    
    let previewUrl: string | undefined;
    // For ethereal email, get the URL where the message can be viewed
    if (process.env.NODE_ENV !== 'production') {
      try {
        // The getTestMessageUrl function can return string | false
        const messageUrl = nodemailer.getTestMessageUrl(info);
        if (messageUrl) {
          previewUrl = messageUrl.toString();
          console.log('Preview URL: %s', previewUrl);
        }
      } catch (error) {
        console.error('Error getting preview URL:', error);
      }
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