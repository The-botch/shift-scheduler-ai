import { query } from './src/config/database.js';

async function checkOctoberRaw() {
  try {
    const result = await query(`
      SELECT
        tenant_id, store_id,
        period_start, period_end
      FROM ops.shift_plans
      WHERE plan_year = 2025 AND plan_month = 10
      ORDER BY tenant_id, store_id
    `);

    console.log('本番DB 10月の期間（生データ）:');
    result.rows.forEach(row => {
      console.log(`T${row.tenant_id}/S${row.store_id}:`);
      console.log(`  period_start: ${row.period_start}`);
      console.log(`  period_end: ${row.period_end}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

checkOctoberRaw();
