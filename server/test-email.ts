import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

console.log('🧪 Testing Email Configuration...\n');

// Check environment variables
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set (hidden)' : '❌ Not set');
console.log('👤 ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'happyhopz308@gmail.com');
console.log('');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function testEmail() {
    try {
        console.log('📤 Sending test email...');

        const info = await transporter.sendMail({
            from: '"Happy Hopz Test" <orders@happyhopz.com>',
            to: process.env.ADMIN_EMAIL || 'happyhopz308@gmail.com',
            subject: '🧪 Test Email - Happy Hopz',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #667eea;">✅ Email Configuration Working!</h2>
                    <p>This is a test email from your Happy Hopz server.</p>
                    <p>If you're seeing this, your email configuration is set up correctly!</p>
                    <hr>
                    <p style="color: #888; font-size: 12px;">
                        Sent at: ${new Date().toLocaleString()}
                    </p>
                </div>
            `
        });

        console.log('✅ Email sent successfully!');
        console.log('📬 Message ID:', info.messageId);
        console.log('📧 Check your inbox:', process.env.ADMIN_EMAIL || 'happyhopz308@gmail.com');
        console.log('\n🎉 Email configuration is working correctly!');

    } catch (error: any) {
        console.error('❌ Email sending failed!');
        console.error('Error:', error.message);

        if (error.code === 'EAUTH') {
            console.log('\n💡 Authentication failed. Please check:');
            console.log('   1. EMAIL_USER is correct');
            console.log('   2. EMAIL_PASS is the 16-character app password (no spaces)');
            console.log('   3. 2-Step Verification is enabled on Gmail');
        }
    }
}

testEmail();
