// Dashboard Statistics Routes
import express from 'express';
import { verifyToken, requireManagement, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper: Get today's date
const getTodayDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// Get dashboard stats based on role
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const today = getTodayDate();
        const role = req.user.role;

        let stats = {};

        // Common stats for all roles
        const announcements = await req.prisma.announcement.count({
            where: { isActive: true }
        });

        if (role === 'admin') {
            // Admin sees everything
            const [
                totalEmployees,
                totalDepartments,
                todayAttendance,
                pendingLeaves,
                totalPayroll
            ] = await Promise.all([
                req.prisma.user.count({ where: { isActive: true } }),
                req.prisma.department.count(),
                req.prisma.attendance.count({
                    where: {
                        date: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
                        checkIn: { not: null }
                    }
                }),
                req.prisma.leaveRequest.count({ where: { status: 'pending' } }),
                req.prisma.payroll.aggregate({
                    where: { status: 'paid' },
                    _sum: { netSalary: true }
                })
            ]);

            const roleBreakdown = await req.prisma.user.groupBy({
                by: ['role'],
                _count: true
            });

            stats = {
                totalEmployees,
                totalDepartments,
                todayAttendance,
                pendingLeaves,
                totalPayroll: totalPayroll._sum.netSalary || 0,
                announcements,
                roleBreakdown: roleBreakdown.reduce((acc, r) => {
                    acc[r.role] = r._count;
                    return acc;
                }, {})
            };
        } else if (role === 'hr') {
            // HR sees employee and attendance data
            const [
                totalEmployees,
                todayAttendance,
                pendingLeaves,
                newHiresThisMonth
            ] = await Promise.all([
                req.prisma.user.count({ where: { isActive: true } }),
                req.prisma.attendance.count({
                    where: {
                        date: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
                        checkIn: { not: null }
                    }
                }),
                req.prisma.leaveRequest.count({ where: { status: 'pending' } }),
                req.prisma.user.count({
                    where: {
                        joiningDate: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }
                    }
                })
            ]);

            stats = {
                totalEmployees,
                todayAttendance,
                pendingLeaves,
                newHiresThisMonth,
                announcements
            };
        } else if (role === 'manager') {
            // Manager sees all employees data
            const teamMembers = await req.prisma.user.findMany({
                where: { role: 'employee' },
                select: { id: true }
            });
            const teamIds = teamMembers.map(m => m.id);

            const [
                teamSize,
                teamPresent,
                pendingLeaves,
                pendingTasks
            ] = await Promise.all([
                teamMembers.length,
                req.prisma.attendance.count({
                    where: {
                        userId: { in: teamIds },
                        date: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
                        checkIn: { not: null }
                    }
                }),
                req.prisma.leaveRequest.count({
                    where: { userId: { in: teamIds }, status: 'pending' }
                }),
                req.prisma.task.count({
                    where: { assigneeId: { in: teamIds }, status: { not: 'completed' } }
                })
            ]);

            stats = {
                teamSize,
                teamPresent,
                pendingLeaves,
                pendingTasks,
                announcements
            };
        } else {
            // Employee sees their own data
            const [
                myAttendanceToday,
                myPendingLeaves,
                myTasks,
                myReviews
            ] = await Promise.all([
                req.prisma.attendance.findFirst({
                    where: {
                        userId: req.user.id,
                        date: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
                    },
                    include: { breaks: true }
                }),
                req.prisma.leaveRequest.count({
                    where: { userId: req.user.id, status: 'pending' }
                }),
                req.prisma.task.count({
                    where: { assigneeId: req.user.id, status: { not: 'completed' } }
                }),
                req.prisma.performance.count({
                    where: { userId: req.user.id }
                })
            ]);

            stats = {
                isCheckedIn: !!myAttendanceToday?.checkIn,
                isCheckedOut: !!myAttendanceToday?.checkOut,
                isOnBreak: myAttendanceToday?.breaks?.some(b => !b.endTime) || false,
                totalBreakTime: myAttendanceToday?.totalBreakTime || 0,
                pendingLeaves: myPendingLeaves,
                pendingTasks: myTasks,
                totalReviews: myReviews,
                announcements
            };
        }

        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Get attendance chart data (last 7 days)
router.get('/attendance-chart', verifyToken, requireManagement, async (req, res) => {
    try {
        const today = getTodayDate();
        const data = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

            const count = await req.prisma.attendance.count({
                where: {
                    date: { gte: date, lt: nextDate },
                    checkIn: { not: null }
                }
            });

            data.push({
                date: date.toISOString().split('T')[0],
                day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
                count
            });
        }

        res.json(data);
    } catch (error) {
        console.error('Get attendance chart error:', error);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

// Get department distribution
router.get('/department-stats', verifyToken, requireManagement, async (req, res) => {
    try {
        const departments = await req.prisma.department.findMany({
            include: {
                _count: { select: { users: true } }
            }
        });

        const stats = departments.map(d => ({
            name: d.name,
            employeeCount: d._count.users
        }));

        res.json(stats);
    } catch (error) {
        console.error('Get department stats error:', error);
        res.status(500).json({ error: 'Failed to fetch department stats' });
    }
});

// Get recent activities (for admin)
router.get('/recent-activities', verifyToken, requireAdmin, async (req, res) => {
    try {
        const [recentLogins, recentLeaves, recentTasks] = await Promise.all([
            req.prisma.attendance.findMany({
                where: { checkIn: { not: null } },
                include: { user: { select: { name: true } } },
                orderBy: { checkIn: 'desc' },
                take: 5
            }),
            req.prisma.leaveRequest.findMany({
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),
            req.prisma.task.findMany({
                where: { status: 'completed' },
                include: { assignee: { select: { name: true } } },
                orderBy: { updatedAt: 'desc' },
                take: 5
            })
        ]);

        res.json({
            recentLogins,
            recentLeaves,
            recentTasks
        });
    } catch (error) {
        console.error('Get recent activities error:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

export default router;
