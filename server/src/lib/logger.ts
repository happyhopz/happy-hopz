import { prisma } from './prisma';

export const logActivity = async (data: {
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
    adminId?: string;
}) => {
    try {
        await (prisma as any).auditLog.create({
            data: {
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                details: data.details ? JSON.stringify(data.details) : null,
                adminId: data.adminId
            }
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};
