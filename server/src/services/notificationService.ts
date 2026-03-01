import { prisma } from '../lib/prisma';
import { sendOrderEmail, sendAdminOrderNotification, sendAdminAlertEmail, sendAdminStatusUpdateEmail } from '../utils/email';
import { sendWhatsAppNotification } from '../utils/whatsapp';
import { generateOrderPDF } from '../utils/pdfUtils';

export class NotificationService {
    /**
     * Notify Admin of a new order
     */
    static async notifyNewOrder(orderId: string, customerName: string, amount: number) {
        try {
            await prisma.notification.create({
                data: {
                    isAdmin: true,
                    title: 'New Order Received! 🛍️',
                    message: `Order #${orderId.slice(-8)} from ${customerName} for ₹${amount}`,
                    type: 'ORDER',
                    priority: 'HIGH',
                    metadata: JSON.stringify({ orderId })
                }
            });
        } catch (error) {
            console.error('Failed to create admin notification:', error);
        }
    }

    /**
     * Notify Customer when order is placed
     */
    static async notifyOrderPlaced(fullOrder: any) {
        const orderId = fullOrder.orderId || fullOrder.id;
        const email = fullOrder.user?.email || fullOrder.guestEmail;
        const phone = fullOrder.user?.phone || fullOrder.guestPhone || fullOrder.address?.phone;

        // 1. Generate PDF
        let pdfBuffer: Buffer | null = null;
        try {
            pdfBuffer = await generateOrderPDF(fullOrder);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
        }

        // 2. Send Email
        if (email) {
            try {
                await sendOrderEmail(email, fullOrder, 'CONFIRMATION', pdfBuffer ? {
                    content: pdfBuffer,
                    filename: `HappyHopz_Receipt_${orderId}.pdf`
                } : undefined);
                await this.logNotification(fullOrder.id, 'email', 'order_created', 'success');
                await prisma.order.update({
                    where: { id: fullOrder.id },
                    data: { emailSent: true }
                });
            } catch (error: any) {
                await this.logNotification(fullOrder.id, 'email', 'order_created', 'failed', error.message);
            }
        }

        // 3. Send WhatsApp
        if (phone) {
            try {
                const params = [
                    fullOrder.address?.name || 'Customer',
                    orderId,
                    `₹${fullOrder.total}`,
                    `https://www.happyhopz.com/orders/${fullOrder.id}`
                ];
                await sendWhatsAppNotification(phone, 'hhz_order_confirmation', params);
                await this.logNotification(fullOrder.id, 'whatsapp', 'order_created', 'success');
                await prisma.order.update({
                    where: { id: fullOrder.id },
                    data: { whatsappSent: true }
                });
            } catch (error: any) {
                await this.logNotification(fullOrder.id, 'whatsapp', 'order_created', 'failed', error.message);
            }
        }

        // 4. Notify Admin via Email
        try {
            await sendAdminOrderNotification(fullOrder);
        } catch (error) {
            console.error('Failed to send admin order notification email:', error);
        }
    }

