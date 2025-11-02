#!/usr/bin/env node
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || process.env.PGHOST,
  port: process.env.DB_PORT || process.env.PGPORT || 5432,
  database: process.env.DB_NAME || process.env.PGDATABASE,
  user: process.env.DB_USER || process.env.PGUSER,
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD
});

async function main() {
  const result = await pool.query(`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'hr'
      AND tc.table_name = 'payroll'
      AND tc.constraint_type = 'UNIQUE'
    ORDER BY kcu.ordinal_position
  `);

  console.log('\nhr.payroll テーブルのユニーク制約:\n');
  result.rows.forEach(row => {
    console.log(`  ${row.constraint_name}: ${row.column_name}`);
  });
  console.log();

  await pool.end();
}

main();
