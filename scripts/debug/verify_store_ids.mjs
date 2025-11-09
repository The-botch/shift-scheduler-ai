import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../backend/.env') });

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const client = await pool.connect();

try {
  const result = await client.query(`
    SELECT
      s.store_name,
      s.store_id,
      COUNT(*) as shift_count
    FROM ops.shifts sh
    JOIN core.stores s ON sh.store_id = s.store_id
    WHERE sh.tenant_id = 3
    GROUP BY s.store_name, s.store_id
    ORDER BY s.store_name
  `);

  console.log('Store ID Distribution in Database:');
  console.log('==================================');
  result.rows.forEach(row => {
    console.log(`  [ID:${row.store_id}] ${row.store_name}: ${row.shift_count} shifts`);
  });
  console.log(`\nTotal stores with shifts: ${result.rows.length}`);
} finally {
  client.release();
  await pool.end();
}
