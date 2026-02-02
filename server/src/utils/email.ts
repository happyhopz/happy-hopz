import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    // For development, you can use ethereal.email or your own SMTP
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendVerificationEmail = async (email: string, code: string) => {
    // If no credentials, log to console
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('------------------------------------');
        console.log(`VERIFICATION CODE FOR ${email}: ${code}`);
        console.log('------------------------------------');
        return;
    }

    const mailOptions = {
        from: '"Happy Hopz" <noreply@happyhopz.com>',
        to: email,
        subject: 'Verify your Happy Hopz Account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #ff6b6b; text-align: center;">Welcome to Happy Hopz! 🎊</h2>
                <p>Thank you for signing up. Please use the following code to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; background: #f0f0f0; border-radius: 5px;">${code}</span>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p style="color: #888; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                    If you did not request this, please ignore this email.
                </p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};
