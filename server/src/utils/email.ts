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
const SITE_URL = (process.env.CLIENT_URL || 'https://www.happyhopz.com').replace(/\/$/, '');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || VERIFIED_SENDER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendOrderEmail = async (email: string, order: any, type: 'CONFIRMATION' | 'STATUS_UPDATE', attachment?: { content: Buffer, filename: string }) => {
    if (!process.env.SENDGRID_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
        console.log(`📠 ORDER EMAIL LOGGED FOR ${email} (Order #${order.orderId || order.id}) - No email provider configured`);
        return;
    }

    const customerName = order.user?.name || order.address?.name || 'Customer';
    const orderId = order.orderId || order.id;

    let subject = '';
    let bodyHtml = '';

    if (type === 'CONFIRMATION') {
        subject = `🎉 Order Confirmed – Happy Hopz (${orderId})`;
        order._inlineAttachments = [];
        bodyHtml = getOrderConfirmationHtml(order, customerName);
    } else {
        subject = getStatusSubject(order.status, orderId);
        order._inlineAttachments = [];
        bodyHtml = getStatusUpdateHtml(order, customerName);
    }

    try {
        if (process.env.SENDGRID_API_KEY) {
            // SendGrid format: attachments need base64 content
            const sgAttachments: any[] = [];
            if (attachment) {
                sgAttachments.push({
                    filename: attachment.filename,
                    content: attachment.content.toString('base64'),
                    type: 'application/pdf',
                    disposition: 'attachment'
                });
            }
            // Convert inline attachments (CID images) to SendGrid format
            for (const att of (order._inlineAttachments || [])) {
                sgAttachments.push({
                    ...att,
                    content: typeof att.content === 'string' ? att.content : att.content?.toString?.('base64') || att.content
                });
            }

            const sgMsg = {
                from: { email: VERIFIED_SENDER, name: 'Happy Hopz' },
                to: email,
                subject: subject,
                html: bodyHtml,
                attachments: sgAttachments.length > 0 ? sgAttachments : undefined
            };
            console.log(`📧 [SendGrid] Sending ${type} email to ${email} for order ${orderId}`);
            await sgMail.send(sgMsg);
            console.log(`✅ [SendGrid] Email sent successfully to ${email}`);
            return;
        }

        // Nodemailer fallback
        const allAttachments = attachment ? [
            {
                filename: attachment.filename,
                content: attachment.content,
                contentType: 'application/pdf'
            }
        ] : [];

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
            attachments: [...allAttachments, ...(order._inlineAttachments || [])]
        };

        console.log(`📧 [Nodemailer] Sending ${type} email to ${email} for order ${orderId}`);
        await transporter.sendMail(mailOptions);
        console.log(`✅ [Nodemailer] Email sent successfully to ${email}`);
    } catch (error: any) {
        console.error(`🔴 [Email Error] Failed to send ${type} email to ${email} for order ${orderId}:`, error.message);
        if (error.response?.body) {
            console.error(`🔴 [Email Error] SendGrid response:`, JSON.stringify(error.response.body));
        }
        throw error; // Re-throw so callers can handle it
    }
};

export const sendOrderConfirmationEmail = async (email: string, order: any) => {
    return sendOrderEmail(email, order, 'CONFIRMATION');
};

