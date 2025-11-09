import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

const client = await pool.connect();
try {
  const staffResult = await client.query('SELECT COUNT(*) FROM hr.staff WHERE tenant_id = 3');
  const shiftResult = await client.query('SELECT COUNT(*) FROM ops.shifts WHERE tenant_id = 3');
  const planResult = await client.query('SELECT COUNT(*) FROM ops.shift_plans WHERE tenant_id = 3');
  
  console.log('現在のデータ件数:');
  console.log(`  hr.staff: ${staffResult.rows[0].count}件`);
  console.log(`  ops.shifts: ${shiftResult.rows[0].count}件`);
  console.log(`  ops.shift_plans: ${planResult.rows[0].count}件`);
} finally {
  client.release();
  await pool.end();
}
