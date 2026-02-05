// Quick script to create the Hiring table directly using SQLite
// Run this if prisma generate fails: node create-hiring-table.js

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'hrms.db');
const db = new Database(dbPath);

try {
    // Check if Hiring table exists
    const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='Hiring'
    `).get();

    if (!tableExists) {
        console.log('Creating Hiring table...');
        db.exec(`
            CREATE TABLE "Hiring" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "title" TEXT NOT NULL,
                "department" TEXT NOT NULL,
                "location" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "salaryRange" TEXT,
                "description" TEXT NOT NULL,
                "requirements" TEXT NOT NULL,
                "status" TEXT NOT NULL DEFAULT 'open',
                "createdById" TEXT NOT NULL,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL
            )
        `);

        // Create indexes
        db.exec(`CREATE INDEX "Hiring_status_idx" ON "Hiring"("status")`);
        db.exec(`CREATE INDEX "Hiring_createdById_idx" ON "Hiring"("createdById")`);

        console.log('✅ Hiring table created successfully!');
    } else {
        console.log('✅ Hiring table already exists.');
    }

    db.close();
    console.log('Database setup complete. Please restart the server.');
} catch (error) {
    console.error('Error:', error.message);
    db.close();
}
