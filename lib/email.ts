/**
 * Email utility for sending emails using Gmail SMTP
 * 
 * Required environment variables:
 * - SMTP_USER: Your Gmail address (e.g., yourname@gmail.com)
 * - SMTP_PASS: Gmail App Password (not your regular password)
 * - FROM_EMAIL: Email address to show as sender (usually same as SMTP_USER)
 * 
 * To generate a Gmail App Password:
 * 1. Go to your Google Account settings
 * 2. Enable 2-Step Verification
 * 3. Go to App Passwords and generate a new app password
 * 4. Use that 16-character password as SMTP_PASS
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create reusable singleton transporter with connection pooling
let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (transporter) {
    return transporter;
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    throw new Error(
      'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.'
    );
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    pool: true, // Use connection pooling
    maxConnections: 5, // Maximum number of connections in the pool
    maxMessages: 100, // Maximum number of messages per connection
    rateDelta: 1000, // Time window for rate limiting (ms)
    rateLimit: 14, // Maximum number of messages per rateDelta
    connectionTimeout: 5000, // Connection timeout in ms (5 seconds)
    greetingTimeout: 5000, // Greeting timeout in ms
    socketTimeout: 5000, // Socket timeout in ms
  });

  return transporter;
};

/**
 * Send an email
 * 
 * @param options Email options
 * @returns Promise that resolves when email is queued (non-blocking)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

  if (!fromEmail) {
    throw new Error('FROM_EMAIL or SMTP_USER environment variable is required');
  }

  const emailTransporter = getTransporter();

  // Send email - returns promise but errors are handled gracefully
  return emailTransporter.sendMail({
    from: fromEmail,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback to plain text if not provided
  })
    .then(() => {
      console.log(`Email sent successfully to ${options.to}`);
    })
    .catch((error: any) => {
      console.error(`Failed to send email to ${options.to}:`, error.message);
      // Don't throw - email failures shouldn't break the request
    });
}

/**
 * Send password reset email
 * 
 * @param email User's email address
 * @param name User's name
 * @param resetLink Password reset link
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string
): Promise<void> {
  const subject = 'Reset Your Password';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          <h1 style="color: #333;">Reset Your Password</h1>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      </body>
    </html>
  `;
  const text = `
    Reset Your Password
    
    Hello ${name},
    
    We received a request to reset your password. Use the following link to reset it:
    
    ${resetLink}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, please ignore this email.
    
    This is an automated message, please do not reply.
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

