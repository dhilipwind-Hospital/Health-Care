
import dotenv from 'dotenv';
import path from 'path';

// Load env before anything else
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('--- Email Test Script ---');
console.log('SMTP Config Loaded:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    passLength: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0,
    secure: process.env.SMTP_SECURE
});

import { EmailService } from '../services/email.service';

async function testEmail() {
    console.log('Initializing Email Service...');
    EmailService.initialize();

    console.log('Attempting to send test email...');
    const result = await EmailService.sendEmail({
        to: process.env.SMTP_USER || 'dhilipwing@gmail.com', // Send to self
        subject: '🏥 Test Email from Hospital System',
        html: '<h1>It Works!</h1><p>Your SMTP configuration is valid.</p>'
    });

    if (result) {
        console.log('✅ SUCCESS: Test email sent successfully!');
    } else {
        console.error('❌ FAILURE: Could not send test email.');
    }
}

testEmail().catch(err => console.error('Script Error:', err));
