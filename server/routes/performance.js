// Performance Review Routes
import express from 'express';
import { verifyToken, requireManagement } from '../middleware/auth.js';

const router = express.Router();

// Get my performance reviews
router.get('/my', verifyToken, async (req, res) => {
    try {
        const reviews = await req.prisma.performance.findMany({
            where: { userId: req.user.id },
            include: {
                reviewer: { select: { id: true, name: true, position: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(reviews);
    } catch (error) {
        console.error('Get my performance error:', error);
        res.status(500).json({ error: 'Failed to fetch performance reviews' });
    }
});

// Get all performance reviews (management)
router.get('/', verifyToken, requireManagement, async (req, res) => {
    try {
        const { userId, period, page = 1, limit = 20 } = req.query;

        const where = {};
        if (userId) where.userId = userId;
        if (period) where.period = period;

        // Manager can see all employees
        if (req.user.role === 'manager') {
            const teamMembers = await req.prisma.user.findMany({
                where: { role: 'employee' },
                select: { id: true }
            });
            where.userId = { in: teamMembers.map(m => m.id) };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [reviews, total] = await Promise.all([
            req.prisma.performance.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true, position: true, department: true } },
                    reviewer: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            req.prisma.performance.count({ where })
        ]);

        res.json({
            reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get all performance error:', error);
        res.status(500).json({ error: 'Failed to fetch performance reviews' });
    }
});

// Create performance review
router.post('/', verifyToken, requireManagement, async (req, res) => {
    try {
        const { userId, period, rating, goals, achievements, feedback } = req.body;

        if (!userId || !period || !rating) {
            return res.status(400).json({ error: 'User ID, period, and rating are required' });
        }

        const review = await req.prisma.performance.create({
            data: {
                userId,
                reviewerId: req.user.id,
                period,
                rating: parseInt(rating),
                goals,
                achievements,
                feedback
            },
            include: {
                user: { select: { id: true, name: true } },
                reviewer: { select: { id: true, name: true } }
            }
        });

        res.status(201).json(review);
    } catch (error) {
        console.error('Create performance error:', error);
        res.status(500).json({ error: 'Failed to create performance review' });
    }
});

// Update performance review
router.put('/:id', verifyToken, requireManagement, async (req, res) => {
    try {
        const { rating, goals, achievements, feedback } = req.body;

        const review = await req.prisma.performance.update({
            where: { id: req.params.id },
            data: {
                rating: rating ? parseInt(rating) : undefined,
                goals,
                achievements,
                feedback
            },
            include: {
                user: { select: { id: true, name: true } },
                reviewer: { select: { id: true, name: true } }
            }
        });

        res.json(review);
    } catch (error) {
        console.error('Update performance error:', error);
        res.status(500).json({ error: 'Failed to update performance review' });
    }
});

// Delete performance review
router.delete('/:id', verifyToken, requireManagement, async (req, res) => {
    try {
        await req.prisma.performance.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Performance review deleted' });
    } catch (error) {
        console.error('Delete performance error:', error);
        res.status(500).json({ error: 'Failed to delete performance review' });
    }
});

export default router;
