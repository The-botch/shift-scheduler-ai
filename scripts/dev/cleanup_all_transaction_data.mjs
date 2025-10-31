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

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🗑️  トランザクションデータ全削除');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 外部キー制約順に削除
const tables = [
  'ops.shifts',
  'ops.shift_solutions',
  'ops.shift_issues',
  'ops.availability_requests',
  'ops.shift_preferences',
  'ops.shift_plans',
  'ops.demand_forecasts',
  'ops.work_hours_actual',
  'hr.payroll',
  'analytics.sales_actual',
  'analytics.sales_forecast',
  'analytics.dashboard_metrics'
];

for (const table of tables) {
  const result = await client.query(`DELETE FROM ${table}`);
  console.log(`   ✓ ${table.padEnd(35)} : ${result.rowCount}件削除`);
}

console.log('\n🎉 全トランザクションデータを削除しました');

client.release();
pool.end();
