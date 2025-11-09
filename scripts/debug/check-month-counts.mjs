import { query } from './src/config/database.js';

async function checkMonthCounts() {
  try {
    const result = await query(`
      SELECT plan_year, plan_month, plan_type, COUNT(*) as count
      FROM ops.shift_plans
      GROUP BY plan_year, plan_month, plan_type
      ORDER BY plan_year, plan_month, plan_type
    `);

    console.log('月別・プランタイプ別レコード数:');
    console.table(result.rows);

    const totalResult = await query(`
      SELECT COUNT(*) as total FROM ops.shift_plans
    `);
    console.log(`\n総レコード数: ${totalResult.rows[0].total}`);

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

checkMonthCounts();
