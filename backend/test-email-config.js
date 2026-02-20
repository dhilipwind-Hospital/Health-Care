/**
 * Test Email Configuration
 * 
 * This script tests the Gmail SMTP configuration
 * Run: node test-email-config.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testEmailConfiguration() {
  logSection('EMAIL CONFIGURATION TEST');

  // Display configuration
  logInfo('Current Email Configuration:');
  console.log(`  SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`  SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`  SMTP User: ${process.env.SMTP_USER}`);
  console.log(`  SMTP Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET'}`);
  console.log(`  From Name: ${process.env.SMTP_FROM_NAME}`);
  console.log(`  From Email: ${process.env.SMTP_FROM_EMAIL}`);

  // Check if all required variables are set
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logError('Missing required SMTP configuration variables');
    process.exit(1);
  }

  logSuccess('All SMTP configuration variables are set');

  // Create transporter
  logSection('CREATING EMAIL TRANSPORTER');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  logSuccess('Email transporter created');

  // Verify connection
  logSection('VERIFYING SMTP CONNECTION');
  
  try {
    await transporter.verify();
    logSuccess('SMTP connection verified successfully!');
  } catch (error) {
    logError(`SMTP connection failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }

  // Send test email
  logSection('SENDING TEST EMAIL');
  
  const testEmail = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: process.env.SMTP_USER, // Send to yourself for testing
    subject: '✅ Hospital Management System - Email Configuration Test',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Email Configuration Test</h1>
          </div>
          <div class="content">
            <div class="success-box">
              <h2 style="color: #155724; margin-top: 0;">✅ Success!</h2>
              <p style="margin: 0; color: #155724;">Your email configuration is working correctly!</p>
            </div>
            
            <h3>Configuration Details:</h3>
            <div class="info-box">
              <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
              <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
              <p><strong>From Name:</strong> ${process.env.SMTP_FROM_NAME}</p>
              <p><strong>From Email:</strong> ${process.env.SMTP_FROM_EMAIL}</p>
              <p style="margin: 0;"><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <h3>What's Next?</h3>
            <ul>
              <li>✅ Appointment confirmation emails will work</li>
              <li>✅ Appointment reminder emails will work</li>
              <li>✅ Password reset emails will work</li>
              <li>✅ Welcome emails for new users will work</li>
              <li>✅ Lab result notifications will work</li>
              <li>✅ Prescription notifications will work</li>
            </ul>
            
            <p style="margin-top: 30px; color: #666;">
              <strong>Note:</strong> This is an automated test email from your Hospital Management System.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Hospital Management System. All rights reserved.</p>
            <p>Powered by Nodemailer & Gmail SMTP</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(testEmail);
    logSuccess(`Test email sent successfully!`);
    logInfo(`Message ID: ${info.messageId}`);
    logInfo(`Check your inbox: ${process.env.SMTP_USER}`);
  } catch (error) {
    logError(`Failed to send test email: ${error.message}`);
    console.error(error);
    process.exit(1);
  }

  logSection('EMAIL CONFIGURATION TEST COMPLETE');
  logSuccess('All tests passed! Email system is ready to use.');
  console.log('\n');
}

// Run the test
testEmailConfiguration().catch(error => {
  logError(`Test failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
