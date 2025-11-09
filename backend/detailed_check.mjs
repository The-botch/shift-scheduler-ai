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
  console.log('接続先:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
  console.log('');
  
  // Tenant 3のデータ確認
  const stores = await client.query('SELECT store_id, store_name FROM core.stores WHERE tenant_id = 3 ORDER BY store_id');
  console.log('店舗一覧:');
  stores.rows.forEach(s => console.log(`  ${s.store_id}: ${s.store_name}`));
  console.log('');
  
  // 各店舗のシフト件数
  console.log('各店舗のシフト件数:');
  for (const store of stores.rows) {
    const result = await client.query(
      'SELECT COUNT(*) FROM ops.shifts WHERE tenant_id = 3 AND store_id = $1',
      [store.store_id]
    );
    console.log(`  ${store.store_name}: ${result.rows[0].count}件`);
  }
  console.log('');
  
  // 最新のシフト
  const recentShifts = await client.query(`
    SELECT s.shift_date, st.store_name, staff.staff_name
    FROM ops.shifts s
    JOIN core.stores st ON s.store_id = st.store_id
    JOIN hr.staff staff ON s.staff_id = staff.staff_id
    WHERE s.tenant_id = 3
    ORDER BY s.shift_date DESC
    LIMIT 5
  `);
  console.log('最新のシフト5件:');
  recentShifts.rows.forEach(r => console.log(`  ${r.shift_date} - ${r.store_name} - ${r.staff_name}`));
  
} finally {
  client.release();
  await pool.end();
}
