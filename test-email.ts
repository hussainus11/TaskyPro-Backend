/**
 * Test script to verify Gmail SMTP credentials
 * Run with: npx tsx test-email.ts
 */

import { sendPasswordResetEmail } from './lib/email';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmail() {
  try {
    console.log('Testing email configuration...\n');
    
    // Check if credentials are set
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.FROM_EMAIL || smtpUser;

    console.log('Environment variables:');
    console.log('SMTP_USER:', smtpUser ? `${smtpUser.substring(0, 3)}***` : 'NOT SET');
    console.log('SMTP_PASS:', smtpPass ? '***SET***' : 'NOT SET');
    console.log('FROM_EMAIL:', fromEmail || 'NOT SET');
    console.log('');

    if (!smtpUser || !smtpPass) {
      console.error('❌ Error: SMTP credentials are not set!');
      console.error('Please set SMTP_USER and SMTP_PASS in your .env file');
      process.exit(1);
    }

    // Test email (use your own email for testing)
    const testEmail = smtpUser; // Send to yourself for testing
    const testName = 'Test User';
    const testLink = 'http://localhost:3000/dashboard/reset-password?token=test-token-123';

    console.log(`Sending test email to: ${testEmail}`);
    console.log('This may take a few seconds...\n');

    await sendPasswordResetEmail(testEmail, testName, testLink);

    console.log('\n✅ SUCCESS! Email sent successfully!');
    console.log('Check your inbox (and spam folder) for the test email.');
  } catch (error: any) {
    console.error('\n❌ FAILED to send email:');
    console.error('Error:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.error('\n💡 Tip: Make sure you\'re using a Gmail App Password, not your regular password.');
      console.error('   Generate one at: https://myaccount.google.com/apppasswords');
    } else if (error.message.includes('SMTP credentials')) {
      console.error('\n💡 Tip: Make sure SMTP_USER and SMTP_PASS are set in your .env file');
    }
    
    process.exit(1);
  }
}

testEmail();


