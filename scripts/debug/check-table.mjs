import { query } from './src/config/database.js';

(async () => {
  try {
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'ops'
      AND table_name = 'shift_plans'
      ORDER BY ordinal_position
    `);
    console.log('ops.shift_plans のカラム一覧:');
    result.rows.forEach(row => console.log(`  - ${row.column_name} (${row.data_type})`));
    process.exit(0);
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
})();