export const sendVerificationEmail = async (email: string, code: string) => {
    try {
        if (process.env.SENDGRID_API_KEY) {
            console.log(`📧 [SendGrid] Sending verification email to ${email}`);
            await sgMail.send({
                from: { email: VERIFIED_SENDER, name: 'Happy Hopz' },
                to: email,
                subject: 'Verify your Happy Hopz Account',
                html: `<h2>Welcome to Happy Hopz!</h2><p>Your verification code is: <strong>${code}</strong></p>`
            });
            console.log(`✅ [SendGrid] Verification email sent to ${email}`);
            return;
        }
        console.log(`📧 [Nodemailer] Sending verification email to ${email}`);
        await transporter.sendMail({
            from: `"Happy Hopz" <${VERIFIED_SENDER}>`,
            to: email,
            subject: 'Verify your Happy Hopz Account',
            html: `<h2>Welcome to Happy Hopz!</h2><p>Your verification code is: <strong>${code}</strong></p>`
        });
        console.log(`✅ [Nodemailer] Verification email sent to ${email}`);
    } catch (error: any) {
        console.error(`🔴 [Verification Email Error] Failed to send to ${email}:`, error.message);
        if (error.response?.body) console.error('SendGrid response:', JSON.stringify(error.response.body));
        throw error;
    }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetUrl = `https://happy-hopz.vercel.app/reset-password?token=${token}`;
    try {
        if (process.env.SENDGRID_API_KEY) {
            console.log(`📧 [SendGrid] Sending password reset email to ${email}`);
            await sgMail.send({
                from: { email: VERIFIED_SENDER, name: 'Happy Hopz' },
                to: email,
                subject: 'Reset your Happy Hopz Password',
                html: `<p>You requested a password reset. Click below to proceed:</p><a href="${resetUrl}">Reset Password</a>`
            });
            console.log(`✅ [SendGrid] Password reset email sent to ${email}`);
            return;
        }
        console.log(`📧 [Nodemailer] Sending password reset email to ${email}`);
        await transporter.sendMail({
            from: `"Happy Hopz" <${VERIFIED_SENDER}>`,
            to: email,
            subject: 'Reset your Happy Hopz Password',
            html: `<p>You requested a password reset. Click below to proceed:</p><a href="${resetUrl}">Reset Password</a>`
        });
        console.log(`✅ [Nodemailer] Password reset email sent to ${email}`);
    } catch (error: any) {
        console.error(`🔴 [Password Reset Email Error] Failed to send to ${email}:`, error.message);
        if (error.response?.body) console.error('SendGrid response:', JSON.stringify(error.response.body));
        throw error;
    }
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
            border-bottom: 2px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
        }
        .tabular-box th:last-child { border-right: none; }
        .tabular-box td {
            padding: 15px;
            border-bottom: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
            vertical-align: middle;
        }
        .tabular-box td:last-child { border-right: none; }
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

const getOrderItemsHtml = (items: any[], attachments: any[] = []) => items.map((item, index) => {
    let imageUrl = '';
    const cid = `product_image_${index}`;

    try {
        if (item.product && item.product.images) {
            const imgs = typeof item.product.images === 'string'
                ? JSON.parse(item.product.images)
                : item.product.images;
            imageUrl = Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : '';

            // Handle Base64 images with CID for reliable email rendering
            if (imageUrl && imageUrl.startsWith('data:image')) {
                const parts = imageUrl.split(';base64,');
                const contentType = parts[0].split(':')[1];
                const base64Data = parts[1];

                attachments.push({
                    cid: cid,
                    content: base64Data,
                    encoding: 'base64',
                    filename: `item-${index}.jpg`,
                    type: contentType,
                    disposition: 'inline'
                });
                imageUrl = `cid:${cid}`;
            } else if (imageUrl && !imageUrl.startsWith('http')) {
                // Resolve relative URLs (Avoid prepending to absolute URLs)
                const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
                imageUrl = `${SITE_URL}${cleanPath}`;
            }
        }
    } catch (e) {
        console.error('Error parsing item images for email:', e);
    }

    const itemName = item.name || item.product?.name || 'Product';

    return `
    <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; vertical-align: middle;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <tr>
                    ${imageUrl ? `
                    <td style="width: 60px; padding-right: 15px; vertical-align: middle;">
                        <div style="width: 60px; height: 75px; overflow: hidden; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
                            <img src="${imageUrl}" width="60" border="0" style="display: block; width: 60px; object-fit: cover;" alt="${itemName}">
                        </div>
                    </td>
                    ` : ''}
                    <td style="vertical-align: middle;">
                        <p style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 800; color: #1e293b; text-transform: uppercase;">${itemName}</p>
                        <p style="margin: 4px 0 0 0; font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase;">SIZE ${item.size} • ${String(item.color).toUpperCase()}</p>
                    </td>
                </tr>
            </table>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; text-align: center; font-family: 'Outfit', sans-serif; font-weight: 700; color: #64748b;">x${item.quantity}</td>
        <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: 'Outfit', sans-serif; font-weight: 800; color: #1e293b;">₹${(item.price * item.quantity).toFixed(0)}</td>
    </tr>
`;
}).join('');

