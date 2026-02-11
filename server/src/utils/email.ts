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
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        
        .email-container { 
            font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; 
            max-width: 600px; 
            margin: auto; 
            padding: 20px; 
            background-color: #ffffff;
            color: #1e293b; 
        }
        .main-card {
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
            background: #ffffff;
        }
        .header { 
            text-align: center; 
            padding: 40px 20px; 
            background: linear-gradient(135deg, #fff5f5 0%, #fff1f2 100%);
            border-bottom: 2px solid #fff1f2;
        }
        .order-id-pill { 
            display: inline-block;
            background: #f1f5f9;
            color: #64748b;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 12px;
            border-radius: 20px;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .content-body { padding: 40px 30px; }
        .spam-note { 
            background: #fffafa; 
            padding: 15px; 
            border-radius: 12px; 
            color: #e11d48; 
            font-weight: 600; 
            text-align: center; 
            border: 1px solid #fecaca; 
            margin: 20px 0; 
            font-size: 13px; 
        }
        .section-title { 
            font-size: 14px; 
            font-weight: 800; 
            color: #0f172a; 
            margin: 30px 0 15px 0; 
            text-transform: uppercase; 
            letter-spacing: 2px;
            display: flex;
            align-items: center;
        }
        .tabular-box {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            overflow: hidden;
            margin: 15px 0;
        }
        .tabular-box th {
            background: #f8fafc;
            text-align: left;
            padding: 12px 15px;
            font-size: 11px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #e2e8f0;
        }
        .tabular-box td {
            padding: 15px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
        }
        .tabular-box tr:last-child td { border-bottom: none; }
        
        .item-name { font-weight: 700; color: #1e293b; font-size: 14px; margin: 0; }
        .item-meta { font-size: 11px; color: #94a3b8; margin: 4px 0 0 0; font-weight: 600; }
        
        .pricing-table { 
            width: 100%; 
            margin-top: 10px;
            border-top: 2px solid #f1f5f9;
            padding-top: 15px;
        }
        .pricing-row td { padding: 6px 0; font-size: 14px; font-weight: 500; color: #475569; }
        .total-row { border-top: 1px solid #f1f5f9; }
        .total-row td { 
            padding-top: 15px; 
            font-size: 20px; 
            font-weight: 800; 
            color: #0f172a; 
        }
        
        .address-card { 
            background: #f8fafc; 
            padding: 25px; 
            border-radius: 20px; 
            border: 1px solid #e2e8f0; 
            margin-top: 30px; 
        }
        .address-header { 
            font-weight: 800; 
            text-transform: uppercase; 
            font-size: 11px; 
            color: #64748b; 
            letter-spacing: 1px; 
            margin-bottom: 15px;
        }
        .track-button { 
            display: inline-block; 
            background: #e11d48; 
            color: #ffffff !important; 
            padding: 18px 35px; 
            text-decoration: none; 
            border-radius: 40px; 
            font-weight: 800; 
            text-align: center; 
            box-shadow: 0 10px 20px rgba(225,29,72,0.2);
            transition: transform 0.2s ease;
            text-transform: uppercase;
            font-size: 14px;
            letter-spacing: 1px;
        }
        .delivery-note { 
            background: #ecfdf5; 
            border: 1px solid #a7f3d0; 
            color: #065f46; 
            padding: 15px; 
            border-radius: 12px; 
            font-size: 13px; 
            font-weight: 700; 
            margin-top: 20px; 
            text-align: center;
        }
    </style>
`;

const getOrderItemsHtml = (items: any[]) => items.map(item => `
    <tr>
        <td style="width: 70%;">
            <p class="item-name">${item.name}</p>
            <p class="item-meta">SIZE ${item.size} • ${item.color.toUpperCase()}</p>
        </td>
        <td style="text-align: center; font-weight: 700; color: #64748b;">x${item.quantity}</td>
        <td style="text-align: right; font-weight: 800; color: #1e293b;">₹${(item.price * item.quantity).toFixed(0)}</td>
    </tr>
`).join('');

const getAddressHtml = (address: any) => `
    <div class="address-card">
        <div class="address-header">📍 Delivery Address</div>
        <p style="margin: 0; font-weight: 800; color: #0f172a; font-size: 15px;">${address?.name}</p>
        <p style="margin: 8px 0; font-size: 13px; color: #475569; line-height: 1.6; font-weight: 500;">
            ${address?.line1}, ${address?.line2 ? address.line2 + ', ' : ''}<br>
            ${address?.city}, ${address?.state} - ${address?.pincode}
        </p>
        <p style="margin-top: 12px; font-size: 13px; font-weight: 800; color: #0f172a;">📞 ${address?.phone}</p>
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
            <div class="main-card">
                <div class="header">
                    <h2 style="color: #e11d48; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">Order Confirmed! 🎊</h2>
                    <div class="order-id-pill">${order.orderId || order.id}</div>
                </div>
                
                <div class="content-body">
                    <p style="margin-top: 0; font-size: 16px; line-height: 1.6;">Hi <strong style="color: #e11d48;">${name}</strong>,</p>
                    <p style="color: #475569; line-height: 1.6;">Great choice! Your order is being processed and will be shipped soon. We're excited to get these to you!</p>
                    
                    <div class="spam-note">💡 Pro-tip: Check your <u>Spam folder</u> if you don't see our updates!</div>

                    ${getExpectedDeliveryHtml(order)}

                    <div class="section-title">📦 Order Summary</div>
                    <table class="tabular-box">
                        <thead>
                            <tr>
                                <th>Item Details</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${getOrderItemsHtml(order.items || [])}
                        </tbody>
                    </table>

                    <div class="tabular-box" style="padding: 20px;">
                        <table class="pricing-table">
                            <tr class="pricing-row">
                                <td>Bag Total</td>
                                <td style="text-align: right;">₹${(order.subtotal || 0).toFixed(0)}</td>
                            </tr>
                            <tr class="pricing-row">
                                <td>GST (${order.tax ? 'Applied' : 'Dynamic'})</td>
                                <td style="text-align: right;">₹${(order.tax || 0).toFixed(0)}</td>
                            </tr>
                            <tr class="pricing-row">
                                <td>Delivery</td>
                                <td style="text-align: right; color: ${order.shipping === 0 ? '#10b981' : '#475569'};">
                                    ${order.shipping === 0 ? 'FREE' : '₹' + (order.shipping || 0).toFixed(0)}
                                </td>
                            </tr>
                            <tr class="total-row">
                                <td style="padding-top: 15px; font-weight: 800; color: #0f172a;">Order Total</td>
                                <td style="text-align: right; padding-top: 15px; font-weight: 800; color: #e11d48; font-size: 24px;">₹${(order.total || 0).toFixed(0)}</td>
                            </tr>
                        </table>
                    </div>

                    ${getAddressHtml(order.address)}

                    <div style="text-align: center; margin-top: 40px;">
                        <a href="https://happy-hopz.vercel.app/orders/${order.id}" class="track-button">Track Order Journey</a>
                    </div>
                </div>
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 30px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">© 2026 Happy Hopz Footwear • Made with ❤️ for little feet</p>
        </div>
    `;
};

const getStatusUpdateHtml = (order: any, name: string) => {
    let statusTitle = 'Order Update';
    let statusColor = '#3b82f6';
    let statusIcon = '🔔';
    let statusMessage = '';

    switch (order.status) {
        case 'SHIPPED':
            statusTitle = 'Package Shipped!';
            statusColor = '#6366f1';
            statusIcon = '🚚';
            statusMessage = `Great news! Your package is officially on its way to you.`;
            break;
        case 'OUT_FOR_DELIVERY':
            statusTitle = 'Out for Delivery';
            statusColor = '#f59e0b';
            statusIcon = '🛵';
            statusMessage = `Your Happy Hopz order is arriving today! Please keep your phone reachable.`;
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
            statusMessage = `Your order has been cancelled. If you have any questions, please reach out.`;
            break;
        case 'REFUNDED':
            statusTitle = 'Refund Processed';
            statusColor = '#10b981';
            statusIcon = '💰';
            statusMessage = `Your refund is on its way. Expect to see it in your account within 5-7 business days.`;
            break;
        default:
            statusMessage = `Update: Your order status is now <strong>${order.status}</strong>`;
    }

    return `
        ${getCommonStyles()}
        <div class="email-container">
            <div class="main-card">
                <div class="header" style="background: ${statusColor}10; border-bottom: 2px solid ${statusColor}15; padding: 50px 20px;">
                    <span style="font-size: 48px;">${statusIcon}</span>
                    <h2 style="color: ${statusColor}; margin: 15px 0 5px 0; font-size: 32px; font-weight: 800;">${statusTitle}</h2>
                    <div class="order-id-pill">${order.orderId || order.id}</div>
                </div>

                <div class="content-body">
                    <p style="margin-top: 0; font-size: 16px; line-height: 1.6;">Hi <strong style="color: ${statusColor};">${name}</strong>,</p>
                    <p style="color: #475569; line-height: 1.6; font-size: 15px;">${statusMessage}</p>

                    ${getExpectedDeliveryHtml(order)}

                    ${order.trackingNumber ? `
                        <div style="background: ${statusColor}08; padding: 25px; border-radius: 16px; margin: 30px 0; border: 1px dashed ${statusColor}40; text-align: center;">
                            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px;">Tracking Courier</p>
                            <p style="margin: 8px 0; font-weight: 800; font-size: 18px; color: #0f172a;">${order.courierPartner || 'Delhivery'}</p>
                            <div style="background: #ffffff; display: inline-block; padding: 8px 15px; border-radius: 8px; font-family: monospace; font-size: 20px; color: ${statusColor}; font-weight: 800; border: 1px solid ${statusColor}20;">
                                ${order.trackingNumber}
                            </div>
                        </div>
                    ` : ''}

                    <div class="section-title">📜 Order Summary</div>
                    <table class="tabular-box">
                        <thead>
                            <tr>
                                <th>Item Details</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${getOrderItemsHtml(order.items || [])}
                        </tbody>
                    </table>

                    <div class="tabular-box" style="padding: 20px; border: none; background: #f8fafc;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="font-weight: 800; color: #64748b; font-size: 12px; text-transform: uppercase;">Total Paid</td>
                                <td style="text-align: right; font-weight: 800; color: ${statusColor}; font-size: 22px;">₹${(order.total || 0).toFixed(0)}</td>
                            </tr>
                        </table>
                    </div>

                    ${getAddressHtml(order.address)}

                    <div style="text-align: center; margin-top: 40px;">
                        <a href="https://happy-hopz.vercel.app/orders/${order.id}" class="track-button" style="background: ${statusColor}; box-shadow: 0 10px 20px ${statusColor}30;">View Full Journey</a>
                    </div>
                </div>
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 30px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">© 2026 Happy Hopz Footwear • Premium Kids Collection</p>
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
