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
  // 武根さんのスタッフIDを取得
  const staffResult = await client.query(`
    SELECT staff_id, staff_code
    FROM hr.staff
    WHERE tenant_id = 3 AND staff_code LIKE '%武根%'
  `);

  if (staffResult.rows.length === 0) {
    console.log('武根さんが見つかりません');
    process.exit(0);
  }

  const takeneStaff = staffResult.rows[0];
  console.log(`武根さん: staff_id=${takeneStaff.staff_id}, staff_code=${takeneStaff.staff_code}\n`);

  // 7月のシフトを確認
  const shiftsResult = await client.query(`
    SELECT
      s.shift_id,
      s.shift_date,
      s.start_time,
      s.end_time,
      st.store_name,
      s.created_at,
      s.updated_at
    FROM ops.shifts s
    JOIN core.stores st ON s.store_id = st.store_id
    WHERE s.tenant_id = 3
      AND s.staff_id = $1
      AND s.shift_date >= '2025-07-01'
      AND s.shift_date <= '2025-07-10'
    ORDER BY s.shift_date, s.start_time
  `, [takeneStaff.staff_id]);

  console.log(`7月1日〜10日のシフト（${shiftsResult.rows.length}件）:\n`);

  shiftsResult.rows.forEach(row => {
    const date = new Date(row.shift_date);
    console.log(`日付: ${row.shift_date} (ISO: ${date.toISOString()})`);
    console.log(`  時間: ${row.start_time} - ${row.end_time}`);
    console.log(`  店舗: ${row.store_name}`);
    console.log(`  作成日時: ${row.created_at}`);
    console.log('');
  });

} finally {
  client.release();
  await pool.end();
}