const getAddressHtml = (address: any) => `
    <div style="background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; margin-top: 30px; font-family: 'Outfit', sans-serif;">
        <div style="font-weight: 800; text-transform: uppercase; font-size: 11px; color: #64748b; letter-spacing: 1px; margin-bottom: 15px;">📍 Delivery Address</div>
        <p style="margin: 0; font-weight: 800; color: #0f172a; font-size: 15px; font-family: 'Outfit', sans-serif;">${address?.name}</p>
        <p style="margin: 8px 0; font-size: 13px; color: #475569; line-height: 1.6; font-weight: 500; font-family: 'Outfit', sans-serif;">
            ${address?.line1}, ${address?.line2 ? address.line2 + ', ' : ''}<br>
            ${address?.city}, ${address?.state} - ${address?.pincode}
        </p>
        <p style="margin-top: 12px; font-size: 13px; font-weight: 800; color: #0f172a; font-family: 'Outfit', sans-serif;">📞 ${address?.phone}</p>
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
        <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #ffffff; color: #1e293b;">
            <div style="border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); background: #ffffff;">
                <div style="text-align: center; padding: 40px 20px; background: #fff5f5; border-bottom: 2px solid #fff1f2;">
                    <h2 style="color: #e11d48; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px; font-family: 'Outfit', sans-serif;">Order Confirmed! 🎊</h2>
                    <div style="display: inline-block; background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; margin-top: 10px; text-transform: uppercase;">${order.orderId || order.id}</div>
                </div>
                
                <div style="padding: 40px 30px;">
                    <p style="margin-top: 0; font-size: 16px; line-height: 1.6; font-family: 'Outfit', sans-serif;">Hi <strong style="color: #e11d48;">${name}</strong>,</p>
                    <p style="color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">Great choice! Your order is being processed and will be shipped soon. We're excited to get these to you!</p>
                    

                    ${getExpectedDeliveryHtml(order)}

                    <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 30px 0 15px 0; text-transform: uppercase; letter-spacing: 2px; font-family: 'Outfit', sans-serif;">📦 Order Summary</div>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin: 15px 0; table-layout: fixed;">
                        <thead>
                            <tr>
                                <th style="background: #f8fafc; text-align: left; padding: 12px 15px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-family: 'Outfit', sans-serif;">Item Details</th>
                                <th style="background: #f8fafc; text-align: center; padding: 12px 15px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-family: 'Outfit', sans-serif; width: 50px;">Qty</th>
                                <th style="background: #f8fafc; text-align: right; padding: 12px 15px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; font-family: 'Outfit', sans-serif; width: 80px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${getOrderItemsHtml(order.items || [], order._inlineAttachments)}
                        </tbody>
                    </table>

                    <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; background: #ffffff; margin-top: 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-family: 'Outfit', sans-serif;">
                            <tr>
                                <td style="padding: 6px 0; font-size: 14px; color: #475569;">Bag Total</td>
                                <td style="text-align: right; padding: 6px 0; font-size: 14px; color: #475569;">₹${(order.subtotal || 0).toFixed(0)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-size: 14px; color: #475569;">GST (${order.tax ? 'Applied' : 'Dynamic'})</td>
                                <td style="text-align: right; padding: 6px 0; font-size: 14px; color: #475569;">₹${(order.tax || 0).toFixed(0)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-size: 14px; color: #475569;">Delivery</td>
                                <td style="text-align: right; padding: 6px 0; font-size: 14px; color: ${order.shipping === 0 ? '#10b981' : '#475569'}; font-weight: strong;">
                                    ${order.shipping === 0 ? 'FREE' : '₹' + (order.shipping || 0).toFixed(0)}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 15px; font-weight: 800; color: #0f172a; border-top: 1px solid #f1f5f9;">Order Total</td>
                                <td style="text-align: right; padding-top: 15px; font-weight: 800; color: #e11d48; font-size: 24px; border-top: 1px solid #f1f5f9;">₹${(order.total || 0).toFixed(0)}</td>
                            </tr>
                        </table>
                    </div>

                    ${getAddressHtml(order.address)}

                    <div style="text-align: center; margin-top: 40px;">
                        <a href="https://happy-hopz.vercel.app/orders/${order.id}" style="display: inline-block; background: #e11d48; color: #ffffff !important; padding: 18px 35px; text-decoration: none; border-radius: 40px; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; font-family: 'Outfit', sans-serif;">Track Order Journey</a>
                    </div>
                </div>
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 30px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-family: 'Outfit', sans-serif;">© 2026 Happy Hopz Footwear • Made with ❤️ for little feet</p>
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
        <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #ffffff; color: #1e293b;">
            <div style="border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); background: #ffffff;">
                <div style="text-align: center; padding: 50px 20px; background: ${statusColor}10; border-bottom: 2px solid ${statusColor}15;">
                    <span style="font-size: 48px;">${statusIcon}</span>
                    <h2 style="color: ${statusColor}; margin: 15px 0 5px 0; font-size: 32px; font-weight: 800; font-family: 'Outfit', sans-serif;">${statusTitle}</h2>
                    <div style="display: inline-block; background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; margin-top: 10px; text-transform: uppercase;">${order.orderId || order.id}</div>
                </div>

                <div style="padding: 40px 30px;">
                    <p style="margin-top: 0; font-size: 16px; line-height: 1.6; font-family: 'Outfit', sans-serif;">Hi <strong style="color: ${statusColor};">${name}</strong>,</p>
                    <p style="color: #475569; line-height: 1.6; font-size: 15px; font-family: 'Outfit', sans-serif;">${statusMessage}</p>

                    ${getExpectedDeliveryHtml(order)}

                    ${order.trackingNumber ? `
                        <div style="background: ${statusColor}08; padding: 25px; border-radius: 16px; margin: 30px 0; border: 1px dashed ${statusColor}40; text-align: center;">
                            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px;">Tracking Courier</p>
                            <p style="margin: 8px 0; font-weight: 800; font-size: 18px; color: #0f172a; font-family: 'Outfit', sans-serif;">${order.courierPartner || 'Delhivery'}</p>
                            <div style="background: #ffffff; display: inline-block; padding: 8px 15px; border-radius: 8px; font-family: monospace; font-size: 20px; color: ${statusColor}; font-weight: 800; border: 1px solid ${statusColor}20;">
                                ${order.trackingNumber}
                            </div>
                        </div>
                    ` : ''}

                    <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 30px 0 15px 0; text-transform: uppercase; letter-spacing: 2px; font-family: 'Outfit', sans-serif;">📜 Order Summary</div>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin: 15px 0;">
                        <thead>
                            <tr>
                                <th style="background: #f8fafc; text-align: left; padding: 12px 15px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-family: 'Outfit', sans-serif;">Item Details</th>
                                <th style="background: #f8fafc; text-align: center; padding: 12px 15px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-family: 'Outfit', sans-serif; width: 50px;">Qty</th>
                                <th style="background: #f8fafc; text-align: right; padding: 12px 15px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; font-family: 'Outfit', sans-serif; width: 80px;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${getOrderItemsHtml(order.items || [], order._inlineAttachments)}
                        </tbody>
                    </table>

                    <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; background: #f8fafc;">
                        <table style="width: 100%; font-family: 'Outfit', sans-serif;">
                            <tr>
                                <td style="font-weight: 800; color: #64748b; font-size: 12px; text-transform: uppercase;">Total Paid</td>
                                <td style="text-align: right; font-weight: 800; color: ${statusColor}; font-size: 22px;">₹${(order.total || 0).toFixed(0)}</td>
                            </tr>
                        </table>
                    </div>

                    ${getAddressHtml(order.address)}

                    <div style="text-align: center; margin-top: 40px;">
                        <a href="https://happy-hopz.vercel.app/orders/${order.id}" style="display: inline-block; background: ${statusColor}; color: #ffffff !important; padding: 18px 35px; text-decoration: none; border-radius: 40px; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; box-shadow: 0 10px 20px ${statusColor}30;">View Full Journey</a>
                    </div>
                </div>
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 30px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-family: 'Outfit', sans-serif;">© 2026 Happy Hopz Footwear • Premium Kids Collection</p>
        </div>
    `;
};

