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

export const sendOrderEmail = async (email: string, order: any, type: 'CONFIRMATION' | 'STATUS_UPDATE', attachment?: { content: Buffer, filename: string }) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`📠 ORDER EMAIL LOGGED FOR ${email} (Order #${order.orderId || order.id})`);
        return;
    }

    const customerName = order.user?.name || order.address?.name || 'Customer';
    const orderId = order.orderId || order.id;

    let subject = '';
    let bodyHtml = '';

    if (type === 'CONFIRMATION') {
        subject = `🎉 Order Confirmed – Happy Hopz (${orderId})`;
        bodyHtml = getOrderConfirmationHtml(order, customerName);
    } else {
        subject = getStatusSubject(order.status, orderId);
        bodyHtml = getStatusUpdateHtml(order, customerName);
    }

    const mailOptions: any = {
        from: `"Happy Hopz" <${VERIFIED_SENDER}>`,
        to: email,
        subject: subject,
        html: bodyHtml,
        headers: {
            'X-Priority': '1 (Highest)',
            'Importance': 'high',
            'Priority': 'urgent'
        },
        attachments: attachment ? [
            {
                filename: attachment.filename,
                content: attachment.content,
                type: 'application/pdf',
                disposition: 'attachment'
            }
        ] : []
    };

    if (process.env.SENDGRID_API_KEY) {
        return sgMail.send(mailOptions);
    }

    return transporter.sendMail(mailOptions);
};

export const sendOrderConfirmationEmail = async (email: string, order: any) => {
    return sendOrderEmail(email, order, 'CONFIRMATION');
};

export const sendVerificationEmail = async (email: string, code: string) => {
    const mailOptions = {
        from: `"Happy Hopz" <${VERIFIED_SENDER}>`,
        to: email,
        subject: 'Verify your Happy Hopz Account',
        html: `<h2>Welcome to Happy Hopz!</h2><p>Your verification code is: <strong>${code}</strong></p>`
    };
    if (process.env.SENDGRID_API_KEY) return sgMail.send(mailOptions);
    return transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetUrl = `https://happy-hopz.vercel.app/reset-password?token=${token}`;
    const mailOptions = {
        from: `"Happy Hopz" <${VERIFIED_SENDER}>`,
        to: email,
        subject: 'Reset your Happy Hopz Password',
        html: `<p>You requested a password reset. Click below to proceed:</p><a href="${resetUrl}">Reset Password</a>`
    };
    if (process.env.SENDGRID_API_KEY) return sgMail.send(mailOptions);
    return transporter.sendMail(mailOptions);
};

const getStatusSubject = (status: string, orderId: string) => {
    switch (status) {
        case 'SHIPPED': return `Your Order Has Been Shipped 🚚 (${orderId})`;
        case 'DELIVERED': return `Order Delivered 🎉 (${orderId})`;
        case 'CANCELLED': return `Order Cancellation Notice (${orderId})`;
        case 'REFUNDED': return `Refund Processed Successfully (${orderId})`;
        default: return `Update on your Happy Hopz order ${orderId}`;
    }
};

const getOrderConfirmationHtml = (order: any, name: string) => {
    const itemsHtml = order.items.map((item: any) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name} (x${item.quantity})</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.quantity}</td>
        </tr>
    `).join('');

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #ff6b6b; text-align: center;">Order Confirmed! 🎊</h2>
            <p>Hi ${name},</p>
            <p><strong>Order ID:</strong> ${order.orderId || order.id}</p>
            <p style="background: #fff4f4; padding: 10px; border-radius: 5px; color: #d00; font-weight: bold; text-align: center; border: 1px dashed #d00; margin: 15px 0;">💡 Please check your <u>Spam/Junk</u> folder for order updates!</p>
            
            <h3 style="border-bottom: 2px solid #ff6b6b; padding-bottom: 5px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
                <tr>
                    <td style="padding: 10px; font-weight: bold;">Grand Total</td>
                    <td style="padding: 10px; font-weight: bold; text-align: right;">₹${order.total}</td>
                </tr>
            </table>

            <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
                <p style="margin: 0; font-weight: bold;">Shipping To:</p>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">
                    ${order.address?.line1}<br>
                    ${order.address?.city}, ${order.address?.state} - ${order.address?.pincode}
                </p>
            </div>

            <p style="text-align: center; margin-top: 30px;">
                <a href="https://happy-hopz.vercel.app/orders/${order.id}" style="background: #ff6b6b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold;">Track Your Order</a>
            </p>
        </div>
    `;
};

const getStatusUpdateHtml = (order: any, name: string) => {
    let statusMessage = '';
    let actionTip = '';

    switch (order.status) {
        case 'SHIPPED':
            statusMessage = `Great news! Your order has been shipped. 🚚`;
            actionTip = `Tracking Link: <a href="https://happy-hopz.vercel.app/orders/${order.id}">Track Here</a><br>Courier: ${order.courierPartner || 'Standard'}<br>Tracking ID: ${order.trackingNumber || 'N/A'}`;
            break;
        case 'DELIVERED':
            statusMessage = `Your Happy Hopz order has been delivered! 🎉 We hope your little one loves it. ❤️`;
            actionTip = `Need help? Contact our support team.`;
            break;
        case 'CANCELLED':
            statusMessage = `Your order has been cancelled.`;
            actionTip = `Reason: ${order.cancellationReason || 'Requested by user'}`;
            break;
        case 'REFUNDED':
            statusMessage = `Your refund has been processed successfully. 💰`;
            actionTip = `The amount should reflect in your account within 5-7 business days.`;
            break;
        default:
            statusMessage = `Your order status has been updated to: <strong>${order.status}</strong>`;
    }

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #667eea; text-align: center;">Order Update</h2>
            <p>Hi ${name},</p>
            <p>${statusMessage}</p>
            <p><strong>Order ID:</strong> ${order.orderId || order.id}</p>
            
            <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px; border-left: 4px solid #667eea;">
                <p style="margin: 0;">${actionTip}</p>
            </div>

            <p style="text-align: center; margin-top: 30px;">
                <a href="https://happy-hopz.vercel.app/orders/${order.id}" style="background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold;">View Order Details</a>
            </p>
        </div>
    `;
};

export const sendAdminOrderNotification = async (order: any) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'happyhopz308@gmail.com';
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

    const mailOptions = {
        from: `"Happy Hopz Admin" <${VERIFIED_SENDER}>`,
        to: adminEmail,
        subject: `🛍️ NEW ORDER: ${order.orderId || order.id} - ₹${order.total}`,
        headers: {
            'X-Priority': '1 (Highest)',
            'Importance': 'high'
        },
        html: `<h2>New Order Alert!</h2><p>Order #${order.orderId || order.id} received from ${order.address?.name || 'Guest'}.</p><a href="https://happy-hopz.vercel.app/admin/orders/${order.id}">Admin View</a>`
    };

    if (process.env.SENDGRID_API_KEY) return sgMail.send(mailOptions);
    return transporter.sendMail(mailOptions);
};

export const sendAdminAlertEmail = async (title: string, message: string) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'happyhopz308@gmail.com';
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

    const mailOptions = {
        from: `"Happy Hopz Alerts" <${VERIFIED_SENDER}>`,
        to: adminEmail,
        subject: `🔔 ALERT: ${title}`,
        headers: {
            'X-Priority': '1 (Highest)',
            'Importance': 'high'
        },
        html: `<p>${message}</p>`
    };

    if (process.env.SENDGRID_API_KEY) return sgMail.send(mailOptions);
    return transporter.sendMail(mailOptions);
};
