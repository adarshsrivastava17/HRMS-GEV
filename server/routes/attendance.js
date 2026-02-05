// Attendance & Break Tracking Routes
import express from 'express';
import { verifyToken, requireManagement } from '../middleware/auth.js';

const router = express.Router();

// Helper: Get today's date string (YYYY-MM-DD)
const getTodayDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// Get my attendance (for employees)
router.get('/my', verifyToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = { userId: req.user.id };

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const attendances = await req.prisma.attendance.findMany({
            where,
            include: { breaks: true },
            orderBy: { date: 'desc' },
            take: 30
        });

        res.json(attendances);
    } catch (error) {
        console.error('Get my attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// Get today's attendance status
router.get('/today', verifyToken, async (req, res) => {
    try {
        const today = getTodayDate();

        let attendance = await req.prisma.attendance.findFirst({
            where: {
                userId: req.user.id,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            include: { breaks: true }
        });

        // Check if currently on break
        const isOnBreak = attendance?.breaks.some(b => b.startTime && !b.endTime) || false;
        const currentBreak = attendance?.breaks.find(b => b.startTime && !b.endTime);

        res.json({
            attendance,
            isCheckedIn: !!attendance?.checkIn,
            isCheckedOut: !!attendance?.checkOut,
            isOnBreak,
            currentBreak
        });
    } catch (error) {
        console.error('Get today attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch today\'s attendance' });
    }
});

// Check In (LOGIN)
router.post('/check-in', verifyToken, async (req, res) => {
    try {
        const today = getTodayDate();
        const now = new Date();

        // Check if already checked in today
        let attendance = await req.prisma.attendance.findFirst({
            where: {
                userId: req.user.id,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        if (attendance?.checkIn) {
            return res.status(400).json({ error: 'Already checked in today' });
        }

        // Create or update attendance record
        if (attendance) {
            attendance = await req.prisma.attendance.update({
                where: { id: attendance.id },
                data: { checkIn: now, status: 'present' },
                include: { breaks: true }
            });
        } else {
            attendance = await req.prisma.attendance.create({
                data: {
                    userId: req.user.id,
                    date: today,
                    checkIn: now,
                    status: 'present'
                },
                include: { breaks: true }
            });
        }

        res.json({
            message: 'Checked in successfully',
            attendance,
            checkInTime: now
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ error: 'Failed to check in' });
    }
});

// Check Out (LEAVE)
router.post('/check-out', verifyToken, async (req, res) => {
    try {
        const today = getTodayDate();
        const now = new Date();

        const attendance = await req.prisma.attendance.findFirst({
            where: {
                userId: req.user.id,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            include: { breaks: true }
        });

        if (!attendance?.checkIn) {
            return res.status(400).json({ error: 'Not checked in today' });
        }

        if (attendance.checkOut) {
            return res.status(400).json({ error: 'Already checked out today' });
        }

        // End any active break
        const activeBreak = attendance.breaks.find(b => !b.endTime);
        if (activeBreak) {
            const breakDuration = Math.round((now.getTime() - new Date(activeBreak.startTime).getTime()) / 60000);
            await req.prisma.break.update({
                where: { id: activeBreak.id },
                data: { endTime: now, duration: breakDuration }
            });
        }

        // Calculate total work time
        const totalBreakTime = attendance.breaks.reduce((sum, b) => sum + (b.duration || 0), 0);
        const totalMinutes = Math.round((now.getTime() - new Date(attendance.checkIn).getTime()) / 60000);
        const totalWorkTime = totalMinutes - totalBreakTime;

        const updated = await req.prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                checkOut: now,
                totalBreakTime,
                totalWorkTime
            },
            include: { breaks: true }
        });

        res.json({
            message: 'Checked out successfully',
            attendance: updated,
            checkOutTime: now,
            totalWorkTime,
            totalBreakTime
        });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ error: 'Failed to check out' });
    }
});

// Start Break (BREAK)
router.post('/break-start', verifyToken, async (req, res) => {
    try {
        const today = getTodayDate();
        const now = new Date();

        const attendance = await req.prisma.attendance.findFirst({
            where: {
                userId: req.user.id,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            include: { breaks: true }
        });

        if (!attendance?.checkIn) {
            return res.status(400).json({ error: 'Not checked in today' });
        }

        if (attendance.checkOut) {
            return res.status(400).json({ error: 'Already checked out' });
        }

        // Check if already on break
        const activeBreak = attendance.breaks.find(b => !b.endTime);
        if (activeBreak) {
            return res.status(400).json({ error: 'Already on break' });
        }

        const newBreak = await req.prisma.break.create({
            data: {
                attendanceId: attendance.id,
                startTime: now
            }
        });

        res.json({
            message: 'Break started',
            break: newBreak,
            startTime: now
        });
    } catch (error) {
        console.error('Break start error:', error);
        res.status(500).json({ error: 'Failed to start break' });
    }
});

// End Break (BREAKOFF)
router.post('/break-end', verifyToken, async (req, res) => {
    try {
        const today = getTodayDate();
        const now = new Date();

        const attendance = await req.prisma.attendance.findFirst({
            where: {
                userId: req.user.id,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            include: { breaks: true }
        });

        if (!attendance) {
            return res.status(400).json({ error: 'No attendance record for today' });
        }

        const activeBreak = attendance.breaks.find(b => !b.endTime);
        if (!activeBreak) {
            return res.status(400).json({ error: 'Not on break' });
        }

        const duration = Math.round((now.getTime() - new Date(activeBreak.startTime).getTime()) / 60000);

        const updatedBreak = await req.prisma.break.update({
            where: { id: activeBreak.id },
            data: { endTime: now, duration }
        });

        // Update total break time
        const totalBreakTime = attendance.breaks.reduce((sum, b) => {
            if (b.id === activeBreak.id) return sum + duration;
            return sum + (b.duration || 0);
        }, 0);

        await req.prisma.attendance.update({
            where: { id: attendance.id },
            data: { totalBreakTime }
        });

        res.json({
            message: 'Break ended',
            break: updatedBreak,
            duration,
            totalBreakTime
        });
    } catch (error) {
        console.error('Break end error:', error);
        res.status(500).json({ error: 'Failed to end break' });
    }
});

// Get all attendance (for HR/Admin/Manager)
router.get('/', verifyToken, requireManagement, async (req, res) => {
    try {
        const { date, userId, departmentId, page = 1, limit = 20 } = req.query;

        const where = {};

        if (date) {
            const targetDate = new Date(date);
            where.date = {
                gte: targetDate,
                lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
            };
        }

        if (userId) where.userId = userId;

        // Manager can see all employees
        if (req.user.role === 'manager') {
            const teamMembers = await req.prisma.user.findMany({
                where: { role: 'employee' },
                select: { id: true }
            });
            where.userId = { in: teamMembers.map(m => m.id) };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [attendances, total] = await Promise.all([
            req.prisma.attendance.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true, position: true, department: true } },
                    breaks: true
                },
                orderBy: { date: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            req.prisma.attendance.count({ where })
        ]);

        res.json({
            attendances,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get all attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
});

// Get live status (who's online, on break, etc.)
router.get('/live-status', verifyToken, requireManagement, async (req, res) => {
    try {
        const today = getTodayDate();

        const attendances = await req.prisma.attendance.findMany({
            where: {
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            include: {
                user: { select: { id: true, name: true, position: true, department: true } },
                breaks: true
            }
        });

        const working = [];
        const onBreak = [];
        const checkedOut = [];

        for (const att of attendances) {
            const hasActiveBreak = att.breaks.some(b => !b.endTime);

            if (att.checkOut) {
                checkedOut.push({ ...att, status: 'checked-out' });
            } else if (hasActiveBreak) {
                onBreak.push({ ...att, status: 'on-break' });
            } else if (att.checkIn) {
                working.push({ ...att, status: 'working' });
            }
        }

        res.json({
            working,
            onBreak,
            checkedOut,
            totalPresent: attendances.length,
            summary: {
                working: working.length,
                onBreak: onBreak.length,
                checkedOut: checkedOut.length
            }
        });
    } catch (error) {
        console.error('Get live status error:', error);
        res.status(500).json({ error: 'Failed to fetch live status' });
    }
});

export default router;
