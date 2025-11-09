import { query } from './src/config/database.js';

async function checkNovember() {
  try {
    const result = await query(`
      SELECT
        plan_id, tenant_id, store_id, plan_year, plan_month,
        plan_code, plan_name, status, plan_type
      FROM ops.shift_plans
      WHERE plan_year = 2025 AND plan_month = 11
      ORDER BY tenant_id, store_id
    `);

    console.log('11月のデータ:');
    console.table(result.rows);
    console.log(`\n総件数: ${result.rows.length}`);

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

checkNovember();
