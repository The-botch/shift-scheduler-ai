import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const tables = [
      'hr.commute_allowance',
      'hr.insurance_rates',
      'hr.tax_brackets',
      'ops.labor_law_constraints',
      'ops.labor_management_rules',
      'ops.shift_validation_rules',
      'ops.store_constraints'
    ];

    for (const table of tables) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      const result = await pool.query(`SELECT * FROM ${table} ORDER BY 1 LIMIT 5`);
      console.log(`\n=== ${table} (${countResult.rows[0].count} rows) ===`);
      console.log(JSON.stringify(result.rows, null, 2));
    }

    await pool.end();
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
})();
