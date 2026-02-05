// Announcement Routes
import express from 'express';
import { verifyToken, requireManagement } from '../middleware/auth.js';

const router = express.Router();

// Get all active announcements
router.get('/', verifyToken, async (req, res) => {
    try {
        const { includeInactive } = req.query;

        const where = {};
        if (!includeInactive || includeInactive !== 'true') {
            where.isActive = true;
        }

        const announcements = await req.prisma.announcement.findMany({
            where,
            include: {
                author: { select: { id: true, name: true, position: true } }
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
        });

        res.json(announcements);
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

// Get single announcement
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const announcement = await req.prisma.announcement.findUnique({
            where: { id: req.params.id },
            include: {
                author: { select: { id: true, name: true, position: true } }
            }
        });

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        res.json(announcement);
    } catch (error) {
        console.error('Get announcement error:', error);
        res.status(500).json({ error: 'Failed to fetch announcement' });
    }
});

// Create announcement
router.post('/', verifyToken, requireManagement, async (req, res) => {
    try {
        const { title, content, priority } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const announcement = await req.prisma.announcement.create({
            data: {
                title,
                content,
                priority: priority || 'normal',
                authorId: req.user.id
            },
            include: {
                author: { select: { id: true, name: true } }
            }
        });

        res.status(201).json(announcement);
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

// Update announcement
router.put('/:id', verifyToken, requireManagement, async (req, res) => {
    try {
        const { title, content, priority, isActive } = req.body;

        const announcement = await req.prisma.announcement.update({
            where: { id: req.params.id },
            data: {
                title,
                content,
                priority,
                isActive
            },
            include: {
                author: { select: { id: true, name: true } }
            }
        });

        res.json(announcement);
    } catch (error) {
        console.error('Update announcement error:', error);
        res.status(500).json({ error: 'Failed to update announcement' });
    }
});

// Delete announcement
router.delete('/:id', verifyToken, requireManagement, async (req, res) => {
    try {
        await req.prisma.announcement.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
});

export default router;
