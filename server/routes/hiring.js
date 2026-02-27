// Hiring Routes - Job Postings Management
// Using Prisma ORM for PostgreSQL compatibility
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all hiring posts (all authenticated users can view)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { status } = req.query;
        const where = status ? { status } : {};

        const hirings = await prisma.hiring.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json(hirings);
    } catch (error) {
        console.error('Error fetching hirings:', error);
        res.status(500).json({ error: 'Failed to fetch hiring posts' });
    }
});

// Get single hiring post
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const hiring = await prisma.hiring.findUnique({
            where: { id: req.params.id }
        });

        if (!hiring) {
            return res.status(404).json({ error: 'Hiring post not found' });
        }

        res.json(hiring);
    } catch (error) {
        console.error('Error fetching hiring:', error);
        res.status(500).json({ error: 'Failed to fetch hiring post' });
    }
});

// Create hiring post (HR and Admin only)
router.post('/', verifyToken, requireRole('hr', 'admin'), async (req, res) => {
    try {
        const { title, department, location, type, salaryRange, description, requirements } = req.body;

        if (!title || !department || !location || !type || !description || !requirements) {
            return res.status(400).json({ error: 'All required fields must be filled' });
        }

        const hiring = await prisma.hiring.create({
            data: {
                title,
                department,
                location,
                type,
                salaryRange: salaryRange || null,
                description,
                requirements,
                status: 'open',
                createdById: req.user.id
            }
        });

        res.status(201).json(hiring);
    } catch (error) {
        console.error('Error creating hiring:', error);
        res.status(500).json({ error: 'Failed to create hiring post: ' + error.message });
    }
});

// Update hiring post (HR and Admin only)
router.put('/:id', verifyToken, requireRole('hr', 'admin'), async (req, res) => {
    try {
        const { title, department, location, type, salaryRange, description, requirements, status } = req.body;

        const hiring = await prisma.hiring.update({
            where: { id: req.params.id },
            data: {
                title,
                department,
                location,
                type,
                salaryRange,
                description,
                requirements,
                status
            }
        });

        res.json(hiring);
    } catch (error) {
        console.error('Error updating hiring:', error);
        res.status(500).json({ error: 'Failed to update hiring post' });
    }
});

// Delete hiring post (HR and Admin only)
router.delete('/:id', verifyToken, requireRole('hr', 'admin'), async (req, res) => {
    try {
        await prisma.hiring.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Hiring post deleted' });
    } catch (error) {
        console.error('Error deleting hiring:', error);
        res.status(500).json({ error: 'Failed to delete hiring post' });
    }
});

export default router;
