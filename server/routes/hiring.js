// Hiring Routes - Job Postings Management
// Using raw SQL queries for compatibility until Prisma client is regenerated
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requireRole } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Get all hiring posts (all authenticated users can view)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { status } = req.query;
        let hirings;

        if (status) {
            hirings = await prisma.$queryRaw`SELECT * FROM Hiring WHERE status = ${status} ORDER BY createdAt DESC`;
        } else {
            hirings = await prisma.$queryRaw`SELECT * FROM Hiring ORDER BY createdAt DESC`;
        }

        res.json(hirings);
    } catch (error) {
        console.error('Error fetching hirings:', error);
        res.status(500).json({ error: 'Failed to fetch hiring posts' });
    }
});

// Get single hiring post
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const hirings = await prisma.$queryRaw`SELECT * FROM Hiring WHERE id = ${req.params.id}`;

        if (hirings.length === 0) {
            return res.status(404).json({ error: 'Hiring post not found' });
        }

        res.json(hirings[0]);
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

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const userId = req.user.id;
        const salary = salaryRange || null;

        await prisma.$executeRaw`
            INSERT INTO Hiring (id, title, department, location, type, salaryRange, description, requirements, status, createdById, createdAt, updatedAt)
            VALUES (${id}, ${title}, ${department}, ${location}, ${type}, ${salary}, ${description}, ${requirements}, 'open', ${userId}, ${now}, ${now})
        `;

        const newHiring = await prisma.$queryRaw`SELECT * FROM Hiring WHERE id = ${id}`;
        res.status(201).json(newHiring[0]);
    } catch (error) {
        console.error('Error creating hiring:', error);
        res.status(500).json({ error: 'Failed to create hiring post: ' + error.message });
    }
});

// Update hiring post (HR and Admin only)
router.put('/:id', verifyToken, requireRole('hr', 'admin'), async (req, res) => {
    try {
        const { title, department, location, type, salaryRange, description, requirements, status } = req.body;
        const now = new Date().toISOString();

        await prisma.$executeRaw`
            UPDATE Hiring 
            SET title = ${title}, department = ${department}, location = ${location}, 
                type = ${type}, salaryRange = ${salaryRange}, description = ${description}, 
                requirements = ${requirements}, status = ${status}, updatedAt = ${now}
            WHERE id = ${req.params.id}
        `;

        const updated = await prisma.$queryRaw`SELECT * FROM Hiring WHERE id = ${req.params.id}`;
        res.json(updated[0]);
    } catch (error) {
        console.error('Error updating hiring:', error);
        res.status(500).json({ error: 'Failed to update hiring post' });
    }
});

// Delete hiring post (HR and Admin only)
router.delete('/:id', verifyToken, requireRole('hr', 'admin'), async (req, res) => {
    try {
        await prisma.$executeRaw`DELETE FROM Hiring WHERE id = ${req.params.id}`;
        res.json({ message: 'Hiring post deleted' });
    } catch (error) {
        console.error('Error deleting hiring:', error);
        res.status(500).json({ error: 'Failed to delete hiring post' });
    }
});

export default router;
