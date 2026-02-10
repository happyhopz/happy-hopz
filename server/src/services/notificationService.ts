import { prisma } from '../lib/prisma';
import { sendAdminAlertEmail } from '../utils/email';
import { sendAdminWhatsApp } from '../utils/whatsapp';

export type NotificationType = 'ORDER' | 'SECURITY' | 'SYSTEM' | 'PAYMENT' | 'ORDER_STATUS' | 'QUERY';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH';

interface CreateNotificationParams {
    userId?: string;
    isAdmin?: boolean;
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    metadata?: Record<string, any>;
}

export class NotificationService {
    /**
     * Create a new notification.
     * If userId is provided, it's a targeted notification.
     * If isAdmin is true and userId is null, it's a broadcast to all admins.
     */
    static async create({
        userId,
        isAdmin = false,
        title,
        message,
        type,
        priority = 'NORMAL',
        metadata
    }: CreateNotificationParams) {
        try {
            const notification = await prisma.notification.create({
                data: {
                    userId: userId || null,
                    isAdmin,
                    title,
                    message,
                    type,
                    priority,
                    metadata: metadata ? JSON.stringify(metadata) : null,
                    isRead: false
                }
            });

            // Trigger Email for High/Normal Priority Admin Notifications - RESTRICTED TO ORDERS ONLY
            if (isAdmin && (priority === 'HIGH' || priority === 'NORMAL') && type === 'ORDER') {
                // Don't await email to avoid blocking response
                sendAdminAlertEmail(title, message, metadata).catch(err =>
                    console.error('Failed to send admin alert email from service:', err)
                );

                // Trigger WhatsApp Notification
                sendAdminWhatsApp(`${title}\n${message}`).catch(err =>
                    console.error('Failed to send WhatsApp alert from service:', err)
                );
            }

            return notification;
        } catch (error) {
            console.error('Failed to create notification:', error);
            return null;
        }
    }

    /**
     * Create an admin notification for a new order.
     */
    static async notifyNewOrder(orderId: string, customerName: string, amount: number) {
        return this.create({
            isAdmin: true,
            title: 'New Order Received! 🛍️',
            message: `Order #${orderId.slice(0, 8)} placed by ${customerName} for ₹${amount.toFixed(2)}.`,
            type: 'ORDER',
            priority: 'HIGH',
            metadata: { orderId }
        });
    }

    /**
     * Create an admin notification for an order cancellation.
     */
    static async notifyOrderCancelled(orderId: string, reason: string) {
        return this.create({
            isAdmin: true,
            title: 'Order Cancelled ❌',
            message: `Order #${orderId.slice(0, 8)} has been cancelled. Reason: ${reason}`,
            type: 'ORDER',
            priority: 'HIGH',
            metadata: { orderId }
        });
    }

    /**
     * Create an admin notification for a security event (e.g., login).
     */
    static async notifySecurityEvent(title: string, message: string, userId: string, details?: any) {
        return this.create({
            isAdmin: true,
            title,
            message,
            type: 'SECURITY',
            priority: 'NORMAL',
            metadata: { userId, ...details }
        });
    }

    /**
     * Create an admin notification for a new contact form submission.
     */
    static async notifyNewQuery(name: string, subject: string, message: string) {
        return this.create({
            isAdmin: true,
            title: 'New Customer Query 📩',
            message: `New message from ${name}: "${subject}"`,
            type: 'QUERY',
            priority: 'NORMAL',
            metadata: { name, subject, message }
        });
    }

    /**
     * Create a notification for a user about their order status.
     */
    static async notifyUserOrderStatus(userId: string, orderId: string, status: string) {
        return this.create({
            userId,
            title: `Order Update: ${status}`,
            message: `Your order #${orderId.slice(0, 8)} is now ${status.toLowerCase()}.`,
            type: 'ORDER_STATUS',
            priority: 'NORMAL',
            metadata: { orderId, status }
        });
    }
}
