import { query } from './src/config/database.js';

async function checkFirstPlan() {
  try {
    const result = await query(`
      SELECT plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name, status, plan_type
      FROM ops.shift_plans
      WHERE plan_type = 'FIRST'
      ORDER BY plan_year, plan_month
    `);

    console.log('FIRST案のデータ:');
    console.table(result.rows);

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

checkFirstPlan();
