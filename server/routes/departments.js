// Department Routes
import express from 'express';
import { verifyToken, requireAdminOrHR } from '../middleware/auth.js';

const router = express.Router();

// Get all departments
router.get('/', verifyToken, async (req, res) => {
    try {
        const departments = await req.prisma.department.findMany({
            include: {
                _count: { select: { users: true } }
            },
            orderBy: { name: 'asc' }
        });

        res.json(departments);
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Get single department
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const department = await req.prisma.department.findUnique({
            where: { id: req.params.id },
            include: {
                users: {
                    select: { id: true, name: true, email: true, position: true, role: true }
                }
            }
        });

        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json(department);
    } catch (error) {
        console.error('Get department error:', error);
        res.status(500).json({ error: 'Failed to fetch department' });
    }
});

// Create department
router.post('/', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Department name is required' });
        }

        const department = await req.prisma.department.create({
            data: { name, description }
        });

        res.status(201).json(department);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Department name already exists' });
        }
        console.error('Create department error:', error);
        res.status(500).json({ error: 'Failed to create department' });
    }
});

// Update department
router.put('/:id', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        const { name, description } = req.body;

        const department = await req.prisma.department.update({
            where: { id: req.params.id },
            data: { name, description }
        });

        res.json(department);
    } catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({ error: 'Failed to update department' });
    }
});

// Delete department
router.delete('/:id', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        // Check if department has employees
        const employeeCount = await req.prisma.user.count({
            where: { departmentId: req.params.id }
        });

        if (employeeCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete department with employees. Please reassign employees first.'
            });
        }

        await req.prisma.department.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({ error: 'Failed to delete department' });
    }
});

export default router;
