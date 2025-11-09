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
  // 武根さんを検索
  const staffResult = await client.query(`
    SELECT staff_id, staff_code, name
    FROM hr.staff
    WHERE tenant_id = 3 AND name LIKE '%武根%'
  `);

  if (staffResult.rows.length === 0) {
    console.log('武根さんが見つかりません');
    process.exit(0);
  }

  const takene = staffResult.rows[0];
  console.log(`武根さん: staff_id=${takene.staff_id}, staff_code=${takene.staff_code}\n`);

  // 7/1-7/10のシフト
  const shiftsResult = await client.query(`
    SELECT
      s.shift_date,
      s.start_time,
      s.end_time,
      st.store_name
    FROM ops.shifts s
    JOIN core.stores st ON s.store_id = st.store_id
    WHERE s.tenant_id = 3
      AND s.staff_id = $1
      AND s.shift_date >= '2025-07-01'
      AND s.shift_date <= '2025-07-10'
    ORDER BY s.shift_date
  `, [takene.staff_id]);

  console.log(`7月1日〜10日のシフト（${shiftsResult.rows.length}件）:\n`);

  shiftsResult.rows.forEach(row => {
    console.log(`${row.shift_date}: ${row.start_time}-${row.end_time} (${row.store_name})`);
  });

} finally {
  client.release();
  await pool.end();
}
