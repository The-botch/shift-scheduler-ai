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
  await client.query('BEGIN');

  // 各店舗・月・プランタイプごとに、最新のplan_id以外を削除
  const deleteResult = await client.query(`
    DELETE FROM ops.shift_plans
    WHERE plan_id IN (
      SELECT plan_id
      FROM (
        SELECT 
          plan_id,
          ROW_NUMBER() OVER (
            PARTITION BY tenant_id, store_id, plan_year, plan_month, plan_type 
            ORDER BY created_at DESC
          ) as rn
        FROM ops.shift_plans
        WHERE tenant_id = 3
      ) ranked
      WHERE rn > 1
    )
  `);

  console.log(`削除された重複プラン: ${deleteResult.rowCount}件`);

  // 残ったプランを確認
  const remaining = await client.query(`
    SELECT 
      p.plan_id,
      p.plan_year,
      p.plan_month,
      p.plan_type,
      p.status,
      s.store_name,
      p.created_at
    FROM ops.shift_plans p
    JOIN core.stores s ON p.store_id = s.store_id
    WHERE p.tenant_id = 3
    ORDER BY p.plan_year, p.plan_month, s.store_name, p.plan_type
  `);

  console.log('\n=== 残ったプラン ===\n');
  remaining.rows.forEach(row => {
    console.log(`${row.plan_year}年${row.plan_month}月 ${row.store_name} ${row.plan_type}: plan_id=${row.plan_id}, status=${row.status}`);
  });

  await client.query('COMMIT');
  console.log('\n削除完了');

} catch (err) {
  await client.query('ROLLBACK');
  console.error('エラー:', err);
  throw err;
} finally {
  client.release();
  await pool.end();
}
