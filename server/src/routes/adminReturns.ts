import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Deployment heartbeat: triggering fresh build after type fixes

// GET /api/admin/returns - Get all return requests with filters
router.get('/', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { status, type, page = '1', limit = '20', search } = req.query;

        const where: any = {};

        if (status) where.status = status;
        if (type) where.type = type;

        if (search) {
            where.OR = [
                { orderId: { contains: search as string } },
                { user: { email: { contains: search as string } } },
                { user: { name: { contains: search as string } } }
            ];
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [returnRequests, total] = await Promise.all([
            prisma.returnRequest.findMany({
                where,
                include: {
                    items: true,
                    order: {
                        select: {
                            id: true,
                            total: true,
                            createdAt: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            phone: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.returnRequest.count({ where })
        ]);

        res.json({
            returnRequests,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error: any) {
        console.error('[Admin Returns List Error]:', error);
        res.status(500).json({ error: 'Failed to fetch return requests' });
    }
});

// GET /api/admin/returns/:id - Get return request details
router.get('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id: id as string },
            include: {
                items: true,
                order: {
                    include: {
                        items: true,
                        address: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true
                    }
                }
            }
        });

        if (!returnRequest) {
            return res.status(404).json({ error: 'Return request not found' });
        }

        res.json(returnRequest);

    } catch (error: any) {
        console.error('[Admin Return Detail Error]:', error);
        res.status(500).json({ error: 'Failed to fetch return request' });
    }
});

// PATCH /api/admin/returns/:id/approve - Approve return request
router.patch('/:id/approve', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { pickupScheduled, adminNotes } = req.body;
        const adminId = req.user!.id;

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id: id as string },
            include: { items: true }
        });

        if (!returnRequest) {
            return res.status(404).json({ error: 'Return request not found' });
        }

        if (returnRequest.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only pending requests can be approved' });
        }

        const updated = await prisma.returnRequest.update({
            where: { id: id as string },
            data: {
                status: 'APPROVED',
                pickupScheduled: pickupScheduled ? new Date(pickupScheduled) : null,
                adminNotes,
                processedBy: adminId,
                processedAt: new Date()
            },
            include: {
                items: true,
                user: true,
                order: true
            }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'APPROVE_RETURN',
                entity: 'ReturnRequest',
                entityId: id as string,
                details: `Approved ${returnRequest.type} request for order ${returnRequest.orderId}`,
                adminId
            }
        });

        res.json({ success: true, returnRequest: updated });

    } catch (error: any) {
        console.error('[Admin Approve Return Error]:', error);
        res.status(500).json({ error: 'Failed to approve return request' });
    }
});

// PATCH /api/admin/returns/:id/reject - Reject return request
router.patch('/:id/reject', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { reason, adminNotes } = req.body;
        const adminId = req.user!.id;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id: id as string }
        });

        if (!returnRequest) {
            return res.status(404).json({ error: 'Return request not found' });
        }

        if (returnRequest.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only pending requests can be rejected' });
        }

        const updated = await prisma.returnRequest.update({
            where: { id: id as string },
            data: {
                status: 'REJECTED',
                adminNotes: `Rejection reason: ${reason}${adminNotes ? `\n${adminNotes}` : ''}`,
                processedBy: adminId,
                processedAt: new Date()
            },
            include: {
                items: true,
                user: true
            }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'REJECT_RETURN',
                entity: 'ReturnRequest',
                entityId: id as string,
                details: `Rejected ${returnRequest.type} request. Reason: ${reason}`,
                adminId
            }
        });

        res.json({ success: true, returnRequest: updated });

    } catch (error: any) {
        console.error('[Admin Reject Return Error]:', error);
        res.status(500).json({ error: 'Failed to reject return request' });
    }
});

// PATCH /api/admin/returns/:id/complete - Mark return as completed
router.patch('/:id/complete', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { refundMethod, trackingNumber, adminNotes, restockItems = true } = req.body;
        const adminId = req.user!.id;

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id: id as string },
            include: { items: true, order: true }
        });

        if (!returnRequest) {
            return res.status(404).json({ error: 'Return request not found' });
        }

        if (returnRequest.status !== 'APPROVED') {
            return res.status(400).json({ error: 'Only approved requests can be completed' });
        }

        // Restore stock if requested
        if (restockItems) {
            for (const item of (returnRequest as any).items) {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity
                        }
                    }
                });
            }
        }

        const updated = await prisma.returnRequest.update({
            where: { id: id as string },
            data: {
                status: 'COMPLETED',
                refundMethod: refundMethod || returnRequest.refundMethod,
                refundStatus: 'PROCESSED',
                trackingNumber,
                adminNotes: adminNotes ? `${returnRequest.adminNotes || ''}\n${adminNotes}` : returnRequest.adminNotes,
                processedAt: new Date()
            },
            include: {
                items: true,
                user: true
            }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'COMPLETE_RETURN',
                entity: 'ReturnRequest',
                entityId: id as string,
                details: `Completed ${returnRequest.type} request. Refund: ₹${returnRequest.refundAmount}. Stock restored: ${restockItems}`,
                adminId
            }
        });

        res.json({ success: true, returnRequest: updated });

    } catch (error: any) {
        console.error('[Admin Complete Return Error]:', error);
        res.status(500).json({ error: 'Failed to complete return request' });
    }
});

// GET /api/admin/returns/stats - Get return statistics
router.get('/stats/summary', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [
            totalReturns,
            pendingReturns,
            approvedReturns,
            completedReturns,
            rejectedReturns,
            totalRefundAmount
        ] = await Promise.all([
            prisma.returnRequest.count(),
            prisma.returnRequest.count({ where: { status: 'PENDING' } }),
            prisma.returnRequest.count({ where: { status: 'APPROVED' } }),
            prisma.returnRequest.count({ where: { status: 'COMPLETED' } }),
            prisma.returnRequest.count({ where: { status: 'REJECTED' } }),
            prisma.returnRequest.aggregate({
                where: { status: 'COMPLETED', type: 'RETURN' },
                _sum: { refundAmount: true }
            })
        ]);

        res.json({
            totalReturns,
            pendingReturns,
            approvedReturns,
            completedReturns,
            rejectedReturns,
            totalRefundAmount: totalRefundAmount._sum.refundAmount || 0
        });

    } catch (error: any) {
        console.error('[Admin Return Stats Error]:', error);
        res.status(500).json({ error: 'Failed to fetch return statistics' });
    }
});

export default router;
