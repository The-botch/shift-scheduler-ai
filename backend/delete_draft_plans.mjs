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

  // 第1案でDRAFT状態のプランを全て削除
  const deleteResult = await client.query(`
    DELETE FROM ops.shift_plans
    WHERE tenant_id = 3
      AND plan_type = 'FIRST'
      AND status = 'DRAFT'
  `);

  console.log(`削除されたDRAFTプラン: ${deleteResult.rowCount}件`);

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
      AND p.plan_type = 'FIRST'
    ORDER BY p.plan_year, p.plan_month, s.store_name, p.plan_type
  `);

  console.log('\n=== 残った第1案プラン ===\n');

  if (remaining.rows.length === 0) {
    console.log('第1案のプランがありません（全てクリーンアップされました）');
  } else {
    remaining.rows.forEach(row => {
      console.log(`${row.plan_year}年${row.plan_month}月 ${row.store_name} ${row.plan_type}: plan_id=${row.plan_id}, status=${row.status}`);
    });
  }

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
