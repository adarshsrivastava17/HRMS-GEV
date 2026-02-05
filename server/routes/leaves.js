// Leave Request Routes
import express from 'express';
import { verifyToken, requireManagement } from '../middleware/auth.js';

const router = express.Router();

// Get my leave requests
router.get('/my', verifyToken, async (req, res) => {
    try {
        const leaves = await req.prisma.leaveRequest.findMany({
            where: { userId: req.user.id },
            include: {
                approver: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(leaves);
    } catch (error) {
        console.error('Get my leaves error:', error);
        res.status(500).json({ error: 'Failed to fetch leave requests' });
    }
});

// Get all leave requests (for management)
router.get('/', verifyToken, requireManagement, async (req, res) => {
    try {
        const { status, userId, page = 1, limit = 20 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (userId) where.userId = userId;

        // Manager can see all employees' leave requests
        if (req.user.role === 'manager') {
            const teamMembers = await req.prisma.user.findMany({
                where: { role: 'employee' },
                select: { id: true }
            });
            where.userId = { in: teamMembers.map(m => m.id) };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [leaves, total] = await Promise.all([
            req.prisma.leaveRequest.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true, position: true, department: true } },
                    approver: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            req.prisma.leaveRequest.count({ where })
        ]);

        res.json({
            leaves,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get all leaves error:', error);
        res.status(500).json({ error: 'Failed to fetch leave requests' });
    }
});

// Submit leave request
router.post('/', verifyToken, async (req, res) => {
    try {
        const { type, startDate, endDate, reason } = req.body;

        if (!type || !startDate || !endDate || !reason) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const leave = await req.prisma.leaveRequest.create({
            data: {
                userId: req.user.id,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason
            },
            include: {
                user: { select: { id: true, name: true } }
            }
        });

        res.status(201).json(leave);
    } catch (error) {
        console.error('Create leave request error:', error);
        res.status(500).json({ error: 'Failed to submit leave request' });
    }
});

// Approve/Reject leave request
router.put('/:id/status', verifyToken, requireManagement, async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const leave = await req.prisma.leaveRequest.update({
            where: { id: req.params.id },
            data: {
                status,
                approvedBy: req.user.id
            },
            include: {
                user: { select: { id: true, name: true } },
                approver: { select: { id: true, name: true } }
            }
        });

        res.json(leave);
    } catch (error) {
        console.error('Update leave status error:', error);
        res.status(500).json({ error: 'Failed to update leave request' });
    }
});

// Delete leave request (only if pending)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const leave = await req.prisma.leaveRequest.findUnique({
            where: { id: req.params.id }
        });

        if (!leave) {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        // Only allow deletion of own pending requests
        if (leave.userId !== req.user.id && !['admin', 'hr'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({ error: 'Can only delete pending requests' });
        }

        await req.prisma.leaveRequest.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Leave request deleted' });
    } catch (error) {
        console.error('Delete leave request error:', error);
        res.status(500).json({ error: 'Failed to delete leave request' });
    }
});

export default router;
