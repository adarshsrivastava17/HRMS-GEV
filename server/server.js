// GEV Backend Server - Express Application
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Import Routes
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import attendanceRoutes from './routes/attendance.js';
import departmentRoutes from './routes/departments.js';
import leaveRoutes from './routes/leaves.js';
import payrollRoutes from './routes/payroll.js';
import performanceRoutes from './routes/performance.js';
import taskRoutes from './routes/tasks.js';
import announcementRoutes from './routes/announcements.js';
import dashboardRoutes from './routes/dashboard.js';
import passwordResetRoutes from './routes/passwordReset.js';
import teamRoutes from './routes/teams.js';
import hiringRoutes from './routes/hiring.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Make prisma available to routes
app.use((req, res, next) => {
    req.prisma = prisma;
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/hiring', hiringRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'GEV Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 GEV Server running on http://localhost:${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