    /**
     * Notify Customer of status update
     */
    static async notifyStatusUpdate(fullOrder: any) {
        const orderId = fullOrder.orderId || fullOrder.id;
        const email = fullOrder.user?.email || fullOrder.guestEmail;
        const phone = fullOrder.user?.phone || fullOrder.guestPhone || fullOrder.address?.phone;

        // 1. Send Customer Email
        if (email) {
            try {
                await sendOrderEmail(email, fullOrder, 'STATUS_UPDATE');
                await this.logNotification(fullOrder.id, 'email', 'status_updated', 'success');
            } catch (error: any) {
                await this.logNotification(fullOrder.id, 'email', 'status_updated', 'failed', error.message);
            }
        }

        // 1b. Send Admin Status Update Email (separate admin-specific format)
        try {
            await sendAdminStatusUpdateEmail(fullOrder);
            console.log(`✅ Admin status update email sent for order ${orderId}`);
        } catch (error: any) {
            console.error(`⚠️ Failed to send admin status update email for ${orderId}:`, error.message);
        }

        // 2. Send WhatsApp
        if (phone) {
            try {
                let template = 'hhz_order_confirmation';
                let params: string[] = [
                    fullOrder.address?.name || 'Customer',
                    orderId,
                    `₹${fullOrder.total}`,
                    `https://www.happyhopz.com/orders/${fullOrder.id}`
                ];

                if (fullOrder.status === 'SHIPPED') {
                    template = 'hhz_order_shipped';
                    params = [
                        orderId,
                        fullOrder.trackingNumber || 'N/A',
                        fullOrder.courierPartner || 'Standard',
                        `https://www.happyhopz.com/orders/${fullOrder.id}`
                    ];
                } else if (fullOrder.status === 'OUT_FOR_DELIVERY') {
                    template = 'hhz_out_for_delivery';
                    params = [
                        orderId,
                        fullOrder.address?.name || 'Customer',
                        `https://www.happyhopz.com/orders/${fullOrder.id}`
                    ];
                } else if (fullOrder.status === 'DELIVERED') {
                    template = 'hhz_order_delivered';
                    params = [
                        fullOrder.address?.name || 'Customer',
                        orderId,
                        `https://www.happyhopz.com/orders/${fullOrder.id}`
                    ];
                } else if (fullOrder.status === 'CANCELLED' || fullOrder.status === 'REFUNDED') {
                    template = 'hhz_order_cancelled';
                    params = [
                        orderId,
                        fullOrder.status === 'REFUNDED' ? 'processed and refunded' : 'cancelled as per request',
                        `https://www.happyhopz.com/orders/${fullOrder.id}`
                    ];
                }

                await sendWhatsAppNotification(phone, template, params);
                await this.logNotification(fullOrder.id, 'whatsapp', 'status_updated', 'success');
            } catch (error: any) {
                await this.logNotification(fullOrder.id, 'whatsapp', 'status_updated', 'failed', error.message);
                console.error(`🔴 WhatsApp failed for ${orderId}:`, error.message);
            }
        }
    }

    static async logNotification(orderId: string, type: string, triggerType: string, status: string, error?: string) {
        try {
            await (prisma as any).notificationLog.create({
                data: {
                    orderId,
                    type,
                    triggerType,
                    status,
                    errorMessage: error || null
                }
            });
        } catch (e) {
            console.error('Failed to log notification:', e);
        }
    }

    static async notifyOrderCancelled(orderId: string, reason: string) {
        try {
            await prisma.notification.create({
                data: {
                    isAdmin: true,
                    title: 'Order Cancelled ⚠️',
                    message: `Order #${orderId.slice(-8)} was cancelled. Reason: ${reason}`,
                    type: 'SYSTEM',
                    priority: 'HIGH',
                    metadata: JSON.stringify({ orderId, reason })
                }
            });
        } catch (error) {
            console.error('Failed to create cancellation notification:', error);
        }
    }

    static async notifyNewQuery(name: string, subject: string, message: string) {
        try {
            await prisma.notification.create({
                data: {
                    isAdmin: true,
                    title: 'New Customer Query 📩',
                    message: `New message from ${name}: "${subject}"`,
                    type: 'QUERY',
                    priority: 'NORMAL',
                    metadata: JSON.stringify({ name, subject, message })
                }
            });
        } catch (error) {
            console.error('Failed to create query notification:', error);
        }

        // Also notify admin via email for queries
        try {
            await sendAdminAlertEmail(`New Query: ${subject}`, `Message from ${name}: ${message}`);
        } catch (error) {
            console.error('Failed to send admin query email:', error);
        }
    }

    /**
     * Generic create method for backward compatibility
     */
    static async create(data: any) {
        try {
            return await prisma.notification.create({
                data: {
                    ...data,
                    metadata: typeof data.metadata === 'object' ? JSON.stringify(data.metadata) : data.metadata
                }
            });
        } catch (error) {
            console.error('Failed to manually create notification:', error);
        }
    }

    /**
     * Notify Admin of security events (Login, Signup, etc.)
     */
    static async notifySecurityEvent(title: string, message: string, userId: string, metadata?: any) {
        try {
            await prisma.notification.create({
                data: {
                    isAdmin: true,
                    title: `Security: ${title}`,
                    message,
                    type: 'SECURITY',
                    priority: 'MEDIUM',
                    metadata: JSON.stringify({ userId, ...metadata })
                }
            });
        } catch (error) {
            console.error('Failed to create security notification:', error);
        }

        // Also send Alert Email for security events
        try {
            await sendAdminAlertEmail(`Security: ${title}`, message);
        } catch (error) {
            console.error('Failed to send admin security alert email:', error);
        }
    }
}
