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

const getCommonStyles = () => `
    <style>
        .email-container { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 15px; color: #333; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #ff6b6b; }
        .order-id { font-weight: bold; color: #777; font-size: 14px; margin: 10px 0; }
        .spam-note { background: #fff4f4; padding: 12px; border-radius: 8px; color: #d00; font-weight: bold; text-align: center; border: 1px dashed #d00; margin: 20px 0; font-size: 13px; }
        .section-title { font-size: 16px; font-weight: bold; color: #ff6b6b; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
        .item-table { width: 100%; border-collapse: collapse; }
        .item-row td { padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
        .item-name { font-weight: bold; color: #222; margin: 0; }
        .item-meta { font-size: 12px; color: #888; margin: 2px 0; }
        .price-table { width: 100%; margin-top: 15px; }
        .price-row td { padding: 5px 0; font-size: 14px; }
        .total-row { font-size: 18px; font-weight: 900; color: #000; border-top: 2px solid #eee; }
        .address-box { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 20px; }
        .address-title { font-weight: 800; text-transform: uppercase; font-size: 11px; color: #64748b; letter-spacing: 1px; margin-bottom: 10px; }
        .track-button { display: block; width: 200px; margin: 30px auto; background: #ff6b6b; color: white !important; padding: 15px; text-decoration: none; border-radius: 30px; font-weight: bold; text-align: center; box-shadow: 0 4px 15px rgba(255,107,107,0.3); }
        .delivery-note { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: bold; margin-top: 15px; }
    </style>
`;

const getOrderItemsHtml = (items: any[]) => items.map(item => `
    <tr class="item-row">
        <td>
            <p class="item-name">${item.name}</p>
            <p class="item-meta">Size: ${item.size} | Color: ${item.color} x ${item.quantity}</p>
        </td>
        <td style="text-align: right; font-weight: bold;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
`).join('');

const getAddressHtml = (address: any) => `
    <div class="address-box">
        <div class="address-title">📦 Shipping To</div>
        <p style="margin: 0; font-weight: bold; color: #1e293b;">${address?.name}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #64748b; line-height: 1.6;">
            ${address?.line1}, ${address?.line2 ? address.line2 + ', ' : ''}<br>
            ${address?.city}, ${address?.state} - ${address?.pincode}
        </p>
        <p style="margin-top: 8px; font-size: 13px; font-weight: bold; color: #1e293b;">📞 ${address?.phone}</p>
    </div>
`;

const getExpectedDeliveryHtml = (order: any) => {
    if (!order.estimatedDelivery) return '';
    try {
        const date = new Date(order.estimatedDelivery);
        return `
            <div class="delivery-note">
                🚚 Expected Delivery: ${date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
        `;
    } catch (e) { return ''; }
};

const getOrderConfirmationHtml = (order: any, name: string) => {
    return `
        ${getCommonStyles()}
        <div class="email-container">
            <div class="header">
                <h2 style="color: #ff6b6b; margin: 0;">Order Confirmed! 🎊</h2>
            </div>
            <p>Hi ${name},</p>
            <p>Thank you for choosing Happy Hopz! Your order has been successfully placed and is now being prepared for shipment.</p>
            
            <div class="order-id">ORDER ID: ${order.orderId || order.id}</div>
            <div class="spam-note">💡 Please check your <u>Spam/Junk</u> folder for order updates!</div>

            ${getExpectedDeliveryHtml(order)}

            <div class="section-title">Order Manifesto</div>
            <table class="item-table">
                ${getOrderItemsHtml(order.items || [])}
            </table>

            <table class="price-table">
                <tr class="price-row">
                    <td>Subtotal</td>
                    <td style="text-align: right;">₹${(order.subtotal || 0).toFixed(2)}</td>
                </tr>
                <tr class="price-row">
                    <td>Tax</td>
                    <td style="text-align: right;">₹${(order.tax || 0).toFixed(2)}</td>
                </tr>
                <tr class="price-row">
                    <td>Shipping</td>
                    <td style="text-align: right;">₹${(order.shipping || 0).toFixed(2)}</td>
                </tr>
                <tr class="price-row total-row">
                    <td style="padding-top: 15px;">TOTAL</td>
                    <td style="text-align: right; padding-top: 15px;">₹${(order.total || 0).toFixed(2)}</td>
                </tr>
            </table>

            ${getAddressHtml(order.address)}

            <a href="https://happy-hopz.vercel.app/orders/${order.id}" class="track-button">Track Your Journey</a>
            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">© 2026 Happy Hopz Footwear</p>
        </div>
    `;
};

