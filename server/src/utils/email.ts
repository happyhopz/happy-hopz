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

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('📧 EMAIL SENDING FAILED (Signup):', error);
        console.log('------------------------------------');
        console.log(`FALLBACK: VERIFICATION CODE FOR ${email}: ${code}`);
        console.log('------------------------------------');
    }
};

export const sendOrderConfirmationEmail = async (email: string, order: any) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`📠 ORDER CONFIRMATION LOGGED FOR ${email} (Order #${order.id.slice(0, 8)})`);
        return;
    }

    const itemsHtml = order.items.map((item: any) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name} (x${item.quantity})</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.quantity}</td>
        </tr>
    `).join('');

    const mailOptions = {
        from: '"Happy Hopz" <orders@happyhopz.com>',
        to: email,
        subject: `Your Happy Hopz Order #${order.id.slice(0, 8)} 👟`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #ff6b6b; text-align: center;">Order Confirmed! 🎊</h2>
                <p>Hi there,</p>
                <p>Thank you for shopping with Happy Hopz! Your order has been placed successfully and is being processed.</p>
                
                <h3 style="border-bottom: 2px solid #ff6b6b; padding-bottom: 5px;">Order Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    ${itemsHtml}
                    <tr>
                        <td style="padding: 10px; font-weight: bold;">Total Paid</td>
                        <td style="padding: 10px; font-weight: bold; text-align: right;">₹${order.total}</td>
                    </tr>
                </table>

                <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
                    <p style="margin: 0; font-weight: bold;">Shipping To:</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #666;">
                        ${order.address?.name || 'Customer'}<br>
                        ${order.address?.line1}<br>
                        ${order.address?.city}, ${order.address?.state} - ${order.address?.pincode}
                    </p>
                </div>

                <p style="text-align: center; margin-top: 30px;">
                    <a href="https://happy-hopz.vercel.app/orders/${order.id}" style="background: #ff6b6b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold;">Track Your Order</a>
                </p>

                <p style="color: #888; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
                    Questions? Reply to this email or visit our <a href="https://happy-hopz.vercel.app/contact">Contact Us</a> page.
                </p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};
