import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid initialized');
}

// Verified sender email (must match SendGrid Sender Identity)
const VERIFIED_SENDER = 'happyhopz308@gmail.com';

// Fallback to nodemailer for local development without SendGrid
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || VERIFIED_SENDER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendVerificationEmail = async (email: string, code: string) => {
    // Disabled at user request - only order emails are active
    console.log(`[DISABLED] Verification code for ${email}: ${code}`);
    return;
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
        from: `"Happy Hopz" <${VERIFIED_SENDER}>`,
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

    if (process.env.SENDGRID_API_KEY) {
        console.log('📧 [ORDER CONFIRMATION] Sending via SendGrid from:', VERIFIED_SENDER);
        return sgMail.send({
            ...mailOptions,
            from: { email: VERIFIED_SENDER, name: 'Happy Hopz' }
        });
    }

    return transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    // Disabled at user request - only order emails are active
    console.log(`[DISABLED] Password reset token for ${email}: ${token}`);
    return;
};

export const sendAdminOrderNotification = async (order: any) => {
    console.log('🔔 [ADMIN NOTIFICATION] Function called');
    console.log('🔔 [ADMIN NOTIFICATION] EMAIL_USER:', process.env.EMAIL_USER);
    console.log('🔔 [ADMIN NOTIFICATION] EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
    console.log('🔔 [ADMIN NOTIFICATION] EMAIL_PASS length:', process.env.EMAIL_PASS?.length);

    const adminEmail = process.env.ADMIN_EMAIL || 'happyhopz308@gmail.com';
    console.log('🔔 [ADMIN NOTIFICATION] Admin email target:', adminEmail);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`❌ [ADMIN NOTIFICATION] Email credentials missing!`);
        console.log(`🔔 NEW ORDER NOTIFICATION FOR ADMIN: Order #${order.id.slice(0, 8)} - ₹${order.total}`);
        return;
    }

    console.log('✅ [ADMIN NOTIFICATION] Credentials found, preparing email...');

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
        console.log('📤 [ADMIN NOTIFICATION] Sending email to:', adminEmail);
        console.log('📤 [ADMIN NOTIFICATION] Email subject:', mailOptions.subject);

        // Use SendGrid if available (production), otherwise fallback to nodemailer (local dev)
        if (process.env.SENDGRID_API_KEY) {
            console.log('📧 [ADMIN NOTIFICATION] Using SendGrid from:', VERIFIED_SENDER);
            const msg = {
                to: adminEmail,
                from: {
                    email: VERIFIED_SENDER,
                    name: 'Happy Hopz Orders'
                },
                subject: mailOptions.subject,
                html: mailOptions.html
            };

            await sgMail.send(msg);
            console.log(`✅ [ADMIN NOTIFICATION] Email sent successfully via SendGrid for order #${order.id.slice(0, 8)}`);
        } else {
            console.log('📧 [ADMIN NOTIFICATION] Using nodemailer (local dev)...');
            await transporter.sendMail(mailOptions);
            console.log(`✅ [ADMIN NOTIFICATION] Email sent successfully via nodemailer for order #${order.id.slice(0, 8)}`);
        }
    } catch (error: any) {
        console.error('❌ [ADMIN NOTIFICATION] Failed to send email:', error?.message || error);
        console.error('❌ [ADMIN NOTIFICATION] Error code:', error?.code);
        console.error('❌ [ADMIN NOTIFICATION] Error response:', error?.response?.body);
        // Don't throw - we don't want to fail the order if email fails
    }
};

