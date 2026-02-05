// Password Reset Request Routes
import express from 'express';
import { verifyToken, requireManagement } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Request password reset (employee submits)
router.post('/request', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await req.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'Email not found' });
        }

        // Check if there's already a pending request
        const existing = await req.prisma.passwordReset.findFirst({
            where: { userId: user.id, status: 'pending' }
        });

        if (existing) {
            return res.status(400).json({ error: 'Password reset already pending approval' });
        }

        const reset = await req.prisma.passwordReset.create({
            data: { userId: user.id }
        });

        res.json({ message: 'Password reset request submitted. Waiting for manager approval.' });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'Failed to submit request' });
    }
});

// Get pending reset requests (for managers)
router.get('/pending', verifyToken, requireManagement, async (req, res) => {
    try {
        const resets = await req.prisma.passwordReset.findMany({
            where: { status: 'pending' },
            include: { user: { select: { id: true, name: true, email: true, position: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(resets);
    } catch (error) {
        console.error('Get pending resets error:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Approve/reject password reset
router.put('/:id', verifyToken, requireManagement, async (req, res) => {
    try {
        const { status, newPassword } = req.body; // status: 'approved' or 'rejected'

        const reset = await req.prisma.passwordReset.findUnique({
            where: { id: req.params.id },
            include: { user: true }
        });

        if (!reset) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (status === 'approved') {
            // Set new password (default: user123)
            const password = newPassword || 'user123';
            const hashedPassword = await bcrypt.hash(password, 10);

            await req.prisma.user.update({
                where: { id: reset.userId },
                data: { password: hashedPassword }
            });
        }

        await req.prisma.passwordReset.update({
            where: { id: req.params.id },
            data: {
                status,
                approvedBy: req.user.id,
                approvedAt: new Date()
            }
        });

        res.json({ message: `Password reset ${status}` });
    } catch (error) {
        console.error('Approve/reject reset error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

export default router;