export const sendAdminOrderNotification = async (order: any) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'happyhopz308@gmail.com';
    if (!process.env.SENDGRID_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) return;

    const customerName = order.user?.name || order.address?.name || 'Customer';
    const orderId = order.orderId || order.id;
    order._inlineAttachments = [];

    const bodyHtml = `
        ${getCommonStyles()}
        <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #ffffff; color: #1e293b;">
            <div style="border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); background: #ffffff;">
                <div style="text-align: center; padding: 40px 20px; background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                    <h2 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; font-family: 'Outfit', sans-serif;">New Order Received! 🛍️</h2>
                    <div style="display: inline-block; background: #e2e8f0; color: #475569; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; margin-top: 10px; text-transform: uppercase;">${orderId}</div>
                </div>
                
                <div style="padding: 40px 30px;">
                    <p style="margin-top: 0; font-size: 16px; line-height: 1.6; font-family: 'Outfit', sans-serif;">Hello Admin,</p>
                    <p style="color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">A new order has been placed by <strong style="color: #0f172a;">${customerName}</strong> (${order.user?.email || order.guestEmail || 'Guest'}).</p>
                    
                    <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 30px 0 15px 0; text-transform: uppercase; letter-spacing: 2px; font-family: 'Outfit', sans-serif;">📦 Order Details</div>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin: 15px 0; table-layout: fixed;">
                        <thead>
                            <tr>
                                <th style="background: #f8fafc; text-align: left; padding: 12px 15px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-family: 'Outfit', sans-serif;">Item Details</th>
                                <th style="background: #f8fafc; text-align: center; padding: 12px 15px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-family: 'Outfit', sans-serif; width: 50px;">Qty</th>
                                <th style="background: #f8fafc; text-align: right; padding: 12px 15px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; font-family: 'Outfit', sans-serif; width: 80px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${getOrderItemsHtml(order.items || [], order._inlineAttachments)}
                        </tbody>
                    </table>

                    <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; background: #ffffff; margin-top: 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-family: 'Outfit', sans-serif;">
                            <tr>
                                <td style="padding: 6px 0; font-size: 14px; color: #475569;">Subtotal</td>
                                <td style="text-align: right; padding: 6px 0; font-size: 14px; color: #475569;">₹${(order.subtotal || 0).toFixed(0)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-size: 14px; color: #475569;">Tax/GST</td>
                                <td style="text-align: right; padding: 6px 0; font-size: 14px; color: #475569;">₹${(order.tax || 0).toFixed(0)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-size: 14px; color: #475569;">Shipping</td>
                                <td style="text-align: right; padding: 6px 0; font-size: 14px; color: #475569;">₹${(order.shipping || 0).toFixed(0)}</td>
                            </tr>
                            <tr>
                                <td style="padding-top: 15px; font-weight: 800; color: #0f172a; border-top: 1px solid #f1f5f9;">Grand Total</td>
                                <td style="text-align: right; padding-top: 15px; font-weight: 800; color: #e11d48; font-size: 24px; border-top: 1px solid #f1f5f9;">₹${(order.total || 0).toFixed(0)}</td>
                            </tr>
                        </table>
                    </div>

                    ${getAddressHtml(order.address)}

                    <div style="text-align: center; margin-top: 40px;">
                        <a href="${SITE_URL}/admin/orders/${order.id}" style="display: inline-block; background: #0f172a; color: #ffffff !important; padding: 18px 35px; text-decoration: none; border-radius: 40px; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; font-family: 'Outfit', sans-serif;">View in Dashboard</a>
                    </div>
                </div>
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 30px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-family: 'Outfit', sans-serif;">HAPPY HOPZ ADMIN NOTIFICATION</p>
        </div>
    `;

    try {
        if (process.env.SENDGRID_API_KEY) {
            // Convert inline attachments to base64 for SendGrid
            const sgAttachments = (order._inlineAttachments || []).map((att: any) => ({
                ...att,
                content: typeof att.content === 'string' ? att.content : att.content?.toString?.('base64') || att.content
            }));

            const sgMsg = {
                from: { email: VERIFIED_SENDER, name: 'Happy Hopz Admin' },
                to: adminEmail,
                subject: `🛍️ NEW ORDER: ${orderId} - ₹${order.total} from ${customerName}`,
                html: bodyHtml,
                attachments: sgAttachments.length > 0 ? sgAttachments : undefined
            };
            console.log(`📧 [SendGrid] Sending admin notification for order ${orderId}`);
            await sgMail.send(sgMsg);
            console.log(`✅ [SendGrid] Admin notification sent successfully`);
            return;
        }

        const mailOptions: any = {
            from: `"Happy Hopz Admin" <${VERIFIED_SENDER}>`,
            to: adminEmail,
            subject: `🛍️ NEW ORDER: ${orderId} - ₹${order.total} from ${customerName}`,
            html: bodyHtml,
            headers: {
                'X-Priority': '1 (Highest)',
                'Importance': 'high'
            },
            attachments: order._inlineAttachments || []
        };

        console.log(`📧 [Nodemailer] Sending admin notification for order ${orderId}`);
        await transporter.sendMail(mailOptions);
        console.log(`✅ [Nodemailer] Admin notification sent successfully`);
    } catch (error: any) {
        console.error(`🔴 [Admin Email Error] Failed to send admin notification for order ${orderId}:`, error.message);
        if (error.response?.body) {
            console.error(`🔴 [Admin Email Error] SendGrid response:`, JSON.stringify(error.response.body));
        }
        throw error;
    }
};

export const sendAdminAlertEmail = async (title: string, message: string) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'happyhopz308@gmail.com';
    if (!process.env.SENDGRID_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) return;

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

    try {
        if (process.env.SENDGRID_API_KEY) {
            await sgMail.send({
                from: { email: VERIFIED_SENDER, name: 'Happy Hopz Alerts' },
                to: adminEmail,
                subject: `🔔 ALERT: ${title}`,
                html: `<p>${message}</p>`
            });
            return;
        }
        await transporter.sendMail(mailOptions);
    } catch (error: any) {
        console.error(`🔴 [Alert Email Error] Failed to send alert "${title}":`, error.message);
        throw error;
    }
};
