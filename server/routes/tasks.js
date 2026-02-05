// Task Assignment Routes
import express from 'express';
import { verifyToken, requireManagement } from '../middleware/auth.js';

const router = express.Router();

// Get my tasks
router.get('/my', verifyToken, async (req, res) => {
    try {
        const { status } = req.query;

        const where = { assigneeId: req.user.id };
        if (status) where.status = status;

        const tasks = await req.prisma.task.findMany({
            where,
            include: {
                assigner: { select: { id: true, name: true, position: true } }
            },
            orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }]
        });

        res.json(tasks);
    } catch (error) {
        console.error('Get my tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get tasks I assigned
router.get('/assigned', verifyToken, requireManagement, async (req, res) => {
    try {
        const { status } = req.query;

        const where = { assignerId: req.user.id };
        if (status) where.status = status;

        const tasks = await req.prisma.task.findMany({
            where,
            include: {
                assignee: { select: { id: true, name: true, position: true, department: true } }
            },
            orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }]
        });

        res.json(tasks);
    } catch (error) {
        console.error('Get assigned tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get all tasks (management)
router.get('/', verifyToken, requireManagement, async (req, res) => {
    try {
        const { status, priority, assigneeId, page = 1, limit = 20 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assigneeId) where.assigneeId = assigneeId;

        // Manager can see all employees' tasks
        if (req.user.role === 'manager') {
            const teamMembers = await req.prisma.user.findMany({
                where: { role: 'employee' },
                select: { id: true }
            });
            where.assigneeId = { in: teamMembers.map(m => m.id) };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [tasks, total] = await Promise.all([
            req.prisma.task.findMany({
                where,
                include: {
                    assignee: { select: { id: true, name: true, position: true, department: true } },
                    assigner: { select: { id: true, name: true } }
                },
                orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
                skip,
                take: parseInt(limit)
            }),
            req.prisma.task.count({ where })
        ]);

        res.json({
            tasks,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get all tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Create task
router.post('/', verifyToken, requireManagement, async (req, res) => {
    try {
        const { title, description, assigneeId, priority, dueDate } = req.body;

        if (!title || !assigneeId) {
            return res.status(400).json({ error: 'Title and assignee are required' });
        }

        const task = await req.prisma.task.create({
            data: {
                title,
                description,
                assigneeId,
                assignerId: req.user.id,
                priority: priority || 'medium',
                dueDate: dueDate ? new Date(dueDate) : null
            },
            include: {
                assignee: { select: { id: true, name: true } },
                assigner: { select: { id: true, name: true } }
            }
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update task status (for assignee)
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'in-progress', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const task = await req.prisma.task.findUnique({
            where: { id: req.params.id }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Only assignee or management can update
        if (task.assigneeId !== req.user.id && !['admin', 'hr', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const updated = await req.prisma.task.update({
            where: { id: req.params.id },
            data: { status },
            include: {
                assignee: { select: { id: true, name: true } },
                assigner: { select: { id: true, name: true } }
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Update task (management)
router.put('/:id', verifyToken, requireManagement, async (req, res) => {
    try {
        const { title, description, priority, dueDate, status } = req.body;

        const task = await req.prisma.task.update({
            where: { id: req.params.id },
            data: {
                title,
                description,
                priority,
                status,
                dueDate: dueDate ? new Date(dueDate) : undefined
            },
            include: {
                assignee: { select: { id: true, name: true } },
                assigner: { select: { id: true, name: true } }
            }
        });

        res.json(task);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
router.delete('/:id', verifyToken, requireManagement, async (req, res) => {
    try {
        await req.prisma.task.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;
