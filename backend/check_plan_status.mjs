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
  // shift_plansテーブルの構造を確認
  const columnsResult = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'ops' 
      AND table_name = 'shift_plans'
    ORDER BY ordinal_position
  `);

  console.log('=== shift_plans テーブルの列 ===\n');
  columnsResult.rows.forEach(row => {
    console.log(`${row.column_name}: ${row.data_type}`);
  });
  console.log('');

  // 第1案のデータを確認（列名を使わずに全て取得）
  const result = await client.query(`
    SELECT 
      p.*,
      s.store_name
    FROM ops.shift_plans p
    JOIN core.stores s ON p.store_id = s.store_id
    WHERE p.tenant_id = 3
      AND p.plan_type = 'FIRST'
    ORDER BY s.store_name
  `);

  console.log('=== 第1案のデータ ===\n');
  
  if (result.rows.length === 0) {
    console.log('第1案のデータがありません');
  } else {
    result.rows.forEach(row => {
      console.log(`店舗: ${row.store_name}`);
      console.log(`  plan_id: ${row.plan_id}`);
      console.log(`  status: ${row.status}`);
      console.log(`  plan_type: ${row.plan_type}`);
      console.log(JSON.stringify(row, null, 2));
      console.log('');
    });
  }

} finally {
  client.release();
  await pool.end();
}
