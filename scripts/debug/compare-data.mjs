import { query } from './src/config/database.js';

async function compareData() {
  try {
    // 本番DBから7-11月のデータを取得（12月とAtelier 11月のFIRSTを除く）
    const result = await query(`
      SELECT
        tenant_id, store_id, plan_year, plan_month,
        plan_code, plan_name, period_start, period_end,
        status, plan_type, generation_type,
        total_labor_hours, total_labor_cost, coverage_score
      FROM ops.shift_plans
      WHERE
        (plan_year = 2025 AND plan_month BETWEEN 7 AND 11)
        AND NOT (plan_month = 12)
        AND NOT (plan_month = 11 AND store_id = 154 AND plan_type = 'FIRST')
      ORDER BY plan_year, plan_month, store_id
    `);

    console.log('本番DB（12月とAtelier 11月FIRSTを除く）:');
    console.log(`レコード数: ${result.rows.length}`);
    console.table(result.rows);

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

compareData();
