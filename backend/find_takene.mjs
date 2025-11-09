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
  const result = await client.query(`
    SELECT staff_id, staff_code
    FROM hr.staff
    WHERE tenant_id = 3
    ORDER BY staff_code
    LIMIT 10
  `);

  console.log('スタッフ一覧 (最初の10件):\n');
  result.rows.forEach(row => {
    console.log(`${row.staff_id}: ${row.staff_code}`);
  });
} finally {
  client.release();
  await pool.end();
}
