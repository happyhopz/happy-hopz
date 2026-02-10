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

export const sendPasswordResetEmail = async (email: string, token: string) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('------------------------------------');
        console.log(`PASSWORD RESET TOKEN FOR ${email}: ${token}`);
        console.log('------------------------------------');
        return;
    }

    const resetUrl = `https://happy-hopz.vercel.app/reset-password?token=${token}`;

    const mailOptions = {
        from: '"Happy Hopz" <noreply@happyhopz.com>',
        to: email,
        subject: 'Reset Your Happy Hopz Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #ff6b6b; text-align: center;">Password Reset Request 🔑</h2>
                <p>Hello,</p>
                <p>We received a request to reset the password for your Happy Hopz account. Click the button below to proceed:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background: #ff6b6b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <p style="color: #888; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
                    For security, never share this link with anyone.
                </p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

export const sendAdminOrderNotification = async (order: any) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'happyhopz308@gmail.com';

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`🔔 NEW ORDER NOTIFICATION FOR ADMIN: Order #${order.id.slice(0, 8)} - ₹${order.total}`);
        return;
    }

    const customerName = order.user?.name || order.guestName || 'Guest Customer';
    const customerEmail = order.user?.email || order.guestEmail || 'N/A';
    const customerPhone = order.user?.phone || order.guestPhone || 'N/A';

    const itemsHtml = order.items.map((item: any) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.size || 'N/A'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.color || 'N/A'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.quantity}</td>
        </tr>
    `).join('');

    const mailOptions = {
        from: '"Happy Hopz Orders" <orders@happyhopz.com>',
        to: adminEmail,
        subject: `🛍️ New Order #${order.id.slice(0, 8)} - ₹${order.total}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: #f9f9f9;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px;">
                    <h2 style="margin: 0; text-align: center;">🎉 New Order Received!</h2>
                    <p style="margin: 10px 0 0 0; text-align: center; font-size: 14px; opacity: 0.9;">Order #${order.id.slice(0, 8)}</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 15px;">
                    <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Customer Information</h3>
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; width: 120px;">Name:</td>
                            <td style="padding: 8px 0;">${customerName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                            <td style="padding: 8px 0;">${customerEmail}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
                            <td style="padding: 8px 0;">${customerPhone}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Type:</td>
                            <td style="padding: 8px 0;">${order.userId ? '👤 Registered User' : '🎭 Guest Checkout'}</td>
                        </tr>
                    </table>
                </div>

                <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 15px;">
                    <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Order Items</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background: #f0f0f0;">
                                <th style="padding: 10px; text-align: left;">Product</th>
                                <th style="padding: 10px; text-align: center;">Size</th>
                                <th style="padding: 10px; text-align: center;">Color</th>
                                <th style="padding: 10px; text-align: center;">Qty</th>
                                <th style="padding: 10px; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>

                <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 15px;">
                    <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Shipping Address</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                        <strong>${order.address?.name || customerName}</strong><br>
                        ${order.address?.line1}<br>
                        ${order.address?.line2 ? order.address.line2 + '<br>' : ''}
                        ${order.address?.city}, ${order.address?.state} - ${order.address?.pincode}<br>
                        📞 ${order.address?.phone || customerPhone}
                    </p>
                </div>

                <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 15px;">
                    <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Order Summary</h3>
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="padding: 8px 0;">Subtotal:</td>
                            <td style="padding: 8px 0; text-align: right;">₹${order.subtotal || 0}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">Tax (GST):</td>
                            <td style="padding: 8px 0; text-align: right;">₹${order.tax || 0}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">Shipping:</td>
                            <td style="padding: 8px 0; text-align: right;">₹${order.shipping || 0}</td>
                        </tr>
                        ${order.couponDiscount > 0 ? `
                        <tr style="color: #22c55e;">
                            <td style="padding: 8px 0;">Discount (${order.couponCode}):</td>
                            <td style="padding: 8px 0; text-align: right;">-₹${order.couponDiscount}</td>
                        </tr>
                        ` : ''}
                        <tr style="border-top: 2px solid #667eea; font-weight: bold; font-size: 16px;">
                            <td style="padding: 12px 0;">Total Amount:</td>
                            <td style="padding: 12px 0; text-align: right; color: #667eea;">₹${order.total}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">Payment Status:</td>
                            <td style="padding: 8px 0; text-align: right;">
                                <span style="background: ${order.paymentStatus === 'COMPLETED' ? '#22c55e' : '#f59e0b'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                                    ${order.paymentStatus}
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center; margin-top: 25px;">
                    <a href="https://happy-hopz.vercel.app/admin/orders/${order.id}" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                        📦 View Order in Admin Panel
                    </a>
                </div>

                <p style="color: #888; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center;">
                    This is an automated notification from Happy Hopz Order Management System
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Admin notification sent for order #${order.id.slice(0, 8)}`);
    } catch (error) {
        console.error('❌ Failed to send admin notification:', error);
    }
};
