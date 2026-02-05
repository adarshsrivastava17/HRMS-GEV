// Payroll Routes
import express from 'express';
import { verifyToken, requireAdminOrHR } from '../middleware/auth.js';

const router = express.Router();

// Get my payslips
router.get('/my', verifyToken, async (req, res) => {
    try {
        const payslips = await req.prisma.payroll.findMany({
            where: { userId: req.user.id },
            orderBy: { month: 'desc' }
        });

        res.json(payslips);
    } catch (error) {
        console.error('Get my payslips error:', error);
        res.status(500).json({ error: 'Failed to fetch payslips' });
    }
});

// Get all payroll records (Admin/HR)
router.get('/', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        const { month, status, userId, page = 1, limit = 20 } = req.query;

        const where = {};
        if (month) where.month = month;
        if (status) where.status = status;
        if (userId) where.userId = userId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [payrolls, total] = await Promise.all([
            req.prisma.payroll.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true, position: true, department: true } }
                },
                orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
                skip,
                take: parseInt(limit)
            }),
            req.prisma.payroll.count({ where })
        ]);

        res.json({
            payrolls,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get all payroll error:', error);
        res.status(500).json({ error: 'Failed to fetch payroll records' });
    }
});

// Create payroll record
router.post('/', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        const { userId, month, basicSalary, bonus = 0, deductions = 0 } = req.body;

        if (!userId || !month || !basicSalary) {
            return res.status(400).json({ error: 'User ID, month, and basic salary are required' });
        }

        const netSalary = parseFloat(basicSalary) + parseFloat(bonus) - parseFloat(deductions);

        const payroll = await req.prisma.payroll.create({
            data: {
                userId,
                month,
                basicSalary: parseFloat(basicSalary),
                bonus: parseFloat(bonus),
                deductions: parseFloat(deductions),
                netSalary
            },
            include: {
                user: { select: { id: true, name: true } }
            }
        });

        res.status(201).json(payroll);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Payroll record already exists for this employee and month' });
        }
        console.error('Create payroll error:', error);
        res.status(500).json({ error: 'Failed to create payroll record' });
    }
});

// Update payroll record
router.put('/:id', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        const { basicSalary, bonus, deductions, status, paidDate } = req.body;

        const current = await req.prisma.payroll.findUnique({
            where: { id: req.params.id }
        });

        if (!current) {
            return res.status(404).json({ error: 'Payroll record not found' });
        }

        const newBasic = basicSalary !== undefined ? parseFloat(basicSalary) : current.basicSalary;
        const newBonus = bonus !== undefined ? parseFloat(bonus) : current.bonus;
        const newDeductions = deductions !== undefined ? parseFloat(deductions) : current.deductions;
        const netSalary = newBasic + newBonus - newDeductions;

        const payroll = await req.prisma.payroll.update({
            where: { id: req.params.id },
            data: {
                basicSalary: newBasic,
                bonus: newBonus,
                deductions: newDeductions,
                netSalary,
                status,
                paidDate: paidDate ? new Date(paidDate) : undefined
            },
            include: {
                user: { select: { id: true, name: true } }
            }
        });

        res.json(payroll);
    } catch (error) {
        console.error('Update payroll error:', error);
        res.status(500).json({ error: 'Failed to update payroll record' });
    }
});

// Process payroll (mark as processed)
router.post('/:id/process', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        const payroll = await req.prisma.payroll.update({
            where: { id: req.params.id },
            data: { status: 'processed' },
            include: {
                user: { select: { id: true, name: true } }
            }
        });

        res.json(payroll);
    } catch (error) {
        console.error('Process payroll error:', error);
        res.status(500).json({ error: 'Failed to process payroll' });
    }
});

// Mark as paid
router.post('/:id/pay', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        const payroll = await req.prisma.payroll.update({
            where: { id: req.params.id },
            data: {
                status: 'paid',
                paidDate: new Date()
            },
            include: {
                user: { select: { id: true, name: true } }
            }
        });

        res.json(payroll);
    } catch (error) {
        console.error('Mark paid error:', error);
        res.status(500).json({ error: 'Failed to mark as paid' });
    }
});

// Delete payroll record
router.delete('/:id', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        await req.prisma.payroll.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Payroll record deleted' });
    } catch (error) {
        console.error('Delete payroll error:', error);
        res.status(500).json({ error: 'Failed to delete payroll record' });
    }
});

// Get payroll summary stats
router.get('/summary/:month', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        const { month } = req.params;

        const payrolls = await req.prisma.payroll.findMany({
            where: { month },
            include: {
                user: { select: { department: true } }
            }
        });

        const summary = {
            totalEmployees: payrolls.length,
            totalBaseSalary: payrolls.reduce((sum, p) => sum + p.basicSalary, 0),
            totalBonus: payrolls.reduce((sum, p) => sum + p.bonus, 0),
            totalDeductions: payrolls.reduce((sum, p) => sum + p.deductions, 0),
            totalNetSalary: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
            pending: payrolls.filter(p => p.status === 'pending').length,
            processed: payrolls.filter(p => p.status === 'processed').length,
            paid: payrolls.filter(p => p.status === 'paid').length
        };

        res.json(summary);
    } catch (error) {
        console.error('Get payroll summary error:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

export default router;
