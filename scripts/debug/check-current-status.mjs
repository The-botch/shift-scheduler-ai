import { query } from './src/config/database.js';

async function checkStatus() {
  try {
    const result = await query(`
      SELECT DISTINCT status, plan_type
      FROM ops.shift_plans
      ORDER BY status, plan_type
    `);

    console.log('現在のstatus値:');
    console.table(result.rows);

    const countResult = await query(`
      SELECT status, plan_type, COUNT(*) as count
      FROM ops.shift_plans
      GROUP BY status, plan_type
      ORDER BY status, plan_type
    `);

    console.log('\nデータ件数:');
    console.table(countResult.rows);

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

checkStatus();
