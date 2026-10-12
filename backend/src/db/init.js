import fs from 'fs';
import path from 'path';
import pool from './pool.js'; // adjust path to your db pool

async function runMigrations() {
    try {
        const sql = fs.readFileSync(path.join(process.cwd(), 'src/db/schema.sql'), 'utf8');
        await pool.query(sql);
        console.log('Database schema successfully initialized.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigrations();