const getStatusUpdateHtml = (order: any, name: string) => {
    let statusTitle = 'Order Update';
    let statusColor = '#667eea';
    let statusIcon = '🔔';
    let statusMessage = '';

    switch (order.status) {
        case 'SHIPPED':
            statusTitle = 'Order Shipped!';
            statusColor = '#8b5cf6';
            statusIcon = '🚚';
            statusMessage = `Great news! Your order is on its way. Use the tracking details below to stay updated.`;
            break;
        case 'OUT_FOR_DELIVERY':
            statusTitle = 'Out for Delivery';
            statusColor = '#f59e0b';
            statusIcon = '🛵';
            statusMessage = `Your Happy Hopz order is out for delivery today! Keep your phone handy.`;
            break;
        case 'DELIVERED':
            statusTitle = 'Order Delivered!';
            statusColor = '#10b981';
            statusIcon = '🎉';
            statusMessage = `Success! Your order has been delivered. We hope your little one loves their new footwear! ❤️`;
            break;
        case 'CANCELLED':
            statusTitle = 'Order Cancelled';
            statusColor = '#ef4444';
            statusIcon = '⚠️';
            statusMessage = `Your order has been cancelled. If you didn't request this, please contact our support.`;
            break;
        case 'REFUNDED':
            statusTitle = 'Refund Processed';
            statusColor = '#10b981';
            statusIcon = '💰';
            statusMessage = `Your refund has been initiated. The amount should reflect in your account within 5-7 business days.`;
            break;
        default:
            statusMessage = `Your order status has been updated to: <strong>${order.status}</strong>`;
    }

    return `
        ${getCommonStyles()}
        <div class="email-container" style="border-top: 6px solid ${statusColor};">
            <div style="text-align: center; padding: 20px 0;">
                <span style="font-size: 40px;">${statusIcon}</span>
                <h2 style="color: ${statusColor}; margin: 10px 0;">${statusTitle}</h2>
            </div>
            <p>Hi ${name},</p>
            <p>${statusMessage}</p>

            <div class="order-id">ORDER ID: ${order.orderId || order.id}</div>
            
            ${getExpectedDeliveryHtml(order)}

            ${order.trackingNumber ? `
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
                    <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Tracking Details</p>
                    <p style="margin: 5px 0; font-weight: bold;">Courier: ${order.courierPartner || 'Delhivery'}</p>
                    <p style="margin: 0; font-family: monospace; font-size: 16px; color: ${statusColor};">AWB: ${order.trackingNumber}</p>
                </div>
            ` : ''}

            <div class="section-title">Order Manifesto</div>
            <table class="item-table">
                ${getOrderItemsHtml(order.items || [])}
            </table>

            <table class="price-table">
                <tr class="price-row total-row">
                    <td style="padding-top: 15px;">TOTAL AMOUNT</td>
                    <td style="text-align: right; padding-top: 15px;">₹${(order.total || 0).toFixed(2)}</td>
                </tr>
            </table>

            ${getAddressHtml(order.address)}

            <a href="https://happy-hopz.vercel.app/orders/${order.id}" class="track-button" style="background: ${statusColor}; box-shadow: 0 4px 15px ${statusColor}40;">View Live Status</a>
            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">© 2026 Happy Hopz Footwear</p>
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
