// Employee Management Routes
import express from 'express';
import bcrypt from 'bcryptjs';
import { verifyToken, requireAdminOrHR } from '../middleware/auth.js';

const router = express.Router();

// Get all employees
router.get('/', verifyToken, async (req, res) => {
    try {
        const { role, departmentId, search, page = 1, limit = 10 } = req.query;

        const where = {};

        if (role) where.role = role;
        if (departmentId) where.departmentId = departmentId;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { position: { contains: search } }
            ];
        }

        // If manager, show all employees (role = 'employee')
        if (req.user.role === 'manager') {
            where.role = 'employee';
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [employees, total] = await Promise.all([
            req.prisma.user.findMany({
                where,
                include: { department: true },
                orderBy: { name: 'asc' },
                skip,
                take: parseInt(limit)
            }),
            req.prisma.user.count({ where })
        ]);

        // Remove passwords
        const sanitizedEmployees = employees.map(({ password, ...rest }) => rest);

        res.json({
            employees: sanitizedEmployees,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// Get single employee
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const employee = await req.prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                department: true,
                attendances: {
                    orderBy: { date: 'desc' },
                    take: 30
                },
                leaveRequests: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const { password, ...employeeWithoutPassword } = employee;
        res.json(employeeWithoutPassword);
    } catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

// Create employee (Admin/HR only)
router.post('/', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        const { email, password, name, role, position, phone, salary, departmentId, managerId } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const existingUser = await req.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const employee = await req.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'employee',
                position,
                phone,
                salary: salary ? parseFloat(salary) : null,
                departmentId,
                managerId
            },
            include: { department: true }
        });

        const { password: _, ...employeeWithoutPassword } = employee;
        res.status(201).json(employeeWithoutPassword);
    } catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({ error: 'Failed to create employee' });
    }
});

// Update employee
router.put('/:id', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        const { name, position, phone, salary, departmentId, managerId, isActive, role } = req.body;

        const employee = await req.prisma.user.update({
            where: { id: req.params.id },
            data: {
                name,
                position,
                phone,
                salary: salary ? parseFloat(salary) : undefined,
                departmentId,
                managerId,
                isActive,
                role
            },
            include: { department: true }
        });

        const { password, ...employeeWithoutPassword } = employee;
        res.json(employeeWithoutPassword);
    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// Delete employee
router.delete('/:id', verifyToken, requireAdminOrHR, async (req, res) => {
    try {
        await req.prisma.user.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

export default router;
