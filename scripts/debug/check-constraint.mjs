import { query } from './src/config/database.js';

async function checkConstraint() {
  try {
    const result = await query(`
      SELECT
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname = 'shift_plans_status_check'
    `);

    console.log('制約情報:');
    console.table(result.rows);

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

checkConstraint();
