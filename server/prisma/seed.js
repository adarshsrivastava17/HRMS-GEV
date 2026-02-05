// Database Seed Script - Creates default users for testing
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'Executive' },
      update: {},
      create: { name: 'Executive', description: 'Senior Leadership Team' }
    }),
    prisma.department.upsert({
      where: { name: 'Human Resources' },
      update: {},
      create: { name: 'Human Resources', description: 'HR Department' }
    }),
    prisma.department.upsert({
      where: { name: 'Engineering' },
      update: {},
      create: { name: 'Engineering', description: 'Software Development Team' }
    }),
    prisma.department.upsert({
      where: { name: 'Sales' },
      update: {},
      create: { name: 'Sales', description: 'Sales and Marketing' }
    }),
    prisma.department.upsert({
      where: { name: 'Operations' },
      update: {},
      create: { name: 'Operations', description: 'Business Operations' }
    })
  ]);

  console.log('✅ Departments created');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin (CEO)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hrms.com' },
    update: {},
    create: {
      email: 'admin@hrms.com',
      password: hashedPassword,
      name: 'John Anderson',
      role: 'admin',
      position: 'CEO & Managing Director',
      phone: '+1 234 567 8901',
      salary: 250000,
      departmentId: departments[0].id,
      accountStatus: 'approved'
    }
  });
  console.log('✅ Admin created:', admin.email);

  // Create Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@hrms.com' },
    update: {},
    create: {
      email: 'manager@hrms.com',
      password: hashedPassword,
      name: 'David Williams',
      role: 'manager',
      position: 'Engineering Manager',
      phone: '+1 234 567 8902',
      salary: 120000,
      departmentId: departments[2].id,
      accountStatus: 'approved'
    }
  });
  console.log('✅ Manager created:', manager.email);

  // Create HR
  const hr = await prisma.user.upsert({
    where: { email: 'aishwarya@hrms.com' },
    update: {},
    create: {
      email: 'aishwarya@hrms.com',
      password: hashedPassword,
      name: 'Aishwarya Nair',
      role: 'hr',
      position: 'HR Manager',
      phone: '+91 9876543210',
      salary: 85000,
      departmentId: departments[1].id,
      accountStatus: 'approved'
    }
  });
  console.log('✅ HR created:', hr.email);

  // Create Employees (6 employees assigned to manager)
  const employees = await Promise.all([
    prisma.user.upsert({
      where: { email: 'employee@hrms.com' },
      update: { managerId: manager.id },
      create: {
        email: 'employee@hrms.com',
        password: hashedPassword,
        name: 'Michael Chen',
        role: 'employee',
        position: 'Senior Developer',
        phone: '+1 234 567 8904',
        salary: 75000,
        departmentId: departments[2].id,
        managerId: manager.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'jane.doe@hrms.com' },
      update: { managerId: manager.id },
      create: {
        email: 'jane.doe@hrms.com',
        password: hashedPassword,
        name: 'Jane Doe',
        role: 'employee',
        position: 'Frontend Developer',
        phone: '+1 234 567 8905',
        salary: 65000,
        departmentId: departments[2].id,
        managerId: manager.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'robert.smith@hrms.com' },
      update: { managerId: manager.id },
      create: {
        email: 'robert.smith@hrms.com',
        password: hashedPassword,
        name: 'Robert Smith',
        role: 'employee',
        position: 'Backend Developer',
        phone: '+1 234 567 8906',
        salary: 70000,
        departmentId: departments[2].id,
        managerId: manager.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'sarah.wilson@hrms.com' },
      update: { managerId: manager.id },
      create: {
        email: 'sarah.wilson@hrms.com',
        password: hashedPassword,
        name: 'Sarah Wilson',
        role: 'employee',
        position: 'UI/UX Designer',
        phone: '+1 234 567 8907',
        salary: 60000,
        departmentId: departments[2].id,
        managerId: manager.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'david.brown@hrms.com' },
      update: { managerId: manager.id },
      create: {
        email: 'david.brown@hrms.com',
        password: hashedPassword,
        name: 'David Brown',
        role: 'employee',
        position: 'DevOps Engineer',
        phone: '+1 234 567 8908',
        salary: 72000,
        departmentId: departments[2].id,
        managerId: manager.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'lisa.taylor@hrms.com' },
      update: { managerId: manager.id },
      create: {
        email: 'lisa.taylor@hrms.com',
        password: hashedPassword,
        name: 'Lisa Taylor',
        role: 'employee',
        position: 'QA Engineer',
        phone: '+1 234 567 8909',
        salary: 58000,
        departmentId: departments[2].id,
        managerId: manager.id
      }
    }),
    prisma.user.upsert({
      where: { email: 'parth@hrms.com' },
      update: { managerId: manager.id },
      create: {
        email: 'parth@hrms.com',
        password: hashedPassword,
        name: 'Parth',
        role: 'employee',
        position: 'Software Developer',
        phone: '+1 234 567 8910',
        salary: 65000,
        departmentId: departments[2].id,
        managerId: manager.id,
        accountStatus: 'approved'
      }
    }),
  ]);
  console.log('✅ Employees created:', employees.length);

  // Create sample announcement
  await prisma.announcement.upsert({
    where: { id: 'welcome-announcement' },
    update: {},
    create: {
      id: 'welcome-announcement',
      title: 'Welcome to HRMS',
      content: 'Welcome to our new Human Resource Management System. Please update your profile and start tracking your attendance.',
      priority: 'high',
      authorId: hr.id
    }
  });
  console.log('✅ Sample announcement created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📧 Test Accounts (password: password123):');
  console.log('   Admin:    admin@hrms.com');
  console.log('   Manager:  manager@hrms.com');
  console.log('   HR:       hr@hrms.com');
  console.log('   Employee: employee@hrms.com');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
