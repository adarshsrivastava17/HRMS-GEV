// Reset today's attendance records
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetTodayAttendance() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Delete breaks first (foreign key constraint)
    const breaks = await prisma.break.deleteMany({
        where: {
            attendance: {
                date: { gte: today, lt: tomorrow }
            }
        }
    });
    console.log(`Deleted ${breaks.count} break records`);

    // Delete attendance records
    const attendance = await prisma.attendance.deleteMany({
        where: {
            date: { gte: today, lt: tomorrow }
        }
    });
    console.log(`Deleted ${attendance.count} attendance records`);
    console.log('✅ Today\'s attendance has been reset! You can now test again.');

    await prisma.$disconnect();
}

resetTodayAttendance().catch(console.error);
