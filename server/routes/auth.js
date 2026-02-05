// Authentication Routes
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await req.prisma.user.findUnique({
            where: { email },
            include: { department: true }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Check account approval status
        if (user.accountStatus === 'pending') {
            return res.status(403).json({ error: 'Your account is pending HR approval. Please wait for approval.' });
        }
        if (user.accountStatus === 'rejected') {
            return res.status(403).json({ error: 'Your account registration was rejected. Please contact HR.' });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Verify Token / Get Current User
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await req.prisma.user.findUnique({
            where: { id: req.user.id },
            include: { department: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({ error: 'Failed to verify authentication' });
    }
});

// Change Password
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await req.prisma.user.findUnique({
            where: { id: req.user.id }
        });

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await req.prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Register new employee (pending approval)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone, position } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Check if email already exists
        const existingUser = await req.prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with pending status
        const user = await req.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone: phone || null,
                position: position || null,
                role: 'employee',
                accountStatus: 'pending',
                isActive: true
            }
        });

        res.status(201).json({
            message: 'Registration successful! Please wait for HR approval before logging in.',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                accountStatus: user.accountStatus
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Get all pending registrations (HR/Admin only)
router.get('/pending-registrations', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'hr' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const pendingUsers = await req.prisma.user.findMany({
            where: { accountStatus: 'pending' },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                position: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(pendingUsers);
    } catch (error) {
        console.error('Error fetching pending registrations:', error);
        res.status(500).json({ error: 'Failed to fetch pending registrations' });
    }
});

// Approve registration (HR/Admin only)
router.put('/approve-registration/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'hr' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;
        const { department, position, salary } = req.body;

        const user = await req.prisma.user.update({
            where: { id },
            data: {
                accountStatus: 'approved',
                departmentId: department || null,
                position: position || null,
                salary: salary ? parseFloat(salary) : null,
                joiningDate: new Date()
            }
        });

        res.json({
            message: 'Registration approved successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                accountStatus: user.accountStatus
            }
        });
    } catch (error) {
        console.error('Error approving registration:', error);
        res.status(500).json({ error: 'Failed to approve registration' });
    }
});

// Reject registration (HR/Admin only)
router.put('/reject-registration/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'hr' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;

        const user = await req.prisma.user.update({
            where: { id },
            data: { accountStatus: 'rejected' }
        });

        res.json({
            message: 'Registration rejected',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                accountStatus: user.accountStatus
            }
        });
    } catch (error) {
        console.error('Error rejecting registration:', error);
        res.status(500).json({ error: 'Failed to reject registration' });
    }
});

export default router;
