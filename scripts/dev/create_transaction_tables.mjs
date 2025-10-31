import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '../../.env');
  const envContent = await fs.readFile(envPath, 'utf-8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
  if (dbUrlMatch) process.env.DATABASE_URL = dbUrlMatch[1].trim();
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

const client = await pool.connect();
console.log('📝 トランザクションテーブル作成中...\n');
const ddl = await fs.readFile(path.join(__dirname, 'transaction_tables_only.sql'), 'utf-8');
await client.query(ddl);
console.log('✅ トランザクションテーブル作成完了\n');

const result = await client.query(`
  SELECT schemaname, tablename 
  FROM pg_tables 
  WHERE schemaname IN ('ops', 'analytics', 'hr') 
    AND tablename IN ('shift_plans', 'shifts', 'payroll', 'sales_actual', 'dashboard_metrics', 'demand_forecasts', 'work_hours_actual', 'shift_preferences', 'availability_requests')
  ORDER BY schemaname, tablename
`);
console.log('作成されたテーブル:');
console.table(result.rows);
client.release();
pool.end();
